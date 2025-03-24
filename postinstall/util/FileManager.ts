import path from 'path';
import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

import { parse as parseJsonc, ParseError } from 'jsonc-parser';
import { ExecutionPaths, PackageJson } from './types';

export class FileManager {
  private readonly currentInstallDirectory = process.env.INIT_CWD!;
  private readonly dispatcherNecessaryFiles = {
    packageJson: 'package.json',
    folder: '@dispatcher',
    env: 'index.ts',
    gitIgnore: '.gitignore',
    tsConfig: 'tsconfig.json',
  };

  public readonly dispatcherExecutionPath: {
    paths: ExecutionPaths;
  } = { paths: [] };

  constructor() {
    this.run();
  }

  public static joinPaths(...paths: string[]) {
    return path.join(...paths);
  }

  private getPackageJson() {
    const parsedPackage: PackageJson = this.getParsedPackageJson();

    return {
      hasWorkspaces: (): boolean => (parsedPackage.workspaces?.length ?? 0) > 0,
      getWorkspaces: (): string[] => parsedPackage.workspaces!,
    };
  }

  private getParsedPackageJson(workspace?: string): PackageJson {
    let packageJsonPath: string;

    if (!workspace) {
      // Case 1: when it's a root
      packageJsonPath = this.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    } else if (path.isAbsolute(workspace)) {
      // Case 3: when workspace is a full path
      packageJsonPath = workspace;
    } else {
      // Case 2: when it's a workspace but just ./workspace/name/
      packageJsonPath = this.joinPaths(
        this.currentInstallDirectory,
        workspace,
        this.dispatcherNecessaryFiles.packageJson,
      );
    }

    return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
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

  private joinPaths(...paths: string[]) {
    return path.join(...paths);
  }

  private isDispatcherFound(dependencies: Record<string, string>): boolean {
    return dependencies && dependencies['@dxfrontier/cds-ts-dispatcher'] !== undefined;
  }

  private appendLineIfAbsent(filePath: string, line: string) {
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(line)) {
      appendFileSync(filePath, `\n${line}\n`);
    }
  }

  private updateGitIgnore(filePath: string) {
    this.appendLineIfAbsent(filePath, this.dispatcherNecessaryFiles.folder);
  }

  private updatePackageJsonImports(filePath: string) {
    if (existsSync(filePath)) {
      const packageJson = this.getParsedPackageJson(filePath);

      packageJson.imports = packageJson.imports || {};

      if (!packageJson.imports['#dispatcher']) {
        packageJson.imports['#dispatcher'] = './@dispatcher/index.js';
        writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
      }
    }
  }

  private updateTsconfigInclude(filePath: string) {
    if (existsSync(filePath)) {
      const tsconfigContent = readFileSync(filePath, 'utf8');
      const errors: ParseError[] = [];

      const tsconfig = parseJsonc(tsconfigContent, errors);

      if (errors.length > 0) {
        throw new Error('tsconfig.json contains comments or invalid JSON format !');
      }

      tsconfig.include = tsconfig.include || [];

      if (!tsconfig.include.includes('./@dispatcher')) {
        tsconfig.include.push('./@dispatcher');
        writeFileSync(filePath, JSON.stringify(tsconfig, null, 2));
      }
    }
  }

  private createOrUpdateConfigFiles(options: {
    envFilePath: string;
    gitignoreFilePath: string;
    packageJsonPath: string;
    tsconfigPath: string;
    dispatcherFolderPath: string;
  }) {
    // Folder
    this.createFolderIfAbsent(options.dispatcherFolderPath);

    // Files
    this.createFileIfAbsent(options.envFilePath);
    this.createFileIfAbsent(options.gitignoreFilePath);

    // Configs
    this.updateGitIgnore(options.gitignoreFilePath);
    this.updatePackageJsonImports(options.packageJsonPath);
    this.updateTsconfigInclude(options.tsconfigPath);
  }

  private processWorkspace(workspace: string) {
    const workspacePath = this.joinPaths(this.currentInstallDirectory, workspace);
    this.processInstallation(workspacePath);
  }

  private processInstallation(targetDirectory: string) {
    const dispatcherFolderPath = this.joinPaths(targetDirectory, this.dispatcherNecessaryFiles.folder);
    const packageJsonPath = this.joinPaths(targetDirectory, this.dispatcherNecessaryFiles.packageJson);
    const tsconfigPath = this.joinPaths(targetDirectory, this.dispatcherNecessaryFiles.tsConfig);
    const gitignoreFilePath = this.joinPaths(targetDirectory, this.dispatcherNecessaryFiles.gitIgnore);
    const envFilePath = this.joinPaths(dispatcherFolderPath, this.dispatcherNecessaryFiles.env);

    this.createOrUpdateConfigFiles({
      dispatcherFolderPath,
      envFilePath,
      gitignoreFilePath,
      packageJsonPath,
      tsconfigPath,
    });

    this.dispatcherExecutionPath.paths.push({
      executedInstalledPath: targetDirectory,
      envFilePath,
      dispatcherPath: dispatcherFolderPath,
    });
  }

  private processRoot() {
    this.processInstallation(this.currentInstallDirectory);
  }

  private processWorkspaces() {
    this.getPackageJson()
      .getWorkspaces()
      .forEach((workspace) => {
        const packageJson: PackageJson = this.getParsedPackageJson(workspace);

        if (this.isDispatcherFound(packageJson.dependencies)) {
          this.processWorkspace(workspace);
        }

        if (this.isDispatcherFound(packageJson.devDependencies)) {
          throw new Error('CDS-TS-Dispatcher should be installed in `dependencies` not in `devDependencies`!');
        }
      });
  }

  private run(): void {
    if (this.getPackageJson().hasWorkspaces()) {
      this.processWorkspaces();
      return;
    }

    this.processRoot();
  }
}
