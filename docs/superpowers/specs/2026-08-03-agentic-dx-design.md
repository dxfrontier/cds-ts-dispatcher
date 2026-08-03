# Agentic DX — making cds-ts-dispatcher guide AI assistants

- **Date:** 2026-08-03
- **Status:** design approved, implementation plan pending
- **Branch context:** builds on `feature-batch2-decorators` (or lands after it merges) — the decorator taxonomy must include `@Throttle`, the `@ServerLifecycle` family, and the websocket decorators, which exist only there.

## Problem

When a developer uses `@dxfrontier/cds-ts-dispatcher` in a consumer project together with an AI coding assistant (Claude Code, Cursor, Codex, Copilot, Zed), the assistant's only local knowledge is `dist/index.d.ts`, whose JSDoc is one line per decorator plus a `@see` link to a GitHub README anchor. Agents rarely follow remote links, so they guess from type names. The observable failures:

- wrong sibling choice (`@AfterRead` vs `@AfterReadEachInstance`, non-draft vs draft variants),
- hallucinated decorator options,
- missed setup contract (tsconfig flags, bootstrap pattern),
- dead ends on runtime errors that don't say how to fix themselves.

**Key discovered fact:** `README.md` (6,646 lines, 268.8 kB) already ships in the npm tarball — npm auto-includes it (verified with `npm pack --dry-run`). Full documentation is already on every consumer's disk at `node_modules/@dxfrontier/cds-ts-dispatcher/README.md`. The problem is not availability; it is discovery, orientation, and feedback loops.

## Decisions (from brainstorming)

1. **Target moments, in priority order:** answering questions → debugging/self-correcting → project setup → writing code. All four are in scope.
2. **Tool-agnostic:** one canonical AGENTS.md-style format readable by every assistant. No per-tool files (`.cursor/rules`, `copilot-instructions.md`, Claude skills).
3. **Delivery:** files shipped inside the tarball, plus a scaffold into the `@dispatcher/` folder the postinstall already owns. The package never writes root-level files in consumer repos.
4. **Docs only:** no CLI, no MCP server, no new executables.
5. **Approach:** layered curation — four thin, hand-written layers, each with one job, each useful on its own if it is the only layer an agent ever sees.

## Component 1 — Package `AGENTS.md` (shipped in the tarball)

New hand-written file at the repo root, added to the `package.json` `files` array (it is **not** auto-included the way README.md is). Target size ≈ 300 lines. This is the agent's entry point for the package.

Content outline, in order:

1. **Disambiguation line** (first line): this file documents *using* the package; contributors to the dispatcher itself see `CLAUDE.md`. Needed because a repo-root `AGENTS.md` is also picked up by contributors' tools.
2. **Mental model** (one screen): decorators only write metadata at decoration time; all registration happens once at `new CDSDispatcher([...]).initialize()`, which returns `cds.service.impl(...)`. This single fact prevents most wrong AI answers.
3. **Setup contract:** required tsconfig flags (`experimentalDecorators`, `emitDecoratorMetadata`), the `@sap/cds` → `@cap-js/cds-types` `paths` mapping, peer-dependency major pairing, bootstrap wiring in the service implementation file.
4. **Decorator taxonomy table:** every exported decorator (~60), grouped by kind (class / before / on / after / parameter / other), one row each: *name → one-sentence when-to-use → local README anchor*.
5. **Confusables section:** the pairs agents mix up — `@AfterRead` vs `@AfterReadEachInstance`, non-draft vs `…Draft` variants, `@OnAction` vs bound actions, `@Prepend` semantics, `@Use` middleware ordering.
6. **Error catalog:** table of stable error codes (Component 4): *code → meaning → likely cause → fix*. Each row carries an anchor (`#e012`) so error messages can deep-link.
7. **Where to read more:** explicit pointers into the local `node_modules/@dxfrontier/cds-ts-dispatcher/README.md` sections, stated as file paths so agents know no network is needed.

## Component 2 — Scaffolded `@dispatcher/AGENTS.md` (consumer project)

A new generator module in `postinstall/util/` (sibling of `TypeGenerator.ts`, writes through `FileManager` like the existing artifacts) emits `@dispatcher/AGENTS.md` next to the generated `index.ts`/`index.js`.

