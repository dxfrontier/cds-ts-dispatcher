import { sync } from 'cross-spawn';

export interface CommandResult {
  /** Exit status of the process, or `null` when it was terminated by a signal or failed to spawn. */
  status: number | null;
  stdout: string;
  stderr: string;
  /** `true` when the process could not be spawned or exited with a non-zero status. */
  failed: boolean;
}

export class ShellCommander {
  /**
   * Executes a command synchronously and returns a structured, non-throwing result.
   *
   * A postinstall script must never abort a consumer's `npm install`, so instead of throwing
   * this surfaces the exit status, `stdout` and `stderr` for the caller to inspect and decide upon.
   */
  public executeCommand(command: string, args: string[], currentExecutionPath?: string): CommandResult {
    const result = sync(command, args, { encoding: 'utf8', cwd: currentExecutionPath });

    return {
      status: result.status,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      failed: result.error != null || (result.status ?? 1) !== 0,
    };
  }

  public compileEnvFile(envFilePath: string, dispatcherFolderPath: string): CommandResult {
    return this.executeCommand('npx tsc', [envFilePath, '--outDir', dispatcherFolderPath]);
  }
}
