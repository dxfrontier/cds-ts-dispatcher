# Agentic DX (JSDoc-only, rev 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `dist/index.d.ts` the best agent documentation the package can ship: a `@packageDocumentation` module header plus a canonical, example-carrying JSDoc block at every exported decorator's declaration site.

**Architecture:** Documentation-only changes in `lib/` — no runtime, no postinstall, no new shipped files, no `package.json` change. A jest drift-gate test (`@example` on every export site, `@packageDocumentation` present) is written FIRST and acts as the authoritative checklist; three batched JSDoc passes turn it green; a grep in CI pins that tsup's dts rollup preserves the blocks.

**Tech Stack:** TypeScript legacy decorators, jest + ts-jest (unit project), tsup dts rollup.

## Global Constraints

- Spec (rev 2): `docs/superpowers/specs/2026-08-03-agentic-dx-design.md`. Read it before starting. Rev 2 is JSDoc-only — do NOT create AGENTS.md files, do NOT touch `postinstall/`, do NOT add error codes.
- `npm pack --dry-run` file list must remain unchanged (acceptance criterion 3).
- JSDoc content rule: only what the signature cannot say — semantics, sibling disambiguation, gotchas, one realistic example. Compress from the decorator's README section; never copy prose. Keep every existing `@see` GitHub link.
- Legacy decorators; no tsconfig/build changes.
- Conventional commits (commitlint); end every commit message with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Working branch: `feature-agentic-dx` off `feature-batch2-decorators`.
- Commands: single test `npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit` (if `@cds-models` imports fail, run `npm run test:unit` once first); full unit `npm run test:unit`; typecheck `npx tsc --noEmit -p tsconfig.json`; lint `npm run check`.

## File Structure

| File | Responsibility |
|---|---|
| `test/__tests__/unit/AGENT_DOCS.test.ts` (create) | Drift gate: `@example` at every export site; `@packageDocumentation` in `lib/index.ts` |
| `lib/index.ts` (modify) | `@packageDocumentation` module header |
| `lib/core/CDSDispatcher.ts` (modify) | Class-level JSDoc: bootstrap contract + example |
| `lib/decorators/class.ts` (modify) | 5 export sites, canonical template |
| `lib/decorators/parameter.ts` (modify) | 24 export sites, canonical template |
| `lib/decorators/method.ts` (modify) | ~76 export sites, canonical template (two batches) |
| `.github/workflows/tests.yml` (modify) | Grep step: `@example` count + module docs survive into `dist/index.d.ts` |

## Canonical JSDoc template (all tasks)

```ts
/**
 * Executes custom logic after a read operation, on the full result set.
 * Registers `srv.after('READ', <Entity>, callback)`.
 *
 * @remarks
 * Operates on the whole result array; use `@AfterReadEachInstance` for per-row logic and
 * `@AfterReadSingleInstance` when a single entity is requested by key. Draft variant: `@AfterReadDraft`.
 *
 * @example
 * @EntityHandler(Book)
 * class BookHandler {
 *   @AfterRead()
 *   private async enrich(@Results() results: Book[], @Req() req: Request): Promise<void> {
 *     results.forEach((book) => (book.discount = '10%'));
 *   }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | CDS-TS-Dispatcher - @AfterRead}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterRead
 */
const AfterRead = buildAfter({ event: 'READ', eventKind: 'AFTER', isDraft: false });
```

Hard rules, per site:
1. Summary's second line ALWAYS names the raw CAP registration — derive it from the factory the export calls (`buildBefore` → `srv.before(event, …)`, `buildAfter` → `srv.after`, `buildOnCRUD`/`buildAction`/`buildOnEvent` → `srv.on`, `buildOnError` → `srv.on('error')`, `buildOnMessagingEvent` → messaging `srv.on`, `Prepend` → `srv.prepend`, `OnServed/OnListening/OnShutdown` → `cds.on('served'|'listening'|'shutdown')`).
2. `@remarks` MUST answer: when to use vs its confusable siblings; draft-variant pointer (if one exists); the gotcha, when there is one (e.g. `@AfterRead` mutates `results` in place; `…Draft` targets `entity.drafts`; `@OnAction` needs an `@UnboundActions` host; `@Use` does not apply to `@ServerLifecycle` classes; handler classes not passed to `CDSDispatcher` are silently inert — say it on the class decorators).
3. Exactly one `@example`, compilable against the real signatures, showing the host class decorator and typical parameter decorators. Parameter decorators get the richest examples (what is injected, when it is `undefined`).
4. Keep the existing `@see` GitHub anchor; add the local-path plain-text line.
5. Replace the existing thin one-liner block entirely; never stack two JSDoc blocks.

---

### Task 1: Branch + drift gate first (RED — the gate is the checklist)

