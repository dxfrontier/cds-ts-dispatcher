// Mock the collaborators so the acquisition ladder can be exercised in isolation:
// - `FileManager` is replaced with a no-I/O stand-in that keeps the real static `joinPaths`
//   (the transport-file path relies on it) and an empty, test-settable execution path list.
// - `fs` is fully mocked; the transport file and generated outputs are asserted through the spies.
// The `ShellCommander` instance is swapped on the constructed generator (see `setup`), so no module
// mock is needed for it.
jest.mock('../../../postinstall/util/FileManager', () => {
  const nodePath = jest.requireActual<typeof import('path')>('path');

  class MockFileManager {
    public static joinPaths(...paths: string[]): string {
      return nodePath.join(...paths);
    }

    public dispatcherExecutionPath: { paths: unknown[] } = { paths: [] };
  }

  return { FileManager: MockFileManager };
});

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  rmSync: jest.fn(),
}));

import { writeFileSync, readFileSync, existsSync, rmSync } from 'fs';

import { EnvGenerator } from '../../../postinstall/util/EnvGenerator';

import type { CommandResult } from '../../../postinstall/util/ShellCommander';

const samplePath = {
  executedInstalledPath: '/project',
  envFilePath: '/project/@dispatcher/index.ts',
  runtimeStubPath: '/project/@dispatcher/index.js',
  dispatcherPath: '/project/@dispatcher',
};

const transportFile = '/project/@dispatcher/.cds-env.tmp.json';

const ok = (stdout = ''): CommandResult => ({ status: 0, stdout, stderr: '', failed: false });
const fail = (stderr = 'boom', status = 1): CommandResult => ({ status, stdout: '', stderr, failed: true });

/**
 * Builds an `EnvGenerator` wired to a single execution path and a fake `ShellCommander` whose
 * `executeCommand` is the returned jest mock (call 0 = programmatic probe, call 1 = CLI fallback).
 */
function setup(): { gen: EnvGenerator; executeCommand: jest.Mock } {
  const executeCommand = jest.fn();
  const gen = new EnvGenerator();

  (gen as unknown as { shellCommander: { executeCommand: jest.Mock } }).shellCommander = { executeCommand };
  (
    gen as unknown as { fileManager: { dispatcherExecutionPath: { paths: unknown[] } } }
  ).fileManager.dispatcherExecutionPath.paths = [samplePath];

  return { gen, executeCommand };
}

describe('POSTINSTALL - EnvGenerator acquisition ladder', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue('{}');
    (writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (rmSync as jest.Mock).mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('PRIMARY success: uses the programmatic probe, never touches the CLI fallback', () => {
    const { gen, executeCommand } = setup();
    executeCommand.mockReturnValue(ok());
    (readFileSync as jest.Mock).mockReturnValue('{"foo":"bar"}');

    gen.run();

    // Only the programmatic probe ran (node executable), fallback `cds` was never spawned.
    expect(executeCommand).toHaveBeenCalledTimes(1);
    expect(executeCommand.mock.calls[0][0]).toBe(process.execPath);
    expect(executeCommand.mock.calls[0][1]).toEqual(['-e', expect.stringContaining('@sap/cds'), transportFile]);

    // index.ts (types) + index.js (runtime stub) both written.
    expect(writeFileSync).toHaveBeenCalledWith(
      '/project/@dispatcher/index.ts',
      expect.stringContaining('export interface CDS_ENV'),
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      '/project/@dispatcher/index.ts',
      expect.stringContaining('foo: string;'),
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      '/project/@dispatcher/index.js',
      expect.stringContaining("runtime stub for the '#dispatcher' import alias"),
    );

    // Transport file cleaned up, no warnings.
    expect(rmSync).toHaveBeenCalledWith(transportFile);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('PRIMARY fail -> FALLBACK success: runs the CLI and generates from its output', () => {
    const { gen, executeCommand } = setup();
    (existsSync as jest.Mock).mockReturnValue(false);
    executeCommand.mockReturnValueOnce(fail('probe crashed')).mockReturnValueOnce(ok('{"b":2}'));

    gen.run();

    expect(executeCommand).toHaveBeenCalledTimes(2);
    expect(executeCommand.mock.calls[0][0]).toBe(process.execPath);
    expect(executeCommand.mock.calls[1][0]).toBe('cds');
    expect(executeCommand.mock.calls[1][1]).toEqual(['env', 'get', '--json']);

    expect(writeFileSync).toHaveBeenCalledWith('/project/@dispatcher/index.ts', expect.stringContaining('b: number;'));
    expect(writeFileSync).toHaveBeenCalledWith(
      '/project/@dispatcher/index.js',
      expect.stringContaining('All exports are TypeScript types'),
    );

    // A rescued install is not silent: the fallback notice names the degraded tier, but the
    // skip warning must not fire (generation succeeded).
    const notice = warnSpy.mock.calls.map((call) => call[0]).join('\n');
    expect(notice).toContain('used the `cds env get --json` fallback');
    expect(notice).not.toContain('Skipped @dispatcher env generation');
  });

  test('FALLBACK strips ANSI + extracts the object literal before parsing', () => {
    const { gen, executeCommand } = setup();
    (existsSync as jest.Mock).mockReturnValue(false);
    const noisy = `\x1b[32mSome banner\x1b[0m\n{"kind":"sqlite"}\ntrailing notice`;
    executeCommand.mockReturnValueOnce(fail()).mockReturnValueOnce(ok(noisy));

    gen.run();

    expect(writeFileSync).toHaveBeenCalledWith(
      '/project/@dispatcher/index.ts',
      expect.stringContaining('kind: string;'),
    );
    const notice = warnSpy.mock.calls.map((call) => call[0]).join('\n');
    expect(notice).toContain('used the `cds env get --json` fallback');
  });

  test('BOTH fail: skips with a warning naming both reasons, writes nothing, does not throw', () => {
    const { gen, executeCommand } = setup();
    (existsSync as jest.Mock).mockReturnValue(false);
    executeCommand.mockReturnValue(fail('nope'));

    expect(() => gen.run()).not.toThrow();

    expect(writeFileSync).not.toHaveBeenCalled();

    const skipMessage = warnSpy.mock.calls.map((call) => call[0]).join('\n');
    expect(skipMessage).toContain('Skipped @dispatcher env generation for: /project');
    expect(skipMessage).toContain('programmatic');
    expect(skipMessage).toContain('Fallback');
    expect(skipMessage).toContain('No @dispatcher env files could be generated');
  });

  test('GARBAGE JSON on both paths: rejected by the validation gate, skips without throwing', () => {
    const { gen, executeCommand } = setup();
    executeCommand.mockReturnValueOnce(ok()).mockReturnValueOnce(ok('{ this is : not json }'));
    (readFileSync as jest.Mock).mockReturnValue('<<not-json>>');

    expect(() => gen.run()).not.toThrow();

    expect(writeFileSync).not.toHaveBeenCalled();
    const skipMessage = warnSpy.mock.calls.map((call) => call[0]).join('\n');
    expect(skipMessage).toContain('invalid JSON');
  });

  test('UNEXPECTED throw inside a path is caught and reported, install is never aborted', () => {
    const { gen, executeCommand } = setup();
    executeCommand.mockImplementation(() => {
      throw new Error('spawn exploded');
    });

    expect(() => gen.run()).not.toThrow();

    const skipMessage = warnSpy.mock.calls.map((call) => call[0]).join('\n');
    expect(skipMessage).toContain('unexpected error: spawn exploded');
    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
