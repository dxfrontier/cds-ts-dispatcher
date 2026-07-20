/**
 * Custom jest resolver for the integration suite.
 *
 * The sample CAP apps address their generated artifacts through Node.js subpath `imports`
 * declared in each app's own `package.json`:
 *   "#cds-models/*": "./@cds-models/*\/index.js"
 *   "#dispatcher":   "./@dispatcher/index.js"
 *
 * jest's default resolver does not apply those per-app `imports` maps when the apps are nested
 * workspaces resolved from the repo root, so cds's runtime `require('#cds-models/...')` fails.
 * We resolve them ourselves, relative to the importing file, so the bookshop and the monorepo
 * admin app each pick up THEIR OWN `@cds-models` / `@dispatcher` folder.
 */
const fs = require('node:fs');
const path = require('node:path');

/** Walk up from `startDir` until `startDir/<relative>` exists; return that path or null. */
function findUp(startDir, relative) {
  let dir = startDir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, relative);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Prefer the generated `.js` (runtime module), fall back to the typer `.ts`. */
function pickIndex(dir) {
  for (const ext of ['.js', '.ts']) {
    const candidate = path.join(dir, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

module.exports = (request, options) => {
  if (request.startsWith('#cds-models/')) {
    const rel = request.slice('#cds-models/'.length);
    const modelDir = findUp(options.basedir, path.join('@cds-models', rel));
    if (modelDir) {
      const index = pickIndex(modelDir);
      if (index) return index;
    }
  }

  if (request === '#dispatcher') {
    const dispatcherDir = findUp(options.basedir, '@dispatcher');
    if (dispatcherDir) {
      const index = pickIndex(dispatcherDir);
      if (index) return index;
    }
  }

  return options.defaultResolver(request, options);
};
