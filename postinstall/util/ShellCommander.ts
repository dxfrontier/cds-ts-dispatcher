import { sync } from 'cross-spawn';

export interface CommandResult {
  /** Exit status of the process, or `null` when it was terminated by a signal or failed to spawn. */
  status: number | null;
  stdout: string;
  stderr: string;
  /** `true` when the process could not be spawned or exited with a non-zero status. */
  failed: boolean;
  /** Message of the spawn-level error (`ENOENT`, `ETIMEDOUT`, …), when one occurred — `stderr` is empty in those cases. */
  errorMessage?: string;
}

export class ShellCommander {
  // A postinstall must never hang a consumer's `npm install`: a stuck env probe or `cds` CLI is
  // killed after this long and surfaces as a regular failed result instead of blocking forever.
  private static readonly EXECUTION_TIMEOUT_MS = 60_000;

  /**
   * Executes a command synchronously and returns a structured, non-throwing result.
   *
   * A postinstall script must never abort a consumer's `npm install`, so instead of throwing
   * this surfaces the exit status, `stdout` and `stderr` for the caller to inspect and decide upon.
   */
  public executeCommand(command: string, args: string[], currentExecutionPath?: string): CommandResult {
    const result = sync(command, args, {
      encoding: 'utf8',
      cwd: currentExecutionPath,
      timeout: ShellCommander.EXECUTION_TIMEOUT_MS,
      // SIGTERM (the default) can be trapped and ignored by the child, which would turn the
      // timeout into the very hang it exists to prevent; SIGKILL cannot be trapped.
      killSignal: 'SIGKILL',
    });

    return {
      status: result.status,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      failed: result.error != null || (result.status ?? 1) !== 0,
      errorMessage: result.error?.message,
    };
  }
}
