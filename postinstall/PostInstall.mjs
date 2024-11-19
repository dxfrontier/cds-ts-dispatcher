var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true });

// postinstall/util/GenerateEnv.ts
import { sync } from 'cross-spawn';
import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import * as path from 'path';
import { json2ts } from 'json-ts';
import { parse as parseJsonc } from 'jsonc-parser';
var GenerateEnv = class {
  static {
    __name(this, 'GenerateEnv');
  }
  dispatcherFolderPath;
  envFilePath;
  gitignoreFilePath;
  packageJsonFilePath;
  tsconfigFilePath;
  clientCwd = process.env.INIT_CWD;
  constructor() {
    this.dispatcherFolderPath = path.join(this.clientCwd, '@dispatcher');
    this.envFilePath = path.join(this.dispatcherFolderPath, 'index.ts');
    this.gitignoreFilePath = path.join(this.clientCwd, '.gitignore');
    this.packageJsonFilePath = path.join(this.clientCwd, 'package.json');
    this.tsconfigFilePath = path.join(this.clientCwd, 'tsconfig.json');
  }
  prepareDispatcherFolder() {
    this.createFolderIfAbsent(this.dispatcherFolderPath);
    this.createFileIfAbsent(this.envFilePath);
    this.createFileIfAbsent(this.gitignoreFilePath);
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
  generateEnvFile() {
    const cdsEnvOutput = this.executeShellCommand('cds', ['env', 'get']);
    const typeDefinitions = this.generateTypeDefinitions(cdsEnvOutput);
    writeFileSync(
      this.envFilePath,
      `// Type definitions for envConfig
export ${typeDefinitions}`,
    );
  }
  compileEnvFile() {
    this.executeShellCommand('npx tsc', [this.envFilePath, '--outDir', this.dispatcherFolderPath]);
  }
  addToGitignore() {
    this.appendLineIfAbsent(this.gitignoreFilePath, '@dispatcher');
  }
  updatePackageJsonImports() {
    if (existsSync(this.packageJsonFilePath)) {
      const packageJson = JSON.parse(readFileSync(this.packageJsonFilePath, 'utf8'));
      packageJson.imports = packageJson.imports || {};
      if (!packageJson.imports['#dispatcher']) {
        packageJson.imports['#dispatcher'] = './@dispatcher/index.js';
        writeFileSync(this.packageJsonFilePath, JSON.stringify(packageJson, null, 2));
      }
    }
  }
  updateTsconfigInclude() {
    if (existsSync(this.tsconfigFilePath)) {
      const tsconfigContent = readFileSync(this.tsconfigFilePath, 'utf8');
      const errors = [];
      const tsconfig = parseJsonc(tsconfigContent, errors);
      if (errors.length > 0) {
        throw new Error('tsconfig.json contains comments or invalid JSON format, which is not allowed.');
      }
      tsconfig.include = tsconfig.include || [];
      if (!tsconfig.include.includes('./@dispatcher')) {
        tsconfig.include.push('./@dispatcher');
        writeFileSync(this.tsconfigFilePath, JSON.stringify(tsconfig, null, 2));
      }
    }
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
  generateTypeDefinitions(jsonString) {
    return json2ts(jsonString, {
      rootName: 'CDS_ENV',
      prefix: '',
    });
  }
  executeShellCommand(command, args) {
    const result = sync(command, args, {
      encoding: 'utf8',
      cwd: this.clientCwd,
    });
    if (result.stderr) {
      console.error(result.stderr);
    }
    return result.stdout;
  }
  run() {
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
};

// postinstall/PostInstall.ts
var PostInstall = class PostInstall2 {
  static {
    __name(this, 'PostInstall');
  }
  GenerateEnv;
  run() {
    new GenerateEnv().run();
  }
};
new PostInstall().run();
//# sourceMappingURL=PostInstall.mjs.map