**Files:**
- Create: `test/__tests__/unit/AGENT_DOCS.test.ts`

**Interfaces:**
- Produces: the failing-name list that Tasks 3-5 work through; `decoratorExports`/`FOREIGN_EXPORTS` conventions Tasks 3-5 must satisfy.

- [ ] **Step 1: Create the working branch**

```bash
git checkout feature-batch2-decorators && git pull --ff-only
git checkout -b feature-agentic-dx
```

- [ ] **Step 2: Write the drift-gate test**

```ts
import { readFileSync } from 'fs';
import { join } from 'path';

import * as dispatcher from '../../../lib';

const REPO_ROOT = join(__dirname, '..', '..', '..');

// Documented via its own class JSDoc, not the decorator template.
const NON_DECORATOR_EXPORTS = new Set(['CDSDispatcher']);
// Re-exported from inversify — its JSDoc lives upstream.
const FOREIGN_EXPORTS = new Set(['Inject']);

const decoratorExports = Object.entries(dispatcher)
  .filter(([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name) && !NON_DECORATOR_EXPORTS.has(name))
  .map(([name]) => name)
  .sort();

const decoratorSources = ['lib/decorators/method.ts', 'lib/decorators/class.ts', 'lib/decorators/parameter.ts']
  .map((file) => readFileSync(join(REPO_ROOT, file), 'utf8'))
  .join('\n');

describe('agent-facing JSDoc drift gate', () => {
  it('exports a sane number of decorators (sanity check for the enumeration)', () => {
    expect(decoratorExports.length).toBeGreaterThan(80);
  });

  it.each(decoratorExports.filter((name) => !FOREIGN_EXPORTS.has(name)))(
    '%s has a JSDoc block containing @example directly above its declaration',
    (name) => {
      const declaration = new RegExp(String.raw`/\*\*([\s\S]*?)\*/\s*(?:export )?(?:const|function) ${name}\b`);
      const match = declaration.exec(decoratorSources);
      expect(match).not.toBeNull();
      expect(match![1]).toContain('@example');
    },
  );

  it('lib/index.ts carries the @packageDocumentation module header', () => {
    const indexSource = readFileSync(join(REPO_ROOT, 'lib', 'index.ts'), 'utf8');
    expect(indexSource).toContain('@packageDocumentation');
  });
});
```

- [ ] **Step 3: Run it — the failure list is the work inventory**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit
```
Expected: FAIL — most per-name cases red (only ~23 sites have `@example` today) plus the `@packageDocumentation` case. Save the red list; Tasks 3-5 must drain it. If a name fails with `match: null` later despite a JSDoc block, the block is not DIRECTLY above the declaration (only whitespace allowed between `*/` and `const`).

- [ ] **Step 4: Commit the red gate**

```bash
git add test/__tests__/unit/AGENT_DOCS.test.ts
git commit -m "test(agent-docs): add JSDoc drift gate (@example per export, package docs)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 2: `@packageDocumentation` header + `CDSDispatcher` class JSDoc

**Files:**
- Modify: `lib/index.ts` (header block above the first export)
- Modify: `lib/core/CDSDispatcher.ts` (class-level JSDoc)

- [ ] **Step 1: Add the module header to `lib/index.ts`**

Insert at the very top of the file:

```ts
/**
 * `@dxfrontier/cds-ts-dispatcher` — TypeScript decorators that remove the boilerplate of
 * SAP CAP (Node.js) event handlers.
 *
 * @remarks
 * Mental model — read this before writing a handler:
 * - Decorators do NO work at decoration time; they only write metadata (reflect-metadata).
 * - Everything registers once at bootstrap: `new CDSDispatcher([Handler, …]).initialize()`
 *   returns `cds.service.impl(...)`. A handler class NOT passed to `CDSDispatcher` is silently inert.
 * - `@EntityHandler(Entity)` binds a class to a CDS-Typer entity; method decorators map 1:1 onto
 *   CAP registrations (`srv.before/on/after/prepend`). `…Draft` variants target `entity.drafts`.
 * - Required consumer tsconfig: `"experimentalDecorators": true`, `"emitDecoratorMetadata": true`.
 * - Peer dependency: dispatcher major ↔ `@sap/cds` major (v6 ↔ `@sap/cds ^10`).
 *
 * Full documentation ships inside this package (no network needed):
 * `node_modules/@dxfrontier/cds-ts-dispatcher/README.md`
 *
 * @example
 * // service implementation file referenced from your .cds `@impl`
 * import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';
 * import { BookHandler } from './handler/BookHandler';
 *
 * export = new CDSDispatcher([BookHandler]).initialize();
 *
 * @packageDocumentation
 */
```

- [ ] **Step 2: Upgrade the `CDSDispatcher` class JSDoc**