- **Template, ~70 lines, version-stamped:** "This project uses `@dxfrontier/cds-ts-dispatcher` v{X}" · the mental model in five lines · the canonical handler-class shape (one short example) · the two local doc paths (`AGENTS.md`, `README.md` under `node_modules/…`) · the error-code loop ("errors starting `[dispatcher] E` → look up the code in the shipped catalog") · a do-not-edit banner (file is regenerated on every install).
- **Console hint**, printed once per install, skip-safe: suggest adding a pointer line referencing `@dispatcher/AGENTS.md` from the project's root `AGENTS.md` / `CLAUDE.md`. Suggested wording of the pointer line is included in the hint so it can be pasted verbatim.
- **Policy:** identical to the existing scaffold — the postinstall must never abort or hang an install; any failure in this generator degrades to skip-with-warning.
- **Known limitation (accepted):** no assistant auto-loads a subfolder file; the pointer the developer adds to their root file is the load-bearing link. That is why the hint prints on every install rather than only the first.

## Component 3 — JSDoc enrichment (`dist/index.d.ts` is what agents read first)

Rewrite the JSDoc at every export site (the `const X = buildY({...})` declarations in `lib/decorators/method.ts`, `class.ts`, `parameter.ts`, plus core exports `CDSDispatcher`, `@EntityHandler`, `@Use`, `@Validate`, `@FieldsFormatter`, `@UnboundActions`, `@Repository`, `@ServiceLogic`). No structural change — the blocks already exist, they are just thin (~23 `@example` blocks today across ~60 decorators).

Canonical template per decorator:

```ts
/**
 * Executes custom logic after a read operation, on the full result set.
 * Registers `srv.after('READ', <Entity>, callback)`.
 *
 * @remarks
 * Operates on the whole result array; use `@AfterReadEachInstance` for
 * per-row logic. Draft variant: `@AfterReadDraft`. Mutate `results` in
 * place or return a new value — returning `undefined` keeps the original.
 *
 * @example
 * @EntityHandler(Book)
 * class BookHandler {
 *   @AfterRead()
 *   async enrich(@Results() results: Book[], @Req() req: Request) { ... }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | GitHub docs}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterRead
 */
```

Rules:

- Summary line always names the raw CAP registration (`srv.before/on/after/prepend`) — agents that know CAP anchor on it.
- Exactly one realistic, compilable `@example` per decorator, showing the class decorator and typical parameter decorators. Parameter decorators (`@Req`, `@Results`, `@Next`, `@Env`, `@Jwt`, …) get the richest examples — their bare signatures are opaque.
- Keep the existing GitHub `@see` link; add the plain-text local-path line.
- Net `dist/index.d.ts` growth ≈ +1,500 lines — acceptable; d.ts exists for tooling.

**Verification item:** confirm tsup's d.ts rollup preserves these JSDoc blocks in `dist/index.d.ts`; the whole layer depends on it. Checked once during implementation and permanently via a grep step in the build CI job.

## Component 4 — Error catalog with stable codes

Developer-facing errors funnel through `util.throwErrorMessage` (~14 call sites in `CDSDispatcher.ts`, `ArgumentMethodProcessor.ts`, `MiddlewareEntityRegistry.ts`, `parameterUtil.ts`, `method.ts`). This component is a message refactor, not new machinery:

**Scope boundary:** codes apply only to errors raised via `throwErrorMessage` — configuration/usage mistakes a developer must fix. Request-level rejections via `util.raiseBadRequestMessage` (`req.reject`, e.g. validation failures) are responses to the *API client*, not the developer; they keep their current format and get no codes.

