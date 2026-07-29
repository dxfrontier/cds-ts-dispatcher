# Decorator batch 2 — design spec

**Date:** 2026-07-29 · **Branch:** `feature-batch2-decorators` (stacked on `feature-tier1-decorators`) · **Source backlog:** [`docs/DECORATOR-CANDIDATES.md`](../../DECORATOR-CANDIDATES.md)

## Scope

Three decorator families from the active backlog batch:

1. **`@Throttle`** (backlog #11) — per-handler rate limiting.
2. **`@ServerLifecycle`** class decorator hosting **`@OnServed` / `@OnListening` / `@OnShutdown`** (backlog #18) — server lifecycle hooks under DI.
3. **WebSocket family** (backlog #17) — `@OnWebSocketConnect`, `@OnWebSocketDisconnect`, `@OnWebSocketMessage('<event>')`, hosted in `@UnboundActions`.

Deliverables per family: implementation, unit + integration + e2e coverage, README section(s), backlog status flip to `implemented` with as-built notes (Tier-1 style).

### Non-goals (explicit decisions)

- **`@Validate` v2 (#13): skipped by user decision (2026-07-29)** — remains `candidate` in the backlog; no code, no docs changes.
- **`@AuditLog` (#14) / `@Notify` (#15): postponed** until their cds-10 plugin smoke tests happen (separate effort).
- No sliding-window/token-bucket throttling — fixed window only.
- No broadcast-facade parameter decorator for websockets (e.g. injecting `srv.broadcast`) — recorded as follow-up candidate.
- No `wsContext` support — follow-up if demand appears.
- **No `@WebSocketHandler` alias class (decision 2026-07-29):** it would carry zero behavioral delta over `@UnboundActions` (unlike `@ServerLifecycle`, which changes registration mechanics). One way to do it; if class-level ws semantics ever materialize (facade injection, `wsContext`), introduce the host then, with real behavior.
- No distributed/shared throttle store — per-instance counters, documented honestly.

## Family 1 — `@Throttle({ limit, window, by? })`

### API

```ts
@Throttle({ limit: 10, window: 60_000 })            // 10 calls per user per minute
@OnAction(GenerateReport)
public async generate(@Req() req: Request) { ... }

@Throttle({ limit: 100, window: 60_000, by: 'tenant' })
```

- `limit: number` — max invocations per window (≥ 1).
- `window: number` — window length in **milliseconds** (≥ 1).
- `by?: 'user' | 'tenant'` — counter key source; default `'user'`.

### Semantics

- Method decorator **stacked on handler decorators** (any handler method in `@EntityHandler` / `@UnboundActions`; primary use case is actions/functions, but not artificially restricted).
- **Fixed window**: first hit for a key opens a window (`start = now`); hits inside `start + window` increment the counter; a hit at/after expiry resets the window. Over `limit` → **`req.reject(429, message)`** (`http-status-codes` `TOO_MANY_REQUESTS`, message via the repo's `util.buildMessage` constants pattern, mentioning limit and window).
- **Keying:** `by: 'user'` → `req.user?.id ?? 'anonymous'`; `by: 'tenant'` → `req.tenant ?? 'no-tenant'`.
- **Store:** per-decorated-method, per-process in-memory `Map<key, { count, start }>`. Expired entries are cleaned **lazily on hit** (sweep of expired keys on access). **No timers** — nothing to leak, nothing to stop on shutdown.
- **Ordering constraint (hard, inherited from Tier-1):** CAP orders same-phase sibling handlers only by their **synchronous prefix** (`Promise.all` in `srv-dispatch`). The throttle check is synchronous and runs before the original method body; the wrapper must not introduce an unconditional `await` before the check or the body (same conditional-await pattern as `ArgumentMethodProcessor`).
- **`@OnError` guard:** decoration-time error when stacked on `@OnError` (error handlers are synchronous; rejecting there is invalid — same rationale as the `@Diff` guard).

### Documentation duties

- Counters are per app instance: in multi-instance deployments the effective limit is per pod. TTL-style honesty rule, same as the parked `@Cached` entry.
- Service-global limiting is CAP's `cds.middlewares.add(rateLimit(), { after: 'auth' })` — README points to it as the complementary approach.

## Family 2 — `@ServerLifecycle` + `@OnServed` / `@OnListening` / `@OnShutdown`

### API

```ts
@ServerLifecycle()
export class Bootstrap {
  constructor(@inject(BookService) private readonly books: BookService) {}

  @OnServed()   // cds.on('served', …) — services object; async allowed
  public async seed(services: cds.Services) { ... }

  @OnListening() // cds.on('listening', …)
  public logUrl(payload: unknown) { ... }

  @OnShutdown() // cds.on('shutdown', …) — async allowed
  public async cleanup() { ... }
}
```

- `@ServerLifecycle()` — class decorator: marks the class `injectable()` + a metadata flag distinguishing it from the four existing hosts. Passed in the same `new CDSDispatcher([...])` array; full constructor DI works.
- The three method decorators are **only** valid inside `@ServerLifecycle` classes (decoration- or bootstrap-time error elsewhere); conversely, handler/method decorators of the other hosts are invalid inside `@ServerLifecycle`.

### Semantics

- Registration happens once in `CDSDispatcher.initialize()` via **`cds.on(event, cb)`** — NOT `srv.*`. Verified: `served`, `listening`, `shutdown` are exactly the events still subscribable from inside `initialize()` (`bootstrap`/`loaded` have already fired; `@OnBootstrap` proven impossible in the backlog research).
- **Arguments are passed through verbatim** from the CAP emitter (`served` receives the services object; `listening`/`shutdown` payload shapes must be **pinned against the installed `@sap/cds` 10 source** during implementation and asserted in tests). No `@Req`/`@Results`-style parameter decorators here — request-scoped injection has no meaning outside a request; `ArgumentMethodProcessor` is bypassed for these methods.
- `served` and `shutdown` support async callbacks (capire-verified); whether `listening` awaits its handlers must be pinned from source and documented.
- **Process-global dedup guard (design-critical):** `cds.on` is global; the same `@ServerLifecycle` class listed in two `CDSDispatcher` instances (multi-service app) must register **once per process**. A module-level `WeakSet<class>` guards registration — same spirit as Tier-1's root-context `Symbol` dedup. First dispatcher to initialize wins; the instance is resolved from that dispatcher's container.
- **Ordering:** within a class, declaration order; across classes, `CDSDispatcher([...])` array order; across dispatchers, initialization order. Documented, not configurable.
- **`@Use` middleware:** not applicable to `@ServerLifecycle` classes (middleware wraps entity/service request handlers). The Tier-1 `MiddlewareEntityRegistry` guard (skip non-action handler kinds) must demonstrably skip the new handler kind too — covered by a regression test, since this exact interaction crashed bootstrap in Tier-1.

### Registration plumbing

- New handler-kind constant (e.g. `eventKind: 'SERVER_LIFECYCLE'`, event ∈ `served | listening | shutdown`) flowing through `MetadataDispatcher` like every other handler record.
- `CDSDispatcher` branches on the class-level `@ServerLifecycle` flag: resolve instance → read records → `cds.on(...)` each; skip all `srv`-based registration for these classes.

## Family 3 — WebSocket decorators

### API

```ts
// CDS: @protocol: 'websocket' service ChatService { action sendMessage(text: String); event received { text: String } }

@UnboundActions() // bound as ChatService's impl via CDSDispatcher
export class ChatHandler {
  @OnWebSocketConnect()          // ≈ srv.on('wsConnect', …)
  public async onConnect(@Req() req: Request) { ... }

  @OnWebSocketDisconnect()       // ≈ srv.on('wsDisconnect', …)
  public async onDisconnect(@Req() req: Request) { ... }

  @OnWebSocketMessage('sendMessage') // ≈ srv.on('sendMessage', …)
  public async onMessage(@Req() req: Request) { ... }
}
```

### Semantics

- **Pure sugar over the existing ON-event machinery** (`buildOnEvent`-family factory with fixed event names `wsConnect` / `wsDisconnect`, and the caller-supplied operation name for `@OnWebSocketMessage`). Standard `srv.on` registrations; `@Req` and the other parameter decorators work unchanged.
- `@OnWebSocketMessage(event: string)` takes the operation/event name as a **plain string** (ws plugin operations are string-routed). Typed `CdsFunction` overloads are not part of this batch — modeled actions can keep using `@OnAction` today; a typed overload is a follow-up if demand appears.
- Hosting: **`@UnboundActions` only** (verified: ws services are regular CAP services; the class is bound as the ws service's impl through `CDSDispatcher` exactly like any service). No alias class — see non-goals.
- **No new library dependency:** the dispatcher never imports `@cap-js-community/websocket`. The plugin (1.11.1, CDS 10 support confirmed in its v1.11.0 release notes) is a **devDependency of the bookshop fixture only**. README states plainly: the decorators require the plugin in the consumer app and a `@protocol: 'websocket'` (or `@ws`) service.
- Bookshop fixture gains a minimal `ChatService` (`@protocol: 'websocket'`, one action, one event) wired through `CDSDispatcher` — this is the end-to-end validation the backlog demanded before shipping.

## Error handling summary

| Case | Behavior |
| --- | --- |
| Throttle over limit | `req.reject(429, <message with limit/window>)` |
| `@Throttle` on `@OnError` | throw at decoration time (clear message) |
| Lifecycle method decorators outside `@ServerLifecycle` (or vice versa) | error at decoration/bootstrap time (clear message) |
| Lifecycle callback throws | propagate to CAP's emitter semantics (no swallowing); document that a throwing `served` handler fails startup — pin exact behavior from source |
| Duplicate `@ServerLifecycle` class across dispatchers | silent single registration (WeakSet), documented |
| WS decorators without the plugin installed | handlers simply never fire (no modeled ws service) — README documents the prerequisite; no runtime detection in the dispatcher |

## Testing strategy

**Unit (jest, existing patterns in `test/__tests__/unit`):**
- Metadata records per new decorator (kind, event, draft-irrelevance).
- `@Throttle` wrapper: limit/window/key logic with a fake `req` (user/tenant/anonymous), window reset, lazy cleanup, `@OnError` decoration-time throw.
- `@ServerLifecycle` flag + method-decorator misuse errors + WeakSet dedup (two dispatcher initializations, one registration).

**Integration (`@cap-js/cds-test`, real HTTP server on an ephemeral port):**
- Throttle: N requests pass, N+1 → 429, new window resets; `by: 'tenant'` vs `'user'` keying.
- Lifecycle: `served`/`listening` observed during boot (e.g. `@OnServed` seeds a row visible via OData; `listening` records the payload); `shutdown` via emitting the event in-suite; args-shape assertions pin the cds-10 payloads.
- WebSocket: real socket roundtrip against the live port using the `ws` client package (new root devDependency): connect → `wsConnect` handler fired; send `sendMessage` → handler fired; disconnect → `wsDisconnect` fired. Requires the plugin active in the bookshop fixture.
- Regression: a `@ServerLifecycle` class + an entity handler using `@Use` middleware in the same dispatcher boots cleanly (Tier-1 `MiddlewareEntityRegistry` guard extended to the new kind).

**E2E (bookshop on :4004, newman + scripts):**
- Postman: hammer a throttled action `limit+1` times → assert the 429 (and window documented in the collection).
- Postman: assert `@OnServed`-seeded data over OData.
- WS smoke: small node script (using `ws`) appended to the e2e chain — connect, exchange one message, disconnect; newman cannot speak websocket.

**Gates:** `npm run check`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e` all green.

## Documentation & bookkeeping

- README: three new sections (`@Throttle`, `@ServerLifecycle` family, WebSocket family hosted in `@UnboundActions`), overview/placement tables updated, honesty notes (per-instance counters; plugin prerequisite; lifecycle ordering).
- `docs/DECORATOR-CANDIDATES.md`: #11, #17, #18 → `implemented (feature-batch2-decorators)` with as-built notes; placement map updated (`@ServerLifecycle` becomes the fifth host class; #17's no-alias decision recorded).
- No `CHANGELOG.md` edits (git-cliff) and no version bump (release flow).

## Implementation constraints (inherited, non-negotiable)

- Legacy decorators only (`experimentalDecorators` + reflect-metadata); all metadata through `MetadataDispatcher`; decorators do **no work at decoration time** beyond metadata + validation.
- Registration only in `CDSDispatcher.initialize()`.
- Synchronous-prefix ordering: no unconditional `await` inserted ahead of user handler bodies by any wrapper.
- Event-queue guard from Tier-1 stays intact — lifecycle/ws additions must not attach request-lifecycle machinery to internal dispatches.
- Conventional commits; commit granularity per family so the reviewer roster can review per risk tier.

## Risks / pins for implementation

1. `listening`/`shutdown` callback payload shapes and await-semantics — pin from installed `@sap/cds` 10.0.3 source, assert in integration tests.
2. WS plugin behavior under `@cap-js/cds-test` (does the plugin attach to the ephemeral-port server?) — validate early; fallback is booting the sample server for ws integration tests the way e2e does.
3. Throttle + `$batch`: each sub-request dispatches the handler individually — count per dispatch (document).
4. `@ServerLifecycle` classes must be skipped by every `srv`-centric code path in `CDSDispatcher` (entity resolution, middleware registry, outboxed binding) — the Tier-1 crash pattern says: test, don't assume.
