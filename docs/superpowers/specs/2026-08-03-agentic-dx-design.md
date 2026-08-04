# Agentic DX — making cds-ts-dispatcher guide AI assistants

- **Date:** 2026-08-03 · **Revision 2:** 2026-08-04
- **Status:** design approved (rev 2), implementation plan at `docs/superpowers/plans/2026-08-04-agentic-dx.md`
- **Branch context:** builds on `feature-batch2-decorators` (or lands after it merges) — the JSDoc pass must cover `@Throttle`, the `@ServerLifecycle` family, and the websocket decorators, which exist only there.

> **Revision 2 (2026-08-04):** scope reduced to **JSDoc-only** by user decision after the research
> review. The shipped `docs/AGENTS.md` guide, the postinstall-scaffolded `@dispatcher/AGENTS.md`,
> and the error-code catalog are dropped/deferred (see "Dropped components"). Rationale: the 5×
> empirical evidence belongs to JSDoc examples + signatures; context files carry drift risk and a
> weak discovery chain (nothing auto-reads `node_modules`), while JSDoc is discovered automatically
> via hover/go-to-definition/d.ts reads. Every unique job the guide had relocates into places
> agents already look (see Component 3).

## Problem

When a developer uses `@dxfrontier/cds-ts-dispatcher` in a consumer project together with an AI coding assistant (Claude Code, Cursor, Codex, Copilot, Zed), the assistant's only local knowledge is `dist/index.d.ts`, whose JSDoc is one line per decorator plus a `@see` link to a GitHub README anchor. Agents rarely follow remote links, so they guess from type names. The observable failures:

- wrong sibling choice (`@AfterRead` vs `@AfterReadEachInstance`, non-draft vs draft variants),
- hallucinated decorator options,
- missed setup contract (tsconfig flags, bootstrap pattern),
- not knowing that an unregistered handler class is silently inert.

**Key facts:** `README.md` (6,646 lines, 268.8 kB) already ships in the npm tarball — npm auto-includes it (verified with `npm pack --dry-run`). Full documentation is already on every consumer's disk. And the d.ts is the one artifact every agent reads without being told to.

## Decisions

1. **Target moments** (rev 1 priority: answering questions → debugging → setup → writing code). Rev 2 serves all four through a single channel: module-level and per-export JSDoc.
2. **Tool-agnostic:** JSDoc/TSDoc in the shipped `dist/index.d.ts` works identically for every assistant and IDE. No per-tool files.
3. **Zero new artifacts:** no new shipped files, no postinstall changes, no runtime changes. The tarball contents are unchanged.
4. **Content rule:** JSDoc carries only what an agent cannot infer from the signature alone — semantics, sibling disambiguation, gotchas, one realistic example. No duplication of README prose; deep dives stay in the shipped README, referenced by local path.

## Component 3 (now the whole program) — JSDoc enrichment

`dist/index.d.ts` is what agents read first; it is produced by tsup's dts rollup from the `lib/` sources.

### 3a. Module-level documentation

- A **`@packageDocumentation`** JSDoc block at the top of `lib/index.ts` — it lands at the very top of `dist/index.d.ts`, the first thing an agent sees. Content: the mental model (decorators only write metadata at decoration time; everything registers once at `new CDSDispatcher([...]).initialize()`; **a handler class not passed to `CDSDispatcher` is silently inert**), the setup contract (`experimentalDecorators`, `emitDecoratorMetadata`, peer-dependency major pairing), the bootstrap example, and the local-docs pointer (`node_modules/@dxfrontier/cds-ts-dispatcher/README.md`).
- **`CDSDispatcher` class JSDoc** carries the same bootstrap contract at the API's front door (constructor expectations + `initialize()` example).
- Contingency: if the dts rollup strips the entry-file banner, the identical content lives on the `CDSDispatcher` class JSDoc (which provably survives); the build check below decides.

### 3b. Per-export canonical template

Every exported decorator (~90 sites in `lib/decorators/method.ts`, `class.ts`, `parameter.ts`) gets:

- **Summary** — always naming the raw CAP registration (`srv.after('READ', <Entity>, cb)`, `cds.on('served', …)`, `srv.prepend(…)`).
- **`@remarks`** — when to use vs confusable siblings (`@AfterRead` vs `@AfterReadEachInstance` vs `@AfterReadSingleInstance`), draft-variant pointer, and the gotcha if one exists (execution order, mutation vs return semantics, host-class requirements). The rev-1 "confusables" section distributes here, at the exact site where the confusion happens.
- **One `@example`** — short, realistic, compilable: host class decorator + the method with its typical parameter decorators. Parameter decorators (`@Req`, `@Results`, `@Next`, `@Env`, `@Jwt`, …) get the richest examples — their bare signatures are opaque.
- **`@see`** — the existing GitHub anchor link stays; plus one plain-text line: "Full docs ship with this package: `node_modules/@dxfrontier/cds-ts-dispatcher/README.md` § <section>".