- **Format:** `[dispatcher] E012: <what happened>. Fix: <concrete action>. Docs: node_modules/@dxfrontier/cds-ts-dispatcher/AGENTS.md#e012`
- **Centralization:** messages currently inlined at call sites (e.g. the `@Throttle` validation strings in `method.ts`) move into the existing `internalConstants.ts` `MESSAGES` catalog; each entry carries code, message template, and fix line. A thin `throwDispatcherError(code, placeholders)` wrapper formats uniformly (built on the existing `util.buildMessage` templating).
- **Code ranges:** `E0xx`/`E1xx` for consumer-triggerable errors; `E9xx` for internal invariants ("Unexpected eventKind") so bug reports become precise. Exact numbers are assigned during implementation.
- **Stability contract:** codes are append-only — never renumbered, never reused. That is what makes them greppable across versions.
- **Catalog home:** the table in the package `AGENTS.md` (Component 1); the scaffolded file only teaches the lookup loop.
- **Scope discipline:** recode *existing* errors and add fix lines. No new misconfiguration detection logic in this iteration. Existing tests asserting message text are updated alongside.

## Cross-cutting

### Drift gate

A jest unit test (`test/__tests__/unit/AGENT_DOCS.test.ts`, rides the existing suite — no new CI plumbing) asserting four invariants:

1. every decorator exported from `lib/index.ts` has a row in the `AGENTS.md` taxonomy table;
2. every exported decorator's JSDoc block contains `@example`;
3. error codes in `MESSAGES` ↔ rows in the `AGENTS.md` error catalog match bidirectionally;
4. every README anchor referenced from `AGENTS.md` resolves against `README.md` headings (protects against TOC restructures like commit `3daf3e8`).

### Tests

- Extend `test/postinstall/Verifier.ts` and `MonoRepoVerifier.ts` (and therefore the docker harness) to assert `@dispatcher/AGENTS.md` exists, carries the stamped version, and contains correct `node_modules` doc paths.
- Update unit tests whose message expectations change with the error recoding.
- Build CI job gains one grep asserting `@example` blocks survived into `dist/index.d.ts`.

### README mirroring (project convention)

- New short README section **"Using with AI assistants"**: what ships (`AGENTS.md`, error codes, scaffolded `@dispatcher/AGENTS.md`), the one pointer line to add to the project's root agent file, and the error-code format.
- The README postinstall section documents the new scaffolded file.

### Rollout

- All changes are minor-version `feat:` material; no breaking changes (error message text is not API).
- Natural PR split, matching the priority order: **(1)** both AGENTS.md layers + scaffold + verifiers, **(2)** error catalog + test updates, **(3)** JSDoc enrichment pass. The drift-gate test lands with PR 1, and each PR arms the invariants it makes satisfiable: PR 1 → taxonomy completeness + README-anchor validity, PR 2 → error-code consistency, PR 3 → `@example` coverage.

### Manual validation (optional, not CI)

Smoke-eval after PR 1 and PR 3: open an AI assistant in a consumer-shaped project (e.g. `test/sample-project/bookshop`), ask a fixed set of canonical questions ("add validation before creating a Book", "why isn't my handler firing", "difference between @AfterRead and @AfterReadEachInstance"), and compare answer quality against today's behavior.

## Non-goals

- CLI tooling (`doctor` / `docs` commands) — revisit if the docs layers prove insufficient for debugging.
- MCP server — SAP's `@cap-js/mcp-server` covers the CAP side; a dispatcher server is future work at best.
- Managing root-level files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, …) in consumer repos.
- Hosting docs / `llms.txt` on a website — there is no docs site; local-first is the strategy.
- New misconfiguration detection logic (new guards/validations beyond what already throws).
- Per-tool guidance files or a Claude Code skill/plugin.

## Acceptance criteria

1. `npm pack` tarball contains `AGENTS.md` at the package root.
2. Verifier, MonoRepoVerifier, and the docker harness all assert the scaffolded `@dispatcher/AGENTS.md` (stamped version, correct paths); an induced generator failure still exits the install successfully (skip-with-warning).
3. Drift-gate test green: taxonomy complete, `@example` on every exported decorator, error codes bidirectionally consistent, README anchors valid.
4. Build CI grep confirms JSDoc (`@example`) present in `dist/index.d.ts`.
5. Every developer-facing error raised via `throwErrorMessage` carries an `E`-code with a fix line and a docs pointer; `req.reject` responses remain untouched.
6. README contains the "Using with AI assistants" section.
7. Full suite green: unit, integration, e2e, verifiers, docker postinstall harness.