In `lib/core/CDSDispatcher.ts`, replace the existing class-level JSDoc (directly above `export class CDSDispatcher`; read what is there and keep any still-true statements) with the same contract in class form: constructor takes ALL handler classes (entity handlers, `@UnboundActions`, `@ServerLifecycle`), `initialize()` must be the module's export, unregistered classes are silently inert, plus the same bootstrap `@example`.

- [ ] **Step 3: Gate case green, typecheck, commit**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit -t "packageDocumentation"
npx tsc --noEmit -p tsconfig.json && npm run check
git add lib/index.ts lib/core/CDSDispatcher.ts
git commit -m "docs(jsdoc): add @packageDocumentation header and CDSDispatcher bootstrap contract

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 3: JSDoc batch 1 — class + parameter decorators (29 sites)

**Files:**
- Modify: `lib/decorators/class.ts` — `EntityHandler` (block on the FIRST overload, `class.ts:21`), `Repository`, `ServiceLogic`, `UnboundActions`, `ServerLifecycle`
- Modify: `lib/decorators/parameter.ts` — `Msg, SingleInstanceSwitch, Error, Next, Result, Results, Req, Res, GetQuery, GetRequest, IsColumnSupplied, IsRole, IsPresent, Jwt, ValidationResults, Locale, Env, Subject, Affected, Data, Param, UserInfo, Tenant, Diff`

Two fully-worked references (the rest follow the template + hard rules):

```ts
/**
 * Binds the handler class to a CDS-Typer entity (or to every entity via `CDS_DISPATCHER.ALL_ENTITIES`)
 * and marks it inversify-injectable. Required host for entity event handlers.
 *
 * @remarks
 * The class only takes effect when passed to `new CDSDispatcher([...])` — otherwise it is silently
 * inert. Draft-variant method decorators inside this class target `<Entity>.drafts` automatically.
 * Unbound actions belong in an `@UnboundActions` class; server lifecycle hooks in `@ServerLifecycle`.
 *
 * @example
 * @EntityHandler(Book)
 * class BookHandler {
 *   @AfterRead()
 *   private async enrich(@Results() results: Book[], @Req() req: Request): Promise<void> { ... }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#entityhandler | CDS-TS-Dispatcher - @EntityHandler}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § EntityHandler
 */
```

