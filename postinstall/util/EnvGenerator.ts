import { writeFileSync } from 'fs';
import { json2ts } from 'json-ts';

import { FileManager } from './FileManager';
import { ShellCommander, CommandResult } from './ShellCommander';
import { ExecutionPaths } from './types';

export class EnvGenerator {
  private readonly fileManager: FileManager;
  private readonly shellCommander: ShellCommander;

  // Matches CSI color sequences: ESC (0x1b) followed by `[<digits/;>m`, e.g. the `\x1b[32m` that
  // `cds` emits around string values when it renders with colors instead of plain JSON.
  private readonly ansiPattern = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g');

  constructor() {
    this.fileManager = new FileManager();
    this.shellCommander = new ShellCommander();
  }

  private generateTypeDefinitions(jsonString: string): string {
    return json2ts(jsonString, { rootName: 'CDS_ENV', prefix: '' });
  }

  /**
   * Runs `cds env get --json` inside the given project.
   *
   * The explicit `--json` flag is essential: without it `cds` inspects the environment and, when
   * it detects a CI provider (e.g. `GITHUB_ACTIONS`), switches to a colored `util.inspect` rendering
   * (`Config { _context: 'cds', ... }` with ANSI escape codes) instead of plain JSON. That non-JSON,
   * lossy payload is exactly what makes json2ts crash during CI installs, and it cannot be recovered
   * by post-processing. Forcing `--json` yields the same clean, complete output on every platform.
   */
  private getCdsEnvOutput(path: string): CommandResult {
    return this.shellCommander.executeCommand('cds', ['env', 'get', '--json'], path);
  }

  /**
   * Strips ANSI escape sequences and extracts the JSON object literal, from the first `{` to the
   * last `}`. Acts as a safety net so that any residual decoration around the payload (banners,
   * colors, notices printed by older `cds` versions) never reaches json2ts.
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

  private createEnvFile(filePath: string, envConfig: string): void {
    const typeDefinitions = this.generateTypeDefinitions(envConfig);
    const fileContent = `// Type definitions for envConfig\nexport ${typeDefinitions}`;

    writeFileSync(filePath, fileContent);
  }

  private compileEnvFile(envFilePath: string, dispatcherPath: string): void {
    this.shellCommander.compileEnvFile(envFilePath, dispatcherPath);
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
        `    Raw \`cds env get\` output (first 200 chars): ${JSON.stringify(rawSample.slice(0, 200))}`,
        '    The library still works; regenerate later by reinstalling once `cds` is available.',
        '',
      ].join('\n'),
    );
  }

  /**
   * Generates the env file for a single execution path.
   *
   * @returns `true` when the file was generated, `false` when the path was skipped.
   */
  private generateEnvFileForPath(paths: ExecutionPaths[number]): boolean {
    const { executedInstalledPath, envFilePath, dispatcherPath } = paths;
    const result = this.getCdsEnvOutput(executedInstalledPath);

    if (result.failed || result.stdout.trim().length === 0) {
      const reason = result.failed
        ? `\`cds env get\` failed (exit code ${result.status}). ${result.stderr.trim()}`.trim()
        : '`cds env get` produced empty output.';

      this.skipWithWarning(executedInstalledPath, reason, result.stdout || result.stderr);
      return false;
    }

    const envObject = this.extractEnvObject(result.stdout);

    if (envObject === null) {
      this.skipWithWarning(executedInstalledPath, 'no JSON object could be extracted from the output.', result.stdout);
      return false;
    }

    this.createEnvFile(envFilePath, envObject);
    this.compileEnvFile(envFilePath, dispatcherPath);
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
