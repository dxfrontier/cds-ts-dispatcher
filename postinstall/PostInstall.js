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
var import_fast_glob = __toESM(require('fast-glob'));
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
    return import_path.default.join(...paths);
  }
  readPackageJson(filePath) {
    return JSON.parse((0, import_fs.readFileSync)(filePath, 'utf8'));
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
    return import_fast_glob.default.isDynamicPattern(workspace) ? true : false;
  }
  getParsedPackageJson(workspace) {
    const sanitizedWorkspace = workspace.replace('*', '');
    const path2 = _FileManager.joinPaths(this.currentInstallDirectory, sanitizedWorkspace);
    const resolveRoot = /* @__PURE__ */ __name(() => {
      return _FileManager.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    }, 'resolveRoot');
    const resolveDynamicPattern = /* @__PURE__ */ __name(() => {
      const workspaces = import_fast_glob.default.globSync(`${path2}*/${this.dispatcherNecessaryFiles.packageJson}`, {
        dot: true,
      });
      const jsons = [];
      workspaces.forEach((item, index) => {
        const fields = {
          path: item.replace('package.json', ''),
          ...JSON.parse((0, import_fs.readFileSync)(workspaces[index], 'utf8')),
        };
        jsons.push(fields);
      });
      return jsons;
    }, 'resolveDynamicPattern');
    const resolveStaticWorkspaces = /* @__PURE__ */ __name(() => {
      const fields = {
        path: path2,
        ...JSON.parse(
          (0, import_fs.readFileSync)(_FileManager.joinPaths(path2, this.dispatcherNecessaryFiles.packageJson), 'utf8'),
        ),
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
  validateDispatcherDependency(dependencies) {
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
      const json = JSON.parse((0, import_fs.readFileSync)(filePath, 'utf8'));
      json.imports = json.imports || {};
      if (!json.imports['#dispatcher']) {
        json.imports['#dispatcher'] = './@dispatcher/index.js';
        (0, import_fs.writeFileSync)(filePath, JSON.stringify(json, null, 2));
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
