var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true });

// postinstall/util/EnvGenerator.ts
import { writeFileSync as writeFileSync2 } from 'fs';
import { json2ts } from 'json-ts';

// postinstall/util/FileManager.ts
import path from 'path';
import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { parse as parseJsonc } from 'jsonc-parser';
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
    return path.join(...paths);
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
    } else if (path.isAbsolute(workspace)) {
      packageJsonPath = workspace;
    } else {
      packageJsonPath = this.joinPaths(
        this.currentInstallDirectory,
        workspace,
        this.dispatcherNecessaryFiles.packageJson,
      );
    }
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
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
  joinPaths(...paths) {
    return path.join(...paths);
  }
  isDispatcherFound(dependencies) {
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
      const packageJson = this.getParsedPackageJson(filePath);
      packageJson.imports = packageJson.imports || {};
      if (!packageJson.imports['#dispatcher']) {
        packageJson.imports['#dispatcher'] = './@dispatcher/index.js';
        writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
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
  processWorkspace(workspace) {
    const workspacePath = this.joinPaths(this.currentInstallDirectory, workspace);
    this.processInstallation(workspacePath);
  }
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
  processRoot() {
    this.processInstallation(this.currentInstallDirectory);
  }
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
  run() {
    if (this.getPackageJson().hasWorkspaces()) {
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
