import { ArgumentMethodProcessor } from '../core/ArgumentMethodProcessor';

import type { PickQueryPropsByKey, CustomRequest, CRUDQueryKeys, PropertyStringPath } from '../types/internalTypes';

// TODO: to be removed in the future
/**
 * Annotates a parameter of a method with the `Request` on an `@OnSubscribe` messaging handler.
 *
 * @deprecated Use `@Req` instead of `@Msg`.
 *
 * @remarks
 * On the current `@sap/cds`, `@Msg` resolves to the exact same value as `@Req` — the distinct
 * `Emitter`-shaped payload (`{ event, data, headers, inbound }`) it used to inject no longer applies.
 * Kept only for source compatibility with existing `@OnSubscribe` handlers.
 *
 * @example
 * ```ts
 * /@OnSubscribe({ eventName: 'BookOrdered', type: 'SAME_NODE_PROCESS' })
 * private async onBookOrdered(@Msg() msg: Request<{ ID: string; amount: number }>): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#msg | CDS-TS-Dispatcher - @Msg}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Msg
 */
function Msg(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'MSG',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with a `boolean` switch: whether the current request targets a
 * single entity instance (`true`) or the entity set (`false`).
 *
 * @remarks
 * Derived from `req.params.length > 0` — only meaningful on `@AfterRead`, `@BeforeRead`, `@OnRead` (and
 * their draft variants), the events where CAP dispatches both single-instance and entity-set reads
 * through the same handler.
 *
 * @example
 * ```ts
 * /@AfterRead()
 * private async enrich(@Results() results: Book[], @Req() req: Request<Book>, @SingleInstanceSwitch() isSingleInstance: boolean): Promise<void> {
 *   if (isSingleInstance) { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#singleinstanceswitch | CDS-TS-Dispatcher - @SingleInstanceSwitch}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § SingleInstanceSwitch
 */
function SingleInstanceSwitch(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'SINGLE_INSTANCE_SWITCH',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of an `@OnError` handler with the `Error` that failed the request.
 *
 * @remarks
 * Only meaningful on `@OnError`, which is conventionally hosted in an `@UnboundActions` class (it is a
 * service-wide hook, not entity-scoped — registration is identical from any handler class). `@OnError`
 * runs synchronously — no `await`, no `@Diff`, in the
 * handler body. `Error` shadows the global `Error` constructor in any file that imports this decorator;
 * alias the import (`Error as ErrorDecorator`) if the file also throws/constructs `Error`s.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ErrorHandler {
 *   /@OnError()
 *   private onError(@Error() err: Error, @Req() req: Request): void { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#error | CDS-TS-Dispatcher - @Error}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Error
 */
function Error(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'ERROR',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of an `@On*` handler with the `next` function, which proceeds to the next
 * handler in CAP's execution chain (or the default implementation if none remain).
 *
 * @remarks
 * Valid on the ON-phase CRUD / action / function / custom-event decorators (active and draft) —
 * `@Before*` / `@After*` handlers never receive a `next` argument (CAP always continues automatically
 * for those phases), so `@Next` there is `undefined`. Equally `undefined` or ignored on `@OnError`,
 * `@OnScheduledSuccess` / `@OnScheduledFailure`, `@OnRequestDone` and the server-lifecycle decorators
 * (`@OnServed` / `@OnListening` / `@OnShutdown`) — none of these dispatch through an interceptor chain.
 * Returning `next()` (or its result) forwards the request; not calling it ends the chain at
 * your handler.
 *
 * @example
 * ```ts
 * /@OnCreate()
 * public async onCreate(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Function> {
 *   return next();
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#next | CDS-TS-Dispatcher - @Next}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Next
 */
function Next(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'NEXT',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of an `@After*` handler with the full result array of the operation.
 *
 * @remarks
 * `@Results` and `@Result` bind the same metadata under the hood — the split exists purely for
 * readability: use `@Results` when the payload is an array (`@AfterRead`), `@Result` for a single object
 * (`@AfterCreate`, `@AfterUpdate`, `@AfterReadEachInstance` — invoked once per instance, analogous to
 * `Array.prototype.forEach`) or a `boolean` (`@AfterDelete`). Mutating row OBJECTS in place changes the
 * OData response; structural array operations (`push` / `splice`) are lost on single-instance READs,
 * where CAP hands the after-phase a fresh `[req.results]` wrapper.
 *
 * @example
 * ```ts
 * /@AfterRead()
 * private async enrich(@Results() results: Book[], @Req() req: Request): Promise<void> {
 *   results.forEach((book) => (book.discount = '10%'));
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#results--result | CDS-TS-Dispatcher - @Results}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Results / Result
 */
function Results(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RESULTS',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of an `@After*` handler with the single-object (or `boolean`) result of the
 * operation.
 *
 * @remarks
 * `@Result` and `@Results` bind the same metadata under the hood — the split exists purely for
 * readability: use `@Result` for a single object (`@AfterCreate`, `@AfterUpdate`, `@AfterReadEachInstance`
 * — invoked once per instance, analogous to `Array.prototype.forEach`) or a `boolean` (`@AfterDelete`),
 * `@Results` when the payload is an array (`@AfterRead`).
 *
 * @example
 * ```ts
 * /@AfterDelete()
 * private async logDeletion(@Result() deleted: boolean, @Req() req: Request): Promise<void> {
 *   if (deleted) { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#results--result | CDS-TS-Dispatcher - @Result}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Results / Result
 */
function Result(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RESULTS',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the current `Request` object.
 *
 * @remarks
 * The all-purpose escape hatch — every other request-derived parameter decorator (`@Data`, `@Param`,
 * `@UserInfo`, `@Tenant`, `@GetRequest`, ...) is a convenience projection of a property already
 * reachable through `@Req`. Reach for those when you only need one or two properties; use `@Req` when
 * you need the object itself (e.g. to call `req.reject()` / `req.notify()`).
 *
 * @example
 * ```ts
 * /@AfterRead()
 * private async enrich(@Req() req: Request<Book>, @Results() results: Book[]): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#req | CDS-TS-Dispatcher - @Req}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Req
 */
function Req(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'REQ',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with `req.http.res` — the raw Node.js `ServerResponse`, for direct
 * response manipulation (e.g. custom headers).
 *
 * @remarks
 * Valid on `@Before*`, `@After*` and `@On*` handlers alike. `undefined` for requests that do not
 * originate over HTTP (internal `srv.read` / `srv.emit` calls, messaging events) — always guard before
 * use. Prefer `req.reject()` / `req.notify()` on `@Req` for standard error/message responses; reach for
 * `@Res` only when you need the raw response object itself.
 *
 * @example
 * ```ts
 * /@AfterRead()
 * private async addHeader(@Req() req: Request, @Res() res: RequestResponse | undefined): Promise<void> {
 *   res?.setHeader('Accept-Language', 'de-DE');
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#res | CDS-TS-Dispatcher - @Res}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Res
 */
function Res(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RES',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with a single `req.query[key][property]` value (`INSERT`, `SELECT`,
 * `UPDATE`, `UPSERT`, `DELETE`).
 *
 * @remarks
 * `key` gates which `property` names type-check (e.g. `'SELECT'` accepts `'columns' | 'where' |
 * 'orderBy' | ...`, `'UPDATE'` accepts `'data' | 'entity' | 'where'`) — see `GetQueryType` for the full,
 * per-key property map. Pairs with `@IsPresent` to check existence before reading the value.
 *
 * @example
 * ```ts
 * /@BeforeCreate()
 * public async beforeCreate(@Req() req: Request<Book>, @GetQuery('INSERT', 'columns') columns: GetQueryType['columns']['forInsert']): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#getquery | CDS-TS-Dispatcher - @GetQuery}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § GetQuery
 */
function GetQuery<Key extends CRUDQueryKeys>(key: Key, property: PickQueryPropsByKey<Key>): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'GET_QUERY',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'QUERY', parameterIndex, property, key },
    });
  };
}

/**
 * Annotates a parameter of a method with a single named property of the `Request` object (e.g.
 * `'locale'`, `'method'`, `'tenant'`).
 *
 * @remarks
 * A convenience projection of `@Req` for when the handler only needs one or two properties instead of
 * the whole object. `property` excludes the `Request` action methods (`reject`, `notify`, `reply`,
 * `warn`, `error`) — those are not gettable properties. Several properties have their own dedicated,
 * typed decorator instead (`@Data`, `@UserInfo`, `@Tenant`, `@Locale`, `@Subject`).
 *
 * @example
 * ```ts
 * /@AfterRead()
 * private async enrich(@Results() results: Book[], @GetRequest('locale') locale: Request['locale']): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#getrequest | CDS-TS-Dispatcher - @GetRequest}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § GetRequest
 */
function GetRequest(property: CustomRequest): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'GET_REQUEST',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'REQ', parameterIndex, property },
    });
  };
}

/**
 * Annotates a parameter of a method with a `boolean`: whether `field` was supplied as a column in the
 * request's `INSERT`, `UPSERT` or `SELECT` query.
 *
 * @remarks
 * For `INSERT` / `UPSERT`: an explicit `.columns` list wins when present; otherwise suppliedness is
 * derived from the `entries` keys (the shape protocol creates produce; ANY entry supplying the field
 * counts); `false` when neither is present. For `SELECT`: inspects the `SELECT.columns` refs. Always `undefined` (never set) on
 * `UPDATE` / `DELETE` requests, which do not carry a `columns` list.
 *
 * @example
 * ```ts
 * /@BeforeCreate()
 * public async beforeCreate(@Req() req: Request<Book>, @IsColumnSupplied<Book>('price') priceSupplied: boolean): Promise<void> {
 *   if (priceSupplied) { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#iscolumnsupplied | CDS-TS-Dispatcher - @IsColumnSupplied}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § IsColumnSupplied
 */
function IsColumnSupplied<Key>(field: keyof Key): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_COLUMN_SUPPLIED',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'CHECK_COLUMN_VALUE', parameterIndex, property: field as string },
    });
  };
}

