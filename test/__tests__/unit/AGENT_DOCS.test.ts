import { readFileSync } from 'fs';
import { join } from 'path';

import * as dispatcher from '../../../lib';

const REPO_ROOT = join(__dirname, '..', '..', '..');

// Documented via its own class JSDoc, not the decorator template.
const NON_DECORATOR_EXPORTS = new Set(['CDSDispatcher']);
// Re-exported from inversify — its JSDoc lives upstream.
const FOREIGN_EXPORTS = new Set(['Inject']);
// Names declared more than once (TS overload signatures), each carrying its own JSDoc block.
// The count pins EVERY documented declaration: deleting any overload's JSDoc drops the match
// count below the expectation instead of silently passing on the first declaration.
const EXPECTED_DOCUMENTED_DECLARATIONS: Record<string, number> = { EntityHandler: 2 };

const decoratorExports = Object.entries(dispatcher)
  .filter(([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name) && !NON_DECORATOR_EXPORTS.has(name))
  .map(([name]) => name)
  .sort();

const decoratorSources = ['lib/decorators/method.ts', 'lib/decorators/class.ts', 'lib/decorators/parameter.ts']
  .map((file) => readFileSync(join(REPO_ROOT, file), 'utf8'))
  .join('\n');

describe('agent-facing JSDoc drift gate', () => {
  it('exports a sane number of decorators (sanity check for the enumeration)', () => {
    expect(decoratorExports.length).toBeGreaterThan(80);
  });

  it.each(decoratorExports.filter((name) => !FOREIGN_EXPORTS.has(name)))(
    '%s has a JSDoc block containing @example directly above every documented declaration',
    (name) => {
      // (?:[^*]|\*(?!/))* forbids `*/` inside the capture, so the match is the JSDoc block
      // DIRECTLY above the declaration — lazy [\s\S]*? would backtrack across comment
      // boundaries and false-pass names whose @example lives in an earlier, unrelated block.
      // matchAll (not exec) so overloaded names are enforced on EVERY declaration: the count
      // expectation catches a deleted overload JSDoc, which exec()'s first match never saw.
      const declaration = new RegExp(
        String.raw`/\*\*((?:[^*]|\*(?!/))*)\*/\s*(?:export )?(?:const|function) ${name}\b`,
        'g',
      );
      const matches = [...decoratorSources.matchAll(declaration)];
      expect(matches).toHaveLength(EXPECTED_DOCUMENTED_DECLARATIONS[name] ?? 1);
      for (const match of matches) {
        expect(match[1]).toContain('@example');
      }
    },
  );

  it('lib/index.ts carries the @packageDocumentation module header', () => {
    const indexSource = readFileSync(join(REPO_ROOT, 'lib', 'index.ts'), 'utf8');
    expect(indexSource).toContain('@packageDocumentation');
  });

  it('lib/core/CDSDispatcher.ts (the module that ships in dist/index.d.ts) carries the agent-facing sentinels', () => {
    // lib/index.ts's @packageDocumentation header does not survive the dts rollup; the CDSDispatcher
    // class JSDoc is what agents actually see, so it is what must be pinned here.
    const dispatcherSource = readFileSync(join(REPO_ROOT, 'lib', 'core', 'CDSDispatcher.ts'), 'utf8');
    expect(dispatcherSource).toContain('silently inert');
    expect(dispatcherSource).toContain('experimentalDecorators');
  });
});
