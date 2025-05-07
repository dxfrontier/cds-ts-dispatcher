var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true });

// postinstall/util/EnvGenerator.ts
import { writeFileSync as writeFileSync2 } from 'fs';
import { json2ts } from 'json-ts';

// postinstall/util/FileManager.ts
import path from 'path';
import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { parse as parseJsonc } from 'jsonc-parser';
import fg from 'fast-glob';
var FileManager = class _FileManager {
  static {
    __name(this, 'FileManager');
  }
  currentInstallDirectory = process.env.INIT_CWD;
  dispatcherNecessaryFiles = {
    packageJson: 'package.json',
    folder: '@dispatcher',
    env: 'index.ts',
    gitIgnore: '.gitignore',
    tsConfig: 'tsconfig.json',
  };
  dispatcherExecutionPath = {
    paths: [],
  };
  constructor() {
    this.run();
  }
  static joinPaths(...paths) {
    return path.join(...paths);
  }
  readPackageJson(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }
  getRootPackageJson() {
    const path2 = _FileManager.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    const packageJson = this.readPackageJson(path2);
    return {
      hasWorkspaces: /* @__PURE__ */ __name(() => (packageJson.workspaces?.length ?? 0) > 0, 'hasWorkspaces'),
      getWorkspaces: /* @__PURE__ */ __name(() => packageJson.workspaces, 'getWorkspaces'),
    };
  }
  isWorkspaceDynamicPattern(workspace) {
    return fg.isDynamicPattern(workspace) ? true : false;
  }
  getParsedPackageJson(workspace) {
    const sanitizedWorkspace = workspace.replace('*', '');
    const path2 = _FileManager.joinPaths(this.currentInstallDirectory, sanitizedWorkspace);
    const resolveRoot = /* @__PURE__ */ __name(() => {
      return _FileManager.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    }, 'resolveRoot');
    const resolveDynamicPattern = /* @__PURE__ */ __name(() => {
      const workspaces = fg.globSync(`${path2}*/${this.dispatcherNecessaryFiles.packageJson}`, {
        dot: true,
      });
      const jsons = [];
      workspaces.forEach((item, index) => {
        const fields = {
          path: item.replace('package.json', ''),
          ...JSON.parse(readFileSync(workspaces[index], 'utf8')),
        };
        jsons.push(fields);
      });
      return jsons;
    }, 'resolveDynamicPattern');
    const resolveStaticWorkspaces = /* @__PURE__ */ __name(() => {
      const fields = {
        path: path2,
        ...JSON.parse(readFileSync(_FileManager.joinPaths(path2, this.dispatcherNecessaryFiles.packageJson), 'utf8')),
      };
      return [fields];
    }, 'resolveStaticWorkspaces');
    return {
      resolveDynamicPattern,
      resolveStaticWorkspaces,
      resolveRoot,
    };
  }
  createFolderIfAbsent(folderPath) {
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, {
        recursive: true,
      });
    }
  }
  createFileIfAbsent(filePath, defaultContent = '') {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, defaultContent);
    }
  }
  validateDispatcherDependency(dependencies) {
    return dependencies && dependencies['@dxfrontier/cds-ts-dispatcher'] !== void 0;
  }
  appendLineIfAbsent(filePath, line) {
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(line)) {
      appendFileSync(
        filePath,
        `
${line}
`,
      );
    }
  }
  updateGitIgnore(filePath) {
    this.appendLineIfAbsent(filePath, this.dispatcherNecessaryFiles.folder);
  }
  updatePackageJsonImports(filePath) {
    if (existsSync(filePath)) {
      const json = JSON.parse(readFileSync(filePath, 'utf8'));
      json.imports = json.imports || {};
      if (!json.imports['#dispatcher']) {
        json.imports['#dispatcher'] = './@dispatcher/index.js';
        writeFileSync(filePath, JSON.stringify(json, null, 2));
      }
    }
  }
  updateTsconfigInclude(filePath) {
    if (existsSync(filePath)) {
      const tsconfigContent = readFileSync(filePath, 'utf8');
      const errors = [];
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
  createOrUpdateConfigFiles(options) {
    this.createFolderIfAbsent(options.dispatcherFolderPath);
    this.createFileIfAbsent(options.envFilePath);
    this.createFileIfAbsent(options.gitignoreFilePath);
    this.updateGitIgnore(options.gitignoreFilePath);
    this.updatePackageJsonImports(options.packageJsonPath);
    this.updateTsconfigInclude(options.tsconfigPath);
  }
  processInstallation(directory) {
    const dispatcherFolderPath = _FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.folder);
    const packageJsonPath = _FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.packageJson);
    const tsconfigPath = _FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.tsConfig);
    const gitignoreFilePath = _FileManager.joinPaths(directory, this.dispatcherNecessaryFiles.gitIgnore);
    const envFilePath = _FileManager.joinPaths(dispatcherFolderPath, this.dispatcherNecessaryFiles.env);
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
  processRoot() {
    this.processInstallation(this.currentInstallDirectory);
  }
  processWorkspaces() {
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
            : this.processInstallation(_FileManager.joinPaths(this.currentInstallDirectory, workspace));
        }
      });
    });
  }
  run() {
    if (this.getRootPackageJson().hasWorkspaces()) {
      this.processWorkspaces();
      return;
    }
    this.processRoot();
  }
};

