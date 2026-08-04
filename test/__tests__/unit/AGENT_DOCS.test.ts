import { readFileSync } from 'fs';
import { join } from 'path';

import * as dispatcher from '../../../lib';

const REPO_ROOT = join(__dirname, '..', '..', '..');

// Documented via its own class JSDoc, not the decorator template.
const NON_DECORATOR_EXPORTS = new Set(['CDSDispatcher']);
// Re-exported from inversify — its JSDoc lives upstream.
const FOREIGN_EXPORTS = new Set(['Inject']);

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
    '%s has a JSDoc block containing @example directly above its declaration',
    (name) => {
      const declaration = new RegExp(String.raw`/\*\*([\s\S]*?)\*/\s*(?:export )?(?:const|function) ${name}\b`);
      const match = declaration.exec(decoratorSources);
      expect(match).not.toBeNull();
      expect(match![1]).toContain('@example');
    },
  );

  it('lib/index.ts carries the @packageDocumentation module header', () => {
    const indexSource = readFileSync(join(REPO_ROOT, 'lib', 'index.ts'), 'utf8');
    expect(indexSource).toContain('@packageDocumentation');
  });
});
