'use strict';

/**
 * Verifies that a real `npm install` of the packed @dxfrontier/cds-ts-dispatcher
 * tarball produced a working `@dispatcher/` setup inside the consumer fixture.
 *
 * Runs INSIDE the container, via plain `node` (no ts-node/tsx needed) against
 * the consumer project copied to /workspace. Exits non-zero (failing the
 * `docker build`) when any check fails; a successful `docker build` is the
 * harness's PASS signal (see run.sh).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = __dirname;
const dispatcherDir = path.join(projectRoot, '@dispatcher');
const indexTsPath = path.join(dispatcherDir, 'index.ts');
const indexJsPath = path.join(dispatcherDir, 'index.js');
const packageJsonPath = path.join(projectRoot, 'package.json');
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
const gitignorePath = path.join(projectRoot, '.gitignore');
const installLogPath = '/tmp/npm-install.log';

// Default ON: the runtime stub is expected to be produced. Flip to "false"
// (via the EXPECT_INDEX_JS build arg / env var) only while validating a tree
// where the index.js-writing fix hasn't been rebuilt into the compiled
// postinstall/PostInstall.js bundle yet. See README.md.
const EXPECT_INDEX_JS = process.env.EXPECT_INDEX_JS !== 'false';

const failures = [];

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    failures.push(label);
    console.error(`FAIL: ${label}`);
  }
}

// 1. @dispatcher/index.ts exists and declares CDS_ENV.
const indexTsExists = fs.existsSync(indexTsPath);
check('@dispatcher/index.ts exists', indexTsExists);
check(
  '@dispatcher/index.ts contains "export interface CDS_ENV"',
  indexTsExists && fs.readFileSync(indexTsPath, 'utf8').includes('export interface CDS_ENV'),
);

// 2. @dispatcher/index.js — gated behind EXPECT_INDEX_JS (see comment above). The alias probe is
// written INTO the consumer package (subpath imports only apply to files belonging to the
// package), proving `#dispatcher` genuinely resolves and loads at runtime, stub included.
if (EXPECT_INDEX_JS) {
  check('@dispatcher/index.js exists (EXPECT_INDEX_JS=true)', fs.existsSync(indexJsPath));

  const aliasProbePath = path.join(projectRoot, '.dispatcher-alias-check.cjs');
  fs.writeFileSync(aliasProbePath, "require('#dispatcher');\n");
  const aliasProbe = spawnSync(process.execPath, [aliasProbePath], { cwd: projectRoot, encoding: 'utf8' });
  check("'#dispatcher' import alias resolves and loads at runtime", aliasProbe.status === 0);
  if (aliasProbe.status !== 0) {
    console.error((aliasProbe.stdout || '') + (aliasProbe.stderr || ''));
  }
  fs.unlinkSync(aliasProbePath);
} else {
  console.log('SKIP: @dispatcher/index.js existence check (EXPECT_INDEX_JS=false)');
}

// 2b. The generated index.ts must be valid TypeScript — the grep in check 1 cannot catch an emit
// bug that produces an unparsable interface (e.g. an unescaped control character in a key).
if (indexTsExists) {
  const tsc = spawnSync('npx', ['tsc', '--noEmit', '--strict', '--skipLibCheck', indexTsPath], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  check('generated @dispatcher/index.ts compiles under `tsc --strict`', tsc.status === 0);
  if (tsc.status !== 0) {
    console.error((tsc.stdout || '') + (tsc.stderr || ''));
  }
}

// 3. package.json imports['#dispatcher'].
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
check(
  "package.json imports['#dispatcher'] === './@dispatcher/index.js'",
  Boolean(packageJson.imports) && packageJson.imports['#dispatcher'] === './@dispatcher/index.js',
);

// 4. tsconfig.json include contains './@dispatcher'.
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
check(
  "tsconfig.json include contains './@dispatcher'",
  Array.isArray(tsconfig.include) && tsconfig.include.includes('./@dispatcher'),
);

// 5. .gitignore ignores @dispatcher.
const gitignore = fs.readFileSync(gitignorePath, 'utf8');
check("'.gitignore' contains '@dispatcher'", gitignore.includes('@dispatcher'));

// 6. The captured `npm install` log proves the primary (non-skip) path ran.
const installLogExists = fs.existsSync(installLogPath);
check(`install log exists at ${installLogPath}`, installLogExists);
if (installLogExists) {
  const log = fs.readFileSync(installLogPath, 'utf8');

  // Positive control for the negative greps below: prove dependency lifecycle output actually
  // reached the log (it only does under `npm install --foreground-scripts`). If npm's streaming
  // behavior ever changes, this fails loudly instead of leaving those assertions silently vacuous.
  check(
    'install log captured the dispatcher postinstall header (foreground-scripts control)',
    /> @dxfrontier\/cds-ts-dispatcher@\S+ postinstall/.test(log),
  );

  check(
    'npm install log does not contain "Skipped @dispatcher env generation"',
    !log.includes('Skipped @dispatcher env generation'),
  );
  // The fixture deliberately ships @sap/cds-dk, so a broken programmatic tier could be silently
  // rescued by the CLI fallback; EnvGenerator prints a notice on fallback exactly so that this
  // assertion can pin the PRIMARY tier, not just "some tier worked".
  check(
    'npm install log does not contain the CLI-fallback notice',
    !log.includes('used the `cds env get --json` fallback'),
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:`);
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('\nAll docker postinstall verification checks passed.');