Net `dist/index.d.ts` growth ≈ +1,500–2,000 lines — free; d.ts exists for tooling.

## Cross-cutting

- **Drift gate** — `test/__tests__/unit/AGENT_DOCS.test.ts` (rides the existing jest unit project): (1) every exported decorator's declaration site has a JSDoc block containing `@example` (source-level check over the three decorator files; `Inject` excluded — re-exported from inversify); (2) `lib/index.ts` contains a `@packageDocumentation` block.
- **Build survival check** — after `npm run build`, `dist/index.d.ts` must contain ≥ 80 `@example` blocks and the package-doc banner; enforced locally during implementation and by one grep step in `.github/workflows/tests.yml` (the job that already builds).
- **No README change required** — JSDoc is not a public-API surface change; the README already documents every decorator.
- **Rollout** — a single `docs(jsdoc)`-scoped PR on top of `feature-batch2-decorators`. No version bump.

## Dropped components (rev 2) — recorded for history

- **Shipped `docs/AGENTS.md` guide** (rev-1 Component 1) — dropped. Weak discovery chain (no tool auto-reads `node_modules`), drift risk, duplication pressure. Its content relocated: mental model + setup → `@packageDocumentation` and `CDSDispatcher` JSDoc; confusables → per-site `@remarks`; taxonomy → unnecessary (the d.ts *is* the enumeration).
- **Postinstall-scaffolded `@dispatcher/AGENTS.md`** (rev-1 Component 2) — dropped with it; postinstall stays untouched.
- **Error catalog with stable codes** (rev-1 Component 4) — **deferred, not rejected**: revisit if debugging-with-agents proves weak in practice. The recon for it is preserved in the plan history (git) — 14 `throwErrorMessage` sites, proposed E001–E008/E901–E906 assignment, `req.reject` boundary.

## Research validation (2026-08-03/04)

Three web-research passes (standard intent, ecosystem survey, published evidence) ran during spec review and directly produced rev 2:

- **JSDoc examples are the best-evidenced mechanism:** examples + signatures ≈ 5× improvement in agent code-generation correctness (ReadMe.LLM, arXiv:2504.09798).
- **Context files are the mixed-evidence mechanism:** lean human-written ones gain ~4% at 15–20% token cost; stale/auto-generated ones measurably hurt (ETH Zurich / Agent-READMEs, arXiv:2511.12884). Rev 2 removes them rather than managing that risk with gates.
- **The AGENTS.md standard is contributor-facing** (root file, auto-loaded by 30+ tools; Claude Code itself reads only `CLAUDE.md` as of mid-2026); no tool reads agent files from dependencies — in-package guides (Next.js ≥16.2 precedent) rely on pointer chains agents may never follow.
- **`llms.txt` non-goal vindicated** (~97% never read; Astro sunset May 2026). **MCP is where measurable usage went** — it remains the strongest future candidate if docs-only proves insufficient.
- **Watch items:** the `agents` package.json field (npm-agentskills), pnpm `agentNotice`, a contributor-facing root `AGENTS.md` for this repo.

## Non-goals

- Shipped agent-guide files (`docs/AGENTS.md`) or postinstall scaffolds — dropped in rev 2 (above).
- Error codes — deferred (above).
- CLI tooling (`doctor` / `docs` commands) and MCP server — revisit only if JSDoc-only proves insufficient.
- Managing root-level files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, …) in consumer repos.
- Hosting docs / `llms.txt` on a website — local-first is the strategy.
- New misconfiguration detection logic; per-tool guidance files; Claude Code skill/plugin.
- Adopting the emerging `agents` package.json field or pnpm `agentNotice` — watch until standardized.

## Acceptance criteria

1. Drift gate green: every exported decorator (minus `Inject`) has a JSDoc block with `@example` at its declaration site; `lib/index.ts` carries `@packageDocumentation`.
2. After `npm run build`: `dist/index.d.ts` contains the module-level documentation (or, if the rollup strips it, the identical content on `CDSDispatcher`) and ≥ 80 `@example` blocks; CI enforces the grep.
3. `npm pack --dry-run` file list is **unchanged** versus `main` (no new shipped files).
4. Full suite green: `npm run test:unit`, `npm run test:integration`, `npm run check`.
