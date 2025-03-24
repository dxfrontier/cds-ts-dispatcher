import { existsSync, readFileSync, readdirSync } from 'fs';
import * as path from 'path';

import { parse } from 'jsonc-parser';

import colors from 'picocolors';

class MonorepoVerifier {
  private rootPath = path.resolve(process.env.INIT_CWD! + '/test/sample-project/monorepo_bookshop');
  private servicesPath = path.resolve(this.rootPath + '/services');
  private serviceDirs = ['admin', 'api']; // Services to check

  private verifyMonorepoStructure() {
    console.log(colors.cyan('Checking monorepo structure...'));

    if (!existsSync(this.rootPath)) {
      throw new Error(colors.red(`❌ Monorepo root folder not found: ${this.rootPath}`));
    }

    if (!existsSync(this.servicesPath)) {
      throw new Error(colors.red(`❌ 'services' folder not found in monorepo.`));
    }

    const packageJsonPath = path.join(this.rootPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error(colors.red('❌ package.json file not found at monorepo root.'));
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.workspaces || !Array.isArray(packageJson.workspaces)) {
      throw new Error(colors.red('❌ No "workspaces" configuration found in monorepo package.json.'));
    }

    console.log(colors.green('✅ Monorepo structure verified.'));
  }

  private verifyService(serviceName: string, servicePath: string) {
    console.log(colors.blue(`\n🔍 Checking service: ${colors.bgGreenBright(serviceName)}\n`));

    if (!existsSync(servicePath)) {
      throw new Error(colors.red(`❌ Service folder not found: ${servicePath}`));
    }

    const packageJsonPath = path.join(servicePath, 'package.json');
    const tsconfigPath = path.join(servicePath, 'tsconfig.json');
    const decoratorIndexPath = path.join(servicePath, '@dispatcher/index.ts');
    const gitignorePath = path.join(servicePath, '.gitignore');

    if (this.hasDispatcherDependency(packageJsonPath)) {
      this.verifyDecoratorFolder(decoratorIndexPath);
      this.verifyPackageJsonImports(packageJsonPath);
      this.verifyTsconfigInclude(tsconfigPath);
      this.verifyGitignore(gitignorePath);

      return;
    }

    console.log(
      colors.yellow(`⚠️  Skipping ${colors.bgWhiteBright(serviceName)} (no @dxfrontier/cds-ts-dispatcher dependency).`),
    );
  }

  private verifyDecoratorFolder(decoratorIndexPath: string) {
    console.log(colors.cyan('Checking @dispatcher folder and index.ts file...'));

    if (!existsSync(decoratorIndexPath)) {
      throw new Error(colors.red('❌ @dispatcher folder or index.ts file is missing.'));
    }

    const indexContent = readFileSync(decoratorIndexPath, 'utf8');
    if (!indexContent.includes('CDS_ENV')) {
      throw new Error(colors.red('❌ CDS_ENV reference not found in @dispatcher/index.ts.'));
    }

    console.log(colors.green('✅ @dispatcher folder and index.ts file are correctly set up.'));
  }

  private verifyPackageJsonImports(packageJsonPath: string) {
    console.log(colors.cyan('Validating package.json imports configuration...'));

    if (!existsSync(packageJsonPath)) {
      throw new Error(colors.red('❌ package.json file is missing.'));
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
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

  private verifyTsconfigInclude(tsconfigPath: string) {
    console.log(colors.cyan('Checking tsconfig.json include paths...'));

    if (!existsSync(tsconfigPath)) {
      throw new Error(colors.red('❌ tsconfig.json file is missing.'));
    }

    const tsconfigContent = readFileSync(tsconfigPath, 'utf8');
    const tsconfig = parse(tsconfigContent);
    const includes = tsconfig.include || [];

    if (!includes.includes('./@dispatcher')) {
      throw new Error(
        colors.red(`
        ❌ @dispatcher directory is missing from tsconfig.json includes.
        Ensure your "include" section contains: ["./src", "./@dispatcher"]
      `),
      );
    }

    console.log(colors.green('✅ tsconfig.json includes the required paths.'));
  }

  private verifyGitignore(gitignorePath: string) {
    console.log(colors.cyan('Ensuring @dispatcher is ignored in .gitignore...'));

    if (!existsSync(gitignorePath)) {
      throw new Error(colors.red('❌ .gitignore file is missing.'));
    }

    const gitignoreContent = readFileSync(gitignorePath, 'utf8');

    if (!gitignoreContent.includes('@dispatcher')) {
      throw new Error(colors.red('❌ @dispatcher directory is not ignored in .gitignore.'));
    }

    console.log(colors.green('✅ @dispatcher is correctly ignored in .gitignore.'));
  }

  private hasDispatcherDependency(packageJsonPath: string): boolean {
    if (!existsSync(packageJsonPath)) return false;
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    return packageJson.dependencies?.['@dxfrontier/cds-ts-dispatcher'] ? true : false;
  }

  public runAllChecks() {
    console.log(colors.blue('🔍 Running verification checks for monorepo project setup...\n'));

    try {
      this.verifyMonorepoStructure();

      for (const service of this.serviceDirs) {
        const servicePath = path.join(this.servicesPath, service);
        this.verifyService(service, servicePath);
      }

      console.log(
        colors.green('\n🎉 All checks passed successfully! Your monorepo project is correctly configured.\n'),
      );
    } catch (error) {
      console.error(colors.red(`\n🚨 Error: ${(error as any).message}\n`));
      process.exit(1);
    }
  }
}

new MonorepoVerifier().runAllChecks();
