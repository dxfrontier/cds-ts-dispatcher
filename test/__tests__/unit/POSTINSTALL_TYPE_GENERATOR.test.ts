import { generateCdsEnvType } from '../../../postinstall/util/TypeGenerator';

describe('POSTINSTALL - TypeGenerator', () => {
  describe('generateCdsEnvType - primitives', () => {
    test('It should MAP : string / number / boolean / null to their widened base types', () => {
      const output = generateCdsEnvType({ a: 'text', b: 42, c: true, d: null });

      expect(output).toBe(
        ['export interface CDS_ENV {', '  a: string;', '  b: number;', '  c: boolean;', '  d: null;', '}'].join('\n'),
      );
    });

    test('It should WIDEN : literal values to their type (not the snapshot value)', () => {
      const output = generateCdsEnvType({ _context: 'cds', port: 4004 });

      expect(output).toContain('_context: string;');
      expect(output).toContain('port: number;');
      expect(output).not.toContain("'cds'");
      expect(output).not.toContain('4004');
    });
  });

  describe('generateCdsEnvType - nested objects', () => {
    test('It should INLINE : nested objects as 2-space-indented object literal types', () => {
      const output = generateCdsEnvType({ outer: { inner: 'v', deep: { flag: true } } });

      expect(output).toBe(
        [
          'export interface CDS_ENV {',
          '  outer: {',
          '    inner: string;',
          '    deep: {',
          '      flag: boolean;',
          '    };',
          '  };',
          '}',
        ].join('\n'),
      );
    });

    test('It should EMIT : a single interface with NO named child interfaces', () => {
      const output = generateCdsEnvType({ a: { x: 1 }, b: { x: 1 } });

      // The one and only `interface ` keyword must be the exported root; nested shapes stay inline,
      // which is exactly what prevents the name collisions the old `json-ts` output suffered from.
      expect(output.match(/interface /g)).toHaveLength(1);
      expect(output.startsWith('export interface CDS_ENV {')).toBe(true);
    });

    test('It should COLLAPSE : an empty object to `{}`', () => {
      const output = generateCdsEnvType({ requires: {} });

      expect(output).toContain('requires: {};');
    });
  });

  describe('generateCdsEnvType - arrays', () => {
    test('It should RENDER : a homogeneous array as `T[]`', () => {
      expect(generateCdsEnvType({ arr: ['a', 'b'] })).toContain('arr: string[];');
      expect(generateCdsEnvType({ arr: [1, 2, 3] })).toContain('arr: number[];');
    });

    test('It should RENDER : a mixed array as `Array<A | B>` with de-duplicated members', () => {
      const output = generateCdsEnvType({ arr: ['a', 1, true, 2, 'b'] });

      expect(output).toContain('arr: Array<string | number | boolean>;');
    });

    test('It should RENDER : an empty array as `unknown[]`', () => {
      expect(generateCdsEnvType({ arr: [] })).toContain('arr: unknown[];');
    });

    test('It should RENDER : an array of same-shaped objects as a single inline object `T[]`', () => {
      const output = generateCdsEnvType({ arr: [{ x: 'a' }, { x: 'b' }] });

      expect(output).toBe(['export interface CDS_ENV {', '  arr: {', '    x: string;', '  }[];', '}'].join('\n'));
    });
  });

  describe('generateCdsEnvType - key quoting', () => {
    test('It should QUOTE : property names that are not valid identifiers', () => {
      const output = generateCdsEnvType({
        _context: 'cds',
        '_home_cds-dk': 'path',
        '[dev]': 1,
        'requires.db': true,
      });

      expect(output).toContain('_context: string;'); // valid identifier, unquoted
      expect(output).toContain("'_home_cds-dk': string;");
      expect(output).toContain("'[dev]': number;");
      expect(output).toContain("'requires.db': boolean;");
    });
  });

  describe('generateCdsEnvType - edge cases / totality', () => {
    test('It should RETURN : an empty interface for an empty root object', () => {
      expect(generateCdsEnvType({})).toBe('export interface CDS_ENV {}');
    });

    test('It should NOT THROW : for any non-object root and still emit a valid interface', () => {
      for (const value of [null, undefined, 'string', 42, true, [1, 2, 3]]) {
        expect(() => generateCdsEnvType(value)).not.toThrow();
        expect(generateCdsEnvType(value)).toBe('export interface CDS_ENV {}');
      }
    });

    test('It should BE STABLE : identical input yields byte-identical output and preserves key order', () => {
      const env = { z: 1, a: 2, m: { y: 'v', b: 'w' } };
      const first = generateCdsEnvType(env);
      const second = generateCdsEnvType(env);

      expect(first).toBe(second);
      expect(first.indexOf('z:')).toBeLessThan(first.indexOf('a:'));
      expect(first.indexOf('y:')).toBeLessThan(first.indexOf('b:'));
    });
  });

  describe('generateCdsEnvType - realistic cds.env sample', () => {
    // A trimmed but structurally faithful `cds.env` shape: underscore-prefixed keys, nested config,
    // arrays, booleans, a non-identifier key and an empty object.
    const env = {
      _context: 'cds',
      _home: '/app',
      _sources: ['.cdsrc.json', 'package.json'],
      _profiles: { _defined: {} },
      production: false,
      requires: {
        db: { kind: 'sqlite', credentials: { url: ':memory:' } },
        auth: { kind: 'mocked', users: [], restrict_all_services: true },
      },
      folders: { db: 'db/', srv: 'srv/', app: 'app/' },
      '_home_cds-dk': '/dk',
    };

    test('It should PRODUCE : a single valid CDS_ENV interface with the expected shape', () => {
      const output = generateCdsEnvType(env);

      expect(output.startsWith('export interface CDS_ENV {')).toBe(true);
      expect(output.match(/interface /g)).toHaveLength(1);
      expect(output).toContain('_sources: string[];');
      expect(output).toContain('_defined: {};');
      expect(output).toContain('production: boolean;');
      expect(output).toContain("'_home_cds-dk': string;");
      expect(output).toContain('url: string;');
      expect(output).toContain('users: unknown[];');
    });

    test('It should USE : 2-space indentation only (no tabs, no 4-space blocks)', () => {
      const output = generateCdsEnvType(env);
      const indents = output.split('\n').map((line) => line.match(/^ */)![0].length);

      expect(output).not.toContain('\t');
      expect(indents.every((width) => width % 2 === 0)).toBe(true);
    });
  });

  describe('generateCdsEnvType - hostile keys and depth', () => {
    test('It should JSON-QUOTE : keys containing control characters into valid string literals', () => {
      const output = generateCdsEnvType({ 'a\nb': 1, 'c\rd': 2, 'e\tf': 3, 'g\u0000h': 4 });

      expect(output).toContain('"a\\nb": number;');
      expect(output).toContain('"c\\rd": number;');
      expect(output).toContain('"e\\tf": number;');
      expect(output).toContain('"g\\u0000h": number;');
    });

    test('It should STAY TOTAL : adversarially deep nesting degrades to unknown instead of overflowing', () => {
      let deep: Record<string, unknown> = { leaf: 1 };
      for (let level = 0; level < 500; level++) {
        deep = { nested: deep };
      }

      expect(() => generateCdsEnvType(deep)).not.toThrow();
      expect(generateCdsEnvType(deep)).toContain('unknown');
    });
  });
});
