import { sync } from 'cross-spawn';

export class ShellCommander {
  public executeCommand(command: string, args: string[], currentExecutionPath?: string) {
    const result = sync(command, args, { encoding: 'utf8', cwd: currentExecutionPath });

    if (result.error && result.stderr) {
      throw new Error(result.stderr);
    }

    return result.stdout;
  }

  compileEnvFile(envFilePath: string, dispatcherFolderPath: string) {
    this.executeCommand('npx tsc', [envFilePath, '--outDir', dispatcherFolderPath]);
  }
}
