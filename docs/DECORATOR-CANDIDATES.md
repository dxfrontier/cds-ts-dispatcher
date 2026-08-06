# Decorator candidates — research backlog

Candidate decorators for future `@dxfrontier/cds-ts-dispatcher` releases, collected from a survey of the SAP CAP Node.js runtime/plugin docs and of decorator surfaces in comparable frameworks (NestJS, Spring, TypeORM/typestack, `cds-routing-handlers`). Researched **July 2026**, against dispatcher **v6** (`@sap/cds` 10).

Use this file as the backlog: when a candidate is picked for a release, flip its **Status** and link the issue/PR; when one is rejected, move it to [Deliberately skipped](#deliberately-skipped) with the reason.

Each entry states where the decorator **lives**: the host class(es) it can be used in — [`@EntityHandler`](../README.md#entityhandler), [`@UnboundActions`](../README.md#unboundactions), [`@ServiceLogic`](../README.md#servicelogic), [`@Repository`](../README.md#repository) — and its kind (class / method / parameter decorator).

**Verification note (2026-07-29):** placements and API facts for all active candidates were verified against the capire docs, the plugin READMEs/releases, and the installed `@sap/cds` **10.0.3** source. Each active entry carries a **Verified facts** block; anything the sources could not confirm is marked explicitly.

Status values: `candidate` → `planned (#issue)` → `implemented (branch/PR)` → `shipped (vX.Y.Z)` / `rejected` / `deferred` (parked by decision — stays in the list, revisit later). `implemented` = merged code on a feature branch/PR, awaiting the release that flips it to `shipped`.

> **Selection 2026-07-29:** active batch = #1–#5, #7, #11, #13, #14, #15, #17, #18. Parked for now: #6 `@Spawn`, #8 `@Retry`, #9 `@Guard`, #10 `@Cached`/`@CacheEvict`, #12 `@Transactional`, #16 `@FeatureGated`.

## Overview

| # | Decorator | Tier | Wraps | Lives in | Extra dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `@BeforeCommit` | 1 — runtime hooks | `req.before('commit')` | EntityHandler · UnboundActions (verified) | none | shipped (6.1.0) |
| 2 | `@AfterCommit` | 1 — runtime hooks | `req.on('succeeded')` | EntityHandler · UnboundActions (verified) | none | shipped (6.1.0) |
| 3 | `@AfterRollback` | 1 — runtime hooks | `req.on('failed')` | EntityHandler · UnboundActions (verified) | none | shipped (6.1.0) |
| 4 | `@OnRequestDone` | 1 — runtime hooks | `req.on('done')` | EntityHandler · UnboundActions (verified) | none | shipped (6.1.0) |
| 5 | `@OnScheduledSuccess` / `@OnScheduledFailure` | 1 — runtime hooks | `srv.after('<event>/#succeeded'\|'/#failed')` | UnboundActions (verified) | none | shipped (6.1.0) |
| 6 | `@Spawn` | 1 — runtime hooks | `cds.spawn` | any dispatcher class | none | deferred (2026-07) |
| 7 | `@Data`, `@Param`, `@UserInfo`, `@Tenant`, `@Diff` | 1 — parameter injection | `req.data` / `req.user` / `req.tenant` / `req.diff()` | handler methods (EntityHandler · UnboundActions); `@Diff` EntityHandler-only (verified) | none | shipped (6.1.0) |
| 8 | `@Retry` | 2 — cross-cutting | own implementation | any dispatcher class | none | deferred (2026-07) |
| 9 | `@Guard` | 2 — cross-cutting | own implementation over `req` | EntityHandler · UnboundActions | none | deferred (2026-07) |
| 10 | `@Cached` / `@CacheEvict` | 2 — cross-cutting | own implementation | EntityHandler · UnboundActions | none | deferred (2026-07) |
| 11 | `@Throttle` | 2 — cross-cutting | own implementation (no CAP-native hook — verified) | EntityHandler · UnboundActions | none | shipped (6.1.0) |
| 12 | `@Transactional` | 2 — cross-cutting | `cds.tx` | ServiceLogic · Repository | none | deferred (2026-07) |
| 13 | `@Validate` v2 (negation, if/else) | 2 — cross-cutting | extends existing `@Validate` DSL (own code — verified: `cds.validate()` has no public API) | EntityHandler · UnboundActions | none | candidate (issues [#96](https://github.com/dxfrontier/cds-ts-dispatcher/issues/96), [#97](https://github.com/dxfrontier/cds-ts-dispatcher/issues/97)) (skipped from batch-2 by decision 2026-07-29) |
| 14 | `@AuditLog` | 3 — plugin integration | `@cap-js/audit-logging` | EntityHandler · UnboundActions (verified) | optional peer | candidate |
| 15 | `@Notify` | 3 — plugin integration | `@cap-js/notifications` | EntityHandler · UnboundActions (verified) | optional peer | candidate |
| 16 | `@FeatureGated` | 3 — plugin integration | `@cap-js-community/feature-toggle-library` | EntityHandler · UnboundActions | optional peer | deferred (2026-07) |
| 17 | `@OnWebSocketMessage` / `@OnWebSocketConnect` / `@OnWebSocketDisconnect` | 3 — plugin integration | `@cap-js-community/websocket` | UnboundActions (verified — ws services are regular CAP services); no `@WebSocketHandler` alias shipped | optional peer | shipped (6.1.0) |
| 18 | `@OnServed` / `@OnListening` / `@OnShutdown` | 3 — lifecycle | `cds.on(...)` | `@ServerLifecycle` class (decided, shipped) | none | shipped (6.1.0) |

Tier meaning: **1** — wraps a native CAP runtime capability we do not cover yet; no new dependencies; highest value-to-effort. **2** — cross-cutting utility decorators proven in other frameworks (Spring/NestJS); self-contained implementations. **3** — thin wrappers over the official CAP plugin ecosystem; each adds an optional peer dependency to test and maintain.

## Placement map — grouped by host

**Active candidates fit into the four pre-existing host classes, plus one dedicated addition.** The earlier assumption that WebSocket handlers need a new host was **disproved** (see #17) — confirmed again at implementation time: no `@WebSocketHandler` alias shipped. The lifecycle family (#18) did get a dedicated host, `@ServerLifecycle` — a semantics choice, not a technical necessity, but it shipped that way in `feature-batch2-decorators`.

| Host | Candidates that live there |
| --- | --- |
| **`@EntityHandler` + `@UnboundActions`** (dual home, like `@Prepend`/`@OnError` today) | `@BeforeCommit`, `@AfterCommit`, `@AfterRollback`, `@OnRequestDone` · `@Throttle`, `@Validate` v2 · `@AuditLog`, `@Notify` · params `@Data`/`@Param`/`@UserInfo`/`@Tenant` · deferred: `@Guard`, `@Cached`/`@CacheEvict`, `@FeatureGated` |
| **`@UnboundActions` only** | `@OnScheduledSuccess` / `@OnScheduledFailure` (service-level `srv.after` handlers, next to `@Schedule`/`@OnScheduled`) · WebSocket family #17 (the class is bound as the ws service's impl) |
| **`@EntityHandler` only** | `@Diff` (needs an entity write event to diff against) |
| **`@ServerLifecycle`** (dedicated host — no other decorator lives here) | `@OnServed`, `@OnListening`, `@OnShutdown` (#18) |
| **Any dispatcher class** (all four hosts) | deferred: `@Spawn`, `@Retry` — plain method wrappers, not handler registrations |
| **`@ServiceLogic` + `@Repository` only** | deferred: `@Transactional` (handler methods already run inside the request's transaction) |

### New host class decorators

1. **`@WebSocketHandler(service)` — NOT required (verified 2026-07-29); final resolution: not shipped.** The `@cap-js-community/websocket` README registers handlers via standard `srv.on(...)` inside a normal service impl (`module.exports = (srv) => ...`) on a service annotated `@protocol: 'websocket'`. A dispatcher consumer can therefore bind an `@UnboundActions` class as that service's impl today. A dedicated `@WebSocketHandler` alias remained an option purely for discoverability, but the design phase dropped it outright (`docs/superpowers/specs/2026-07-29-decorator-batch2-design.md`) rather than deferring it — `feature-batch2-decorators` ships `@OnWebSocketConnect`/`@OnWebSocketDisconnect`/`@OnWebSocketMessage` as plain `@OnEvent` sugar hosted in ordinary `@UnboundActions` classes, with no dedicated websocket host class at all (see #17).
2. **`@ServerLifecycle` — final resolution: shipped as recommended.** Hosts `@OnServed`/`@OnListening`/`@OnShutdown` (#18). They *could* have been hosted in `@UnboundActions`, but server lifecycle has nothing to do with "unbound actions of this service" — a dedicated host keeps the semantics honest, so it shipped that way in `feature-batch2-decorators`: `@ServerLifecycle` hosts *only* the three lifecycle decorators, registers once per process per class against `cds.on(...)`, and rejects `@Use` middleware and any other handler decorator at bootstrap. Verified: `@OnBootstrap` cannot work at all (see #18).

Decision rule: **everything in the active batch slots into the existing architecture as-is** (method/parameter decorators registered through the same metadata → `CDSDispatcher` flow). The only open architectural choice was the host for the lifecycle family — resolved in `feature-batch2-decorators`: a dedicated `@ServerLifecycle` class, exactly as recommended.

---

## Tier 1 — Native CAP runtime hooks

### 1. `@BeforeCommit`

```ts
@BeforeCommit()
public async checkInvariants(@Req() req: Request) { ... }
```

Registers the method on `req.before('commit')`: it runs **inside the transaction, immediately before commit**, after all other handlers of the request (including handlers of other services touched by the same request) have run. Throwing an error vetoes the commit and rolls everything back — this is the only one of the four request-lifecycle hooks that can still veto.

**Lives in:** method decorator — `@EntityHandler` classes (scoped to requests touching that entity, following the entity-binding of the class) and `@UnboundActions` (service-wide, hooks every request of the service).

**Verified facts (2026-07-29)**

- The hook is attachable from within any handler (before/on/after) during request processing — so the dispatcher can attach it lazily via a generic `srv.before` registration. Capire: "Use the `req.before('commit')` hook to perform final validation or bookkeeping before a transaction is finalized."
- Fires once per **root** request: for OData `$batch` changesets, only after the entire changeset completes — document this for consumers expecting per-sub-request granularity.

**Implemented (2026-07-29 — `feature-tier1-decorators`)**

- As designed: metadata `type: 'REQUEST_LIFECYCLE'`, ONE prepended `srv.before('*'[, entity])` attach handler per host class, deduped once per root request via a `Symbol` stamped on the root context. Once-per-`$batch`-changeset semantics pinned by an integration test (two atomicity groups in ONE `$batch` call); the veto is also covered e2e (postman).
- The callback receives the **first sub-request** of the root that reached the attach handler — documented guidance: use this hook for cross-request / final-state invariants (read DB state), keep per-operation validation in `@Before*`/`@On*`.
- Draft-enabled entities: fires on draft **activation** only, not during the draft-editing roundtrip (documented).
- Two hardening discoveries, both guarded in `CDSDispatcher` now: (a) the persistent event-queue's internal dispatches are real `cds.Request`s whose `context` is a JSON-deserialized **plain object** — attaching there crashed the queue; `attach` skips roots that cannot host the shared emitter (`_set`/`_emitter` capability check). (b) `@Use` middleware combined with any lifecycle/scheduled decorator crashed bootstrap in `MiddlewareEntityRegistry` — non-action handler types are skipped there now.
- Ordering caveat (documented in README): across classes, `@BeforeCommit` callbacks run in `CDSDispatcher([...])` array order, the three post-tx hooks in reverse array order; within one class, declaration order always holds.

**Benefits**

- Only place to enforce cross-entity invariants over the *final* state of a request (e.g. "after this deep update, total stock must still be ≥ 0"). `@AfterUpdate` runs too early to see sibling changes.
- Declarative last-chance validation without hand-wiring `req.before('commit', …)` in every handler.

Docs: <https://cap.cloud.sap/docs/node.js/events>

### 2. `@AfterCommit`

```ts
@AfterCommit()
public async sendConfirmation(@Req() req: Request) { ... }
```

Registers the method on `req.on('succeeded')`: it runs **only after the transaction durably committed**, outside of it. Cannot veto anything anymore.

**Lives in:** method decorator — `@EntityHandler` (entity-scoped) and `@UnboundActions` (service-wide), same hosting rules as `@BeforeCommit` (#1).

**Verified facts (2026-07-29)**

- Capire, verbatim: "The events succeeded, failed, and done are emitted after the current transaction has ended, meaning they operate outside framework-managed transactions. Consequently, handlers for these events cannot veto a commit. To perform database operations within these handlers, manual transactions or cds.spawn should be used."
- The documented pattern for DB access inside the callback is a fresh transaction: `await cds.tx(async () => { await UPDATE… })`. The dispatcher docs/examples must show exactly this, or consumers will hit "transaction closed" errors.
- Fires once per root request (changeset-level for `$batch`), same as #1.

**Implemented (2026-07-29 — `feature-tier1-decorators`)**

- Registration/dedup/host semantics shared with #1. The dispatcher **catches and logs** callback errors instead of rethrowing — source-verified necessity: a throw in a `'succeeded'` listener makes CAP emit `'failed'` and error the response *despite the durable commit* (`lib/srv/srv-tx.js`).
- The mandated `await cds.tx(async () => …)` DB-access pattern is shown in README, JSDoc and the bookshop sample handler.

**Benefits**

- Fixes the most common CAP correctness bug: side effects written in `@AfterCreate`/`@AfterUpdate` (emails, webhooks, cache invalidation, external calls) fire *before* commit and also fire when the transaction later rolls back.
- Spring equivalent is `@TransactionalEventListener(AFTER_COMMIT)`; no CAP library offers it declaratively — differentiator.

Docs: <https://cap.cloud.sap/docs/node.js/events>

### 3. `@AfterRollback`

Registers the method on `req.on('failed')`: runs after the transaction rolled back. Cannot veto.

**Lives in:** method decorator — `@EntityHandler` (entity-scoped) and `@UnboundActions` (service-wide), same hosting rules as `@BeforeCommit` (#1).

**Verified facts (2026-07-29)**

- Same constraints as #2: runs outside any transaction; DB access requires `cds.tx`/`cds.spawn`; fires once per root request.

**Implemented (2026-07-29 — `feature-tier1-decorators`)** — shares #1's registration and #2's catch-and-log shield; exercised end-to-end by the `@BeforeCommit` veto flows (integration + e2e), where it fires together with `@OnRequestDone` while `@AfterCommit` stays silent.

**Benefits**

- Compensation/cleanup of *external* resources the request created before failing (delete an already-uploaded blob, release a reservation in a remote system).
- Per-business-operation failure alerting and metrics instead of a generic error log.

Docs: <https://cap.cloud.sap/docs/node.js/events>

### 4. `@OnRequestDone`

Registers the method on `req.on('done')`: runs when the request ends, success or failure. Cannot veto.

**Lives in:** method decorator — `@EntityHandler` (entity-scoped) and `@UnboundActions` (service-wide), same hosting rules as `@BeforeCommit` (#1).

**Verified facts (2026-07-29)**

- Same constraints as #2: outside any transaction; `cds.tx` for DB work (capire's own `done` example uses `cds.tx` to bump a counter); once per root request.

**Implemented (2026-07-29 — `feature-tier1-decorators`)** — shares #1's registration and #2's shield; service-wide hosting proven in `@UnboundActions` (bookshop `UnboundActions.ts` + integration test), which is also what surfaced the event-queue guard described in #1.

**Benefits**

- `finally` semantics: release locks, stop timers, emit duration metrics, clean per-request temp state — without duplicating logic across a success hook and a failure hook.

Docs: <https://cap.cloud.sap/docs/node.js/events>

### 5. `@OnScheduledSuccess(task)` / `@OnScheduledFailure(task)`

```ts
@OnScheduledFailure('sendDailyDigest')
public async alertOps(@Result() failure: { name: string; message: string }, @Req() req: Request) { ... }
```

Wraps CAP's scheduled/queued-event outcome callbacks: the runtime emits `<event>/#succeeded` after a queued event is processed and `<event>/#failed` once its retries are exhausted.

**Lives in:** method decorator — `@UnboundActions`, next to the `@Schedule`/`@OnScheduled` task they observe (verified: these are **service-level** registrations, not entity-bound).

**Verified facts (2026-07-29)**

- Exact mechanism (capire event-queues, verbatim): "Once a message is processed, the runtime emits `<event>/#succeeded`, and if retries are exhausted, it emits `<event>/#failed`." Registered as standard service handlers: `srv.after('BookingCreated/#succeeded', (result, req) => …)` / `srv.after('BookingCreated/#failed', (error, req) => …)` — so the dispatcher implementation is a plain `srv.after` with a suffixed event name; no new registration machinery.
- Handler arguments differ per outcome: `#succeeded` receives the task's **result**, `#failed` receives the **error** — the parameter-injection design must account for both shapes.
- `#failed` fires only after **final retry exhaustion** (queue retries up to `maxAttempts`, default 10) — not on each failed attempt. Important expectation to document.

**Implemented (2026-07-29 — `feature-tier1-decorators`)**

- Plain suffixed `srv.after('<task>/#succeeded' | '/#failed')` registrations as predicted; task names registered verbatim (dots preserved), same rule as `@OnScheduled`.
- **Correction to the researched assumption** (and to this entry's original example, updated above): the `#failed` payload is **not** an `Error` instance — CAP serializes it (`_errorToObj` + outbox JSON round-trip, `libx/queue/`) into a plain `{ name, message, stack, code }` object. It must be injected with `@Result()`; `@Error()` stays `undefined` (it only matches `instanceof Error`). A naive `@Error()` fixture even crashed the app under real retry exhaustion (the resulting `TypeError` hits the queue's programming-error path → `cds.exit(1)`).
- The callbacks bypass the dispatcher's cds-10 `affected` normalization so raw results survive (a numeric task result `1` would otherwise arrive as `true`).
- `#succeeded` proven end-to-end through the real queue (integration); `#failed` registration + payload shape pinned at unit level — simulating 10-attempt retry exhaustion in-suite is impractical.

**Benefits**

- Completes the existing `@Schedule`/`@OnScheduled` story: today a failed scheduled task dies silently unless the consumer hand-writes the callback chain.
- Declarative failure alerting and success chaining ("when the digest finishes, kick off cleanup").

Docs: <https://cap.cloud.sap/docs/node.js/event-queues>

### 6. `@Spawn`

**Status: deferred (2026-07)** — parked by decision, revisit later.

```ts
@Spawn() // method returns immediately; body runs detached
public async regeneratePdf(@Data() data: OrderData) { ... }
```

Wraps `cds.spawn`: the method body runs as a detached background job in its **own transaction**, with tenant/user context propagated correctly.

**Lives in:** method decorator (wrapper, not a handler registration) — any dispatcher-managed class: `@EntityHandler`, `@UnboundActions`, `@ServiceLogic`, `@Repository`. Typical home: `@ServiceLogic` methods and companions of `@AfterCommit` (#2) handlers.

**Benefits**

- Low response latency for heavy post-processing (document generation, recalculation cascades) without consumers learning `cds.spawn`'s context rules.
- The natural companion of `@AfterCommit` (#2), whose callbacks run outside a transaction and need exactly this to touch the DB safely.

Docs: <https://cap.cloud.sap/docs/node.js/cds-tx>

### 7. Parameter decorators: `@Data`, `@Param`, `@UserInfo`, `@Tenant`, `@Diff`

```ts
@BeforeUpdate()
public async onPriceChange(@Diff() diff: Book, @UserInfo() user: User) { ... }
```

Ride the existing `ArgumentMethodProcessor`; each is a small, independent addition.

**Lives in:** parameter decorators — on any handler method in `@EntityHandler` or `@UnboundActions` classes (same hosting as today's `@Req`/`@Results`). Exception: `@Diff` is `@EntityHandler`-only, on entity write events (`@BeforeUpdate`, `@BeforeSaveDraft`, …) where an old-vs-new delta exists.

| Decorator | Injects | Benefit |
| --- | --- | --- |
| `@Data()` | `req.data` (typed) | Cleaner signatures; unit tests pass a plain object instead of a mocked `Request`. |
| `@Param('field')` | one field of `req.data` | The signature documents exactly what the handler consumes. |
| `@UserInfo()` | `req.user` | Direct access to id/roles/attributes for ownership and authorization logic. |
| `@Tenant()` | `req.tenant` | Multitenant handlers need it constantly. |
| `@Diff()` | `await req.diff()` | The standout: CAP's deep old-vs-new delta against the DB state. Turns "did the price change, and from what?" from a manual `SELECT` + compare into one parameter. |

**Verified facts (2026-07-29)**

- `@Data`/`@Param`/`@UserInfo`/`@Tenant`: `req.data`, `req.user`, `req.tenant` are standard, documented `cds.Request` members — no constraints beyond handler context.
- `@Diff`: **`req.diff()` exists in the installed `@sap/cds` 10.0.3** (`lib/req/request.js:176`, lazily loaded from `libx/_runtime/common/utils/differ.js`) but is **absent from current capire docs** — treat it as a semi-stable API. Source-verified behavior: reads the current DB state via a deep `SELECT` expanding compositions (recursion depth 4 by default, tunable via `cds.env.features.recursion_depth`), draft-column-aware. Implementation must pin its behavior with tests, and the decorator's README entry should note the one-extra-DB-read cost.
- `@Diff` is async (`await req.diff()`), so `ArgumentMethodProcessor` must support awaited parameter resolution — a small but real processor change.

**Implemented (2026-07-29 — `feature-tier1-decorators`)**

- `@Data` / `@Param` (repeatable) / `@UserInfo` / `@Tenant` as designed, through `ArgumentMethodProcessor`.
- `@Diff` made the processor async-capable: `applyDecorators()` now returns `void | Promise<void>` and the method wrappers await **conditionally** (`const applied = …; if (applied) await applied;`). An unconditional `await` broke `@Prepend`/sibling-handler ordering, because CAP runs same-phase handlers via `Promise.all` (`lib/srv/srv-dispatch.js`) — only **synchronous prefixes** are ordered between sibling handlers. Recorded as a hard design constraint for every future decorator that wraps handler methods.
- `@Diff` costs one extra DB read, defers the handler body by one microtask (documented), and is rejected at **decoration time** on `@OnError` (error handlers are invoked synchronously; a floating `req.diff()` rejection could kill the process).
- `req.diff()` payload shape pinned by integration tests on cds 10.0.3: top-level fields carry the **new** (incoming) values, old values nest under `_old`, `_op` marks the operation, unchanged fields are dropped, key fields always present.

`@Data`/`@Param`/`@UserInfo` also close the only surface gap vs. `cds-routing-handlers` (`@Data`/`@Param`/`@User`), making migration from it frictionless.

Docs: <https://cap.cloud.sap/docs/node.js/events>

---

## Tier 2 — Cross-cutting utilities

### 8. `@Retry({ attempts, backoff, retryOn? })`

**Status: deferred (2026-07)** — parked by decision, revisit later.

Re-invokes the failing handler body with backoff.

**Lives in:** method decorator (wrapper) — any dispatcher-managed class: `@EntityHandler`, `@UnboundActions`, `@ServiceLogic`, `@Repository`. Most useful on handlers and service methods that call remote systems.

**Benefits**

- Handlers calling remote systems (S/4 APIs, destinations) fail transiently all the time; today every team hand-rolls retry loops with inconsistent backoff policies.
- One decorator, one policy, visible in the signature. Constraint to document: idempotent operations only.
- Precedent: Spring `@Retryable`. A `@CircuitBreaker` could follow later; retry alone covers most demand.

### 9. `@Guard(fn | GuardClass)`

**Status: deferred (2026-07)** — parked by decision, revisit later.

```ts
@Guard(IsOwner) // class with canActivate(req): boolean | Promise<boolean>
@OnBoundAction(Order, 'cancel')
```

Composable predicates over `req`; a failing guard rejects with 403.

**Lives in:** method decorator stacked on handler decorators — `@EntityHandler` and `@UnboundActions` (same hosting as today's `@ExecutionAllowedForRole`). A class-level variant (guard every handler in the class) is a possible follow-up.

**Benefits**

- `@ExecutionAllowedForRole` only covers roles. Real apps need ownership ("only the creator may cancel"), attribute-based and time-based rules.
- Guards are reusable across handlers, testable in isolation, and NestJS-familiar (`@UseGuards`/`CanActivate`).

### 10. `@Cached({ ttl, key? })` / `@CacheEvict(...)`

**Status: deferred (2026-07)** — parked by decision, revisit later.

Memoizes `@OnRead`/`@OnFunction` results; evicts on writes.

**Lives in:** method decorator stacked on handler decorators — `@Cached` on `@OnRead`/`@OnBoundFunction` in `@EntityHandler` and `@OnFunction` in `@UnboundActions`; `@CacheEvict` on write handlers (`@OnUpdate`, `@OnDelete`, actions) in `@EntityHandler`.

**Benefits**

- Declarative caching for expensive reads (remote aggregations, heavy calculations) instead of hand-rolled maps scattered through repositories.
- Precedent: Spring `@Cacheable`/`@CacheEvict`, NestJS cache interceptors.
- Design caveat that must ship in the docs: per-instance in-memory cache — in multi-instance deployments TTL is the only consistency guarantee.

### 11. `@Throttle({ limit, window, by: 'user' | 'tenant' })`

Rate-limits actions/functions; over the limit → 429.

**Lives in:** method decorator stacked on handler decorators — bound actions/functions in `@EntityHandler`, unbound actions/functions in `@UnboundActions`.

**Verified facts (2026-07-29)**

- CAP Node.js has **no native rate-limiting hook** — confirmed. The CAP security guide's own recommendation: "applications should implement rate limiting to restrict client call frequency… managed at the application level or centrally via platform-level Route Services." A handler-level decorator is exactly the application-level option.
- `@cap-js-community/event-queue`'s "load management" is concurrency balancing for queued events, **not** request rate limiting — no ecosystem overlap.
- For service-global (not per-handler) limits, CAP's sanctioned extension point is `cds.middlewares.add(rateLimit(), { after: 'auth' })` in a custom `server.js` — worth mentioning in the README entry as the complementary approach; the decorator stays per-handler.

**Implemented (2026-07-29 — `feature-batch2-decorators`)**

- Shipped as a `descriptor`-wrapping decorator, following the exact `callback-capture` rule this repo already uses for `@ExecutionAllowedForRole`/`@CatchAndSetErrorCode`: the wrapper stores its own metadata at *its* decoration time and returns a new `descriptor.value` that the handler factory (`@OnAction`, `@OnCreate`, ...) captures when *it* runs. `@Throttle` must sit **below** the handler decorator, closer to the method — stacked **above** it, the wrapper never becomes part of the registered callback (dead code: no error, no throttling, no signal that anything is wrong).
- Scope is broader than originally researched: `@Throttle` works on **any** handler that receives a real `cds.Request` — CRUD, actions, and functions, in both `@EntityHandler` and `@UnboundActions` — not just actions/functions. It does **not** work on messaging-event handlers (`@OnEvent` / `@OnSubscribe`): CAP delivers those with a `cds.Event`, not a `cds.Request` (`Request extends Event`, not the reverse — confirmed against the installed `@sap/cds` 10.0.3 source), so `util.findRequest`'s `instanceof` check never matches and every single delivery throws the descriptive `THROTTLE_NO_REQUEST` error instead of silently passing unthrottled.
- Decoration-time guards added beyond the original design: `limit`/`window` are validated `>= 1` at decoration time (throws immediately, not on first call); stacking `@Throttle` under `@OnError()` throws at decoration time too — the marker `Symbol` (`THROTTLE_KEY`) set by `@Throttle` is read back by `buildOnError`'s own decoration-time guard, the same mechanism already used for the `@Diff`-on-`@OnError` guard.
- Counters are a plain fixed-window `Map` closed over per decorated method (created once, at decorator-factory call time) — per app instance, per method, with lazy sweep of expired keys on every hit. No batch-level dedup: each OData `$batch` sub-request invokes the wrapped handler (and therefore the counter) individually.
- Exercised end-to-end: unit (`throttleUtil` fixed-window/reset/sweep/isolation + decorator wiring, including the `@OnError` and no-`Request` failure paths), integration (bookshop `throttledPing` unbound action: per-user isolation, 429 message content), e2e (postman folder driving the real limit/window to a 429).

**Benefits**

- Protects expensive endpoints (report generation, mass actions) from runaway UIs and abuse.
- Nothing native in CAP and no community library exists — genuine gap. Precedent: NestJS `@Throttle`.
- Design notes: counters are per-instance (same honesty rule as `@Cached`); key on `req.user.id` / `req.tenant` per the `by` option.

### 12. `@Transactional`

**Status: deferred (2026-07)** — parked by decision, revisit later.

Wraps a `@ServiceLogic` method in `cds.tx` when no ambient transaction exists.

**Lives in:** method decorator (wrapper) — `@ServiceLogic` and `@Repository` classes. Not for handler methods in `@EntityHandler`/`@UnboundActions`: those always run inside the request's transaction already (using it there should log a warning).

**Benefits**

- Service-logic methods become safely callable from background jobs, `@Spawn` bodies, and lifecycle code — not only from request handlers — with Spring-familiar atomicity semantics.

Docs: <https://cap.cloud.sap/docs/node.js/cds-tx>

### 13. `@Validate` v2 — negation and if/else

Extends the existing validator DSL with `not` and conditional chains ("when `type = 'B2B'` then `vatId` must exist").

**Lives in:** method decorator stacked on handler decorators — same hosting as today's `@Validate`: `@EntityHandler` (before/on entity events) and `@UnboundActions` (actions, `@OnSubscribe` — see issue [#167](https://github.com/dxfrontier/cds-ts-dispatcher/issues/167)).

**Verified facts (2026-07-29)**

- `cds.validate()` (mentioned in the CAP 8 release notes as the reimplemented generic input validation) has **no public signature in the docs** — building on it would mean depending on an undocumented API. Conclusion: v2 extends **our own** validator DSL; CAP's documented pattern for custom validation remains the before-handler with `req.error(...)`, which is exactly where `@Validate` already hooks.
- `req.error()` **collects** multiple errors into one response while `req.reject()` throws immediately — the v2 design should keep using `req.error` so several failed rules report together (matches CAP's multi-error response pattern).

**Benefits**

- Recorded user demand: issues [#96](https://github.com/dxfrontier/cds-ts-dispatcher/issues/96) and [#97](https://github.com/dxfrontier/cds-ts-dispatcher/issues/97), never built.
- Removes the cliff where simple declarative validation suddenly forces a hand-written imperative validator.
- Alternative to evaluate during design: a zod/schema adapter instead of growing the in-house DSL.

---

## Tier 3 — Plugin ecosystem integrations

Each adds an **optional peer dependency** to test and maintain; wrappers themselves are thin.

### 14. `@AuditLog(event, dataFn?)` — `@cap-js/audit-logging`

Emits a compliance audit entry around the handler.

```ts
@AuditLog('SensitiveDataRead', (req) => ({ data_subject: … }))
@OnRead()
public async readPatients(@Req() req: Request) { ... }
```

**Lives in:** method decorator stacked on handler decorators — `@EntityHandler` (sensitive entity events) and `@UnboundActions` (sensitive actions).

**Verified facts (2026-07-29)**

- Runtime API: `const audit = await cds.connect.to('audit-log')`, then `await audit.log('<EventType>', data)`. Typed event names include `SensitiveDataRead`, `PersonalDataModified`, `ConfigurationModified`, `SecurityEvent`.
- **Outboxed by default**: "Transactional outbox is enabled by default for all audit log implementations" — entries are stored with the transaction and forwarded **only after successful commit**. Consequence for design: `@AuditLog` does *not* need `@AfterCommit` pairing; calling `audit.log` inside the handler is already rollback-safe. (Disable via `cds.requires.audit-log.outbox: false`.)
- Dev mode logs to console; production targets the SAP Audit Log Service.
- **Risk:** current version 1.2.2 declares `@sap/cds >= 8`; **cds 10 compatibility is unconfirmed** — must be smoke-tested against the bookshop sample before shipping the decorator.

**Benefits**

- GDPR/DPP audit logging becomes declarative and uniform instead of imperative `audit.log(...)` calls copy-pasted into every sensitive handler.
- Auditors get consistent event shapes; rollback-safety comes free from the plugin's outbox.

Docs: <https://cap.cloud.sap/docs/guides/security/dpp-audit-logging> · <https://github.com/cap-js/audit-logging>

### 15. `@Notify(template, recipients?)` — `@cap-js/notifications`

Sends a SAP BTP / Fiori launchpad notification after the handler succeeds.

```ts
@Notify('BookOrdered', (req) => [req.data.buyerId])
@OnAction(SubmitOrder)
public async submitOrder(@Req() req: Request) { ... }
```

**Lives in:** method decorator stacked on handler decorators — `@EntityHandler` (typically after bound actions) and `@UnboundActions`.

**Verified facts (2026-07-29)**

- Runtime API: `const alert = await cds.connect.to('notifications')`, then either untyped `alert.notify({ recipients, title, description?, priority? })` (priority `LOW|NEUTRAL|MEDIUM|HIGH`), a batch array, or typed `alert.notify('<TemplateKey>', { recipients, data })` with templates from a `notification-types.json` file (auto-registered/synced at startup; config under `cds.requires.notifications`: `types` path, `prefix`, `auth` strategy; default destination `SAP_Notifications`).
- Local development logs notifications to the console instead of publishing to Work Zone — cheap to test.
- Built on a transactional-outbox architecture; **whether delivery is strictly after-commit is not explicitly documented** — verify during design and, if not guaranteed, register the send via `@AfterCommit` (#2) mechanics.
- **Risk:** current version 0.3.0 declares `@sap/cds >= 8`; **cds 10 compatibility unconfirmed** — smoke-test before shipping.

**Benefits**

- The standard "notify the approver" requirement in one line, with template/i18n support from the plugin.
- Combined with after-commit semantics, notifications never fire for rolled-back operations.

Docs: <https://github.com/cap-js/notifications>

### 16. `@FeatureGated(flag)` — `@cap-js-community/feature-toggle-library`

**Status: deferred (2026-07)** — parked by decision, revisit later.

Skips or rejects the handler unless the feature toggle is on.

**Lives in:** method decorator stacked on any handler decorator — `@EntityHandler` and `@UnboundActions`.

**Benefits**

- Progressive rollout, per-tenant features, and instant kill switches for problematic handlers — no redeploy.

### 17. WebSocket family — `@cap-js-community/websocket`

`@OnWebSocketMessage(event)`, `@OnWebSocketConnect`, `@OnWebSocketDisconnect`.

```cds
@protocol: 'websocket'
service ChatService {
  event received { text: String; }
  action sendMessage(text: String);
}
```

```ts
@UnboundActions() // bound as ChatService's impl via CDSDispatcher
export class ChatHandler {
  @OnWebSocketConnect() // sugar for srv.on('wsConnect', …)
  public async onConnect(@Req() req: Request) { ... }
}
```

**Lives in:** `@UnboundActions` — **verified, and this overturns the earlier assumption that a new host class is required.** The plugin's README declares websocket services with a `@protocol: 'websocket'` (or `@ws`) annotation and registers handlers as a **regular CAP service impl** with standard `srv.on(...)` calls (`module.exports = (srv) => { srv.on("sendMessage", …) }`). A dispatcher consumer can therefore use `CDSDispatcher` as the ws service's impl and host handlers in `@UnboundActions` today. The dedicated decorators are **sugar**: `@OnWebSocketConnect` ≈ `@OnEvent('wsConnect')`, `@OnWebSocketDisconnect` ≈ `@OnEvent('wsDisconnect')`; an optional `@WebSocketHandler` class alias would exist only for discoverability. **Decided (2026-07-29): the `@WebSocketHandler` alias was not shipped** — validated end-to-end against the real plugin in `feature-batch2-decorators` (see Implemented below) using plain `@UnboundActions`.

**Verified facts (2026-07-29)**

- Special lifecycle operations exposed by the plugin: `wsConnect` (socket connected), `wsDisconnect(reason?)`, `wsContext(...)` (event-context management) — all handled via ordinary `srv.on('wsConnect', cb)` registrations.
- Broadcasting API on the service facade: `srv.emit(event, data)` (current socket), `srv.broadcast(event, data, headers?, filter?)` (all except sender), `srv.broadcastAll(...)` (all including sender); filters support `user`/`role`/`context`/`identifier` include/exclude. A parameter decorator injecting this facade is worth considering in the design.
- Transactional safety exists: events can go through the CDS persistent queue so they broadcast "exactly once, when the primary transaction succeeds".
- Version 1.11.1; **CDS 10 support explicitly confirmed** (v1.11.0 release notes). Actively maintained, Apache-2.0.

**Implemented (2026-07-29 — `feature-batch2-decorators`)**

- Shipped as pure sugar over the existing `buildOnEvent`/`@OnEvent` machinery — `OnWebSocketConnect()` ≈ `OnEvent('wsConnect')`, `OnWebSocketDisconnect()` ≈ `OnEvent('wsDisconnect')`, `OnWebSocketMessage(name)` ≈ `OnEvent(name)` verbatim, no new registration path. Unit-proven: an `@OnWebSocketConnect()` handler and an equivalent hand-written `@OnEvent('wsConnect')` handler produce byte-identical `EVENT` metadata (aside from the callback reference).
- No dedicated host class shipped — the `@WebSocketHandler` alias floated during research was **dropped outright** during the design phase (not merely deferred): a websocket service impl is a regular CAP service impl, so the existing `@UnboundActions` host is sufficient and an extra decorator would only rename `@UnboundActions` for one protocol.
- Confirmed the modeled-actions requirement empirically: `wsConnect()` / `wsDisconnect(reason: String)` only fire when declared as CDS `action`s on the `@protocol: 'websocket'` service (the bookshop `ChatService` fixture models both) — the plugin's adapter calls modeled operations only, it does not synthesize connect/disconnect events for services that omit them.
- Two more wire-level corrections found during review, both now pinned in the `@OnWebSocketDisconnect`/`@OnWebSocketMessage` JSDoc and the README: (a) under the plugin's default `kind: 'ws'`, the value delivered to the modeled `wsDisconnect(reason: String)` is the socket **close code** as a string (e.g. `'1000'`, `'1005'`) — raw `ws` passes `(code, reason)` to its close handler and the plugin forwards only the first argument, so `req.data.reason` is **not** a human reason phrase; (b) `@OnWebSocketMessage(name)` strips everything before the last dot at registration, same as `@OnEvent` — `'ChatService.sendMessage'` registers as `'sendMessage'`, so consumers must pass the plain operation name.
- Spike result (design-spec risk #2): `@cap-js-community/websocket` **does** attach correctly under `@cap-js/cds-test`'s real HTTP server on an ephemeral port — no fallback to a spawned `start-server-and-test` boot was needed for the integration suite; the `ws` root devDep connects straight to `client.url` with `http` swapped for `ws`.
- Wire observation pinned by a real run against `@cap-js-community/websocket` `1.11.0` on kind `'ws'`: the server-side handler fires and its action resolves, but the return value is **not** echoed back as a reply frame — raw `ws` has no ack-callback channel (unlike `socket.io`), so the value is simply discarded. The e2e smoke script's pass criterion was relaxed accordingly (open + unthrown send = green, documented inline in `ws-smoke.js`); the README carries the same caveat.
- Exercised end-to-end: unit (metadata sugar equivalence to `@OnEvent`), integration (real `ChatService` over a real `ws` client: connect/message/disconnect markers), e2e (smoke script chained after the newman collection against the real booted server).

**Benefits**

- Realtime handlers in the same class-based style as the rest of the dispatcher; niche today but differentiating.
- Because hosting works via `@UnboundActions`, the family is much cheaper than previously estimated — mostly named sugar plus README documentation.

Docs: <https://github.com/cap-js-community/websocket>

### 18. Lifecycle decorators — `@OnServed`, `@OnListening`, `@OnShutdown`

Wrap the `cds.on(...)` server lifecycle events. No plugin dependency — listed in Tier 3 only because they sit outside per-request handling.

**Lives in:** a dedicated `@ServerLifecycle` class decorator — **decided and shipped** (2026-07-29, `feature-batch2-decorators`): server lifecycle has nothing to do with "unbound actions of this service", so a dedicated host keeps the semantics honest (see Implemented below).

**Verified facts (2026-07-29)**

- Full lifecycle order: `bootstrap` (express app created) → `loaded` (models compiled) → `served` (all services bootstrapped; receives the services object; async handlers allowed) → `listening` (HTTP server up) → `shutdown` (graceful shutdown, fires on SIGINT/SIGTERM, async handlers allowed).
- Timing constraint confirmed: service impl functions run during `cds.serve()`, **after `bootstrap` and `loaded` have already fired**. From inside `CDSDispatcher.initialize()` the reliably subscribable events are exactly **`served`, `listening`, `shutdown`** — which is why `@OnBootstrap` was dropped from this family.

**Implemented (2026-07-29 — `feature-batch2-decorators`)**

- Shipped exactly as recommended: a dedicated `@ServerLifecycle` class decorator, hosting only `@OnServed` / `@OnListening` / `@OnShutdown`. The class is `injectable()` like every other host but also writes its own `SERVER_LIFECYCLE_NAME` class-metadata flag; `CDSDispatcher` reads it via `MetadataDispatcher.isServerLifecycle` and throws at bootstrap in both directions — lifecycle decorators found outside a `@ServerLifecycle` class, or any *other* handler decorator found inside one.
- Registration bypasses `srv` entirely: CAP's `served`/`listening`/`shutdown` are `process-global` `cds.on(...)` events (pinned against the installed `@sap/cds` 10.0.3 source before implementation), not service-scoped, so `CDSDispatcher` dispatches straight to `cds.on(...)` instead of the usual `srv.before/on/after` path. `shutdown` in particular is **not** `emit`-based on CAP's side: it is dispatched as `await Promise.all(cds.listeners('shutdown').map(fn => fn(err)))`, with **no once-guard** — the callback can and does fire more than once per process, so `@OnShutdown` handlers must be idempotent (documented in the README).
- `cds.on` is process-global infrastructure, so a class-level `WeakSet<Constructable>` (module scope) deduplicates registration `once per process per class`, independent of how many `CDSDispatcher` instances or bootstraps list it. Consequence pinned by a unit test: **first-dispatcher-wins** — the instance whose callbacks stay bound is the one resolved by the *first* `CDSDispatcher.initialize()` call to reach that class; a later dispatcher registering the same class skips silently (the already-registered check short-circuits before it resolves its own instance). Honesty caveat carried into the README: the guard is per **loaded bundle** — a consumer that ends up with both the CJS and the ESM build of this package loaded in one process would register a `@ServerLifecycle` class twice (two separate module scopes, two separate `WeakSet`s).
- `@Use` stacked on a `@ServerLifecycle` class fails fast at bootstrap (`SERVER_LIFECYCLE_MIDDLEWARE`) — added after review as a companion to the "wrong host" / "foreign handlers" guards, since lifecycle hooks are not request handlers and middleware has nothing to wrap there.
- Exercised end-to-end: unit (metadata shape/order, `cds.on` registration/dedup/binding/cross-class ordering, all four guard-throw paths, coexistence with a middleware-wrapped `@UnboundActions` class in the same dispatcher), integration (real bookshop boot: `@OnServed` seeds a row visible over OData before `listening` fires, `@OnListening` reports the real ephemeral port, `cds.shutdown()` triggers the marker), e2e (seeded row visible via the postman collection).

**Benefits**

- Seeding, cache warmup, connection setup and graceful cleanup live in decorated classes under DI instead of an imperative `server.js` — the last place consumers still have to leave the dispatcher's programming model.
- `@OnShutdown` gives handler classes a symmetric place to release what `@OnServed` acquired (connections, watchers, intervals).

Docs: <https://cap.cloud.sap/docs/node.js/cds-server>

---

## Deliberately skipped

| Idea | Source | Reason |
| --- | --- | --- |
| CQRS decorators (`@CommandHandler`, `@EventsHandler`, `@Saga`) | NestJS | Not CAP-idiomatic; CAP's event model is not CQRS-structured. |
| ORM entity lifecycle hooks (`@BeforeInsert`, `@AfterLoad`, …) | TypeORM/MikroORM | Our CRUD event decorators already are that layer. |
| Change-tracking, hierarchies, ETag/concurrency decorators | CAP plugins/annotations | CDS-annotation-driven; a runtime decorator adds nothing over the model annotation. |
| `@Cron`-style scheduling | NestJS `@nestjs/schedule` | Already shipped: `@Schedule` accepts interval strings and cron expressions (v6). |
| Response serialization (`@Expose`/`@Transform`) | class-transformer | Largely shipped: `@Exclude`/`@Include`/`@Mask` response transformers (v6); revisit only if custom-transform demand appears. |
| `@OnBootstrap` lifecycle decorator | own idea (#18) | Verified impossible: `bootstrap` fires before `CDSDispatcher.initialize()` runs. |

## Research sources

- CAP Node.js events & request lifecycle: <https://cap.cloud.sap/docs/node.js/events>
- Transactions, `cds.spawn`, `cds.tx`: <https://cap.cloud.sap/docs/node.js/cds-tx>
- Event queues & scheduling (CAP 9+): <https://cap.cloud.sap/docs/node.js/event-queues>
- Server lifecycle: <https://cap.cloud.sap/docs/node.js/cds-server> · middlewares: <https://cap.cloud.sap/docs/node.js/cds-serve>
- Plugin ecosystem: <https://cap.cloud.sap/docs/plugins/> · audit-logging: <https://github.com/cap-js/audit-logging> · notifications: <https://github.com/cap-js/notifications> · websocket: <https://github.com/cap-js-community/websocket>
- `req.diff()` verification: installed `@sap/cds` 10.0.3 source (`lib/req/request.js`, `libx/_runtime/common/utils/differ.js`)
- Release notes surveyed: CAP 8.0 (Jun 2024) → CAP 10 (2026), <https://cap.cloud.sap/docs/releases/>
- Framework comparison: NestJS (schedule, throttler, guards, interceptors, cqrs), Spring (`@Transactional`, `@Cacheable`, `@Retryable`, `@TransactionalEventListener`), TypeORM/MikroORM lifecycle, typestack (`routing-controllers`, `class-transformer`), `cds-routing-handlers` (<https://github.com/mrbandler/cds-routing-handlers>)
