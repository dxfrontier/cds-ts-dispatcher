/**
 * `@dxfrontier/cds-ts-dispatcher` — TypeScript decorators that remove the boilerplate of
 * SAP CAP (Node.js) event handlers.
 *
 * @remarks
 * Mental model — read this before writing a handler:
 * - Decorators do NO work at decoration time; they only write metadata (reflect-metadata).
 * - Everything registers once at bootstrap: `new CDSDispatcher([Handler, …]).initialize()`
 *   returns `cds.service.impl(...)`. A handler class NOT passed to `CDSDispatcher` is silently inert.
 * - `@EntityHandler(Entity)` binds a class to a CDS-Typer entity; method decorators map 1:1 onto
 *   CAP registrations (`srv.before/on/after/prepend`). `…Draft` variants target `entity.drafts`.
 * - Required consumer tsconfig: `"experimentalDecorators": true`, `"emitDecoratorMetadata": true`.
 * - Peer dependency: dispatcher major ↔ `@sap/cds` major (v6 ↔ `@sap/cds ^10`).
 *
 * In the examples throughout these typings, a decorator at the start of a line is written `/@Name` —
 * drop the leading slash when copying; it only keeps TypeScript's JSDoc parser from truncating the example.
 *
 * Full documentation ships inside this package (no network needed):
 * `node_modules/@dxfrontier/cds-ts-dispatcher/README.md`
 *
 * @example
 * ```ts
 * // service implementation file referenced from your .cds `@impl`
 * import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';
 * import { BookHandler } from './handler/BookHandler';
 *
 * export = new CDSDispatcher([BookHandler]).initialize();
 * ```
 *
 * @packageDocumentation
 */

export * from './decorators/class';
export * from './decorators/method';
export * from './decorators/parameter';

export * from './core/CDSDispatcher';

export * from './constants/constants';

export type * from './types/types';
export type * from './types/validator';
export type * from './types/formatter';
export type * from './types/responseTransformers';

// Exported to uppercase to be in guidance with other decorators.
export { inject as Inject } from 'inversify';
