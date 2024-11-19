import { sync } from 'cross-spawn';

import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import * as path from 'path';
import { json2ts } from 'json-ts';
import { parse as parseJsonc, ParseError } from 'jsonc-parser';

export class GenerateEnv {
  private readonly dispatcherFolderPath: string;
  private readonly envFilePath: string;
  private readonly gitignoreFilePath: string;
  private readonly packageJsonFilePath: string;
  private readonly tsconfigFilePath: string;
  private readonly clientCwd = process.env.INIT_CWD!;

  constructor() {
    this.dispatcherFolderPath = path.join(this.clientCwd, '@dispatcher');
    this.envFilePath = path.join(this.dispatcherFolderPath, 'index.ts');
    this.gitignoreFilePath = path.join(this.clientCwd, '.gitignore');
    this.packageJsonFilePath = path.join(this.clientCwd, 'package.json');
    this.tsconfigFilePath = path.join(this.clientCwd, 'tsconfig.json');
  }

  private prepareDispatcherFolder() {
    this.createFolderIfAbsent(this.dispatcherFolderPath);
    this.createFileIfAbsent(this.envFilePath);
    this.createFileIfAbsent(this.gitignoreFilePath);
  }

  private createFolderIfAbsent(folderPath: string) {
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
  }

  private createFileIfAbsent(filePath: string, defaultContent = '') {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, defaultContent);
    }
  }

  private generateEnvFile() {
    const cdsEnvOutput = this.executeShellCommand('cds', ['env', 'get']);
    const typeDefinitions = this.generateTypeDefinitions(cdsEnvOutput);

    writeFileSync(this.envFilePath, `// Type definitions for envConfig\nexport ${typeDefinitions}`);
  }

  private compileEnvFile() {
    this.executeShellCommand('npx tsc', [this.envFilePath, '--outDir', this.dispatcherFolderPath]);
  }

  private addToGitignore() {
    this.appendLineIfAbsent(this.gitignoreFilePath, '@dispatcher');
  }

  private updatePackageJsonImports() {
    if (existsSync(this.packageJsonFilePath)) {
      const packageJson = JSON.parse(readFileSync(this.packageJsonFilePath, 'utf8'));
      packageJson.imports = packageJson.imports || {};

      if (!packageJson.imports['#dispatcher']) {
        packageJson.imports['#dispatcher'] = './@dispatcher/index.js';
        writeFileSync(this.packageJsonFilePath, JSON.stringify(packageJson, null, 2));
      }
    }
  }

  private updateTsconfigInclude() {
    if (existsSync(this.tsconfigFilePath)) {
      const tsconfigContent = readFileSync(this.tsconfigFilePath, 'utf8');
      const errors: ParseError[] = [];

      const tsconfig = parseJsonc(tsconfigContent, errors);

      if (errors.length > 0) {
        throw new Error('tsconfig.json contains comments or invalid JSON format, which is not allowed.');
      }

      // Ensure `include` property is present and update if needed
      tsconfig.include = tsconfig.include || [];
      if (!tsconfig.include.includes('./@dispatcher')) {
        tsconfig.include.push('./@dispatcher');
        writeFileSync(this.tsconfigFilePath, JSON.stringify(tsconfig, null, 2));
      }
    }
  }

  private appendLineIfAbsent(filePath: string, line: string) {
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(line)) {
      appendFileSync(filePath, `\n${line}\n`);
    }
  }

  private generateTypeDefinitions(jsonString: string): string {
    return json2ts(jsonString, { rootName: 'CDS_ENV', prefix: '' });
  }

  private executeShellCommand(command: string, args: string[]) {
    const result = sync(command, args, { encoding: 'utf8', cwd: this.clientCwd });

    if (result.stderr) {
      throw new Error(result.stderr);
    }

    return result.stdout;
  }

  public run() {
    try {
      this.prepareDispatcherFolder();
      this.generateEnvFile();
      this.compileEnvFile();
      this.addToGitignore();
      this.updatePackageJsonImports();
      this.updateTsconfigInclude();
    } catch (error) {
      console.error('Error during post-install steps:', error);
      process.exit(1);
    }
  }
}
