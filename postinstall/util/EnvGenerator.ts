import { writeFileSync } from 'fs';
import { json2ts } from 'json-ts';

import { FileManager } from './FileManager';
import { ShellCommander } from './ShellCommander';

export class EnvGenerator {
  private readonly fileManager = new FileManager();
  private readonly shellCommander = new ShellCommander();

  private generateTypeDefinitions(jsonString: string): string {
    return json2ts(jsonString, { rootName: 'CDS_ENV', prefix: '' });
  }

  private getCdsEnvOutput(path: string): string {
    return this.shellCommander.executeCommand('cds', ['env', 'get'], path);
  }

  private createEnvFile(filePath: string, envConfig: string): void {
    const typeDefinitions = this.generateTypeDefinitions(envConfig);
    const fileContent = `// Type definitions for envConfig\nexport ${typeDefinitions}`;

    writeFileSync(filePath, fileContent);
  }

  private compileEnvFile(envFilePath: string, dispatcherPath: string): void {
    this.shellCommander.compileEnvFile(envFilePath, dispatcherPath);
  }

  private generateEnvFiles(): void {
    this.fileManager.dispatcherExecutionPath.paths.forEach(({ executedInstalledPath, envFilePath, dispatcherPath }) => {
      const output = this.getCdsEnvOutput(executedInstalledPath);

      this.createEnvFile(envFilePath, output);
      this.compileEnvFile(envFilePath, dispatcherPath);
    });
  }

  public run(): void {
    try {
      this.generateEnvFiles();
    } catch (error) {
      console.error('Error generating environment files:', error);
      process.exit(1);
    }
  }
}
