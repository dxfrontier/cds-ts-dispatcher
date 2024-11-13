import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

import { parse } from 'jsonc-parser';

class Verifier {
  private packageJsonPath = path.resolve('package.json');
  private tsconfigPath = path.resolve('tsconfig.json');
  private decoratorIndexPath = path.resolve('@dispatcher/index.ts');
  private gitignorePath = path.resolve('.gitignore');

  verifyDecoratorFolder() {
    if (!existsSync(this.decoratorIndexPath)) {
      throw new Error('@dispatcher folder or index.ts file not found.');
    }

    const indexContent = readFileSync(this.decoratorIndexPath, 'utf8');
    const cdsEnvNotFound = !indexContent.includes('CDS_ENV');

    if (cdsEnvNotFound) {
      throw new Error('CDS_ENV not found in @dispatcher/index.ts.');
    }

    console.log('@dispatcher folder and index.ts file verified.');
  }

  verifyPackageJsonImports() {
    if (!existsSync(this.packageJsonPath)) {
      throw new Error('package.json file not found.');
    }

    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
    const imports = packageJson.imports || {};
    const dispatcherNotFound = imports['#dispatcher'] !== './@dispatcher/index.js';

    if (dispatcherNotFound) {
      throw new Error(`
        Required imports not found in package.json. 
        'imports' must contain "#dispatcher": "./@dispatcher/index.js"
      `);
    }

    console.log('Required imports found in package.json.');
  }

  verifyTsconfigInclude() {
    if (!existsSync(this.tsconfigPath)) {
      throw new Error('tsconfig.json file not found.');
    }

    const tsconfigContent = readFileSync(this.tsconfigPath, 'utf8');
    const tsconfig = parse(tsconfigContent);
    const includes = tsconfig.include || [];
    const dispatcherNotFound = !includes.includes('./@dispatcher');

    if (dispatcherNotFound) {
      throw new Error(`
        Required include not found in tsconfig.json. 
        'include' must contain "include": ["./srv", "./@dispatcher"]"
      `);
    }

    console.log('Required includes found in tsconfig.json.');
  }

  verifyGitignore() {
    if (!existsSync(this.gitignorePath)) {
      throw new Error('.gitignore file not found.');
    }

    const gitignoreContent = readFileSync(this.gitignorePath, 'utf8');
    const dispatcherNotFound = !gitignoreContent.includes('@dispatcher');

    if (dispatcherNotFound) {
      throw new Error('@dispatcher not found in .gitignore.');
    }

    console.log('@dispatcher entry found in .gitignore.');
  }

  runAllChecks() {
    try {
      this.verifyDecoratorFolder();
      this.verifyPackageJsonImports();
      this.verifyTsconfigInclude();
      this.verifyGitignore();

      console.log('All checks passed successfully.');
    } catch (error) {
      console.error((error as any).message);
      process.exit(1);
    }
  }
}

new Verifier().runAllChecks();
