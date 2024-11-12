"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// postinstall/util/GenerateEnv.ts
var import_child_process = require("child_process");
var import_fs = require("fs");
var path = __toESM(require("path"));
var import_json_ts = require("json-ts");
var import_jsonc_parser = require("jsonc-parser");
var GenerateEnv = class {
  static {
    __name(this, "GenerateEnv");
  }
  dispatcherFolderPath;
  envFilePath;
  gitignoreFilePath;
  packageJsonFilePath;
  tsconfigFilePath;
  clientCwd = process.env.INIT_CWD;
  constructor() {
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
    if (!(0, import_fs.existsSync)(folderPath)) {
      (0, import_fs.mkdirSync)(folderPath, {
        recursive: true
      });
    }
  }
  createFileIfAbsent(filePath, defaultContent = "") {
    if (!(0, import_fs.existsSync)(filePath)) {
      (0, import_fs.writeFileSync)(filePath, defaultContent);
    }
  }
  generateEnvFile() {
    const cdsEnvOutput = this.executeShellCommand("cds", [
      "env",
      "get"
    ]);
    const typeDefinitions = this.generateTypeDefinitions(cdsEnvOutput);
    (0, import_fs.writeFileSync)(this.envFilePath, `// Type definitions for envConfig
export ${typeDefinitions}`);
  }
  compileEnvFile() {
    this.executeShellCommand("tsc", [
      this.envFilePath,
      "--outDir",
      this.dispatcherFolderPath
    ]);
  }
  addToGitignore() {
    this.appendLineIfAbsent(this.gitignoreFilePath, "@dispatcher");
  }
  updatePackageJsonImports() {
    if (!(0, import_fs.existsSync)(this.packageJsonFilePath)) {
      throw new Error("Could not find package.json");
    }
    const packageJson = JSON.parse((0, import_fs.readFileSync)(this.packageJsonFilePath, "utf8"));
    packageJson.imports = packageJson.imports || {};
    if (!packageJson.imports["#dispatcher"]) {
      packageJson.imports["#dispatcher"] = "./@dispatcher/index.js";
      (0, import_fs.writeFileSync)(this.packageJsonFilePath, JSON.stringify(packageJson, null, 2));
    }
  }
  updateTsconfigInclude() {
    if (!(0, import_fs.existsSync)(this.tsconfigFilePath)) {
      throw new Error("Could not find tsconfig.json");
    }
    const tsconfigContent = (0, import_fs.readFileSync)(this.tsconfigFilePath, "utf8");
    const errors = [];
    const tsconfig = (0, import_jsonc_parser.parse)(tsconfigContent, errors);
    if (errors.length > 0) {
      throw new Error("tsconfig.json contains comments or invalid JSON format, which is not allowed.");
    }
    tsconfig.include = tsconfig.include || [];
    if (!tsconfig.include.includes("./@dispatcher")) {
      tsconfig.include.push("./@dispatcher");
      (0, import_fs.writeFileSync)(this.tsconfigFilePath, JSON.stringify(tsconfig, null, 2));
    }
  }
  appendLineIfAbsent(filePath, line) {
    const content = (0, import_fs.readFileSync)(filePath, "utf8");
    if (!content.includes(line)) {
      (0, import_fs.appendFileSync)(filePath, `
${line}
`);
    }
  }
  generateTypeDefinitions(jsonString) {
    return (0, import_json_ts.json2ts)(jsonString, {
      rootName: "CDS_ENV",
      prefix: ""
    });
  }
  executeShellCommand(command, args) {
    const result = (0, import_child_process.spawnSync)(command, args, {
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
};

// postinstall/PostInstall.ts
var PostInstall = class PostInstall2 {
  static {
    __name(this, "PostInstall");
  }
  GenerateEnv;
  run() {
    new GenerateEnv().run();
  }
};
new PostInstall().run();
