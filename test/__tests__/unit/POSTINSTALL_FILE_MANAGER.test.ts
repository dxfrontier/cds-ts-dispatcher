import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { FileManager } from '../../../postinstall/util/FileManager';
import { RUNTIME_STUB_CONTENT } from '../../../postinstall/util/runtimeStub';

/**
 * Real-filesystem coverage for the consumer-project hardening of `FileManager`: every scenario
 * below is one that used to abort a consumer's `npm install` (or mangle its config files) and must
 * now degrade to a warning. Each test gets its own temp directory wired in via `INIT_CWD`.
 */
describe('POSTINSTALL - FileManager consumer-project hardening', () => {
  let projectDir: string;
  let warnSpy: jest.SpyInstance;
  const originalInitCwd = process.env.INIT_CWD;

  const warnings = (): string => warnSpy.mock.calls.flat().join('\n');

  beforeEach(() => {
    projectDir = mkdtempSync(path.join(tmpdir(), 'dispatcher-fm-'));
    process.env.INIT_CWD = projectDir;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();

    if (originalInitCwd === undefined) {
      delete process.env.INIT_CWD;
    } else {
      process.env.INIT_CWD = originalInitCwd;
    }

    rmSync(projectDir, { recursive: true, force: true });
  });

  test('NO package.json: skips with a warning instead of aborting the install', () => {
    let fileManager!: FileManager;

    expect(() => (fileManager = new FileManager())).not.toThrow();

    expect(fileManager.dispatcherExecutionPath.paths).toHaveLength(0);
    expect(warnings()).toContain('No package.json found');
    expect(existsSync(path.join(projectDir, '@dispatcher'))).toBe(false);
  });

  test('INIT_CWD absent + own package dir: the dispatcher itself is never treated as the consumer', () => {
    delete process.env.INIT_CWD;
    // Faithful replica of the published package.json: it keeps the repository `workspaces` entries
    // even though the tarball ships no `test/` folder, so scanning them would crash on ENOENT.
    writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify({ name: '@dxfrontier/cds-ts-dispatcher', workspaces: ['test/sample-project/bookshop'] }),
    );
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(projectDir);

    try {
      let fileManager!: FileManager;

      expect(() => (fileManager = new FileManager())).not.toThrow();

      expect(fileManager.dispatcherExecutionPath.paths).toHaveLength(0);
      expect(warnings()).toContain('INIT_CWD is not set');
    } finally {
      cwdSpy.mockRestore();
    }
  });

  test('JSONC tsconfig: comments and trailing commas survive the ./@dispatcher include append', () => {
    writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify({ name: 'consumer', dependencies: { '@dxfrontier/cds-ts-dispatcher': '^6' } }),
    );
    const tsconfigPath = path.join(projectDir, 'tsconfig.json');
    writeFileSync(
      tsconfigPath,
      [
        '{',
        '  // keep me',
        '  "compilerOptions": {',
        '    "strict": true,',
        '  },',
        '  "include": ["./srv",],',
        '}',
      ].join('\n'),
    );

    new FileManager();

    const updated = readFileSync(tsconfigPath, 'utf8');
    expect(updated).toContain('// keep me');
    expect(updated).toContain('"./srv"');
    expect(updated).toContain('./@dispatcher');

    // Scaffolding happened alongside: runtime stub exists BEFORE any env acquisition ran, so a
    // failed acquisition can never leave `imports['#dispatcher']` dangling.
    expect(readFileSync(path.join(projectDir, '@dispatcher', 'index.js'), 'utf8')).toBe(RUNTIME_STUB_CONTENT);
    const packageJson = JSON.parse(readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
    expect(packageJson.imports['#dispatcher']).toBe('./@dispatcher/index.js');
    expect(readFileSync(path.join(projectDir, '.gitignore'), 'utf8')).toContain('@dispatcher');

    // Idempotence: a second run must not append the include entry twice.
    new FileManager();
    const twice = readFileSync(tsconfigPath, 'utf8');
    expect(twice.match(/\.\/@dispatcher/g)).toHaveLength(1);
  });

  test('MALFORMED tsconfig: warns and leaves the file untouched, everything else still scaffolds', () => {
    writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
    const tsconfigPath = path.join(projectDir, 'tsconfig.json');
    writeFileSync(tsconfigPath, '{ "include": [ }');

    expect(() => new FileManager()).not.toThrow();

    expect(readFileSync(tsconfigPath, 'utf8')).toBe('{ "include": [ }');
    expect(warnings()).toContain('Could not parse');
    expect(existsSync(path.join(projectDir, '@dispatcher', 'index.js'))).toBe(true);
  });

  test('STALE workspace entry: a missing folder is skipped with a warning, present ones still process', () => {
    writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify({ name: 'mono', workspaces: ['packages/ghost', 'packages/real'] }),
    );
    const realWorkspace = path.join(projectDir, 'packages', 'real');
    mkdirSync(realWorkspace, { recursive: true });
    writeFileSync(
      path.join(realWorkspace, 'package.json'),
      JSON.stringify({ name: 'real', dependencies: { '@dxfrontier/cds-ts-dispatcher': '^6' } }),
    );

    let fileManager!: FileManager;

    expect(() => (fileManager = new FileManager())).not.toThrow();

    expect(fileManager.dispatcherExecutionPath.paths).toHaveLength(1);
    expect(warnings()).toContain('packages/ghost');
    expect(existsSync(path.join(realWorkspace, '@dispatcher', 'index.js'))).toBe(true);
  });
});
