# JSDoc correctness review — findings register

**Date:** 2026-08-04 · **Branch:** `feature-batch2-decorators` · **Range:** `155a23c..HEAD` (the agent-oriented JSDoc pass, net diff ~2,700 lines)

**Method:** three independent Opus reviewers (BEFORE/AFTER families · ON/event/lifecycle/wrappers · class/parameter/core + gate), every CRITICAL and load-bearing MINOR re-verified by the orchestrator against `lib/` source and the installed `@sap/cds` **10.0.3** in `node_modules`; capire cross-checked via the CAP MCP (`search_docs`). All ~130 documented exports covered.

**Gates at review time:** `AGENT_DOCS.test.ts` 130/130 · `npm run build` green · `dist/index.d.ts` carries 140 `@example` (CI threshold ≥ 120) + both sentinels.

**Why the suite is green despite these findings:** the fixtures only exercise working configurations — transformers and `@IsColumnSupplied` only under `@AfterRead`, `@IsPresent` only with `'SELECT'`, `@FieldsFormatter` only single-field, no `@BeforeCreateDraft`/`@AfterCreateDraft` fixture exists, and the DeleteDraft fixture bodies are empty. In one case a green test *proves* a finding: `test/__tests__/integration/CRUD-CONTRACT.test.ts:52` ("It should RECEIVE the request data") asserts exactly the behavior the `@AfterUpdate` JSDoc denies. The drift gate is structural (`@example` presence), not semantic.

**Classification:** `DOC` = the prose is wrong, code behaves sensibly → fix wording. `CODE` = the doc describes the *intended/sensible* behavior and the implementation diverges → decide code-fix (+ tests) vs doc-fix. `GATE` = defect in review infrastructure. All findings below are **CONFIRMED** (traced in source; none rest on reviewer authority alone except where noted).

**Status (2026-08-04, docs-only tranche):** ✅ **FIXED & shipped on this branch** — C1, C2, M1–M5, M7, M10–M17, N1–N9 (JSDoc prose in `lib/`, README mirrors for M1/M16, tests.yml escape-convention sentinel for N8). Gates at fix time: check clean · build + 3 d.ts sentinels PASS · unit 527/527.