```ts
/**
 * Injects the typed `cds.env` project configuration (generated into `@dispatcher/index.ts` by the
 * postinstall) into the decorated parameter.
 *
 * @remarks
 * The type comes from the consumer project's own `CDS_ENV`; import it via the `#dispatcher` alias.
 * If the postinstall was skipped (warning in the install log), the value is still injected but untyped.
 *
 * @example
 * import type { CDS_ENV } from '#dispatcher';
 *
 * @AfterRead()
 * private async read(@Results() results: Book[], @Env() env: CDS_ENV): Promise<void> {
 *   if (env.requires.db.kind === 'sqlite') { ... }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#env | CDS-TS-Dispatcher - @Env}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Env
 */
```

- [ ] **Step 1: Apply the template to all 29 sites** (content source: each decorator's README section — verify the `@see` anchor you keep matches it)
- [ ] **Step 2: Verify the batch is green in the gate**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit 2>&1 | grep -E "✕" | grep -vE "method\.ts" || true
```
Expected: remaining failures name only `method.ts` exports. (Simply re-run the full gate and confirm every class/parameter name passed.)

- [ ] **Step 3: Typecheck + lint + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run check
git add lib/decorators/class.ts lib/decorators/parameter.ts
git commit -m "docs(jsdoc): canonical agent-oriented JSDoc for class and parameter decorators

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: JSDoc batch 2 — method decorators, BEFORE/AFTER families (45 sites)

**Files:**
- Modify: `lib/decorators/method.ts` — checklist: `BeforeAll, BeforeCreate, BeforeRead, BeforeUpdate, BeforeDelete, BeforeAction, BeforeFunction, BeforeBoundAction, BeforeBoundFunction, BeforeCreateDraft, BeforeReadDraft, BeforeUpdateDraft, BeforeDeleteDraft, BeforeAllDraft, AfterAll, AfterCreate, AfterRead, AfterReadEachInstance, AfterReadSingleInstance, AfterReadDraftSingleInstance, AfterUpdate, AfterDelete, AfterAction, AfterFunction, AfterBoundAction, AfterBoundFunction, AfterCreateDraft, AfterReadDraft, AfterReadDraftEachInstance, AfterUpdateDraft, AfterDeleteDraft, AfterAllDraft, BeforeNewDraft, BeforeCancelDraft, BeforePatchDraft, BeforeDiscardDraft, BeforeEditDraft, BeforeSaveDraft, AfterNewDraft, AfterCancelDraft, AfterPatchDraft, AfterDiscardDraft, AfterEditDraft, AfterSaveDraft`

- [ ] **Step 1: Apply the template to every site in the checklist.** Sibling-disambiguation is the priority of this batch: the read family (`AfterRead` / `EachInstance` / `SingleInstance` / draft combinations) and the draft-lifecycle events (`BeforeNewDraft` vs `BeforeCreateDraft` — new-draft creation vs CREATE on the draft table) must each name their neighbors in `@remarks`.
- [ ] **Step 2: Gate progress + typecheck + lint + commit**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit
npx tsc --noEmit -p tsconfig.json && npm run check
git add lib/decorators/method.ts
git commit -m "docs(jsdoc): canonical agent-oriented JSDoc for BEFORE/AFTER method decorators

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 5: JSDoc batch 3 — remaining method decorators (gate goes fully GREEN)

**Files:**
- Modify: `lib/decorators/method.ts` — checklist: `OnCreate, OnRead, OnUpdate, OnDelete, OnAction, OnFunction, OnEvent, OnError, OnBoundAction, OnBoundFunction, OnAll, OnCreateDraft, OnReadDraft, OnUpdateDraft, OnDeleteDraft, OnBoundActionDraft, OnBoundFunctionDraft, OnAllDraft, OnNewDraft, OnCancelDraft, OnPatchDraft, OnDiscardDraft, OnEditDraft, OnSaveDraft, BeforeCommit, AfterCommit, AfterRollback, OnRequestDone, OnScheduled, Schedule, OnScheduledSuccess, OnScheduledFailure, Stream, Throttle, OnServed, OnListening, OnShutdown, OnWebSocketMessage, OnWebSocketConnect, OnWebSocketDisconnect, OnSubscribe, Use, Prepend, PrependDraft, ExecutionAllowedForRole, SingleInstanceCapable, Validate, FieldsFormatter, CatchAndSetErrorMessage, CatchAndSetErrorCode, Exclude, Include, Mask, LogExecution` — plus ANY name the gate still reports (the export block may contain a few websocket/tail exports beyond this list; the test is authoritative).

- [ ] **Step 1: Apply the template to every remaining red name.** Notable gotchas to state in `@remarks`: `@OnError` runs synchronously (no async work; `@Throttle`/`@Diff` are rejected there); `@OnRead` REPLACES the default READ implementation (vs `@AfterRead` which post-processes); `@Prepend` runs before all other handlers of the event; `@Use` wraps entity handlers only; `@OnServed/@OnListening/@OnShutdown` require a `@ServerLifecycle` host class.
- [ ] **Step 2: Full gate green + full unit suite + commit**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit
npm run test:unit && npx tsc --noEmit -p tsconfig.json && npm run check
git add lib/decorators/method.ts
git commit -m "docs(jsdoc): complete decorator JSDoc pass; drift gate fully green

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 6: d.ts survival — local verification + CI grep

**Files:**
- Modify: `.github/workflows/tests.yml` (Postinstall verifier job, directly after the `Build project` step, ~line 81)

- [ ] **Step 1: Verify locally that tsup's dts rollup preserves the docs**

```bash
npm run build
grep -c "@example" dist/index.d.ts
grep -c "silently inert" dist/index.d.ts
```
Expected: `@example` ≥ 80; "silently inert" ≥ 1 (the module header made it through). If the module header was stripped but per-export blocks survived, verify the same text exists via the `CDSDispatcher` class JSDoc in `dist/index.d.ts` (the spec's contingency) — the class JSDoc from Task 2 Step 2 must then carry the full mental-model content; adjust it if you shortened it.

- [ ] **Step 2: Add the CI step**

```yaml
      - name: Assert agent-facing JSDoc survives into dist/index.d.ts
        run: |
          COUNT=$(grep -c "@example" dist/index.d.ts)
          echo "Found $COUNT @example blocks in dist/index.d.ts"
          test "$COUNT" -ge 80
          grep -q "silently inert" dist/index.d.ts
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/tests.yml
git commit -m "ci(tests): assert agent-facing JSDoc survives the d.ts rollup

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 7: Acceptance run + push

- [ ] **Step 1: Full acceptance against the spec (rev 2) criteria**

```bash
npm run test:unit                     # incl. AGENT_DOCS gate (criterion 1)
npm run test:integration
npm run check
npm run build && grep -c "@example" dist/index.d.ts   # ≥ 80 (criterion 2)
npm pack --dry-run                    # file list identical to main (criterion 3)
```
The pack list must contain no new entries versus the branch base — in particular nothing from `docs/` and no `AGENTS.md` anywhere.

- [ ] **Step 2: Push the branch** (PR creation stays with the user per repo convention)

```bash
git push -u origin feature-agentic-dx
```
