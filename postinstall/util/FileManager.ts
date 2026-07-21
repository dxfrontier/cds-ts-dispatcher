import path from 'path';
import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

import { parse as parseJsonc, modify, applyEdits, ParseError } from 'jsonc-parser';
import { RUNTIME_STUB_CONTENT } from './runtimeStub';
import { ExecutionPaths, PackageJson } from './types';

import fg from 'fast-glob';
export class FileManager {
  // `INIT_CWD` is the directory `npm`/`yarn`/`pnpm` was invoked from. It is absent when the
  // postinstall is re-run by hand or through flows like pnpm's `approve-builds`, so fall back to the
  // current working directory instead of blowing up on `undefined`.
  private readonly currentInstallDirectory = process.env.INIT_CWD ?? process.cwd();
  private readonly dispatcherNecessaryFiles = {
    packageJson: 'package.json',
    folder: '@dispatcher',
    env: 'index.ts',
    runtimeStub: 'index.js',
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
      isDispatcherItself: (): boolean => packageJson.name === '@dxfrontier/cds-ts-dispatcher',
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
      const workspacePackageJsonPath = FileManager.joinPaths(path, this.dispatcherNecessaryFiles.packageJson);

      // A listed workspace can be absent on disk (stale entry, sparse checkout, or the phantom
      // fixture workspaces the published dispatcher package.json itself carries) — a missing one
      // must not abort the whole postinstall.
      if (!existsSync(workspacePackageJsonPath)) {
        console.warn(`⚠️  [cds-ts-dispatcher] Workspace '${workspace}' has no package.json on disk; skipped.`);
        return [];
      }

      const fields: PackageJson = {
        path,
        ...JSON.parse(readFileSync(workspacePackageJsonPath, 'utf8')),
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

  /**
   * Adds `./@dispatcher` to the tsconfig `include` list.
   *
   * `tsconfig.json` is JSONC — comments and trailing commas are legal (tsc accepts both) — so the
   * entry is appended through jsonc-parser edit operations that leave the rest of the file
   * (comments, formatting) untouched, instead of a parse → stringify rewrite. A file that cannot be
   * parsed at all is reported and skipped; it must never abort the consumer's install.
   */
  private updateTsconfigInclude(filePath: string) {
    if (!existsSync(filePath)) {
      return;
    }

    const tsconfigContent = readFileSync(filePath, 'utf8');
    const errors: ParseError[] = [];
    const tsconfig = parseJsonc(tsconfigContent, errors, { allowTrailingComma: true });

    if (errors.length > 0 || tsconfig === null || typeof tsconfig !== 'object') {
      console.warn(
        `⚠️  [cds-ts-dispatcher] Could not parse ${filePath}; add './@dispatcher' to its "include" list manually.`,
      );
      return;
    }

    const include: unknown[] = Array.isArray(tsconfig.include) ? tsconfig.include : [];

    if (include.includes('./@dispatcher')) {
      return;
    }

    const formatting = { formattingOptions: { insertSpaces: true, tabSize: 2 } };
    const edits = Array.isArray(tsconfig.include)
      ? modify(tsconfigContent, ['include', -1], './@dispatcher', formatting)
      : modify(tsconfigContent, ['include'], ['./@dispatcher'], formatting);

    writeFileSync(filePath, applyEdits(tsconfigContent, edits));
  }

  private createOrUpdateConfigFiles(options: {
    envFilePath: string;
    runtimeStubPath: string;
    gitignoreFilePath: string;
    packageJsonPath: string;
    tsconfigPath: string;
    dispatcherFolderPath: string;
  }) {
    // Folder
    this.createFolderIfAbsent(options.dispatcherFolderPath);

    // Files — the runtime stub is created here, not only on env-acquisition success:
    // `imports['#dispatcher']` targets `./@dispatcher/index.js` unconditionally, so the file must
    // exist even when acquisition later fails and `index.ts` stays empty.
    this.createFileIfAbsent(options.envFilePath);
    this.createFileIfAbsent(options.runtimeStubPath, RUNTIME_STUB_CONTENT);
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
    const runtimeStubPath = FileManager.joinPaths(dispatcherFolderPath, this.dispatcherNecessaryFiles.runtimeStub);

    this.createOrUpdateConfigFiles({
      dispatcherFolderPath,
      envFilePath,
      runtimeStubPath,
      gitignoreFilePath,
      packageJsonPath,
      tsconfigPath,
    });

    this.dispatcherExecutionPath.paths.push({
      executedInstalledPath: directory,
      envFilePath,
      runtimeStubPath,
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
    const rootPackageJsonPath = FileManager.joinPaths(
      this.currentInstallDirectory,
      this.dispatcherNecessaryFiles.packageJson,
    );

    // `npm install <pkg>` in a bare directory (or any npx-style install) has no package.json at
    // INIT_CWD; there is no consumer project to scaffold, and aborting the install over it is
    // exactly what this postinstall must never do.
    if (!existsSync(rootPackageJsonPath)) {
      console.warn(
        `⚠️  [cds-ts-dispatcher] No package.json found at ${this.currentInstallDirectory}; skipped @dispatcher setup.`,
      );
      return;
    }

    const rootPackageJson = this.getRootPackageJson();

    // Without INIT_CWD the cwd fallback can resolve to the installed package's own directory (e.g.
    // a manual `node PostInstall.js` from inside node_modules/@dxfrontier/cds-ts-dispatcher). The
    // published package.json still carries this repository's `workspaces` fixture entries, which do
    // not exist in the tarball — the dispatcher itself must never be treated as the consumer.
    if (process.env.INIT_CWD === undefined && rootPackageJson.isDispatcherItself()) {
      console.warn(
        '⚠️  [cds-ts-dispatcher] INIT_CWD is not set and the current directory is the dispatcher package itself; ' +
          'skipped @dispatcher setup. Re-run from the consumer project root.',
      );
      return;
    }

    if (rootPackageJson.hasWorkspaces()) {
      this.processWorkspaces();
      return;
    }

    this.processRoot();
  }
}
