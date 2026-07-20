var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// postinstall/util/EnvGenerator.ts
import { writeFileSync as writeFileSync2 } from "fs";
import { json2ts } from "json-ts";

// postinstall/util/FileManager.ts
import path from "path";
import { existsSync, appendFileSync, writeFileSync, mkdirSync, readFileSync } from "fs";
import { parse as parseJsonc } from "jsonc-parser";
import fg from "fast-glob";
var FileManager = class _FileManager {
  static {
    __name(this, "FileManager");
  }
  currentInstallDirectory = process.env.INIT_CWD;
  dispatcherNecessaryFiles = {
    packageJson: "package.json",
    folder: "@dispatcher",
    env: "index.ts",
    gitIgnore: ".gitignore",
    tsConfig: "tsconfig.json"
  };
  dispatcherExecutionPath = {
    paths: []
  };
  constructor() {
    this.run();
  }
  static joinPaths(...paths) {
    return path.join(...paths);
  }
  readPackageJson(filePath) {
    return JSON.parse(readFileSync(filePath, "utf8"));
  }
  getRootPackageJson() {
    const path2 = _FileManager.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    const packageJson = this.readPackageJson(path2);
    return {
      hasWorkspaces: /* @__PURE__ */ __name(() => (packageJson.workspaces?.length ?? 0) > 0, "hasWorkspaces"),
      getWorkspaces: /* @__PURE__ */ __name(() => packageJson.workspaces, "getWorkspaces")
    };
  }
  isWorkspaceDynamicPattern(workspace) {
    return fg.isDynamicPattern(workspace) ? true : false;
  }
  getParsedPackageJson(workspace) {
    const sanitizedWorkspace = workspace.replace("*", "");
    const path2 = _FileManager.joinPaths(this.currentInstallDirectory, sanitizedWorkspace);
    const resolveRoot = /* @__PURE__ */ __name(() => {
      return _FileManager.joinPaths(this.currentInstallDirectory, this.dispatcherNecessaryFiles.packageJson);
    }, "resolveRoot");
    const resolveDynamicPattern = /* @__PURE__ */ __name(() => {
      const workspaces = fg.globSync(`${path2}*/${this.dispatcherNecessaryFiles.packageJson}`, {
        dot: true
      });
      const jsons = [];
      workspaces.forEach((item, index) => {
        const fields = {
          path: item.replace("package.json", ""),
          ...JSON.parse(readFileSync(workspaces[index], "utf8"))
        };
        jsons.push(fields);
      });
      return jsons;
    }, "resolveDynamicPattern");
    const resolveStaticWorkspaces = /* @__PURE__ */ __name(() => {
      const fields = {
        path: path2,
        ...JSON.parse(readFileSync(_FileManager.joinPaths(path2, this.dispatcherNecessaryFiles.packageJson), "utf8"))
      };
      return [
        fields
      ];
    }, "resolveStaticWorkspaces");
    return {
      resolveDynamicPattern,
      resolveStaticWorkspaces,
      resolveRoot
    };
  }
  createFolderIfAbsent(folderPath) {
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, {
        recursive: true
      });
    }
  }
  createFileIfAbsent(filePath, defaultContent = "") {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, defaultContent);
    }
  }
  validateDispatcherDependency(dependencies) {
    return dependencies && dependencies["@dxfrontier/cds-ts-dispatcher"] !== void 0;
  }
  appendLineIfAbsent(filePath, line) {
    const content = readFileSync(filePath, "utf8");
    if (!content.includes(line)) {
      appendFileSync(filePath, `
${line}
`);
    }
  }
  updateGitIgnore(filePath) {
    this.appendLineIfAbsent(filePath, this.dispatcherNecessaryFiles.folder);
  }
  updatePackageJsonImports(filePath) {
    if (existsSync(filePath)) {
      const json = JSON.parse(readFileSync(filePath, "utf8"));
      json.imports = json.imports || {};
      if (!json.imports["#dispatcher"]) {
        json.imports["#dispatcher"] = "./@dispatcher/index.js";
        writeFileSync(filePath, JSON.stringify(json, null, 2));
      }
    }
  }
  updateTsconfigInclude(filePath) {
    if (existsSync(filePath)) {
      const tsconfigContent = readFileSync(filePath, "utf8");
      const errors = [];
      const tsconfig = parseJsonc(tsconfigContent, errors);
      if (errors.length > 0) {
        throw new Error("tsconfig.json contains comments or invalid JSON format !");
      }
      tsconfig.include = tsconfig.include || [];
      if (!tsconfig.include.includes("./@dispatcher")) {
        tsconfig.include.push("./@dispatcher");
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
      tsconfigPath
    });
    this.dispatcherExecutionPath.paths.push({
      executedInstalledPath: directory,
      envFilePath,
      dispatcherPath: dispatcherFolderPath
    });
  }
  processRoot() {
    this.processInstallation(this.currentInstallDirectory);
  }
  processWorkspaces() {
    const workspaces = this.getRootPackageJson().getWorkspaces();
    workspaces.forEach((workspace) => {
      const isDynamic = this.isWorkspaceDynamicPattern(workspace);
      const packages = isDynamic ? this.getParsedPackageJson(workspace).resolveDynamicPattern() : this.getParsedPackageJson(workspace).resolveStaticWorkspaces();
      packages.forEach((pkg) => {
        if (this.validateDispatcherDependency(pkg.dependencies)) {
          isDynamic ? this.processInstallation(pkg.path) : this.processInstallation(_FileManager.joinPaths(this.currentInstallDirectory, workspace));
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
import { sync } from "cross-spawn";
var ShellCommander = class {
  static {
    __name(this, "ShellCommander");
  }
  /**
  * Executes a command synchronously and returns a structured, non-throwing result.
  *
  * A postinstall script must never abort a consumer's `npm install`, so instead of throwing
  * this surfaces the exit status, `stdout` and `stderr` for the caller to inspect and decide upon.
  */
  executeCommand(command, args, currentExecutionPath) {
    const result = sync(command, args, {
      encoding: "utf8",
      cwd: currentExecutionPath
    });
    return {
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      failed: result.error != null || (result.status ?? 1) !== 0
    };
  }
  compileEnvFile(envFilePath, dispatcherFolderPath) {
    return this.executeCommand("npx tsc", [
      envFilePath,
      "--outDir",
      dispatcherFolderPath
    ]);
  }
};

// postinstall/util/EnvGenerator.ts
var EnvGenerator = class {
  static {
    __name(this, "EnvGenerator");
  }
  fileManager;
  shellCommander;
  // Matches CSI color sequences: ESC (0x1b) followed by `[<digits/;>m`, e.g. the `\x1b[32m` that
  // `cds` emits around string values when it renders with colors instead of plain JSON.
  ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
  constructor() {
    this.fileManager = new FileManager();
    this.shellCommander = new ShellCommander();
  }
  generateTypeDefinitions(jsonString) {
    return json2ts(jsonString, {
      rootName: "CDS_ENV",
      prefix: ""
    });
  }
  /**
  * Runs `cds env get --json` inside the given project.
  *
  * The explicit `--json` flag is essential: without it `cds` inspects the environment and, when
  * it detects a CI provider (e.g. `GITHUB_ACTIONS`), switches to a colored `util.inspect` rendering
  * (`Config { _context: 'cds', ... }` with ANSI escape codes) instead of plain JSON. That non-JSON,
  * lossy payload is exactly what makes json2ts crash during CI installs, and it cannot be recovered
  * by post-processing. Forcing `--json` yields the same clean, complete output on every platform.
  */
  getCdsEnvOutput(path2) {
    return this.shellCommander.executeCommand("cds", [
      "env",
      "get",
      "--json"
    ], path2);
  }
  /**
  * Strips ANSI escape sequences and extracts the JSON object literal, from the first `{` to the
  * last `}`. Acts as a safety net so that any residual decoration around the payload (banners,
  * colors, notices printed by older `cds` versions) never reaches json2ts.
  *
  * @returns the sanitized object literal, or `null` when no object literal can be found.
  */
  extractEnvObject(raw) {
    const withoutAnsi = raw.replace(this.ansiPattern, "");
    const start = withoutAnsi.indexOf("{");
    const end = withoutAnsi.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      return null;
    }
    return withoutAnsi.slice(start, end + 1);
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
  /**
  * Loudly reports an execution path that could not be processed, then lets the caller continue.
  * The `@dispatcher` folder is a convenience that backs the typed `#dispatcher` import; a failure
  * here must never abort the consumer's `npm install`.
  */
  skipWithWarning(path2, reason, rawSample) {
    console.warn([
      "",
      `\u26A0\uFE0F  [cds-ts-dispatcher] Skipped @dispatcher env generation for: ${path2}`,
      `    Reason: ${reason}`,
      `    Raw \`cds env get\` output (first 200 chars): ${JSON.stringify(rawSample.slice(0, 200))}`,
      "    The library still works; regenerate later by reinstalling once `cds` is available.",
      ""
    ].join("\n"));
  }
  /**
  * Generates the env file for a single execution path.
  *
  * @returns `true` when the file was generated, `false` when the path was skipped.
  */
  generateEnvFileForPath(paths) {
    const { executedInstalledPath, envFilePath, dispatcherPath } = paths;
    const result = this.getCdsEnvOutput(executedInstalledPath);
    if (result.failed || result.stdout.trim().length === 0) {
      const reason = result.failed ? `\`cds env get\` failed (exit code ${result.status}). ${result.stderr.trim()}`.trim() : "`cds env get` produced empty output.";
      this.skipWithWarning(executedInstalledPath, reason, result.stdout || result.stderr);
      return false;
    }
    const envObject = this.extractEnvObject(result.stdout);
    if (envObject === null) {
      this.skipWithWarning(executedInstalledPath, "no JSON object could be extracted from the output.", result.stdout);
      return false;
    }
    this.createEnvFile(envFilePath, envObject);
    this.compileEnvFile(envFilePath, dispatcherPath);
    return true;
  }
  generateEnvFiles() {
    const { paths } = this.fileManager.dispatcherExecutionPath;
    let generated = 0;
    paths.forEach((path2) => {
      try {
        if (this.generateEnvFileForPath(path2)) {
          generated += 1;
        }
      } catch (error) {
        this.skipWithWarning(path2.executedInstalledPath, `unexpected error: ${error.message}`, "");
      }
    });
    if (paths.length > 0 && generated === 0) {
      console.warn("\u26A0\uFE0F  [cds-ts-dispatcher] No @dispatcher env files could be generated. The library is installed and usable; only the typed `#dispatcher` env import is affected.");
    }
  }
  /**
  * Entry point for the postinstall step.
  *
  * Policy: this never calls `process.exit(1)`. Generating `@dispatcher` type definitions is a
  * convenience, and breaking every consumer's `npm install` on a `cds env` hiccup (the original
  * bug) is disproportionate. Unusable paths are skipped with a loud warning; any unexpected error
  * is caught and reported instead of propagating.
  */
  run() {
    try {
      this.generateEnvFiles();
    } catch (error) {
      console.warn(`\u26A0\uFE0F  [cds-ts-dispatcher] Postinstall env generation skipped: ${error.message}`);
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
    new EnvGenerator().run();
  }
};
new PostInstall().run();
//# sourceMappingURL=PostInstall.mjs.map