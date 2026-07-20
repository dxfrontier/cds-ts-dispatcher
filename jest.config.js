/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  verbose: true,
  silent: true,
  collectCoverageFrom: ['lib/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    // Ratcheted from the {37,5,26,37} placeholder after measuring the final state (statements 89.27%,
    // branches 75.86%, functions 90.25%, lines 89.3% - each clears its target by >=2 points).
    // Only enforced on `--coverage` runs (i.e. `test:coverage`), never on plain unit/integration runs.
    global: {
      statements: 85,
      branches: 70,
      functions: 85,
      lines: 85,
    },
  },
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/__tests__/unit/**/*.test.ts', '<rootDir>/test/__tests__/draft/**/*.test.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/__tests__/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/test/integration.setup.ts'],
      // Honor each sample app's package.json subpath `imports` (`#cds-models/*`, `#dispatcher`).
      resolver: '<rootDir>/test/integration.resolver.js',
      moduleNameMapper: {
        // The monorepo admin fixture imports the dispatcher by its published package name; resolve it
        // to the in-repo source (like the bookshop's relative imports) so no built `dist/` is required
        // and the source is coverage-instrumented.
        '^@dxfrontier/cds-ts-dispatcher$': '<rootDir>/lib/index.ts',
        // The monorepo admin fixture references the companion package `@dxfrontier/cds-ts-repository`
        // (peer `@sap/cds@^9`), which is not installed here. A no-op stub lets the app boot so its
        // AdminService handlers can be exercised; those handlers never touch a repository. See stub.
        '^@dxfrontier/cds-ts-repository$': '<rootDir>/test/stubs/cds-ts-repository.ts',
      },
      // Transpile-only: the integration suite boots the real CAP runtime, so cds pulls in the
      // sample apps' `.ts` impls through jest's module registry. `isolatedModules` skips the
      // whole-program type-check (which otherwise chokes on rootDir inference and runtime-only code).
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
      },
    },
  ],
};
