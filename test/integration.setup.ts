/**
 * Integration-suite setup - runs once per test file, before the test framework and before
 * `@sap/cds` is imported by the test.
 *
 * `CDS_TYPESCRIPT` makes cds's service-implementation resolver prefer `srv/**\/*.ts` (and
 * `server.ts`) siblings over `.js` - the sample apps ship TypeScript impls only.
 */
process.env.CDS_TYPESCRIPT = 'true';
