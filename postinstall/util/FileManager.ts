import path from 'path';
import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

import { parse as parseJsonc, ParseError } from 'jsonc-parser';
import { ExecutionPaths, PackageJson } from './types';

import fg from 'fast-glob';
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

  private readPackageJson(filePath: string): PackageJson {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }

  private getRootPackageJson() {
    const path = FileManager.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    const packageJson: PackageJson = this.readPackageJson(path);

    return {
      hasWorkspaces: (): boolean => (packageJson.workspaces?.length ?? 0) > 0,
      getWorkspaces: (): string[] => packageJson.workspaces!,
    };
  }

  private isWorkspaceDynamicPattern(workspace: string): boolean {
    return fg.isDynamicPattern(workspace) ? true : false;
  }

  private getParsedPackageJson(workspace: string) {
    // path join has an issue with '*' and I am replacing it with empty '' and adding later when is needed
    const sanitizedWorkspace = workspace.replace('*', '');
    const path = FileManager.joinPaths(this.currentInstallDirectory, sanitizedWorkspace);

    /**
     * When the package.json is on the root level, meaning it doesn't have workspaces
     */
    const resolveRoot = (): string => {
      return FileManager.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    };

    /**
     * When the package.json has workspaces with the '*'
     * @example
     * "workspaces": [
     *   "./services/*"
     * ]
     */
    const resolveDynamicPattern = (): PackageJson[] => {
      const workspaces = fg.globSync(`${path}*/${this.dispatcherNecessaryFiles.packageJson}`, { dot: true });
      const jsons: PackageJson[] = [];

      workspaces.forEach((item, index) => {
        const fields: PackageJson = {
          path: item.replace('package.json', ''),
          ...JSON.parse(readFileSync(workspaces[index], 'utf8')),
        };

        jsons.push(fields);
      });

      return jsons;
    };

    /**
     * When the package.json has workspaces with the '*'
     * @example
     * "workspaces": [
     *   "./services/admin",
     *   "./services/api"
     * ]
     */
    const resolveStaticWorkspaces = (): PackageJson[] => {
      const fields: PackageJson = {
        path,
        ...JSON.parse(readFileSync(FileManager.joinPaths(path, this.dispatcherNecessaryFiles.packageJson), 'utf8')),
      };

      return [fields];
    };

    return {
      resolveDynamicPattern,
      resolveStaticWorkspaces,
      resolveRoot,
    };
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

  private validateDispatcherDependency(dependencies: Record<string, string>): boolean {
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
      const json: PackageJson = JSON.parse(readFileSync(filePath, 'utf8'));

      json.imports = json.imports || {};

      if (!json.imports['#dispatcher']) {
        json.imports['#dispatcher'] = './@dispatcher/index.js';
        writeFileSync(filePath, JSON.stringify(json, null, 2));
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

  private processInstallation(directory: string) {
    const dispatcherFolderPath = FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.folder);
    const packageJsonPath = FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.packageJson);
    const tsconfigPath = FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.tsConfig);
    const gitignoreFilePath = FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.gitIgnore);
    const envFilePath = FileManager.joinPaths(dispatcherFolderPath, this.dispatcherNecessaryFiles.env);

    this.createOrUpdateConfigFiles({
      dispatcherFolderPath,
      envFilePath,
      gitignoreFilePath,
      packageJsonPath,
      tsconfigPath,
    });

    this.dispatcherExecutionPath.paths.push({
      executedInstalledPath: directory,
      envFilePath,
      dispatcherPath: dispatcherFolderPath,
    });
  }

  private processRoot() {
    this.processInstallation(this.currentInstallDirectory);
  }

  private processWorkspaces() {
    const workspaces = this.getRootPackageJson().getWorkspaces();

    workspaces.forEach((workspace) => {
      const isDynamic = this.isWorkspaceDynamicPattern(workspace);
      const packages = isDynamic
        ? this.getParsedPackageJson(workspace).resolveDynamicPattern()
        : this.getParsedPackageJson(workspace).resolveStaticWorkspaces();

      packages.forEach((pkg) => {
        if (this.validateDispatcherDependency(pkg.dependencies)) {
          isDynamic
            ? this.processInstallation(pkg.path)
            : this.processInstallation(FileManager.joinPaths(this.currentInstallDirectory, workspace));
        }
      });
    });
  }

  private run(): void {
    if (this.getRootPackageJson().hasWorkspaces()) {
      this.processWorkspaces();
      return;
    }

    this.processRoot();
  }
}
