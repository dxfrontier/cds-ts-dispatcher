import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

import { parse } from 'jsonc-parser';

import colors from 'picocolors';

class Verifier {
  private packageJsonPath = path.resolve(process.env.INIT_CWD! + '/test/sample-project/bookshop/package.json');
  private tsconfigPath = path.resolve(process.env.INIT_CWD! + '/test/sample-project/bookshop/tsconfig.json');
  private decoratorIndexPath = path.resolve(
    process.env.INIT_CWD! + '/test/sample-project/bookshop/@dispatcher/index.ts',
  );
  private gitignorePath = path.resolve(process.env.INIT_CWD! + '/test/sample-project/bookshop/.gitignore');

  verifyDecoratorFolder() {
    console.log(colors.cyan('Checking @dispatcher folder and index.ts file...'));

    if (!existsSync(this.decoratorIndexPath)) {
      throw new Error(colors.red('❌ @dispatcher folder or index.ts file is missing.'));
    }

    const indexContent = readFileSync(this.decoratorIndexPath, 'utf8');
    if (!indexContent.includes('CDS_ENV')) {
      throw new Error(colors.red('❌ CDS_ENV reference not found in @dispatcher/index.ts.'));
    }

    console.log(colors.green('✅ @dispatcher folder and index.ts file are correctly set up.'));
  }

  verifyPackageJsonImports() {
    console.log(colors.cyan('Validating package.json imports configuration...'));

    if (!existsSync(this.packageJsonPath)) {
      throw new Error(colors.red('❌ package.json file is missing.'));
    }

    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
    const imports = packageJson.imports || {};
    if (imports['#dispatcher'] !== './@dispatcher/index.js') {
      throw new Error(
        colors.red(`
        ❌ Missing required import in package.json. 
        Ensure "imports" contains: 
        "#dispatcher": "./@dispatcher/index.js"
      `),
      );
    }

    console.log(colors.green('✅ package.json imports are correctly configured.'));
  }

  verifyTsconfigInclude() {
    console.log(colors.cyan('Checking tsconfig.json include paths...'));

    if (!existsSync(this.tsconfigPath)) {
      throw new Error(colors.red('❌ tsconfig.json file is missing.'));
    }

    const tsconfigContent = readFileSync(this.tsconfigPath, 'utf8');
    const tsconfig = parse(tsconfigContent);
    const includes = tsconfig.include || [];

    if (!includes.includes('./@dispatcher')) {
      throw new Error(
        colors.red(`
        ❌ @dispatcher directory is missing from tsconfig.json includes.
        Ensure your "include" section contains: ["./srv", "./@dispatcher"]
      `),
      );
    }

    console.log(colors.green('✅ tsconfig.json includes the required paths.'));
  }

  verifyGitignore() {
    console.log(colors.cyan('Ensuring @dispatcher is ignored in .gitignore...'));

    if (!existsSync(this.gitignorePath)) {
      throw new Error(colors.red('❌ .gitignore file is missing.'));
    }

    const gitignoreContent = readFileSync(this.gitignorePath, 'utf8');

    if (!gitignoreContent.includes('@dispatcher')) {
      throw new Error(colors.red('❌ @dispatcher directory is not ignored in .gitignore.'));
    }

    console.log(colors.green('✅ @dispatcher is correctly ignored in .gitignore.'));
  }

  runAllChecks() {
    console.log(colors.blue('🔍 Running verification checks for project setup...\n'));

    try {
      this.verifyDecoratorFolder();
      this.verifyPackageJsonImports();
      this.verifyTsconfigInclude();
      this.verifyGitignore();

      console.log(colors.green('\n🎉 All checks passed successfully! Your project is correctly configured.\n'));
    } catch (error) {
      console.error(colors.red(`\n🚨 Error: ${(error as any).message}\n`));
      process.exit(1);
    }
  }
}

new Verifier().runAllChecks();