/**
 * Annotates a parameter of a method with a `boolean`: whether the current user has at least one of the
 * given roles (`req.user.is(role)`).
 *
 * @remarks
 * Logical `OR` across `roles` — `true` as soon as one matches. Role names correspond to the `@requires`
 * / `@restrict.grants.to` annotations in your CDS models.
 *
 * @example
 * ```ts
 * /@AfterRead()
 * private async enrich(@Results() results: Book[], @IsRole('Admin', 'Editor') isPrivileged: boolean): Promise<void> {
 *   if (isPrivileged) { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#isrole | CDS-TS-Dispatcher - @IsRole}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § IsRole
 */
function IsRole(...roles: string[]): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_ROLE',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'ROLE', parameterIndex, property: roles },
    });
  };
}

/**
 * Annotates a parameter of a method with a `boolean`: whether `req.query[key][property]` is present
 * (`INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`).
 *
 * @remarks
 * Same `key` / `property` pairing as `@GetQuery` (see `PickQueryPropsByKey` for the per-key property
 * union) but returns existence instead of the value — check with `@IsPresent` before reading with
 * `@GetQuery` when the property may legitimately be absent. Note protocol creates build
 * `INSERT...entries(data)` WITHOUT a `.columns` list — `('INSERT', 'columns')` answers `true` only
 * for queries that set columns explicitly (programmatic CQN).
 *
 * @example
 * ```ts
 * /@BeforeCreate()
 * public async beforeCreate(@Req() req: Request<Book>, @IsPresent('INSERT', 'columns') hasColumns: boolean): Promise<void> {
 *   if (hasColumns) { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#ispresent | CDS-TS-Dispatcher - @IsPresent}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § IsPresent
 */
