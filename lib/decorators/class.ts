import { injectable } from 'inversify';

import constants from '../constants/internalConstants';
import { MetadataDispatcher } from '../core/MetadataDispatcher';

import type { CDSTyperEntity } from '../types/types';
import type CDS_DISPATCHER from '../constants/constants';

/**
 * Binds the handler class to a CDS-Typer entity (or to every entity via `CDS_DISPATCHER.ALL_ENTITIES`)
 * and marks it inversify-injectable. Required host for entity event handlers.
 *
 * @remarks
 * The class only takes effect when passed to `new CDSDispatcher([...])` — otherwise it is silently
 * inert. Draft-variant method decorators inside this class target `<Entity>.drafts` automatically.
 * Unbound actions belong in an `@UnboundActions` class; server lifecycle hooks in `@ServerLifecycle`.
 *
 * @example
 * @EntityHandler(Book)
 * class BookHandler {
 *   @AfterRead()
 *   private async enrich(@Results() results: Book[], @Req() req: Request): Promise<void> { ... }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#entityhandler | CDS-TS-Dispatcher - @EntityHandler}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § EntityHandler
 */
function EntityHandler<T>(entity: CDSTyperEntity<T>): (target: new (...args: never) => unknown) => void;

function EntityHandler(entity: typeof CDS_DISPATCHER.ALL_ENTITIES): (target: new (...args: never) => unknown) => void;

function EntityHandler<T>(entity: CDSTyperEntity<T> | typeof CDS_DISPATCHER.ALL_ENTITIES) {
  return function <Target extends new (...args: never) => unknown>(target: Target): void {
    new MetadataDispatcher(target, constants.DECORATOR.ENTITY_HANDLER_NAME).addEntityHandlerMetadata(entity);

    injectable()(target);
  };
}

/**
 * Marks a class as a repository — CDS-QL-only data access code — and makes it inversify-injectable.
 *
 * @remarks
 * Not passed to `new CDSDispatcher([...])` directly: it only takes effect once `@Inject`ed — directly
 * or transitively — into a class that itself is in that array (an `@EntityHandler`, `@UnboundActions`
 * or `@ServerLifecycle` class); an `@Repository` class nobody injects is never instantiated. Pairs
 * optionally with the companion `@dxfrontier/cds-ts-repository` package's `BaseRepository<Entity>` for
 * ready-made CRUD. In the suggested Controller-Service-Repository layering, `@ServiceLogic` classes call
 * into repositories, not the other way around.
 *
 * @example
 * @Repository()
 * class BookRepository extends BaseRepository<Book> {
 *   constructor() {
 *     super(Book);
 *   }
 * }
 *
 * @EntityHandler(Book)
 * class BookHandler {
 *   @Inject(BookRepository) private repository: BookRepository;
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#repository | CDS-TS-Dispatcher - @Repository}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Repository
 */
function Repository<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * Marks a class as service logic (business rules) and makes it inversify-injectable, with an optional
 * dependency-injection `scope`.
 *
 * @remarks
 * `scope` defaults to `'Transient'` (a new instance per injection); `'Singleton'` shares ONE instance
 * app-wide — its property values persist across requests and are visible to every injector, so use it
 * only for genuinely shared state. Like `@Repository`, it is not passed to `new CDSDispatcher([...])`
 * directly: it takes effect once `@Inject`ed — directly or transitively — into a class that itself is in
 * that array; otherwise it is never instantiated.
 *
 * @example
 * @ServiceLogic('Singleton')
 * class BookService {
 *   private cache = new Map<string, Book>();
 * }
 *
 * @EntityHandler(Book)
 * class BookHandler {
 *   @Inject(BookService) private service: BookService;
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#servicelogic | CDS-TS-Dispatcher - @ServiceLogic}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § ServiceLogic
 */
function ServiceLogic<Target extends new (...args: never) => unknown>(scope?: 'Singleton' | 'Transient') {
  return function (target: Target) {
    injectable(scope)(target);
  };
}

/**
 * Marks a class as the host for a service's unbound actions/functions/events/errors and makes it
 * inversify-injectable.
 *
 * @remarks
 * Hosts `@OnAction`, `@OnFunction`, `@OnEvent`, `@OnError`, `@OnSubscribe` — decorators that belong to
 * the service itself, not to any single entity. Entity-scoped handlers belong in an `@EntityHandler`
 * class instead; server lifecycle hooks in `@ServerLifecycle`. Like `@EntityHandler`, the class only
 * takes effect when passed to `new CDSDispatcher([...])` — otherwise it is silently inert.
 *
 * @example
 * @UnboundActions()
 * class ActionsHandler {
 *   @OnAction(SubmitOrder)
 *   private async onSubmitOrder(
 *     @Req() req: ActionRequest<typeof SubmitOrder>,
 *     @Next() next: NextEvent,
 *   ): ActionReturn<typeof SubmitOrder> { ... }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#unboundactions | CDS-TS-Dispatcher - @UnboundActions}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § UnboundActions
 */
function UnboundActions<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * Marks a class as the host for the three `server lifecycle` method decorators and makes it
 * inversify-injectable. Registers their callbacks against CAP's `process-global`
 * `cds.on('served' | 'listening' | 'shutdown', ...)` events (NOT `srv.*`).
 *
 * @remarks
 * May host ONLY `@OnServed`, `@OnListening`, `@OnShutdown` — any other handler decorator throws at
 * bootstrap, and those three throw at bootstrap if hosted outside a `@ServerLifecycle` class. `@Use`
 * does not apply here either (lifecycle hooks are not request handlers) and fails fast at bootstrap.
 * Registers `once per process`: no matter how many `CDSDispatcher` instances (or bootstraps, e.g. in
 * tests) list the class, the `first` dispatcher to `initialize()` resolves the instance the callbacks
 * stay bound to; later ones do not re-register or re-bind. Like every handler class, it only takes
 * effect when passed to `new CDSDispatcher([...])` — otherwise it is silently inert.
 *
 * @example
 * @ServerLifecycle()
 * class Bootstrap {
 *   @OnServed()
 *   public async seed(services: object): Promise<void> { ... }
 *
 *   @OnListening()
 *   public logUrl(payload: { server: unknown; url: string }): void { ... }
 *
 *   @OnShutdown()
 *   public async cleanup(error: Error | null): Promise<void> { ... }
 * }
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#serverlifecycle | CDS-TS-Dispatcher - @ServerLifecycle}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § ServerLifecycle
 */
function ServerLifecycle<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    Reflect.defineMetadata(constants.DECORATOR.SERVER_LIFECYCLE_NAME, true, target);

    injectable()(target);
  };
}

export { EntityHandler, Repository, ServerLifecycle, ServiceLogic, UnboundActions };
