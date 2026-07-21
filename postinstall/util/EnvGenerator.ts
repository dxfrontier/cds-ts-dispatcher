import { writeFileSync, readFileSync, existsSync, rmSync } from 'fs';

import { FileManager } from './FileManager';
import { writeRuntimeStub } from './runtimeStub';
import { ShellCommander, CommandResult } from './ShellCommander';
import { generateCdsEnvType } from './TypeGenerator';
import { ExecutionPaths } from './types';

/**
 * Outcome of an env-acquisition attempt. Either the parsed `cds.env` object, or a human-readable
 * reason plus a small raw sample for the skip warning.
 */
type AcquisitionSuccess = { ok: true; env: unknown };
type AcquisitionFailure = { ok: false; reason: string; rawSample: string };
type EnvAcquisition = AcquisitionSuccess | AcquisitionFailure;

export class EnvGenerator {
  private readonly fileManager: FileManager;
  private readonly shellCommander: ShellCommander;

  // Matches CSI color sequences: ESC (0x1b) followed by `[<digits/;>m`, e.g. the `\x1b[32m` that
  // `cds` emits around string values when it renders with colors instead of plain JSON.
  private readonly ansiPattern = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g');

  // Single-line, dependency-free probe executed by a fresh `node` process inside the consumer
  // project. `require('@sap/cds').env` is a plain object that `JSON.stringify` renders as clean JSON,
  // immune to `GITHUB_ACTIONS`/`FORCE_COLOR` (unlike the CLI, which switches to a colored
  // `util.inspect` dump under CI). The result is written to a file so unrelated stdout noise
  // (plugin banners, deprecation notices) cannot corrupt the payload.
  private readonly envProbeScript =
    "const r=require.resolve('@sap/cds',{paths:[process.cwd()]});" +
    'require("fs").writeFileSync(process.argv[1],JSON.stringify(require(r).env));';

  // Temporary transport file for the programmatic probe. It lives inside the already-created
  // `@dispatcher` folder (no `os.tmpdir` dependency) and is removed in a `finally`.
  private readonly transportFileName = '.cds-env.tmp.json';

  constructor() {
    this.fileManager = new FileManager();
    this.shellCommander = new ShellCommander();
  }

  /**
   * PRIMARY acquisition path — programmatic, no CLI.
   *
   * Spawns `process.execPath` with `-e` and the probe script, `cwd` set to the consumer project so
   * `require.resolve('@sap/cds')` finds the project's own `@sap/cds`. On success the transport file
   * holds the stringified `cds.env`, which is then `JSON.parse`d as a validation gate.
   */
  private acquireEnvProgrammatically(executedInstalledPath: string, dispatcherPath: string): EnvAcquisition {
    const transportFile = FileManager.joinPaths(dispatcherPath, this.transportFileName);

    try {
      const result = this.shellCommander.executeCommand(
        process.execPath,
        ['-e', this.envProbeScript, transportFile],
        executedInstalledPath,
      );

      if (result.failed) {
        // A spawn-level failure (ENOENT, ETIMEDOUT after the kill, …) leaves stderr empty; the
        // error message is the only actionable detail in that case.
        const detail = this.compressFailureDetail(result.stderr) || result.errorMessage || '';

        return {
          ok: false,
          reason: `programmatic \`@sap/cds\` env probe failed (exit code ${result.status}). ${detail}`.trim(),
          rawSample: result.stderr || result.stdout,
        };
      }

      if (!existsSync(transportFile)) {
        return { ok: false, reason: 'programmatic `@sap/cds` env probe produced no output.', rawSample: result.stdout };
      }

      return this.parseEnv(readFileSync(transportFile, 'utf8'), 'programmatic `@sap/cds` env probe');
    } finally {
      this.removeTransportFile(transportFile);
    }
  }

  /**
   * FALLBACK acquisition path — the hardened CLI.
   *
   * Runs `cds env get --json`, strips ANSI, extracts the object literal, then `JSON.parse`s it as a
   * validation gate (previously the extracted string reached the type generator unvalidated).
   */
  private acquireEnvViaCli(executedInstalledPath: string): EnvAcquisition {
    const result = this.getCdsEnvOutput(executedInstalledPath);

    if (result.failed || result.stdout.trim().length === 0) {
      const detail = this.compressFailureDetail(result.stderr) || result.errorMessage || '';
      const reason = result.failed
        ? `\`cds env get --json\` failed (exit code ${result.status}). ${detail}`.trim()
        : '`cds env get --json` produced empty output.';

      return { ok: false, reason, rawSample: result.stdout || result.stderr };
    }

    const envObject = this.extractEnvObject(result.stdout);

    if (envObject === null) {
      return {
        ok: false,
        reason: 'no JSON object could be extracted from `cds env get --json` output.',
        rawSample: result.stdout,
      };
    }

    return this.parseEnv(envObject, '`cds env get --json`');
  }

  /**
   * Compresses a child process's stderr into a single informative line for warning messages: a
   * failed `require` dumps a full multiline stack trace, but install logs deserve just the
   * `Error: …` essence. The raw sample shown alongside skip warnings keeps the uncompressed data.
   */
  private compressFailureDetail(raw: string): string {
    const lines = raw
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return '';
    }

    const errorLine = lines.find((line) => /^\w*Error[:\s]/.test(line));

