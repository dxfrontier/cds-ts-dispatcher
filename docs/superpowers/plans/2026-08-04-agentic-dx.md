# Agentic DX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@dxfrontier/cds-ts-dispatcher` guide AI coding assistants in consumer projects: a shipped agent guide (`docs/AGENTS.md`), a postinstall-scaffolded `@dispatcher/AGENTS.md`, stable developer-facing error codes, and rich JSDoc with `@example` on every exported decorator.

**Architecture:** Four passive documentation layers, no new executables. A hand-written `docs/AGENTS.md` ships in the tarball; a new `AgentsMdGenerator` (sibling of `EnvGenerator`) scaffolds a thin pointer file into consumer projects on install; all `util.throwErrorMessage` sites migrate to a coded `throwDispatcherError`; JSDoc at every export site gets a canonical template. A jest drift-gate test keeps docs and code in lockstep.

**Tech Stack:** TypeScript (legacy decorators), jest + ts-jest (unit project), tsup (build + d.ts rollup), the existing postinstall machinery (`FileManager`, `EnvGenerator`), picocolors in verifiers.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-03-agentic-dx-design.md`. Read it before starting.
- Postinstall hard policy: **never abort or hang a consumer's install** — every failure in new postinstall code degrades to skip-with-warning (`console.warn`), never `throw` out of `run()`, never `process.exit(1)`.
- Error codes are **append-only**: never renumber or reuse. `E0xx` = developer-facing configuration/usage errors; `E9xx` = internal invariants. Codes apply ONLY to `util.throwErrorMessage` migrations. `req.reject` / `raiseBadRequestMessage` messages (VALIDATOR_*, THROTTLE_LIMIT_EXCEEDED) are end-user API responses — **do not touch them**.
- `docs/AGENTS.md` content rule: only information an agent cannot discover from code/types/README; the taxonomy is a one-line index into README anchors, never a copy of README prose.
- Only `docs/AGENTS.md` ships from `docs/` — `docs/superpowers/**` must never appear in the tarball.
- Legacy decorators only (`experimentalDecorators` + `emitDecoratorMetadata`); do not change build/tsconfig behavior.
- Conventional commits enforced by commitlint. End every commit message with the trailer line: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `CHANGELOG.md` is generated — never edit. No `version` bump in this work.
- Working branch: `feature-agentic-dx`, created off `feature-batch2-decorators` (the taxonomy needs `@Throttle`, `@ServerLifecycle` family, websocket decorators that exist only there).
- Test commands: unit `npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit` (first run of the day: `npm run test:unit` to regenerate `@cds-models`); full unit `npm run test:unit`; verifiers `npm run test:verifier` and `npm run test:verifier:monorepo` (both need `npm run build && node ./postinstall/PostInstall.js` first); lint `npm run check`.

## File Structure

| File | Responsibility |
|---|---|
| `docs/AGENTS.md` (create) | Shipped agent guide: mental model, setup contract, decorator taxonomy (index → README anchors), confusables, error catalog |
| `package.json` (modify) | Add `./docs/AGENTS.md` to `files` |
| `test/__tests__/unit/AGENT_DOCS.test.ts` (create) | Drift gate: taxonomy ↔ exports, README anchors, error codes ↔ catalog (PR 2), `@example` coverage (PR 3) |
| `postinstall/util/AgentsMdGenerator.ts` (create) | Writes `@dispatcher/AGENTS.md` per execution path; version-stamped; skip-with-warning |
| `postinstall/PostInstall.ts` (modify) | Construct one shared `FileManager`, run both generators |
| `postinstall/util/EnvGenerator.ts` (modify) | Accept injected `FileManager` (default keeps current behavior) |
| `test/postinstall/Verifier.ts`, `MonoRepoVerifier.ts` (modify) | Assert scaffolded `@dispatcher/AGENTS.md` (existence, version stamp, docs pointer) |
| `lib/constants/internalConstants.ts` (modify) | New `DISPATCHER_ERRORS` catalog (code + message + fix); migrated entries leave `MESSAGES` |
| `lib/util/util.ts` (modify) | New `throwDispatcherError(entry, placeholders)` |
| `lib/core/CDSDispatcher.ts`, `lib/core/ArgumentMethodProcessor.ts`, `lib/util/middleware/MiddlewareEntityRegistry.ts`, `lib/util/parameter/parameterUtil.ts`, `lib/decorators/method.ts` (modify) | 14 call sites migrate to `throwDispatcherError` |
| `lib/decorators/method.ts`, `class.ts`, `parameter.ts`, `lib/core/CDSDispatcher.ts` (modify) | JSDoc template at every export site |
| `README.md` (modify) | "Using with AI assistants" section + postinstall section mentions the new artifact |
| `.github/workflows/tests.yml` (modify) | Grep step asserting `@example` survives into `dist/index.d.ts` |

---

## Phase 1 — Shipped guide, scaffold, drift gate (PR 1)

### Task 1: Create branch and author `docs/AGENTS.md` + `files` entry

**Files:**
- Create: `docs/AGENTS.md`
- Modify: `package.json:8-11` (`files` array)

**Interfaces:**
- Produces: `docs/AGENTS.md` with (a) taxonomy table rows in the exact format `| `@Name` | one-liner | [§](../README.md#anchor) |`, (b) error-catalog placeholder section `## Error catalog` (filled in Task 9). Tasks 2 and 9 parse these exact shapes.

- [ ] **Step 1: Create the working branch**

```bash
git checkout feature-batch2-decorators && git pull --ff-only
git checkout -b feature-agentic-dx
```

- [ ] **Step 2: Write `docs/AGENTS.md`**

Create the file with the following content. The taxonomy tables below are seeded with all currently known exports; Task 2's drift test is the completeness oracle — it will list any name you missed or invented. For each row's one-liner: open the decorator's README section (the anchor in the row) and compress its purpose to ≤ 90 chars. Do not copy README prose.

````markdown
# Agent guide — @dxfrontier/cds-ts-dispatcher

> For AI coding assistants working in a project that **consumes** this package.
> Contributors to the dispatcher itself: see `CLAUDE.md` in the repository instead.
> Deep documentation ships with this package: `node_modules/@dxfrontier/cds-ts-dispatcher/README.md` (no network needed).

## Mental model (read this first)

- Decorators do **no work at decoration time** — they only write metadata (reflect-metadata).
- Everything registers once at bootstrap: `new CDSDispatcher([Handler1, …]).initialize()` returns `cds.service.impl(...)`. A handler class not passed to `CDSDispatcher` is silently inert.
- `@EntityHandler(Entity)` binds a class to a CDS-Typer entity (or `CDS_DISPATCHER.ALL_ENTITIES`); method decorators map 1:1 onto CAP registrations (`srv.before/on/after/prepend`).
- Draft variants (`…Draft`) target `entity.drafts`, not the active entity.
- Classes are resolved through the inversify container; `@Inject(CDS_DISPATCHER.SRV)` injects the CAP service.

## Setup contract

Consumer `tsconfig.json` MUST have:

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- `@sap/cds` is a peerDependency: dispatcher major ↔ `@sap/cds` major (v6 ↔ `@sap/cds ^10`).
- The postinstall scaffolds `@dispatcher/` (typed `CDS_ENV` for the `@Env` parameter decorator + this guide's pointer file). It is regenerated on every install — never hand-edit it, and keep it gitignored.

## Bootstrap pattern

```ts
import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';
import { BookHandler } from './handler/BookHandler';

export = new CDSDispatcher([BookHandler]).initialize();
```

## Decorator taxonomy

One row per exported decorator. The § link is the full documentation in the README **shipped inside this package**.

### Class decorators

| Decorator | When to use | Docs |
|---|---|---|
| `@EntityHandler` | Bind a handler class to one CDS-Typer entity (or all entities) | [§](../README.md#entityhandler) |
| `@ServiceLogic` | Mark a business-logic class as injectable (Singleton/Transient) | [§](../README.md#servicelogic) |
| `@Repository` | Mark a data-access class as injectable | [§](../README.md#repository) |
| `@UnboundActions` | Host handlers for actions/functions not bound to an entity | [§](../README.md#unboundactions) |
| `@ServerLifecycle` | Host `@OnServed` / `@OnListening` / `@OnShutdown` hooks | [§](../README.md#serverlifecycle) |

### Method decorators — BEFORE (validate/enrich before the event runs)

| Decorator | When to use | Docs |
|---|---|---|
| `@BeforeCreate` | Before CREATE on the active entity | [§](../README.md#beforecreate) |
| `@BeforeRead` | Before READ on the active entity | [§](../README.md#beforeread) |
| `@BeforeUpdate` | Before UPDATE on the active entity | [§](../README.md#beforeupdate) |
| `@BeforeDelete` | Before DELETE on the active entity | [§](../README.md#beforedelete) |
| `@BeforeAll` | Before every CRUD event of the entity | [§](../README.md#beforeall) |
| `@BeforeAction` / `@BeforeFunction` | Before an unbound action/function | [§](../README.md#beforeaction) |
| `@BeforeBoundAction` / `@BeforeBoundFunction` | Before a bound action/function | [§](../README.md#beforeboundaction) |

(…continue: one row for EVERY remaining export. Seed list — method decorators: `BeforeCreateDraft, BeforeReadDraft, BeforeUpdateDraft, BeforeDeleteDraft, BeforeAllDraft, AfterAll, AfterCreate, AfterRead, AfterReadEachInstance, AfterReadSingleInstance, AfterReadDraftSingleInstance, AfterUpdate, AfterDelete, AfterAction, AfterFunction, AfterBoundAction, AfterBoundFunction, AfterCreateDraft, AfterReadDraft, AfterReadDraftEachInstance, AfterUpdateDraft, AfterDeleteDraft, AfterAllDraft, OnCreate, OnRead, OnUpdate, OnDelete, OnAction, OnFunction, OnEvent, OnError, OnBoundAction, OnBoundFunction, OnAll, OnCreateDraft, OnReadDraft, OnUpdateDraft, OnDeleteDraft, OnBoundActionDraft, OnBoundFunctionDraft, OnAllDraft, BeforeNewDraft, BeforeCancelDraft, BeforePatchDraft, BeforeDiscardDraft, BeforeEditDraft, BeforeSaveDraft, AfterNewDraft, AfterCancelDraft, AfterPatchDraft, AfterDiscardDraft, AfterEditDraft, AfterSaveDraft, OnNewDraft, OnCancelDraft, OnPatchDraft, OnDiscardDraft, OnEditDraft, OnSaveDraft, BeforeCommit, AfterCommit, AfterRollback, OnRequestDone, OnScheduled, Schedule, OnScheduledSuccess, OnScheduledFailure, Stream, Throttle, OnServed, OnListening, OnShutdown, OnWebSocketMessage, OnWebSocketConnect, OnWebSocketDisconnect` plus any drift-test additions; standalone: `OnSubscribe, Use, Prepend, PrependDraft, ExecutionAllowedForRole, SingleInstanceCapable, Validate, FieldsFormatter, CatchAndSetErrorMessage, CatchAndSetErrorCode, Exclude, Include, Mask, LogExecution, Inject`; parameter decorators: `Req, Res, Results, Result, Next, Error, Msg, SingleInstanceSwitch, GetQuery, GetRequest, IsColumnSupplied, IsRole, IsPresent, Jwt, ValidationResults, Locale, Env, Subject, Affected, Data, Param, UserInfo, Tenant, Diff`.)

## Confusables — pick the right sibling

- `@AfterRead` receives the **whole result array**; `@AfterReadEachInstance` runs per row; `@AfterReadSingleInstance` only when a single entity is requested by key.
- `…Draft` variants register on `entity.drafts` — a non-draft decorator never fires for draft edits.
- `@OnAction`/`@OnFunction` are **unbound** (service-level, host class `@UnboundActions`); `@OnBoundAction`/`@OnBoundFunction` are bound to the `@EntityHandler` entity.
- `@Prepend` registers with `srv.prepend` and runs **before** every other registered handler of that event.
- `@Use` middleware wraps entity handlers; it does not apply to `@ServerLifecycle` classes (error E003).
- `@OnEvent` is for custom/messaging events; `@OnSubscribe` is the websocket subscribe hook.

## Error catalog

Errors raised by the dispatcher start with `[dispatcher] E###`. Look the code up here; each entry states the fix.

_(Filled in with the E-code sections when the error catalog lands — see spec Component 4.)_

## Where to read more (all local, no network)

- Full decorator docs: `node_modules/@dxfrontier/cds-ts-dispatcher/README.md`
- This guide: `node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md`
````

- [ ] **Step 3: Add the `files` entry**

In `package.json`, change:

```json
  "files": [
    "./dist",
    "./postinstall"
  ],
```

to:

```json
  "files": [
    "./dist",
    "./postinstall",
    "./docs/AGENTS.md"
  ],
```

- [ ] **Step 4: Verify the tarball**

```bash
npm pack --dry-run 2>&1 | grep -E "docs/" 
```
Expected: exactly one line, `docs/AGENTS.md` (with its size). If anything under `docs/superpowers/` appears, the `files` entry is wrong — it must be the single file path, not `./docs`.

- [ ] **Step 5: Commit**

```bash
git add docs/AGENTS.md package.json
git commit -m "feat(agent-docs): ship docs/AGENTS.md agent guide in the npm tarball

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 2: Drift gate — taxonomy completeness + README anchors

**Files:**
- Create: `test/__tests__/unit/AGENT_DOCS.test.ts`
- Modify: `docs/AGENTS.md` (complete the taxonomy until green)

**Interfaces:**
- Consumes: taxonomy row format from Task 1 (`| \`@Name\` |` at line start; anchors as `README.md#slug`).
- Produces: the test file that Tasks 9 and 13 extend with more `describe` blocks.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'fs';
import { join } from 'path';

import * as dispatcher from '../../../lib';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const agentsMd = readFileSync(join(REPO_ROOT, 'docs', 'AGENTS.md'), 'utf8');
const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');

// Documented separately in the guide's prose, not taxonomy rows.
const NON_DECORATOR_EXPORTS = new Set(['CDSDispatcher']);

const decoratorExports = Object.entries(dispatcher)
  .filter(([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name) && !NON_DECORATOR_EXPORTS.has(name))
  .map(([name]) => name)
  .sort();

const taxonomyRows = [...agentsMd.matchAll(/^\|\s*`@([A-Za-z]+)`/gm)].map((match) => match[1]);

/** Replicates GitHub's heading-anchor algorithm closely enough for this README. */
function githubSlug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

function readmeAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>();
  const seen = new Map<string, number>();
  let inFence = false;

  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    const heading = !inFence && /^#{1,6}\s+(.+)$/.exec(line);
    if (!heading) continue;

    const base = githubSlug(heading[1]);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

describe('docs/AGENTS.md drift gate', () => {
  it('has a taxonomy row for every exported decorator', () => {
    const missing = decoratorExports.filter((name) => !taxonomyRows.includes(name));
    expect(missing).toEqual([]);
  });

  it('has no taxonomy row for a non-existent export', () => {
    const stale = taxonomyRows.filter((name) => !decoratorExports.includes(name));
    expect(stale).toEqual([]);
  });

  it('references only README anchors that exist', () => {
    const anchors = readmeAnchors(readme);
    const referenced = [...agentsMd.matchAll(/README\.md#([a-z0-9-]+)/g)].map((match) => match[1]);
    expect(referenced.length).toBeGreaterThan(0);
    const broken = [...new Set(referenced)].filter((anchor) => !anchors.has(anchor));
    expect(broken).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it — expect failure listing every missing taxonomy row**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit
```
Expected: FAIL. The `missing` array in the first assertion is your authoritative to-do list; the third assertion lists broken anchors. (If `@cds-models` imports fail, run `npm run test:unit` once first to regenerate fixtures.)

- [ ] **Step 3: Complete `docs/AGENTS.md` until green**

Add a row per missing name (one-liner from its README section; anchor from the README heading). Fix any broken anchors the third test reports. Re-run the command from Step 2 after each pass.
Expected: PASS (3/3).

- [ ] **Step 4: Lint and commit**

```bash
npm run check
git add test/__tests__/unit/AGENT_DOCS.test.ts docs/AGENTS.md
git commit -m "test(agent-docs): add drift gate for taxonomy completeness and README anchors

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 3: Failing verifier checks for the scaffolded guide

**Files:**
- Modify: `test/postinstall/Verifier.ts`
- Modify: `test/postinstall/MonoRepoVerifier.ts`

**Interfaces:**
- Produces: `verifyAgentsGuide()` assertions that Task 4's generator must satisfy: file exists at `<project>/@dispatcher/AGENTS.md`, contains `v<version>` (version read from the REPO root `package.json`), contains the literal string `node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md`.

- [ ] **Step 1: Extend `Verifier.ts`**

Add the two path fields next to the existing ones (`Verifier.ts:9-17`) and the method; call it inside `run()` right after `verifyDecoratorFolder()`:

```ts
  private agentsGuidePath = path.resolve(
    process.env.INIT_CWD! + '/test/sample-project/bookshop/@dispatcher/AGENTS.md',
  );
  private rootPackageJsonPath = path.resolve(process.env.INIT_CWD! + '/package.json');

  verifyAgentsGuide() {
    console.log(colors.cyan('Checking @dispatcher/AGENTS.md agent guide...'));

    if (!existsSync(this.agentsGuidePath)) {
      throw new Error(colors.red('❌ @dispatcher/AGENTS.md is missing.'));
    }

    const content = readFileSync(this.agentsGuidePath, 'utf8');
    const { version } = JSON.parse(readFileSync(this.rootPackageJsonPath, 'utf8'));

    if (!content.includes(`v${version}`)) {
      throw new Error(colors.red(`❌ @dispatcher/AGENTS.md does not carry the installed version v${version}.`));
    }

    if (!content.includes('node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md')) {
      throw new Error(colors.red('❌ @dispatcher/AGENTS.md is missing the shipped-docs pointer.'));
    }

    console.log(colors.green('✅ @dispatcher/AGENTS.md is correctly generated.'));
  }
```

- [ ] **Step 2: Extend `MonoRepoVerifier.ts`**

Read the file first — it follows the same throw-on-missing pattern, iterating both workspace services. Add per-service guide paths:

```ts
  private agentsGuidePaths = [
    path.resolve(process.env.INIT_CWD! + '/test/sample-project/monorepo_bookshop/services/api/@dispatcher/AGENTS.md'),
    path.resolve(process.env.INIT_CWD! + '/test/sample-project/monorepo_bookshop/services/admin/@dispatcher/AGENTS.md'),
  ];
  private rootPackageJsonPath = path.resolve(process.env.INIT_CWD! + '/package.json');
```

and a `verifyAgentsGuide()` that loops `this.agentsGuidePaths` applying the SAME three assertions as in `Verifier.ts` Step 1 (existence / `v${version}` read from `this.rootPackageJsonPath` / literal docs pointer `node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md`), wired into its `run()`. Match the file's existing field/method style.

- [ ] **Step 3: Run to verify both fail for the right reason**

```bash
npm run build && node ./postinstall/PostInstall.js
npm run test:verifier
```
Expected: FAIL with `❌ @dispatcher/AGENTS.md is missing.` (the generator doesn't exist yet). Same for `npm run test:verifier:monorepo`.

- [ ] **Step 4: Commit the failing verifiers** (red is fine here — the postinstall docker harness only runs verifiers on CI after the generator lands with the same PR)

```bash
git add test/postinstall/Verifier.ts test/postinstall/MonoRepoVerifier.ts
git commit -m "test(postinstall): verifiers assert the scaffolded @dispatcher/AGENTS.md

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: `AgentsMdGenerator` + PostInstall wiring

**Files:**
- Create: `postinstall/util/AgentsMdGenerator.ts`
- Modify: `postinstall/util/EnvGenerator.ts:38-41` (constructor DI)
- Modify: `postinstall/PostInstall.ts`

**Interfaces:**
- Consumes: `FileManager.dispatcherExecutionPath.paths[n].dispatcherPath` (absolute path of each `@dispatcher` folder) and `FileManager.joinPaths(...)`.
- Produces: `class AgentsMdGenerator { constructor(fileManager?: FileManager); run(): void }` — same shape as `EnvGenerator`.

- [ ] **Step 1: Write `postinstall/util/AgentsMdGenerator.ts`**

```ts
import { readFileSync, writeFileSync } from 'fs';

import { FileManager } from './FileManager';

/**
 * Scaffolds `@dispatcher/AGENTS.md` — a thin, regenerated-on-every-install orientation file that
 * tells AI coding assistants where the full dispatcher documentation lives inside `node_modules`.
 *
 * Policy: identical to `EnvGenerator` — a failure here must never abort a consumer's install.
 */
export class AgentsMdGenerator {
  constructor(private readonly fileManager: FileManager = new FileManager()) {}

  /**
   * The generator is bundled into `postinstall/PostInstall.js`, so at runtime `__dirname` is the
   * package's `postinstall/` folder and the own package.json sits one level up.
   */
  private resolveOwnVersion(): string {
    try {
      const raw = readFileSync(FileManager.joinPaths(__dirname, '..', 'package.json'), 'utf8');
      const version = JSON.parse(raw).version;

      return typeof version === 'string' ? version : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private buildContent(version: string): string {
    return [
      `<!-- Generated by @dxfrontier/cds-ts-dispatcher v${version} on every install - do not edit. -->`,
      '',
      '# This project uses @dxfrontier/cds-ts-dispatcher',
      '',
      `Version: v${version}. TypeScript decorators for SAP CAP event handlers.`,
      '',
      '## Mental model',
      '',
      '- Decorators only write metadata; registration happens once at `new CDSDispatcher([...]).initialize()`.',
      '- A handler class not passed to `CDSDispatcher` is silently inert.',
      '- `…Draft` decorator variants target `entity.drafts`, not the active entity.',
      '',
      '## Handler shape',
      '',
      '```ts',
      "import { EntityHandler, AfterRead, Req, Results } from '@dxfrontier/cds-ts-dispatcher';",
      "import type { Request } from '@dxfrontier/cds-ts-dispatcher';",
      "import { Book } from '#cds-models/CatalogService';",
      '',
      '@EntityHandler(Book)',
      'export class BookHandler {',
      '  @AfterRead()',
      '  private async enrich(@Results() results: Book[], @Req() req: Request): Promise<void> { /* ... */ }',
      '}',
      '```',
      '',
      '## Full documentation (local, no network needed)',
      '',
      '- Agent guide (taxonomy, confusables, error catalog): `node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md`',
      '- Complete reference: `node_modules/@dxfrontier/cds-ts-dispatcher/README.md`',
      '',
      '## Errors',
      '',
      'Dispatcher errors start with `[dispatcher] E###` and each message carries its own fix.',
      'Look codes up in the error catalog of the agent guide above.',
      '',
    ].join('\n');
  }

  public run(): void {
    try {
      const version = this.resolveOwnVersion();
      const { paths } = this.fileManager.dispatcherExecutionPath;
      let generated = 0;

      paths.forEach(({ dispatcherPath }) => {
        try {
          writeFileSync(FileManager.joinPaths(dispatcherPath, 'AGENTS.md'), this.buildContent(version));
          generated += 1;
        } catch (error) {
          console.warn(
            `⚠️  [cds-ts-dispatcher] Skipped @dispatcher/AGENTS.md for ${dispatcherPath}: ${(error as Error).message}`,
          );
        }
      });

      if (generated > 0) {
        console.log(
          [
            'ℹ️  [cds-ts-dispatcher] Agent guide generated at @dispatcher/AGENTS.md.',
            "    To make AI assistants load it, add this line to your project's AGENTS.md (and/or CLAUDE.md):",
            '    Read @dispatcher/AGENTS.md before working with @dxfrontier/cds-ts-dispatcher handlers.',
          ].join('\n'),
        );
      }
    } catch (error) {
      console.warn(`⚠️  [cds-ts-dispatcher] Agent guide generation skipped: ${(error as Error).message}`);
    }
  }
}
```

- [ ] **Step 2: Give `EnvGenerator` an injectable `FileManager`**

In `postinstall/util/EnvGenerator.ts`, replace the constructor (lines 38-41):

```ts
  constructor(fileManager: FileManager = new FileManager()) {
    this.fileManager = fileManager;
    this.shellCommander = new ShellCommander();
  }
```

- [ ] **Step 3: Wire both generators in `postinstall/PostInstall.ts`**

Replace the file's class body:

```ts
import { AgentsMdGenerator } from './util/AgentsMdGenerator';
import { EnvGenerator } from './util/EnvGenerator';
import { FileManager } from './util/FileManager';

class PostInstall {
  public run() {
    // Last-resort guard: a postinstall must never abort a consumer's `npm install`, wherever it
    // fails — including the project scan that runs while `FileManager` is being constructed.
    try {
      const fileManager = new FileManager();

      new EnvGenerator(fileManager).run();
      new AgentsMdGenerator(fileManager).run();
    } catch (error) {
      console.warn(`⚠️  [cds-ts-dispatcher] Postinstall skipped: ${(error as Error).message}`);
    }
  }
}

new PostInstall().run();
```

- [ ] **Step 4: Rebuild, regenerate, verify green**

```bash
npm run build && node ./postinstall/PostInstall.js
npm run test:verifier && npm run test:verifier:monorepo
```
Expected: both PASS, including the new `✅ @dispatcher/AGENTS.md is correctly generated.` lines. Note: the version stamp read via `__dirname` resolves to the REPO's own `package.json` here because the repo runs its own postinstall — the verifier compares against the same file, so a wrong relative path fails loudly as `vunknown`.

- [ ] **Step 5: Pin the never-break-the-install policy (spec acceptance criterion 2)**

Create `test/__tests__/unit/AGENTS_MD_GENERATOR.test.ts`:

```ts
import { AgentsMdGenerator } from '../../../postinstall/util/AgentsMdGenerator';

import type { FileManager } from '../../../postinstall/util/FileManager';

describe('AgentsMdGenerator resilience', () => {
  it('never throws when path discovery explodes', () => {
    const exploding = {
      get dispatcherExecutionPath(): never {
        throw new Error('boom');
      },
    } as unknown as FileManager;

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => new AgentsMdGenerator(exploding).run()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Agent guide generation skipped'));

    warn.mockRestore();
  });

  it('skips an unwritable path with a warning and continues', () => {
    const fileManager = {
      dispatcherExecutionPath: { paths: [{ dispatcherPath: '/nonexistent-dir-for-agents-md-test' }] },
    } as unknown as FileManager;

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => new AgentsMdGenerator(fileManager).run()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipped @dispatcher/AGENTS.md'));

    warn.mockRestore();
  });
});
```

Run: `npx jest test/__tests__/unit/AGENTS_MD_GENERATOR.test.ts --selectProjects unit`
Expected: PASS (the generator from Step 1 already satisfies both).

- [ ] **Step 6: Full unit suite + lint, then commit**

```bash
npm run test:unit && npm run check
git add postinstall/util/AgentsMdGenerator.ts postinstall/util/EnvGenerator.ts postinstall/PostInstall.ts test/__tests__/unit/AGENTS_MD_GENERATOR.test.ts
git commit -m "feat(postinstall): scaffold @dispatcher/AGENTS.md agent guide on install

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 5: README section "Using with AI assistants"

**Files:**
- Modify: `README.md` (new section + TOC entry + postinstall section mention)

- [ ] **Step 1: Add the section**

Place it as a top-level section right after the installation/postinstall documentation area (find the postinstall section heading; keep heading level consistent with siblings):

```markdown
## Using with AI assistants

The dispatcher ships agent-readable documentation inside the npm package — no network needed:

- `node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md` — agent guide: mental model, decorator taxonomy, confusables, error catalog.
- `node_modules/@dxfrontier/cds-ts-dispatcher/README.md` — this document, shipped in full.
- `@dispatcher/AGENTS.md` — a thin pointer scaffolded into your project on every install (it is gitignored; CI agents get it after `npm install`).

To make Claude Code, Cursor, Codex or Copilot pick it up automatically, add this line to your project's `AGENTS.md` (and/or `CLAUDE.md`):

> Read `@dispatcher/AGENTS.md` before working with `@dxfrontier/cds-ts-dispatcher` handlers.

Dispatcher errors are stable and greppable: they start with `[dispatcher] E###`, carry their own fix, and are cataloged in the agent guide.
```

- [ ] **Step 2: Mirror in TOC and postinstall docs**

Add the section to the README table of contents (same style as sibling entries) and add `AGENTS.md` to the list of files the postinstall generates (find the existing `@dispatcher` scaffold description; it currently names `index.ts` + `index.js`).

- [ ] **Step 3: Drift gate + lint still green**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit && npm run check
```
Expected: PASS (README heading changes must not break referenced anchors).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): document AI-assistant integration and shipped agent guide

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Phase 2 — Error catalog with stable codes (PR 2)

### Task 6: `DISPATCHER_ERRORS` catalog + `throwDispatcherError`

**Files:**
- Modify: `lib/constants/internalConstants.ts:46-64`
- Modify: `lib/util/util.ts:114-121`
- Create: `test/__tests__/unit/DISPATCHER_ERRORS.test.ts`

**Interfaces:**
- Produces: `constants.DISPATCHER_ERRORS.<KEY>` entries `{ code: string; message: string; fix: string }` and `util.throwDispatcherError(entry, placeholders?): never`. Tasks 7-9 depend on these exact names.

- [ ] **Step 1: Write the failing test**

```ts
import constants from '../../../lib/constants/internalConstants';
import util from '../../../lib/util/util';

describe('throwDispatcherError', () => {
  it('formats code, rendered message, fix and docs pointer', () => {
    expect(() =>
      util.throwDispatcherError(constants.DISPATCHER_ERRORS.THROTTLE_NO_REQUEST, {
        className: 'BookHandler',
        methodName: 'afterRead',
      }),
    ).toThrow(
      "[dispatcher] E006: @Throttle() could not find a 'Request' among the handler arguments of " +
        "'BookHandler.afterRead'. Fix: Place @Throttle() directly below the handler decorator and keep " +
        'a @Req() parameter. Docs: node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md#e006',
    );
  });

  it('keeps every code unique and append-only formatted', () => {
    const codes = Object.values(constants.DISPATCHER_ERRORS).map((entry) => entry.code);
    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach((code) => expect(code).toMatch(/^E\d{3}$/));
  });
});
```

Check the `import util` / `import constants` style against an existing unit test first (default vs named import) and match it.

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest test/__tests__/unit/DISPATCHER_ERRORS.test.ts --selectProjects unit
```
Expected: FAIL — `DISPATCHER_ERRORS` undefined.

- [ ] **Step 3: Add the catalog to `internalConstants.ts`**

Insert after the `MESSAGES` object (keep `MESSAGES` for the reject-path strings). Entries migrated OUT of `MESSAGES` in this step: `THROTTLE_NO_REQUEST`, `THROTTLE_ON_ERROR`, `SERVER_LIFECYCLE_FOREIGN_HANDLERS`, `SERVER_LIFECYCLE_WRONG_HOST`, `SERVER_LIFECYCLE_MIDDLEWARE` (delete them from `MESSAGES` in Task 7 once call sites are migrated). `VALIDATOR_*`, `THROTTLE_LIMIT_EXCEEDED`, `UNSUPPORTED_DECORATOR_ACTIONS` stay untouched in `MESSAGES` (reject-path / dead constant).

```ts
  /**
   * Developer-facing (E0xx) and internal-invariant (E9xx) errors raised via
   * `util.throwDispatcherError`. Codes are APPEND-ONLY: never renumber, never reuse.
   * Request-level rejections (`req.reject`) stay in `MESSAGES` and never get codes.
   */
  DISPATCHER_ERRORS: {
    SERVER_LIFECYCLE_WRONG_HOST: {
      code: 'E001',
      message:
        "@OnServed / @OnListening / @OnShutdown found in '${className}', which is not decorated with @ServerLifecycle.",
      fix: 'Move these handlers into a @ServerLifecycle class and register that class in CDSDispatcher.',
    },
    SERVER_LIFECYCLE_FOREIGN_HANDLERS: {
      code: 'E002',
      message: "@ServerLifecycle class '${className}' contains non-lifecycle handler decorators.",
      fix: 'Keep only @OnServed / @OnListening / @OnShutdown here; move entity handlers into an @EntityHandler class.',
    },
    SERVER_LIFECYCLE_MIDDLEWARE: {
      code: 'E003',
      message: "@Use middleware found on @ServerLifecycle class '${className}'.",
      fix: 'Remove @Use from the lifecycle class - server lifecycle hooks are not request handlers.',
    },
    THROTTLE_INVALID_LIMIT: {
      code: 'E004',
      message: "@Throttle() 'limit' must be a number >= 1, got '${limit}'.",
      fix: 'Pass a positive integer, e.g. @Throttle({ limit: 100, window: 60000 }).',
    },
    THROTTLE_INVALID_WINDOW: {
      code: 'E005',
      message: "@Throttle() 'window' must be a number (ms) >= 1, got '${window}'.",
      fix: 'Pass the window in milliseconds, e.g. @Throttle({ limit: 100, window: 60000 }).',
    },
    THROTTLE_NO_REQUEST: {
      code: 'E006',
      message: "@Throttle() could not find a 'Request' among the handler arguments of '${className}.${methodName}'.",
      fix: 'Place @Throttle() directly below the handler decorator and keep a @Req() parameter.',
    },
    THROTTLE_ON_ERROR: {
      code: 'E007',
      message:
        '@Throttle() cannot be used on @OnError handlers (error handlers are invoked synchronously). [class: ${className}, method: ${methodName}]',
      fix: 'Remove @Throttle() from the @OnError handler; throttle the originating handlers instead.',
    },
    DIFF_ON_ERROR: {
      code: 'E008',
      message:
        '@Diff is not supported on @OnError (error handlers run synchronously while the transaction unwinds) in ${className}.${methodName}.',
      fix: 'Remove @Diff from the @OnError handler; read the diff in a @Before/@On handler instead.',
    },
    UNEXPECTED_EVENT_KIND: {
      code: 'E901',
      message: "Unexpected eventKind: '${eventKind}'.",
      fix: 'Internal invariant violated - please open an issue: https://github.com/dxfrontier/cds-ts-dispatcher/issues',
    },
    UNSUPPORTED_DECORATOR_KEY: {
      code: 'E902',
      message: 'Unsupported decorator key.',
      fix: 'Internal invariant violated - please open an issue: https://github.com/dxfrontier/cds-ts-dispatcher/issues',
    },
    PARAMETER_OPTION_NOT_HANDLED: {
      code: 'E903',
      message: "Parameter decorator '${metadataKey}' option not handled.",
      fix: 'Internal invariant violated - please open an issue: https://github.com/dxfrontier/cds-ts-dispatcher/issues',
    },
    MIDDLEWARE_UNEXPECTED_EVENT: {
      code: 'E904',
      message: "Unexpected event type: '${event}'.",
      fix: 'Internal invariant violated - please open an issue: https://github.com/dxfrontier/cds-ts-dispatcher/issues',
    },
    PARAMETER_UTIL_OPTION_NOT_HANDLED: {
      code: 'E905',
      message: 'Parameter decorator option not handled.',
      fix: 'Internal invariant violated - please open an issue: https://github.com/dxfrontier/cds-ts-dispatcher/issues',
    },
    EXTRACT_ARGUMENT_NOT_HANDLED: {
      code: 'E906',
      message: "Option '${arg}' is not handled for extractArgument.",
      fix: 'Internal invariant violated - please open an issue: https://github.com/dxfrontier/cds-ts-dispatcher/issues',
    },
  },
```

- [ ] **Step 4: Add `throwDispatcherError` to `lib/util/util.ts`**

Directly below `throwErrorMessage` (which stays — other code may still reference it until Task 7 finishes):

```ts
  /**
   * Throws a coded, self-documenting dispatcher error:
   * `[dispatcher] E###: <message>. Fix: <fix> Docs: <shipped AGENTS.md anchor>`.
   * Codes are append-only; `req.reject` paths must never use this.
   */
  throwDispatcherError(entry: { code: string; message: string; fix: string }, placeholders: Record<string, any> = {}): never {
    const rendered = util.buildMessage(entry.message, placeholders);

    throw new Error(
      `[dispatcher] ${entry.code}: ${rendered} Fix: ${entry.fix} Docs: node_modules/@dxfrontier/cds-ts-dispatcher/docs/AGENTS.md#${entry.code.toLowerCase()}`,
    );
  },
```

- [ ] **Step 5: Run to verify it passes, commit**

```bash
npx jest test/__tests__/unit/DISPATCHER_ERRORS.test.ts --selectProjects unit && npm run check
git add lib/constants/internalConstants.ts lib/util/util.ts test/__tests__/unit/DISPATCHER_ERRORS.test.ts
git commit -m "feat(errors): add DISPATCHER_ERRORS catalog and coded throwDispatcherError

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 7: Migrate the 8 developer-facing call sites

**Files:**
- Modify: `lib/decorators/method.ts:229,233,~256,~824,~832` (Throttle limit/window/no-request, Diff-on-error, Throttle-on-error)
- Modify: `lib/core/CDSDispatcher.ts:~830,~839,~847` (ServerLifecycle trio)
- Modify: `lib/constants/internalConstants.ts` (delete the 5 migrated `MESSAGES` entries)
- Modify: affected unit tests

- [ ] **Step 1: Migrate each site to `throwDispatcherError`**

Pattern — before (`method.ts:256` area):

```ts
        util.throwErrorMessage(
          util.buildMessage(constants.MESSAGES.THROTTLE_NO_REQUEST, {
            className: (target as any).constructor?.name ?? 'Unknown',
            methodName: String(propertyName),
          }),
        );
```

after:

```ts
        util.throwDispatcherError(constants.DISPATCHER_ERRORS.THROTTLE_NO_REQUEST, {
          className: (target as any).constructor?.name ?? 'Unknown',
          methodName: String(propertyName),
        });
```

Site-by-site mapping (placeholders must match the catalog templates exactly):
- `method.ts:229` → `DISPATCHER_ERRORS.THROTTLE_INVALID_LIMIT`, `{ limit: options.limit }` (inline string deleted)
- `method.ts:233` → `DISPATCHER_ERRORS.THROTTLE_INVALID_WINDOW`, `{ window: options.window }`
- `method.ts` Diff-on-OnError site (~824, inline template string) → `DISPATCHER_ERRORS.DIFF_ON_ERROR`, `{ className, methodName: String(propertyName) }`
- `method.ts` Throttle-on-OnError site (~832, `THROTTLE_ON_ERROR` + manual suffix) → `DISPATCHER_ERRORS.THROTTLE_ON_ERROR`, `{ className: (target as any).constructor?.name ?? 'Unknown', methodName: String(propertyName) }` (drop the hand-built `[class: …]` suffix — it is now part of the template)
- `CDSDispatcher.ts` trio → `DISPATCHER_ERRORS.SERVER_LIFECYCLE_WRONG_HOST` / `SERVER_LIFECYCLE_FOREIGN_HANDLERS` / `SERVER_LIFECYCLE_MIDDLEWARE`, each `{ className: entityInstance.constructor?.name ?? 'Unknown' }`

Then delete `THROTTLE_NO_REQUEST`, `THROTTLE_ON_ERROR`, `SERVER_LIFECYCLE_WRONG_HOST`, `SERVER_LIFECYCLE_FOREIGN_HANDLERS`, `SERVER_LIFECYCLE_MIDDLEWARE` from `MESSAGES`.

- [ ] **Step 2: Find and update test expectations**

```bash
grep -rn "THROTTLE_NO_REQUEST\|THROTTLE_ON_ERROR\|SERVER_LIFECYCLE_\|must be a number\|@Diff is not supported" test/ --include="*.ts" -l
```
For each hit: update the expectation to build the expected string from `constants.DISPATCHER_ERRORS.<KEY>` (import the constant; do not duplicate literals). Where a test asserts a substring, `expect(...).toThrow(/\[dispatcher\] E006/)` on the code prefix plus a distinctive fragment is enough.

- [ ] **Step 3: Full unit suite green, commit**

```bash
npm run test:unit && npm run check
git add -A lib test
git commit -m "refactor(errors): migrate developer-facing throws to coded dispatcher errors

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 8: Migrate the 6 internal-invariant sites

**Files:**
- Modify: `lib/core/CDSDispatcher.ts:345`, `lib/core/ArgumentMethodProcessor.ts:142,349`, `lib/util/middleware/MiddlewareEntityRegistry.ts:120`, `lib/util/parameter/parameterUtil.ts:212,348`

- [ ] **Step 1: Migrate each site**

- `CDSDispatcher.ts:345` `util.throwErrorMessage(\`Unexpected eventKind: ${eventKind}\`)` → `util.throwDispatcherError(constants.DISPATCHER_ERRORS.UNEXPECTED_EVENT_KIND, { eventKind })`
- `ArgumentMethodProcessor.ts:142` → `UNSUPPORTED_DECORATOR_KEY` (no placeholders)
- `ArgumentMethodProcessor.ts:349` → `PARAMETER_OPTION_NOT_HANDLED`, `{ metadataKey }` (note: `metadataKey` is a Symbol in some paths — pass `String(metadataKey)`)
- `MiddlewareEntityRegistry.ts:120` → `MIDDLEWARE_UNEXPECTED_EVENT`, `{ event: handler.event }`
- `parameterUtil.ts:212` → `PARAMETER_UTIL_OPTION_NOT_HANDLED` (no placeholders)
- `parameterUtil.ts:348` → `EXTRACT_ARGUMENT_NOT_HANDLED`, `{ arg }`

Verify each file already imports `constants` from `../constants/internalConstants` (or the correct relative path); add the import where missing. After this task, `grep -rn "throwErrorMessage" lib --include="*.ts"` must return only the definition in `util.ts` — leave the helper in place (out of scope to remove).

- [ ] **Step 2: Unit suite green (update any expectation greps as in Task 7 Step 2), commit**

```bash
npm run test:unit && npm run check
git add -A lib test
git commit -m "refactor(errors): code internal invariant throws as E9xx dispatcher errors

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 9: Error catalog section in `docs/AGENTS.md` + drift-gate invariant 3

**Files:**
- Modify: `docs/AGENTS.md` (replace the placeholder under `## Error catalog`)
- Modify: `test/__tests__/unit/AGENT_DOCS.test.ts`

- [ ] **Step 1: Extend the drift gate first (failing)**

Append to `AGENT_DOCS.test.ts`:

```ts
import constants from '../../../lib/constants/internalConstants';

describe('docs/AGENTS.md error catalog', () => {
  const catalogCodes = Object.values(constants.DISPATCHER_ERRORS).map((entry) => entry.code);
  const documentedCodes = [...agentsMd.matchAll(/^###\s+(E\d{3})\b/gm)].map((match) => match[1]);

  it('documents every DISPATCHER_ERRORS code', () => {
    expect(catalogCodes.filter((code) => !documentedCodes.includes(code))).toEqual([]);
  });

  it('documents no unknown code', () => {
    expect(documentedCodes.filter((code) => !catalogCodes.includes(code))).toEqual([]);
  });
});
```

Run `npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit` — expected FAIL (no `### E…` headings yet).

- [ ] **Step 2: Write the catalog section**

Replace the placeholder paragraph under `## Error catalog` with one `### E###` heading per entry (heading = plain code so the anchor is stable `#e001` …), body = rendered meaning + cause + fix. Example shape (repeat for every code, E001-E008 then E901-E906, texts derived from `DISPATCHER_ERRORS`):

```markdown
### E001

**@OnServed / @OnListening / @OnShutdown outside a @ServerLifecycle class.**
Cause: lifecycle method decorators found in a class not decorated with `@ServerLifecycle`.
Fix: move these handlers into a `@ServerLifecycle` class and register that class in `CDSDispatcher`.

### E002
…
```

For the E9xx block add one intro line: "E9xx codes are internal invariants — hitting one is a dispatcher bug; please open an issue."

- [ ] **Step 3: Green + commit**

```bash
npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit && npm run check
git add docs/AGENTS.md test/__tests__/unit/AGENT_DOCS.test.ts
git commit -m "docs(agent-docs): add coded error catalog and arm drift-gate code invariant

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Phase 3 — JSDoc enrichment (PR 3)

### Canonical JSDoc template (applies to Tasks 10-12)

Every export site gets this structure — summary with the raw CAP mapping, `@remarks` with sibling disambiguation + gotchas, exactly one realistic `@example`, `@see` GitHub link (keep the existing one) plus the local-path line:

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

Rules: keep the existing `@see` GitHub anchor; the summary's second line ALWAYS names the underlying CAP registration (`srv.before('CREATE', …)`, `srv.on('error', …)`, `cds.on('served', …)`, `srv.prepend(…)`, …) — take it from the factory the export calls (`buildBefore`/`buildAfter`/`buildOnCRUD`/`buildAction`/`buildOnEvent`/`buildOnError`/`buildOnMessagingEvent`) and the README section; `@example` must be compilable against the real signatures; content source for `@remarks` is the decorator's README section — compress, don't copy.

### Task 10: JSDoc — class decorators + parameter decorators

**Files:**
- Modify: `lib/decorators/class.ts` (5 export sites: `EntityHandler` — put the block on the first overload at line 21 — `Repository`, `ServiceLogic`, `UnboundActions`, `ServerLifecycle`)
- Modify: `lib/decorators/parameter.ts` (24 export sites, names listed in Task 1)

- [ ] **Step 1: Apply the template to all 29 sites**

Two fully-worked references — parameter decorators emphasize what gets injected and when it is `undefined`:

```ts
/**
 * Injects the active CAP `Request` object into the decorated parameter.
 *
 * @remarks
 * Available on every handler kind. For typed access use `Request<Book>`.
 *
 * @example
 * @AfterRead()
 * private async enrich(@Results() results: Book[], @Req() req: Request): Promise<void> {
 *   if (req.user.is('admin')) { ... }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#req | CDS-TS-Dispatcher - @Req}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Req
 */
```

```ts
/**
 * Binds the handler class to a CDS-Typer entity (or to every entity via `CDS_DISPATCHER.ALL_ENTITIES`)
 * and marks it inversify-injectable. Required host for entity event handlers.
 *
 * @remarks
 * Draft-variant method decorators inside this class target `<Entity>.drafts` automatically.
 * Unbound actions belong in an `@UnboundActions` class instead; lifecycle hooks in `@ServerLifecycle`.
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

- [ ] **Step 2: Typecheck + lint + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run check
git add lib/decorators/class.ts lib/decorators/parameter.ts
git commit -m "docs(jsdoc): canonical agent-oriented JSDoc for class and parameter decorators

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 11: JSDoc — method decorators, BEFORE + AFTER groups

**Files:**
- Modify: `lib/decorators/method.ts` (export sites of: `BeforeAll…BeforeBoundFunction`, all `Before…Draft`, `AfterAll…AfterBoundFunction`, all `After…Draft`, `AfterReadEachInstance`, `AfterReadSingleInstance`, `AfterReadDraftSingleInstance`, draft-specific `BeforeNewDraft…BeforeSaveDraft`, `AfterNewDraft…AfterSaveDraft` — the seed list in Task 1 is the checklist)

- [ ] **Step 1: Apply the template to every BEFORE/AFTER export site** (existing thin one-liners are replaced; keep existing `@see` links)

- [ ] **Step 2: Typecheck + lint + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run check
git add lib/decorators/method.ts
git commit -m "docs(jsdoc): canonical agent-oriented JSDoc for BEFORE/AFTER method decorators

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 12: JSDoc — ON/lifecycle/standalone groups + `CDSDispatcher` + arm `@example` invariant

**Files:**
- Modify: `lib/decorators/method.ts` (remaining sites: `On…` incl. drafts, `OnError`, `OnEvent`, `OnSubscribe`, websocket trio, `BeforeCommit/AfterCommit/AfterRollback/OnRequestDone`, scheduling quartet, `Stream`, `Throttle`, `OnServed/OnListening/OnShutdown`, `Use`, `Prepend/PrependDraft`, `ExecutionAllowedForRole`, `SingleInstanceCapable`, `Validate`, `FieldsFormatter`, `CatchAndSetErrorMessage/Code`, `Exclude/Include/Mask/LogExecution`)
- Modify: `lib/core/CDSDispatcher.ts` (class-level JSDoc: constructor contract + `initialize()` example)
- Modify: `test/__tests__/unit/AGENT_DOCS.test.ts` (invariant 2)

- [ ] **Step 1: Apply the template to all remaining sites**

- [ ] **Step 2: Arm the `@example` invariant (failing first if any site was missed)**

Append to `AGENT_DOCS.test.ts`:

```ts
describe('JSDoc @example coverage', () => {
  const sources = ['lib/decorators/method.ts', 'lib/decorators/class.ts', 'lib/decorators/parameter.ts']
    .map((file) => readFileSync(join(REPO_ROOT, file), 'utf8'))
    .join('\n');

  // Re-exported from inversify — its JSDoc lives upstream.
  const FOREIGN_EXPORTS = new Set(['Inject']);

  it.each(decoratorExports.filter((name) => !FOREIGN_EXPORTS.has(name)))(
    '%s has a JSDoc block with @example at its declaration site',
    (name) => {
      const declaration = new RegExp(String.raw`/\*\*([\s\S]*?)\*/\s*(?:export )?(?:const|function) ${name}\b`);
      const match = declaration.exec(sources);
      expect(match).not.toBeNull();
      expect(match![1]).toContain('@example');
    },
  );
});
```

Run `npx jest test/__tests__/unit/AGENT_DOCS.test.ts --selectProjects unit`; fix any listed site until green.

- [ ] **Step 3: Full unit suite + lint + commit**

```bash
npm run test:unit && npm run check
git add lib test/__tests__/unit/AGENT_DOCS.test.ts
git commit -m "docs(jsdoc): complete decorator JSDoc pass and arm @example drift invariant

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 13: d.ts survival check — local + CI

**Files:**
- Modify: `.github/workflows/tests.yml` (Postinstall verifier job, after the `Build project` step at ~line 80)

- [ ] **Step 1: Verify locally that tsup preserves the JSDoc**

```bash
npm run build
grep -c "@example" dist/index.d.ts
```
Expected: ≥ 80 (roughly one per decorator). If the count is near zero, STOP — tsup's dts rollup is stripping comments; investigate `tsup.config.ts` (`dts: true` normally preserves JSDoc) before proceeding.

- [ ] **Step 2: Add the CI step**

In `.github/workflows/tests.yml`, in the job that already runs `npm run build` (Postinstall verifier, after line ~81):

```yaml
      - name: Assert JSDoc examples survive into dist/index.d.ts
        run: |
          COUNT=$(grep -c "@example" dist/index.d.ts)
          echo "Found $COUNT @example blocks in dist/index.d.ts"
          test "$COUNT" -ge 80
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/tests.yml
git commit -m "ci(tests): assert JSDoc @example blocks survive the d.ts rollup

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 14: Full acceptance run

- [ ] **Step 1: Run the whole gate against the spec's acceptance criteria**

```bash
npm run build && node ./postinstall/PostInstall.js
npm run test:unit
npm run test:integration
npm run test:verifier && npm run test:verifier:monorepo
npm pack --dry-run 2>&1 | grep -E "docs/"        # exactly docs/AGENTS.md, nothing from docs/superpowers
grep -c "@example" dist/index.d.ts                # ≥ 80
```
All green. If a docker daemon is available, also `npm run test:postinstall:docker`; otherwise note it for CI.

- [ ] **Step 2: Optional e2e sanity** (boots bookshop on :4004)

```bash
npm run test:e2e
```

- [ ] **Step 3: Push the branch** (PR creation stays with the user per repo convention)

```bash
git push -u origin feature-agentic-dx
```
