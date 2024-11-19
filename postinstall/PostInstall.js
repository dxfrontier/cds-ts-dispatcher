"use strict"; function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } var _class;var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// postinstall/util/GenerateEnv.ts
var _crossspawn = require('cross-spawn');
var _fs = require('fs');
var _path = require('path'); var path = _interopRequireWildcard(_path);
var _jsonts = require('json-ts');
var _jsoncparser = require('jsonc-parser');
var GenerateEnv = (_class = class {
  static {
    __name(this, "GenerateEnv");
  }
  
  
  
  
  
  __init() {this.clientCwd = process.env.INIT_CWD}
  constructor() {;_class.prototype.__init.call(this);
    this.dispatcherFolderPath = path.join(this.clientCwd, "@dispatcher");
    this.envFilePath = path.join(this.dispatcherFolderPath, "index.ts");
    this.gitignoreFilePath = path.join(this.clientCwd, ".gitignore");
    this.packageJsonFilePath = path.join(this.clientCwd, "package.json");
    this.tsconfigFilePath = path.join(this.clientCwd, "tsconfig.json");
  }
  prepareDispatcherFolder() {
    this.createFolderIfAbsent(this.dispatcherFolderPath);
    this.createFileIfAbsent(this.envFilePath);
    this.createFileIfAbsent(this.gitignoreFilePath);
  }
  createFolderIfAbsent(folderPath) {
    if (!_fs.existsSync.call(void 0, folderPath)) {
      _fs.mkdirSync.call(void 0, folderPath, {
        recursive: true
      });
    }
  }
  createFileIfAbsent(filePath, defaultContent = "") {
    if (!_fs.existsSync.call(void 0, filePath)) {
      _fs.writeFileSync.call(void 0, filePath, defaultContent);
    }
  }
  generateEnvFile() {
    const cdsEnvOutput = this.executeShellCommand("cds", [
      "env",
      "get"
    ]);
    const typeDefinitions = this.generateTypeDefinitions(cdsEnvOutput);
    _fs.writeFileSync.call(void 0, this.envFilePath, `// Type definitions for envConfig
export ${typeDefinitions}`);
  }
  compileEnvFile() {
    this.executeShellCommand("npx tsc", [
      this.envFilePath,
      "--outDir",
      this.dispatcherFolderPath
    ]);
  }
  addToGitignore() {
    this.appendLineIfAbsent(this.gitignoreFilePath, "@dispatcher");
  }
  updatePackageJsonImports() {
    if (_fs.existsSync.call(void 0, this.packageJsonFilePath)) {
      const packageJson = JSON.parse(_fs.readFileSync.call(void 0, this.packageJsonFilePath, "utf8"));
      packageJson.imports = packageJson.imports || {};
      if (!packageJson.imports["#dispatcher"]) {
        packageJson.imports["#dispatcher"] = "./@dispatcher/index.js";
        _fs.writeFileSync.call(void 0, this.packageJsonFilePath, JSON.stringify(packageJson, null, 2));
      }
    }
  }
  updateTsconfigInclude() {
    if (_fs.existsSync.call(void 0, this.tsconfigFilePath)) {
      const tsconfigContent = _fs.readFileSync.call(void 0, this.tsconfigFilePath, "utf8");
      const errors = [];
      const tsconfig = _jsoncparser.parse.call(void 0, tsconfigContent, errors);
      if (errors.length > 0) {
        throw new Error("tsconfig.json contains comments or invalid JSON format, which is not allowed.");
      }
      tsconfig.include = tsconfig.include || [];
      if (!tsconfig.include.includes("./@dispatcher")) {
        tsconfig.include.push("./@dispatcher");
        _fs.writeFileSync.call(void 0, this.tsconfigFilePath, JSON.stringify(tsconfig, null, 2));
      }
    }
  }
  appendLineIfAbsent(filePath, line) {
    const content = _fs.readFileSync.call(void 0, filePath, "utf8");
    if (!content.includes(line)) {
      _fs.appendFileSync.call(void 0, filePath, `
${line}
`);
    }
  }
  generateTypeDefinitions(jsonString) {
    return _jsonts.json2ts.call(void 0, jsonString, {
      rootName: "CDS_ENV",
      prefix: ""
    });
  }
  executeShellCommand(command, args) {
    const result = _crossspawn.sync.call(void 0, command, args, {
      encoding: "utf8",
      cwd: this.clientCwd
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
      console.error("Error during post-install steps:", error);
      process.exit(1);
    }
  }
}, _class);

// postinstall/PostInstall.ts
var PostInstall = class PostInstall2 {
  static {
    __name(this, "PostInstall");
  }
  
  run() {
    new GenerateEnv().run();
  }
};
new PostInstall().run();
//# sourceMappingURL=PostInstall.js.map