function IsPresent<Key extends CRUDQueryKeys>(key: Key, property: PickQueryPropsByKey<Key>): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_PRESENT',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'QUERY', parameterIndex, property, key },
    });
  };
}

/**
 * Annotates a parameter of a method with the bearer `JWT` extracted from `req.http.req`'s
 * `Authorization` header.
 *
 * @remarks
 * Expects the `Bearer <token>` format. Resolves to `undefined` (with a warning logged) when the header
 * is missing or malformed — no throw for HTTP-borne requests, so narrow the `string | undefined` type
 * before use. NON-HTTP dispatches are the exception: without `req.http` (queued/scheduled tasks,
 * messaging events, programmatic `srv.run` outside an HTTP context) the underlying SDK helper throws —
 * only use `@Jwt` on handlers reached via HTTP.
 *
 * @example
 * ```ts
 * /@AfterRead()
 * private async enrich(@Results() results: Book[], @Jwt() token: string | undefined): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#jwt | CDS-TS-Dispatcher - @Jwt}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Jwt
 */
function Jwt(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'JWT',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the accumulated `@Validate` flags for the current invocation.
 *
 * @remarks
 * Only `@Validate` calls with `exposeValidatorResult: true` contribute a flag; each contributing call
 * adds one key named after its `action` (e.g. `isLowercase`, `endsWith`) to the injected object. If no
 * such `@Validate` decorates the same method, the parameter is never assigned and stays `undefined` (NOT
 * an empty object) — guard before reading a flag off it.
 *
 * @example
 * ```ts
 * /@BeforeCreate()
 * /@Validate<Book>({ action: 'isLowercase', exposeValidatorResult: true }, 'title')
 * public async beforeCreate(@Req() req: Request<Book>, @ValidationResults() validator: ValidatorFlags<'isLowercase'> | undefined): Promise<void> {
 *   if (validator?.isLowercase) { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#validationresults | CDS-TS-Dispatcher - @ValidationResults}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § ValidationResults
 */
function ValidationResults(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'VALIDATORS',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with `req.locale` — the negotiated locale of the current request.
 *
 * @remarks
 * A convenience projection of `@Req`; equivalent to `@GetRequest('locale')` typed as `string`.
 *
 * @example
 * ```ts
 * /@BeforeCreate()
 * public async beforeCreate(@Req() req: Request<Book>, @Locale() locale: string): Promise<void> {
 *   if (locale === 'en-US') { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#locale | CDS-TS-Dispatcher - @Locale}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Locale
 */
function Locale(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'LOCALE',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with a single value resolved from the project's `cds.env`
 * configuration, read at the given dotted `env` path.
 *
 * @remarks
 * `env` is a required, dotted property path into `T` (e.g. `'requires.db.kind'`) — the whole env object
 * is never injected. Type the generic with the consumer project's generated `CDS_ENV` (from the
 * `#dispatcher` postinstall alias) so the path and the parameter's type are both checked:
 * `@Env<CDS_ENV>('requires.db.kind')`. Reads `cds.env` directly, not the generated file, so the value
 * always reflects the live runtime configuration.
 *
 * @example
 * ```ts
 * import type { CDS_ENV } from '#dispatcher';
 *
 * /@BeforeCreate()
 * public async beforeCreate(@Req() req: Request<Book>, @Env<CDS_ENV>('requires.db.kind') dbKind: string): Promise<void> {
 *   if (dbKind === 'sqlite') { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#env | CDS-TS-Dispatcher - @Env}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Env
 */

function Env<T>(env: PropertyStringPath<T>): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'ENV',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'ENV', parameterIndex, property: env },
    });
  };
}

/**
 * Annotates a parameter of a method with `req.subject` — the CQN `ref` identifying the request's target
 * instance.
 *
 * @remarks
 * The sanctioned replacement for `req.query` on bound actions/functions since `@sap/cds` 10 (`req.query`
 * on bound operations is planned for removal in `@sap/cds` 11) — use it to resolve the entity instance a
 * bound `@OnBoundAction` / `@OnBoundFunction` was invoked on. `ref | undefined`: `undefined` on unbound
 * operations (no query, no target); on plain CRUD requests it resolves to the target ref derived from the
 * query (`SELECT.from` / `INSERT.into` / `UPSERT.into` / `UPDATE.entity` / `DELETE.from`).
 *
 * @example
 * ```ts
 * /@OnBoundFunction(Book.actions.someFunction)
 * public async someBoundFunction(@Req() req: Request, @Subject() subject: ref | undefined): Promise<void> {
 *   if (subject) {
 *     const instance = await SELECT.one.from(subject);
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#subject | CDS-TS-Dispatcher - @Subject}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Subject
 */
function Subject(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'SUBJECT',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of an `@After*` handler with the database `affected` row count of the current
 * request.
 *
 * @remarks
 * Populated for `CREATE` / `UPDATE` / `DELETE` under `@sap/cds` >= 10 (the row count reported by the
 * database); `undefined` for `READ`. Independent of `@Results` / `@Result` — it does not change what
 * they receive, it only exposes the raw count.
 *
 * @example
 * ```ts
 * /@AfterDelete()
 * public async afterDelete(@Req() req: Request<Book>, @Affected() affected: number | undefined): Promise<void> {
 *   req.notify(`Deleted ${affected} row(s)`);
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#affected | CDS-TS-Dispatcher - @Affected}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Affected
 */
function Affected(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'AFFECTED',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with `req.data` — the payload of the current request, typed.
 *
 * @remarks
 * Keeps handler signatures (and their unit tests) simple: pass a plain object instead of mocking the
 * whole `Request`. For a single field instead of the whole payload, use `@Param`.
 *
 * @example
 * ```ts
 * /@OnCreate()
 * public async onCreate(@Data() data: Book): Promise<Book> {
 *   return data;
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#data | CDS-TS-Dispatcher - @Data}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Data
 */
function Data(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'DATA',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with `req.data[field]` — a single field of the current request's
 * payload.
 *
 * @remarks
 * A narrower alternative to `@Data` when the handler only needs one or two fields. Repeatable — decorate
 * as many parameters as the fields you need.
 *
 * @example
 * ```ts
 * /@OnCreate()
 * public async onCreate(@Param<Book>('title') title: string, @Param<Book>('stock') stock: number): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#param | CDS-TS-Dispatcher - @Param}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Param
 */
function Param<T = Record<string, any>>(field: Extract<keyof T, string>): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'PARAM',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'DATA_PARAM', parameterIndex, property: field },
    });
  };
}

/**
 * Annotates a parameter of a method with `req.user` — the authenticated user of the current request.
 *
 * @remarks
 * A convenience projection of `@Req`; equivalent to `@GetRequest('user')` typed as `User`. Combine with
 * `user.is(role)` for ownership/authorization checks, or use `@IsRole` for a ready-made `boolean`.
 *
 * @example
 * ```ts
 * /@OnUpdate()
 * public async onUpdate(@UserInfo() user: User): Promise<void> {
 *   if (user.is('Manager')) { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#userinfo | CDS-TS-Dispatcher - @UserInfo}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § UserInfo
 */
function UserInfo(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'USER_INFO',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with `req.tenant` — the tenant of the current request.
 *
 * @remarks
 * A convenience projection of `@Req`; equivalent to `@GetRequest('tenant')`. `undefined` in
 * single-tenant setups and for requests without a resolved tenant.
 *
 * @example
 * ```ts
 * /@OnRead()
 * public async onRead(@Tenant() tenant: string | undefined): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#tenant | CDS-TS-Dispatcher - @Tenant}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Tenant
 */
function Tenant(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'TENANT',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with `await req.diff()` — CAP's deep before/after change-set of the
 * request against the current database state (compositions expanded, draft-aware).
 *
 * @remarks
 * The only `async` parameter decorator: it costs one extra database read on `UPDATE` / `DELETE` (none
 * on `CREATE`) and resolves a microtask later
 * than sibling handlers on the same event — do not rely on synchronous ordering against them. Not
 * supported on `@OnError` (which runs synchronously). `req.diff()` is a semi-stable, undocumented
 * `@sap/cds` API; on `@sap/cds` 10 an `UPDATE` diff carries the NEW values at the top level, the OLD
 * values nested under `_old`, plus an `_op` marker — unchanged fields are omitted, key fields are always
 * present. Do not assume `diff.<field>` is the old value.
 *
 * @example
 * ```ts
 * /@BeforeUpdate()
 * public async beforeUpdate(@Req() req: Request<Book>, @Diff() diff: Book): Promise<void> { ... }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#diff | CDS-TS-Dispatcher - @Diff}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Diff
 */
function Diff(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'DIFF',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

export {
  Msg,
  SingleInstanceSwitch,
  Error,
  Next,
  Result,
  Results,
  Req,
  Res,
  GetQuery,
  GetRequest,
  IsColumnSupplied,
  IsRole,
  IsPresent,
  Jwt,
  ValidationResults,
  Locale,
  Env,
  Subject,
  Affected,
  Data,
  Param,
  UserInfo,
  Tenant,
  Diff,
};