**Status (2026-08-04, code-fix tranche):** the code-fix fork was taken for all seven open defects. ✅ **M18** — gate hardened (`matchAll` + per-name expected declaration counts; red-proofed by stripping the wildcard `@EntityHandler` overload's JSDoc). ✅ **C3, C4** — code-fixed (option (a) both): `applyIsColumnSupplied` guards INSERT/UPSERT with the ladder explicit `.columns` wins → `entries` keys (any entry) → `false`; the `'columns'` IsPresent branch keys on `req.query[parameter.key]`. Red-first `PARAMETER-QUERY-GUARDS.test.ts` (unit 14, integration 2 — the previously-500ing OData POST now 201s; the C4 discriminator rides an entries-form INSERT with an explicit `.columns` list because cds 10 app services reject positional rows payloads at input validation). `parameter.ts` remarks + README notes aligned. ✅ **C5** — code-fixed (option (a)): `formatterUtil.findResults` falls back to `req.results` when no callback argument identity-matches (the cds-10 write-event argument swap), guarded to object-shaped results (a `null` reply from a custom `@On*` handler or a `legacy_srv_results` numeric count keeps the pre-fix no-op instead of throwing inside the transformers). `@Exclude`/`@Include`/`@Mask`/`@FieldsFormatter` now genuinely engage on write-AFTER events. **Empirical, verified against installed sources:** generic write `req.results` carries no business data — CREATE = key columns only (`InsertResults#materialize`, `@cap-js/db-service`), UPDATE = empty array + `.affected` (`crud.js` `new_behavior`, `legacy_srv_results: false` default) — and generic OData/REST write response bodies are rebuilt AFTER the after-phase (read-after-write / `req.data`), so transformer shaping reaches the HTTP body only where a custom `@On*` handler returned full rows; multiple `.after` handlers of one event dispatch under `Promise.all`, not registration order. JSDoc (three transformer remarks) and README (three section notes; `@Mask` option names corrected to `visibleStart`/`visibleEnd`) now steer HTTP write-response shaping to `@AfterRead`. Red-first: unit fallback contract (rule-labelled, 8 new/updated cases + 2 guard cases) and `TRANSFORMERS-WRITE-EVENTS.test.ts` (RED→GREEN via `@Exclude('ID')` — the only field CREATE surfaces; the 201-body assertion pins the read-after-write mechanism). Opus-reviewed: both IMPORTANT findings (non-object guard; response-body caveat) fixed before commit; two latent minors deferred — a lazily-unmaterialized `InsertResults` written by a concurrent same-event `@FieldsFormatter` can corrupt the key row before `_only_keys` is evaluated, and `@AfterReadEachInstance` + transformer applies the whole-array transform once per row (idempotent actions unaffected); neither has fixture coverage. ✅ **C6** — code-fixed (option (a)): the `@FieldsFormatter` descriptor now dispatches by branch instead of a `break`-per-field loop — `customFormatter` runs exactly ONCE with `(req, results)` (zero field arguments included; `results` is `undefined` on the request-data path), the AFTER-many/AFTER-single branches format EVERY listed field, and the BEFORE/ON request-data path (incl. its per-field 400-reject) is semantically untouched. Red-first: 6 new unit cases in `FORMATTER-UTIL.test.ts` (multi-field many/single, zero-field custom AFTER/BEFORE, plus regression pins). JSDoc remarks + README (§FieldsFormatter host list extended to write-AFTER with the `@Exclude` caveat pointer; all-fields/custom-once note) aligned; the deferred each-instance caveat now sits in `@AfterReadEachInstance`'s remarks. ✅ **M6** — code-fixed (mirror option): `mapPrependDraftEvent` carries `isDraft: false` on exactly the six EDIT/SAVE entries (their own decorators register on the ACTIVE entity), `MapPrepend` gained `isDraft?: boolean`, and `@PrependDraft` registers `isDraft ?? true` — `@PrependDraft({eventDecorator:'BeforeEditDraft'})` now fires on a real `draftEdit` (red-first integration `PREPEND-DRAFT-EDIT.test.ts` + map-level and metadata-level unit reds in `DECORATORS-UTIL.test.ts`; the two other fixture `@PrependDraft` usages are non-EDIT/SAVE and unaffected). Reviewed (sonnet): no findings; the reviewer traced `registerPrependHandler` → `getActiveEntityOrDraft` consuming `handler.isDraft`, confirming the map change is live code. ⏳ **IN PROGRESS** — M8, M9 (red-first tests per the backlog below; status updated per commit).

---

## Critical

### C1 · `@BeforeCreateDraft` / `@AfterCreateDraft` — exclusivity claim is false · DOC
- **Where:** `lib/decorators/method.ts:1298` (Before), `:1667` (After), example comment `:1308`.
- **Claim:** "only fires for a literal `CREATE` issued WITHOUT a protocol straight at `<Entity>.drafts`" — i.e. never for the Fiori "New" flow.
- **Actual:** CAP's own `NEW` implementation is the counterexample: `lean-draft.js:2156` builds `INSERT.into(req.subject)` and `await this.dispatch(insertReq)`; `_newReq` stamps `event: 'CREATE'` for an INSERT (`lean-draft.js:573`) targeting `<Entity>.drafts`, and `srv-dispatch.js` `handle()` runs all matching `.before`/`.after` handlers for any dispatched request. **Every Fiori Elements "New" fires these decorators** as a nested sub-request.
- **capire:** documents `NEW` (on `.drafts`) as the draft-creation lifecycle event (`node.js/fiori` § Draft-specific Events; `guides/uis/fiori`: `POST /Foo` → NEW). The nested `CREATE` dispatch is undocumented internal behavior — pinned in source.
- **Fix direction:** keep steering users to `@BeforeNewDraft`/`@AfterNewDraft` for UI flows, but replace the exclusivity claim: these hooks fire for programmatic creates **and** as the nested INSERT sub-request inside every `NEW`.

### C2 · `@BeforeDeleteDraft` / `@AfterDeleteDraft` — "distinct from discarding" is false · DOC
- **Where:** `lib/decorators/method.ts:1441`, `:1921`.
- **Claim:** a literal `DELETE` on `.drafts`, "distinct from abandoning a draft through the Fiori Elements UI".
- **Actual:** discard is rewritten to `CANCEL` (`lean-draft.js:626`, `:603`); `onCancel` then dispatches a nested `DELETE` on `.drafts` (`lean-draft.js:2414-2416`). **Both** the Cancel/Discard decorators and the DeleteDraft decorators fire for one UI discard.
- **capire:** `DELETE …(IsActiveEntity=false)` → DISCARD is the documented lifecycle event; the nested DELETE is internal.
- **Fix direction:** same shape as C1 — "also fires as a nested sub-request of every draft discard".

### C3 · `@IsColumnSupplied` example crashes every OData/REST create · CODE (+ example)
- **Where:** doc/example `lib/decorators/parameter.ts:319-329` (pins usage under `@BeforeCreate`); implementation `lib/util/parameter/parameterUtil.ts:53-61`.
- **Claim:** works on CREATE — example: `@BeforeCreate()` + `@IsColumnSupplied<Book>('price')`.
- **Actual:** the INSERT and UPSERT branches call `req.query.INSERT.columns.includes(...)` **unguarded**. Protocol creates build `INSERT.into(from).entries(data)` (`libx/odata/middleware/create.js:58`) and per the official CQN spec `columns` is optional — required only for the `values`/`rows` forms, never present with `entries`. Copying the example → `TypeError` → HTTP 500 on every create. Only the SELECT branch is guarded (and is the only branch fixtures exercise, under `@AfterRead`).
- **Fix options:** (a) code — guard the INSERT/UPSERT branches and derive suppliedness from `entries` keys (e.g. `entries.some(e => field in e)`), + tests; (b) doc — revert the example to a READ context and state INSERT/UPSERT support requires explicit `.columns(...)` queries.

### C4 · `@IsPresent('INSERT'|'UPSERT', 'columns')` is always `false` · CODE (+ example)
- **Where:** doc/example `lib/decorators/parameter.ts:375-390`; implementation `parameterUtil.ts:202-209`.
- **Claim:** answers "is `req.query[key][property]` present" for all keys; example: `@BeforeCreate()` + `@IsPresent('INSERT', 'columns')` guarding an `if (hasColumns)` block.
- **Actual:** the `'columns'` case hardcodes `!!req.query.SELECT?.[queryOption]` on the IsPresent branch regardless of the requested key — on CREATE, `req.query.SELECT` is `undefined`, so the parameter is unconditionally `false`; the example's `if` body is dead code. (`@GetQuery('INSERT','columns')` takes the `'Get'` branch and is unaffected.)
- **Fix options:** (a) code — use `req.query[parameter.key]?.[queryOption]` on both branches, + tests; (b) doc — restrict the documented keys for `'columns'` to `SELECT` and restore the previous working example.

### C5 · `@Exclude` / `@Include` / `@Mask` silently no-op on `@AfterCreate` / `@AfterUpdate` · CODE — leak-shaped
- **Where:** docs `lib/decorators/method.ts:541`, `:581`, `:621` ("…or the single row from `@AfterCreate` / `@AfterUpdate`"); implementation `lib/util/formatter/formatterUtil.ts` `findResults` + `lib/core/CDSDispatcher.ts:184-190`.
- **Actual:** `findResults` only returns an argument **identical to `req.results`** (or wrapping a non-array `req.results`). For CREATE/UPDATE under cds 10, `executeAfterCallback` deliberately swaps the handler argument to `req.data` before invoking — so `findResults` finds nothing, the transformer early-returns, and (per the docs' own example theme) `password`/`ssn` stay in the response with no error. The transformers actually work only where the argument *is* `req.results`: READ paths.
- **Fix options:** (a) code — teach `findResults` to also match the swapped `req.data` payload (or have `executeAfterCallback` expose the substituted results for transformers), + a red-then-green test asserting field removal on POST/PATCH responses — recommended, this is a security-shaped footgun; (b) doc — restrict the claim to READ-phase decorators.

### C6 · `@FieldsFormatter` formats only the FIRST field on `@After*` results · CODE
- **Where:** docs `lib/decorators/method.ts:407`, `:411` ("one or more fields", "formats `results` (array or single row)"); implementation loop `method.ts:446-465`.
- **Actual:** the `for (const field of fields)` loop `break`s after the first field in all three results branches (custom, many, one) — `@FieldsFormatter({action:'toUpper'}, 'title', 'author')` on `@AfterRead` uppercases `title` and silently skips `author`. Only the request-data path (BEFORE/ON) iterates every field. Sub-gotcha: the `customFormatter` branch lives *inside* the loop, so with zero field arguments the callback is never invoked.
- **Fix options:** (a) code — hoist the custom-formatter call out of the loop and remove the `break`s (or iterate fields inside each branch), + multi-field tests; (b) doc — state "first field only" for AFTER results (unattractive: the API takes variadic fields).

---

## Minor

### CRUD / draft semantics

- **M1 · `PATCH`/`DISCARD` "canonical … since `@sap/cds` 10" is inverted** · DOC — repeated ~14×: `method.ts:1371`, `:1394`, `:1849`, `:1872`, `:2244`, `:2268`, `:2769`, `:2821`, `:2924`, `:3021`, `:3043`, `:3065`, `:3088`, `:3114`. Ground truth: the alias table `{PATCH:'UPDATE', DISCARD:'CANCEL'}` is applied **at registration** (`srv-handlers.js:163-171`, with CAP's own `REVISIT` comment), `req.event` is never `'PATCH'`/`'DISCARD'` at runtime, and the aliases date from cds **9** (CHANGELOG 9.0.0 / 9.4.2), not 10. capire agrees: "PATCH: alias for UPDATE on drafts". Also worth stating: the Patch/Discard decorators produce byte-identical registrations to their Update/Cancel twins (stacking both = a two-link `next()` chain — the fixture `BookEventsHandler.ts:104-120` relies on exactly this). One global sentence fix.
- **M2 · `@AfterUpdate` "receives the updated row"** · DOC — `method.ts:1847`. It receives the request change-set: `CDSDispatcher.ts:186` sets `results = req.data` (PATCH body + URL keys); `result.title` is `undefined` after `PATCH {stock:7}`. The repo's own test names it correctly (`CRUD-CONTRACT.test.ts:52`), and capire (June 2022 release) says write results "might be minimized" with read-after-write logic belonging in `after('READ')`.
- **M3 · `@AfterReadSingleInstance` "entity-set requests never reach it"** · DOC — `method.ts:1788` (+ `:1821` draft twin). The gate is `req.params.length > 0`; keyed *navigation* reads (`GET /Authors(1)/books`) carry one param per keyed path segment while targeting the set — the handler fires and receives only `data[0]`, silently dropping the rest.
- **M4 · `@AfterAction`/`@AfterFunction`(+Bound) omit the numeric→boolean normalization hazard** · DOC — `method.ts:1938-2032`. They register through the same `executeAfterCallback` whose cds-9 branch coerces any numeric result: `results = results === 1` (`CDSDispatcher.ts:187-189`) — an action returning `Integer 1` delivers `true` to `@Result`. The After-CRUD docs document this; the action docs don't.
- **M5 · `@AfterReadEachInstance`(+draft) per-row callbacks are not awaited** · DOC — `method.ts:1733-1780`. CAP's `foreach_handler_for` is `rows.forEach(r => handler.call(...))` — returned promises are discarded. The examples are `async`; an `await` inside silently races the response. capire's own `each` examples are synchronous. Docs should say: synchronous mutation only.
- **M6 · `@PrependDraft` accepts EDIT/SAVE decorators but hardcodes `isDraft: true`** · CODE or DOC — `method.ts:145-157` docs, `:203` implementation. `@BeforeEditDraft`/`@OnEditDraft`/`@AfterEditDraft` (+SAVE family) are all `isDraft: false` (EDIT dispatches against the **active** entity — capire: "EDIT handlers are registered on the active entity"), so `@PrependDraft({eventDecorator:'BeforeEditDraft'})` registers on `.drafts` and never fires; SAVE fires only via the `draftActivate` gate. Fix: mirror the target decorator's `isDraft` (code) or carve EDIT/SAVE out of `PrependDraftDecorators`/docs.

### Wrappers / middleware

- **M7 · `@Use` class-level registration described wrongly on both halves** · DOC (targeting arguably CODE) — `method.ts:781-783`. (1) The path is `<Entity>.drafts` whenever the entity is draft-enabled (`MiddlewareEntityRegistry.ts:47-53`) — plain requests to the active entity never run the middleware, contradicting "runs before every handler". (2) It is either/or, not "plus": `buildMiddlewares` registers `srv.before('*')` **or** per-action handlers (`:149-165`), so `@EntityHandler` classes get no action/event/error wrapping and `@UnboundActions` classes get no `'*'`.
- **M8 · Method-level `@Use` discards the handler's return value** · CODE — `middlewareUtil.ts:66-67` ends `await originalMethod?.apply(this, args);` with no `return` — an `@OnAction` + `@Use` handler resolves `undefined`, so CAP never `reply`s the payload, contradicting `@OnAction`'s "return the action's result directly" (`method.ts:2343`). One-token fix (`return await …`) + test.
- **M9 · Class-level `@Use` `next()` re-runs the chain tail** · CODE — `middlewareUtil.ts:36-43`: the `next` closure runs `executeMiddlewareChain(index+1, …, entityInstance)` **and then** unconditionally `executeMiddlewareChain(index+1, …)` — with `@Use(M1, M2)` both calling `next()`, `M2` executes twice per request (tail count grows with chain length). Fixtures only `console.log`, so nothing caught it.
- **M10 · `@Validate` — `exposeValidatorResult` *replaces* the rejection** · DOC — `method.ts:473-485` says failure "always" rejects and the flag "additionally" exposes flags; `validatorUtil.ts:163-166` returns the flags **before** the reject path, so with the flag set nothing is rejected and the handler always runs. Say "instead of", not "additionally".
- **M11 · `@FieldsFormatter` "sibling `@Validate` … rejects instead of transforming"** · DOC (reject itself is questionable → CODE candidate) — the formatter's request path *also* rejects: `handleOneItemOfRequest` → `req.reject(400)` when the field is null/undefined in `req.data` (`formatterUtil.ts:135-146`) — a PATCH not touching the formatted field gets 400.
- **M12 · Request-lifecycle decorators claim service-wide coverage without the queue carve-out** · DOC — `method.ts:3148`, `:3185`, `:3219`, `:3254`. `CDSDispatcher.ts:513-532` deliberately skips persistent-queue background dispatches (plain-object task context can't host hooks — the code comment documents the incident); `@OnScheduled` + `@BeforeCommit` in one class → the hook never fires for the queued execution. Docs must state the carve-out the code already explains.

### Parameters / class / module

- **M13 · `@Next` example doesn't type-check** · DOC — `parameter.ts:110-115`: `NextEvent = (req?) => Function` (`types.ts:56`), so `return next()` is not assignable to `Promise<Book>` (TS2322). The `method.ts` examples were fixed to `Promise<Function>`/`Promise<unknown>`; this copy was missed.
- **M14 · `@Next` "valid on every `@On*` decorator" is over-broad** · DOC — `parameter.ts:104-105`. Counterexamples: `@OnError` (invoked `(err, req)`), `@OnScheduledSuccess`/`Failure` (registered via `srv.after`, `(data, req)`), `@OnRequestDone` (`(req)`) — `@Next` injects `undefined`; `@OnServed`/`@OnListening`/`@OnShutdown` bypass `ArgumentMethodProcessor` entirely, so `@Next` is silently ignored. `return next()` there → `TypeError`.
- **M15 · `@OnError` "only valid inside an `@UnboundActions` class"** · DOC — `parameter.ts:70-71` contradicts `method.ts:2651` ("**Conventionally** hosted…", which is correct): no such constraint exists; `srv.on('error', …)` registers identically from an `@EntityHandler` class (`CDSDispatcher.ts:751-756`).
- **M16 · `@ServiceLogic('Singleton')` "shares ONE instance app-wide"** · DOC — `class.ts:104-105`. The inversify container is a per-`CDSDispatcher` instance field (`CDSDispatcher.ts:87`); the bookshop fixture alone constructs 4 dispatchers — a Singleton shared across two of them yields two instances. Scope claim: per dispatcher (per CAP service). `README.md:769` carries the same overstatement.
- **M17 · `@Jwt` "it does not throw"** · DOC — `parameter.ts:410-412`. For non-HTTP dispatches (`req.http` undefined: queue/scheduled, messaging, bare `srv.run`), `@sap-cloud-sdk`'s `retrieveJwt` reads `req.headers` off `undefined` → TypeError. The sibling `@Res` doc calls the non-HTTP case out; `@Jwt` must too. *(Accepted on single-reviewer trace of SDK internals; lowest-confidence item in this register.)*

### Review infrastructure

- **M18 · Drift gate enforces only the FIRST `@EntityHandler` overload** · GATE — `AGENT_DOCS.test.ts:36` uses `regex.exec()` (first match). Deleting the entire JSDoc of the second overload (`'*'` wildcard, `class.ts:32-54`) stays green. Fix: `matchAll` + assert every declaration of a name carries `@example` (or per-name expected counts). The regex itself is sound against the two designed vectors (no-JSDoc slip-through; previous block satisfying adjacency).

---

## Nits

- **N1** `method.ts:1788` — single-instance miss yields `{}` (via `getArrayFirstItem`), not `undefined`; `if (!result) return` never short-circuits.
- **N2** `method.ts:1591` — `@AfterAll` example comment `// READ (entity set)`: single READs are array-wrapped too (`srv-dispatch.js:68`), landing in the same branch.
- **N3** `method.ts:2506` — `@OnEvent` "excluded from `@OnAll`… firing" is false for an `@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)` host (event `'*'` + path `'*'` → no filter at all).
- **N4** `method.ts:3143` etc. — lifecycle hooks documented as `req.context.before(...)`; code calls `req.before(...)` on the sub-request (semantically equivalent via the shared root emitter, but the file's convention is to quote the literal call).
- **N5** `method.ts:662-664` — `@LogExecution` "transformers not included in the duration" holds only when it is the innermost wrapper; decorator order flips it.
- **N6** `lib/index.ts:10-11` + `CDSDispatcher.ts:52-53` — "method decorators map 1:1 onto `srv.before/on/after/prepend`" conflicts with the documented exceptions (`cds.on` server lifecycle, `req.before/on` request lifecycle, `@Schedule`'s `cds.once('served')`). The two doc copies agree with each other (checked bullet-by-bullet).
- **N7** `parameter.ts:714` — `@Diff` "costs one extra database read": true for UPDATE/DELETE, not CREATE (`differ.js:158-166` reads nothing).
- **N8** `.github/workflows/tests.yml:88-89` — the two sentinels pin bullets 3/5 of the CDSDispatcher block but not the escape-convention paragraph after them; tail truncation stays green.
- **N9** `parameter.ts:139` — `@Results` "mutating the array in place changes the response": element mutation always works, but `push`/`splice` are lost on single-instance READs (CAP passes a fresh `[req.results]` wrapper).

---

## Notable claims verified CORRECT (keep as-is)

ON interceptor-stack/first-match semantics incl. the `req.reply` split · `@OnSaveDraft` firing for ordinary active writes (draftActivate gate) · `@BeforeCommit` array order vs reversed `@AfterCommit`/`@AfterRollback`/`@OnRequestDone` · `@OnServed` sequential await / `@OnListening` fire-and-forget / `@OnShutdown` parallel + rejection blocking close · `@OnError` sync-only · CREATE→NEW / DELETE→CANCEL protocol rewrites · `@OnScheduledFailure` `maxAttempts: 10` · websocket close-code-as-reason · `@Mask` defaults · `@Diff` payload shape (`_op`/`_old`, keys always present) + the microtask ordering warning · `@Subject` cds^11 deprecation (verbatim in CHANGELOG) · wildcard `'*'` "drafts included, duplicates every event" · `@EntityHandler` overload set (no string overload claimed) · `@ServerLifecycle` foreign-handler/wrong-host/`@Use` throws + per-process `WeakSet` dedup · container constants and `initialize()` → `cds.service.impl` contract · the `/@Name` escape convention applied consistently (zero unescaped line-start tokens; 140 fenced examples).

---

## Derived test backlog (if the code-fix fork is taken)

Each gap that let a bug hide is the test to write:

1. `@Exclude`/`@Mask` under `@AfterCreate`/`@AfterUpdate` — assert field removal in POST/PATCH response bodies (C5).
2. `@IsColumnSupplied` under `@BeforeCreate` — OData POST must not 500; suppliedness from `entries` (C3).
3. `@IsPresent('INSERT','columns')` — true/false on crafted queries with/without `.columns` (C4).
4. `@FieldsFormatter` with ≥2 fields on `@AfterRead` + `customFormatter` with zero fields (C6).
5. Draft choreography: spy `@BeforeCreateDraft`/`@AfterCreateDraft` during a Fiori-style `POST {}` (NEW), and `@BeforeDeleteDraft`/`@AfterDeleteDraft` during a discard — pins C1/C2 wording either way.
6. Method-level `@Use` on `@OnAction` — action response body survives (M8).
7. Class-level `@Use(M1, M2)` — `M2` executes exactly once per request (M9).
8. `@PrependDraft({eventDecorator:'BeforeEditDraft'})` — callback fires on EDIT (M6).
9. Drift gate: `matchAll` regression for the second `@EntityHandler` overload (M18).

## Decision needed

- **C1, C2, M1-M5, M7, M10-M17, N1-N9** — ✅ DONE: shipped as the docs-only tranche on this branch.
- **C3, C4, C5, C6, M6, M8, M9** — OPEN: the docs describe the *intended* behavior; fixing the code is a behavior change requiring tests (backlog above). Recommended to fix in code: **C5** (data-leak footgun; note the fix must target `req.results`, which is what CAP replies from — not the swapped callback argument), **C3** (crash), **M8/M9** (silent correctness). If deferred, the corresponding JSDoc must be rewritten to the current behavior in the meantime — a published doc must not promise what the code doesn't do.
- **M18** — ✅ DONE: `AGENT_DOCS.test.ts` now `matchAll`s every documented declaration per name and pins the count (`EntityHandler: 2`); deleting either overload's JSDoc fails the gate.