    return (errorLine ?? lines[0]).slice(0, 300);
  }

  /**
   * Validation gate shared by both acquisition paths: parses the raw payload and reports invalid
   * JSON as a skip reason rather than letting it reach the type generator.
   */
  private parseEnv(raw: string, source: string): EnvAcquisition {
    try {
      return { ok: true, env: JSON.parse(raw) };
    } catch (error) {
      return { ok: false, reason: `${source} returned invalid JSON: ${(error as Error).message}`, rawSample: raw };
    }
  }

  /**
   * Runs `cds env get --json` inside the given project.
   *
   * The explicit `--json` flag is essential: without it `cds` inspects the environment and, when
   * it detects a CI provider (e.g. `GITHUB_ACTIONS`), switches to a colored `util.inspect` rendering
   * (`Config { _context: 'cds', ... }` with ANSI escape codes) instead of plain JSON. That non-JSON,
   * lossy payload is exactly what broke CI installs, and it cannot be recovered by post-processing.
   * Forcing `--json` yields the same clean, complete output on every platform.
   */
  private getCdsEnvOutput(path: string): CommandResult {
    return this.shellCommander.executeCommand('cds', ['env', 'get', '--json'], path);
  }

  /**
   * Strips ANSI escape sequences and extracts the JSON object literal, from the first `{` to the
   * last `}`. Acts as a safety net so that any residual decoration around the payload (banners,
   * colors, notices printed by older `cds` versions) never reaches the parser.
   *
   * @returns the sanitized object literal, or `null` when no object literal can be found.
   */
  private extractEnvObject(raw: string): string | null {
    const withoutAnsi = raw.replace(this.ansiPattern, '');
    const start = withoutAnsi.indexOf('{');
    const end = withoutAnsi.lastIndexOf('}');

    if (start === -1 || end === -1 || end < start) {
      return null;
    }

    return withoutAnsi.slice(start, end + 1);
  }

  /**
   * Best-effort removal of the transport file. A leftover temp file must never fail the install.
   */
  private removeTransportFile(transportFile: string): void {
    try {
      if (existsSync(transportFile)) {
        rmSync(transportFile);
      }
    } catch {
      /* ignore — cleanup is best-effort */
    }
  }

  /**
   * Writes `@dispatcher/index.ts`: the header comment plus the `export interface CDS_ENV` produced
   * by the in-house type generator.
   */
  private createEnvFile(filePath: string, env: unknown): void {
    const fileContent = `// Type definitions for envConfig\n${generateCdsEnvType(env)}\n`;

    writeFileSync(filePath, fileContent);
  }

  /**
   * Loudly reports an execution path that could not be processed, then lets the caller continue.
   * The `@dispatcher` folder is a convenience that backs the typed `#dispatcher` import; a failure
   * here must never abort the consumer's `npm install`.
   */
  private skipWithWarning(path: string, reason: string, rawSample: string): void {
    console.warn(
      [
        '',
        `⚠️  [cds-ts-dispatcher] Skipped @dispatcher env generation for: ${path}`,
        `    Reason: ${reason}`,
        `    Raw output (first 200 chars): ${JSON.stringify(rawSample.slice(0, 200))}`,
        '    The library still works; regenerate later by reinstalling once `@sap/cds` is installed.',
        '',
      ].join('\n'),
    );
  }

  /**
   * Generates the env file for a single execution path using the acquisition ladder:
   * programmatic probe first, hardened CLI as a fallback, skip-with-warning when both fail.
   *
   * @returns `true` when the files were generated, `false` when the path was skipped.
   */
  private generateEnvFileForPath(paths: ExecutionPaths[number]): boolean {
    const { executedInstalledPath, envFilePath, runtimeStubPath, dispatcherPath } = paths;

    const primary = this.acquireEnvProgrammatically(executedInstalledPath, dispatcherPath);
    let acquisition: AcquisitionSuccess;

    if (primary.ok) {
      acquisition = primary;
    } else {
      const fallback = this.acquireEnvViaCli(executedInstalledPath);

      if (!fallback.ok) {
        this.skipWithWarning(
          executedInstalledPath,
          `${primary.reason} Fallback: ${fallback.reason}`,
          fallback.rawSample,
        );
        return false;
      }

      // A rescued install must stay observable: if the programmatic tier silently regressed, this
      // notice would be the only signal (the docker harness fails when it appears in an install log).
      console.warn(
        `⚠️  [cds-ts-dispatcher] Programmatic @sap/cds env read failed (${primary.reason}) — used the \`cds env get --json\` fallback instead.`,
      );
      acquisition = fallback;
    }

    this.createEnvFile(envFilePath, acquisition.env);
    writeRuntimeStub(runtimeStubPath);
    return true;
  }

  private generateEnvFiles(): void {
    const { paths } = this.fileManager.dispatcherExecutionPath;
    let generated = 0;

    paths.forEach((path) => {
      try {
        if (this.generateEnvFileForPath(path)) {
          generated += 1;
        }
      } catch (error) {
        this.skipWithWarning(path.executedInstalledPath, `unexpected error: ${(error as Error).message}`, '');
      }
    });

    if (paths.length > 0 && generated === 0) {
      console.warn(
        '⚠️  [cds-ts-dispatcher] No @dispatcher env files could be generated. ' +
          'The library is installed and usable; only the typed `#dispatcher` env import is affected.',
      );
    }
  }

  /**
   * Entry point for the postinstall step.
   *
   * Policy: this never calls `process.exit(1)`. Generating `@dispatcher` type definitions is a
   * convenience, and breaking every consumer's `npm install` on a `cds env` hiccup (the original
   * bug) is disproportionate. Unusable paths are skipped with a loud warning; any unexpected error
   * is caught and reported instead of propagating.
   */
  public run(): void {
    try {
      this.generateEnvFiles();
    } catch (error) {
      console.warn(`⚠️  [cds-ts-dispatcher] Postinstall env generation skipped: ${(error as Error).message}`);
    }
  }
}
