'use strict';
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true });
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, 'default', { value: mod, enumerable: true }) : target,
    mod,
  )
);

// postinstall/util/EnvGenerator.ts
var import_fs2 = require('fs');
var import_json_ts = require('json-ts');

// postinstall/util/FileManager.ts
var import_path = __toESM(require('path'));
var import_fs = require('fs');
var import_jsonc_parser = require('jsonc-parser');
var FileManager = class {
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
    return import_path.default.join(...paths);
  }
  getPackageJson() {
    const parsedPackage = this.getParsedPackageJson();
    return {
      hasWorkspaces: /* @__PURE__ */ __name(() => (parsedPackage.workspaces?.length ?? 0) > 0, 'hasWorkspaces'),
      getWorkspaces: /* @__PURE__ */ __name(() => parsedPackage.workspaces, 'getWorkspaces'),
    };
  }
  getParsedPackageJson(workspace) {
    let packageJsonPath;
    if (!workspace) {
      packageJsonPath = this.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    } else if (import_path.default.isAbsolute(workspace)) {
      packageJsonPath = workspace;
    } else {
      packageJsonPath = this.joinPaths(
        this.currentInstallDirectory,
        workspace,
        this.dispatcherNecessaryFiles.packageJson,
      );
    }
    return JSON.parse((0, import_fs.readFileSync)(packageJsonPath, 'utf8'));
  }
  createFolderIfAbsent(folderPath) {
    if (!(0, import_fs.existsSync)(folderPath)) {
      (0, import_fs.mkdirSync)(folderPath, {
        recursive: true,
      });
    }
  }
  createFileIfAbsent(filePath, defaultContent = '') {
    if (!(0, import_fs.existsSync)(filePath)) {
      (0, import_fs.writeFileSync)(filePath, defaultContent);
    }
  }
  joinPaths(...paths) {
    return import_path.default.join(...paths);
  }
  isDispatcherFound(dependencies) {
    return dependencies && dependencies['@dxfrontier/cds-ts-dispatcher'] !== void 0;
  }
  appendLineIfAbsent(filePath, line) {
    const content = (0, import_fs.readFileSync)(filePath, 'utf8');
    if (!content.includes(line)) {
      (0, import_fs.appendFileSync)(
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
    if ((0, import_fs.existsSync)(filePath)) {
      const packageJson = this.getParsedPackageJson(filePath);
      packageJson.imports = packageJson.imports || {};
      if (!packageJson.imports['#dispatcher']) {
        packageJson.imports['#dispatcher'] = './@dispatcher/index.js';
        (0, import_fs.writeFileSync)(filePath, JSON.stringify(packageJson, null, 2));
      }
    }
  }
  updateTsconfigInclude(filePath) {
    if ((0, import_fs.existsSync)(filePath)) {
      const tsconfigContent = (0, import_fs.readFileSync)(filePath, 'utf8');
      const errors = [];
      const tsconfig = (0, import_jsonc_parser.parse)(tsconfigContent, errors);
      if (errors.length > 0) {
        throw new Error('tsconfig.json contains comments or invalid JSON format !');
      }
      tsconfig.include = tsconfig.include || [];
      if (!tsconfig.include.includes('./@dispatcher')) {
        tsconfig.include.push('./@dispatcher');
        (0, import_fs.writeFileSync)(filePath, JSON.stringify(tsconfig, null, 2));
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
  // private processWorkspace(workspace: string) {
  //   const workspacePath = this.joinPaths(this.currentInstallDirectory, workspace);
  //   const dispatcherFolderPath = this.joinPaths(workspacePath, this.dispatcherNecessaryFiles.folder);
  //   const packageJsonPath = this.joinPaths(workspacePath, this.dispatcherNecessaryFiles.packageJson);
  //   const tsconfigPath = this.joinPaths(workspacePath, this.dispatcherNecessaryFiles.tsConfig);
  //   const gitignoreFilePath = this.joinPaths(workspacePath, this.dispatcherNecessaryFiles.gitIgnore);
  //   const envFilePath = this.joinPaths(dispatcherFolderPath, this.dispatcherNecessaryFiles.env);
  //   this.createOrUpdateConfigFiles({
  //     dispatcherFolderPath,
  //     envFilePath,
  //     gitignoreFilePath,
  //     packageJsonPath,
  //     tsconfigPath,
  //   });
  //   this.dispatcherExecutionPath.paths.push({
  //     executedInstalledPath: workspacePath,
  //     envFilePath,
  //     dispatcherPath: dispatcherFolderPath,
  //   });
  // }
  processWorkspaces() {
    this.getPackageJson()
      .getWorkspaces()
      .forEach((workspace) => {
        const packageJson = this.getParsedPackageJson(workspace);
        if (this.isDispatcherFound(packageJson.dependencies)) {
          this.processWorkspace(workspace);
        }
        if (this.isDispatcherFound(packageJson.devDependencies)) {
          throw new Error('CDS-TS-Dispatcher should be installed in `dependencies` not in `devDependencies`!');
        }
      });
  }
  // private processRoot() {
  //   const dispatcherFolderPath = this.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.folder);
  //   const packageJsonPath = this.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
  //   const tsconfigPath = this.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.tsConfig);
  //   const gitignoreFilePath = this.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.gitIgnore);
  //   const envFilePath = this.joinPaths(dispatcherFolderPath, this.dispatcherNecessaryFiles.env);
  //   this.createOrUpdateConfigFiles({
  //     dispatcherFolderPath,
  //     envFilePath,
  //     gitignoreFilePath,
  //     packageJsonPath,
  //     tsconfigPath,
  //   });
  //   this.dispatcherExecutionPath.paths.push({
  //     executedInstalledPath: this.currentInstallDirectory,
  //     envFilePath,
  //     dispatcherPath: dispatcherFolderPath,
  //   });
  // }
  processInstallation(targetDirectory) {
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
  processWorkspace(workspace) {
    const workspacePath = this.joinPaths(this.currentInstallDirectory, workspace);
    this.processInstallation(workspacePath);
  }
  processRoot() {
    this.processInstallation(this.currentInstallDirectory);
  }
  run() {
    if (this.getPackageJson().hasWorkspaces()) {
      this.processWorkspaces();
      return;
    }
    this.processRoot();
  }
};

// postinstall/util/ShellCommander.ts
var import_cross_spawn = require('cross-spawn');
var ShellCommander = class {
  static {
    __name(this, 'ShellCommander');
  }
  constructor() {}
  executeCommand(command, args, currentExecutionPath) {
    const result = (0, import_cross_spawn.sync)(command, args, {
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
    return (0, import_json_ts.json2ts)(jsonString, {
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
    (0, import_fs2.writeFileSync)(filePath, fileContent);
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
//# sourceMappingURL=PostInstall.js.map