// postinstall/util/ShellCommander.ts
import { sync } from 'cross-spawn';
var ShellCommander = class {
  static {
    __name(this, 'ShellCommander');
  }
  constructor() {}
  executeCommand(command, args, currentExecutionPath) {
    const result = sync(command, args, {
      encoding: 'utf8',
      cwd: currentExecutionPath,
    });
    if (result.error && result.stderr) {
      throw new Error(result.stderr);
    }
    return result.stdout;
  }
  compileEnvFile(envFilePath, dispatcherFolderPath) {
    this.executeCommand('npx tsc', [envFilePath, '--outDir', dispatcherFolderPath]);
  }
};

// postinstall/util/EnvGenerator.ts
var EnvGenerator = class {
  static {
    __name(this, 'EnvGenerator');
  }
  fileManager = new FileManager();
  shellCommander = new ShellCommander();
  generateTypeDefinitions(jsonString) {
    return json2ts(jsonString, {
      rootName: 'CDS_ENV',
      prefix: '',
    });
  }
  getCdsEnvOutput(path2) {
    return this.shellCommander.executeCommand('cds', ['env', 'get'], path2);
  }
  createEnvFile(filePath, envConfig) {
    const typeDefinitions = this.generateTypeDefinitions(envConfig);
    const fileContent = `// Type definitions for envConfig
export ${typeDefinitions}`;
    writeFileSync2(filePath, fileContent);
  }
  compileEnvFile(envFilePath, dispatcherPath) {
    this.shellCommander.compileEnvFile(envFilePath, dispatcherPath);
  }
  generateEnvFiles() {
    this.fileManager.dispatcherExecutionPath.paths.forEach(({ executedInstalledPath, envFilePath, dispatcherPath }) => {
      const output = this.getCdsEnvOutput(executedInstalledPath);
      this.createEnvFile(envFilePath, output);
      this.compileEnvFile(envFilePath, dispatcherPath);
    });
  }
  run() {
    try {
      this.generateEnvFiles();
    } catch (error) {
      console.error('Error generating environment files:', error);
      process.exit(1);
    }
  }
};

// postinstall/PostInstall.ts
var PostInstall = class PostInstall2 {
  static {
    __name(this, 'PostInstall');
  }
  GenerateEnv;
  run() {
    new EnvGenerator().run();
  }
};
new PostInstall().run();
//# sourceMappingURL=PostInstall.mjs.map
