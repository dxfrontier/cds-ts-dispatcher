/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import cds, { CdsFunction } from '@sap/cds';

import util from '../util/util';
import CDS_DISPATCHER from '../constants/constants';
import constants from '../constants/internalConstants';

import { Container } from 'inversify';
import { MiddlewareEntityRegistry } from '../util/middleware/MiddlewareEntityRegistry';
import { MetadataDispatcher } from './MetadataDispatcher';

import type {
  NonEmptyArray,
  BaseHandler,
  Constructable,
  EventMessagingOptions,
  REQUEST_LIFECYCLE_EVENTS,
  ScheduleTaskBuilder,
} from '../types/internalTypes';
import type { Request, ScheduleOptions, Service, ServiceImpl } from '../types/types';

/**
 * Narrow view of the `request lifecycle` API of a CAP event context.
 *
 * `cds-types` types `before` / `on` only with their `literal` phases and does not declare `context` (the `root`
 * event context) on `Request` at all, so the dispatcher casts to this local shape - same approach as
 * `parameterUtil.retrieveAffected`. The `symbol` index carries the `attached once` marker of the root context.
 */
type RequestLifecycleContext = {
  context?: RequestLifecycleContext;
  before: (event: string, listener: () => Promise<void>) => void;
  on: (event: string, listener: () => Promise<void>) => void;
  /** `EventContext._set` / its lazily created `_emitter` - what the `emitter` getter of a ROOT context needs. */
  _set?: (property: string, value: unknown) => unknown;
  _emitter?: unknown;
  [marker: symbol]: unknown;
};

/** `cds.on` is process-global: a `@ServerLifecycle` class registers once, no matter how many dispatchers list it. */
const registeredServerLifecycleClasses = new WeakSet<Constructable>();

/**
 * `CDSDispatcher` is responsible for managing and registering event handlers for entities within the CDS framework.
 *
 * It supports events such as `Before`, `After`, `On`, and `Prepend`.
 */
class CDSDispatcher {
  /**
   * The service instance used by the dispatcher.
   *
   * This is the service that the dispatcher will interact with to register handlers and perform operations.
   */
  private srv: Service;

  /**
   * The dependency injection container for managing service instances and dependencies.
   *
   * This container is configured to:
   * - Skip base class checks.
   * - Automatically bind injectable classes.
   */
  private readonly container: Container = new Container({ autobind: true });

  /**
   * Creates an instance of `CDSDispatcher`.
   *
   * @param entities - An array of entity classes to manage event handlers for.
   * @example
   * ```typescript
   * export = new CDSDispatcher([Entity1, Entity2, EntityN]).initialize();
   * ```
   */
  constructor(private readonly entities: NonEmptyArray<Constructable>) {}

  /**
   * Stores the service instance.
   *
   * @param srv - The service instance.
   */
  private storeService(srv: Service): void {
    this.srv = srv;
  }

  /**
   * Executes a 'before' event handler.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   * @param req - The request object.
   * @returns The result of the handler's callback.
   */
  private async executeBeforeCallback(handlerAndEntity: [BaseHandler, Constructable], req: Request): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    return await handler.callback.call(entity, req);
  }

  /**
   * Executes an 'onError' event handler.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   * @param err - The error object.
   * @param req - The request object.
   * @returns The result of the handler's callback.
   */
  private executeOnErrorCallback(
    handlerAndEntity: [BaseHandler, Constructable],
    err: Error,
    req: Request,
  ): unknown | void {
    const [handler, entity] = handlerAndEntity;
    return handler.callback.call(entity, err, req);
  }

  /**
   * Executes an 'on' event handler.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   * @param req - The request object.
   * @param next - The next middleware function.
   * @returns The result of the handler's callback.
   */
  private async executeOnCallback(
    handlerAndEntity: [BaseHandler, Constructable],
    req: Request,
    next: Function,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    return await handler.callback.call(entity, req, next);
  }

  /**
   * Executes an 'after' event handler.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   * @param req - The request object.
   * @param results - The result of the request.
   * @returns The result of the handler's callback.
   */
  private async executeAfterCallback(
    handlerAndEntity: [BaseHandler, Constructable],
    req: Request,
    results: unknown | unknown[] | number,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;

    // Capture the raw database `affected` row count and stash it on the request under a `Symbol`
    // (see `@Affected` parameter decorator). Done BEFORE the normalization below, which discards it.
    if (Array.isArray(results) && 'affected' in results) {
      (req as unknown as Record<symbol, number | undefined>)[constants.AFFECTED] = (
        results as { affected?: number }
      ).affected;
    } else if (!Array.isArray(results) && util.lodash.isNumber(results)) {
      (req as unknown as Record<symbol, number | undefined>)[constants.AFFECTED] = results as number;
    }

    // `@sap/cds` >= 10: the generic CREATE/UPDATE/UPSERT/DELETE handlers return an array
    // carrying an `.affected` property instead of `req.data` / the delete count. Restore the
    // pre-cds-10 contract of the `@After*` decorators (DELETE -> boolean, CREATE/UPDATE -> data).
    if (Array.isArray(results) && 'affected' in results) {
      const { affected } = results as { affected?: number };
      results = req.event === 'DELETE' ? affected === 1 : req.data;
    } else if (!Array.isArray(results) && util.lodash.isNumber(results)) {
      // `@sap/cds` 9: DELETE single request returned the affected row count as a number.
      results = results === 1;
    }

    // READ entity set, CREATE, READ, UPDATE - single request, DELETE - single request
    return await handler.callback.call(entity, results, req);
  }

  /**
   * Executes a `scheduled task outcome` event handler (`@OnScheduledSuccess`, `@OnScheduledFailure`).
   *
   * Deliberately `bypasses` `executeAfterCallback`: its cds-10 `affected` normalization would corrupt raw task
   * results (a numeric result `1` would become `true`), so the task `result` / `error` is passed through untouched.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   * @param req - The request object.
   * @param data - The `result` of the task (`#succeeded`) or its `serialized` failure (`#failed`), which CAP
   * delivers as a plain object (`{ name, message, stack, code, ... }`), NOT as an `Error` instance.
   * @returns The result of the handler's callback.
   */
  private async executeScheduledOutcomeCallback(
    handlerAndEntity: [BaseHandler, Constructable],
    req: Request,
    data: unknown,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    return await handler.callback.call(entity, data, req);
  }

  /**
   * Returns the active entity or the draft entity of the current handler class.
   *
   * @param handler - The handler instance.
   * @param entityInstance - The entity instance.
   * @returns The active `entity` or `draft entity`, or `undefined` for Unbound actions
   */
  private getActiveEntityOrDraft(handler: BaseHandler, entityInstance: Constructable): string | undefined {
    const entity = MetadataDispatcher.getEntity(entityInstance);

    if (util.lodash.isUndefined(entity)) {
      return;
    }

    const getEntityName = () => {
      if (entity.name) {
        return handler.isDraft ? entity.drafts.name : entity.name;
      }
    };

    const getAllEntitiesStar = () => {
      if (typeof entity === 'string' && entity === CDS_DISPATCHER.ALL_ENTITIES) {
        return CDS_DISPATCHER.ALL_ENTITIES;
      }
    };

    return getEntityName() ?? getAllEntitiesStar();
  }

  /**
   * Retrieves the properties of the handler.
   *
   * @param handler - The handler instance.
   * @param entityInstance - The entity instance.
   * @returns The handler properties.
   */
  private getHandlerProps(handler: BaseHandler, entityInstance: Constructable) {
    const entity = this.getActiveEntityOrDraft(handler, entityInstance);
    const { event } = handler;

    const defaultProps = { event, entity };

    // PUBLIC routines for this func
    const getDefault = () => ({ ...defaultProps });

    const getAction = () => {
      const _getDefaultAction = () => {
        if (handler.type === 'ACTION_FUNCTION') {
          return handler.actionName;
        }
      };

      const _getPrependAction = () => {
        if (handler.type === 'PREPEND' && ['ACTION', 'FUNC', 'BOUND_ACTION', 'BOUND_FUNC'].includes(handler.event)) {
          return handler.options;
        }
      };

      return { actionName: _getDefaultAction() ?? _getPrependAction()?.actionName };
    };

    const getMessagingEvent = () => {
      if (handler.type === 'EVENT' && handler.event === 'MESSAGING_EVENT') {
        if (util.lodash.isUndefined(handler.options.showReceiverMessage)) {
          handler.options.showReceiverMessage = false;
        }

        if (util.lodash.isUndefined(handler.options.consoleStyle)) {
          handler.options.consoleStyle = 'debug';
        }

        // Overwrite the eventName by extract string after last '.'
        handler.options.eventName = util.subtractLastDotString(handler.options.eventName as string);

        return { options: handler.options };
      }
    };

    const getEvent = () => {
      // PRIVATE routine for this func
      const _constructEventName = () => {
        const _getDefaultEvent = () => {
          if (handler.type === 'EVENT' && handler.event !== 'MESSAGING_EVENT') {
            return handler.eventName;
          }
        };

        const _getPrependEvent = () => {
          if (handler.type === 'PREPEND' && handler.event === 'EVENT') {
            return handler.options.eventName;
          }
        };

        const eventName: string | undefined = _getDefaultEvent() ?? _getPrependEvent();

        if (!util.lodash.isUndefined(eventName)) {
          return util.subtractLastDotString(eventName);
        }
      };

      return { eventName: _constructEventName() };
    };

    // Get all properties for 'OnAction', 'OnBoundAction', 'OnFunction', 'OnBoundFunction'
    const getPrepend = () => {
      const eventKind = handler.type === 'PREPEND' ? handler.eventKind : undefined;

      return { eventKind };
    };

    // Get the verbatim task name and (optional) schedule options for '@OnScheduled' / '@Schedule' and the
    // verbatim task name for '@OnScheduledSuccess' / '@OnScheduledFailure'
    const getScheduled = () => {
      if (handler.type === 'SCHEDULED') {
        return { taskName: handler.taskName, scheduleOptions: handler.scheduleOptions };
      }

      if (handler.type === 'SCHEDULED_OUTCOME') {
        return { taskName: handler.taskName, scheduleOptions: undefined };
      }

      return { taskName: undefined, scheduleOptions: undefined };
    };

    return { getDefault, getAction, getEvent, getPrepend, getMessagingEvent, getScheduled };
  }

  /**
   * Registers all `PREPEND` event handlers.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private registerPrependHandler(handlerAndEntity: [BaseHandler, Constructable]) {
    const { eventKind } = this.getHandlerProps(...handlerAndEntity).getPrepend();

    void this.srv.prepend(() => {
      switch (eventKind) {
        case 'BEFORE':
          this.registerBeforeHandler(handlerAndEntity);
          break;

        case 'AFTER':
          this.registerAfterHandler(handlerAndEntity);
          break;

        case 'AFTER_SINGLE':
          this.registerAfterSingleInstanceHandler(handlerAndEntity);
          break;

        case 'ON':
          this.registerOnHandler(handlerAndEntity);
          break;

        default:
          util.throwErrorMessage(`Unexpected eventKind: ${eventKind}`);
      }
    });
  }

  /**
   * Registers `AFTER - SingleInstance` event handlers.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private registerAfterSingleInstanceHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity).getDefault();

    this.srv.after(event, entity!, async (data, req) => {
      const singleInstance = req.params && req.params.length > 0;

      if (singleInstance) {
        return await this.executeAfterCallback(handlerAndEntity, req, util.getArrayFirstItem(data));
      }
    });
  }

  /**
   * Registers all `AFTER` event handlers.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private registerAfterHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const getProps = this.getHandlerProps(...handlerAndEntity);

    const { event, entity } = getProps.getDefault();
    const { actionName } = getProps.getAction();

    switch (event) {
      case 'ACTION':
      case 'FUNC': {
        this.srv.after(actionName! as CdsFunction, async (data, req) => {
          return await this.executeAfterCallback(handlerAndEntity, req, data);
        });

        break;
      }

      case 'BOUND_ACTION':
      case 'BOUND_FUNC': {
        this.srv.after(actionName as CdsFunction, entity as string, async (data, req) => {
          return await this.executeAfterCallback(handlerAndEntity, req, data);
        });

        break;
      }

      case 'SCHEDULED_SUCCESS':
      case 'SCHEDULED_FAILURE': {
        const { taskName } = getProps.getScheduled();
        const outcome = event === 'SCHEDULED_SUCCESS' ? '#succeeded' : '#failed';

        // The task name is composed `verbatim` (NO dot-stripping), like the '@OnScheduled' handler itself.
        this.srv.after(`${taskName}/${outcome}`, async (data, req) => {
          return await this.executeScheduledOutcomeCallback(handlerAndEntity, req, data);
        });

        break;
      }

      // CRUD_EVENTS[NEW, CANCEL, CREATE, READ, UPDATE, DELETE, EDIT, SAVE]
      default: {
        this.srv.after(event, entity!, async (data, req) => {
          return await this.executeAfterCallback(handlerAndEntity, req, data);
        });
      }
    }
  }
  /**
   * Registers all `BEFORE` event handlers.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private registerBeforeHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const getProps = this.getHandlerProps(...handlerAndEntity);

    const { event, entity } = getProps.getDefault();
    const { actionName } = getProps.getAction();

    switch (event) {
      case 'ACTION':
      case 'FUNC': {
        this.srv.before(actionName!, async (req) => {
          return await this.executeBeforeCallback(handlerAndEntity, req);
        });

        break;
      }

      case 'BOUND_ACTION':
      case 'BOUND_FUNC': {
        this.srv.before(actionName!, entity!, async (req) => {
          return await this.executeBeforeCallback(handlerAndEntity, req);
        });

        break;
      }

      // CRUD_EVENTS[NEW, CANCEL, CREATE, READ, UPDATE, DELETE, EDIT, SAVE]
      default: {
        this.srv.before(event, entity!, async (req) => {
          return await this.executeBeforeCallback(handlerAndEntity, req);
        });
      }
    }
  }

  /**
   * Registers all `REQUEST_LIFECYCLE` event handlers (`@BeforeCommit`, `@AfterCommit`, `@AfterRollback`,
   * `@OnRequestDone`) of a handler class.
   *
   * The hooks live on the `ROOT` event context of the request (`req.before('commit')` /
   * `req.on('succeeded' | 'failed' | 'done')`), which CAP emits `once` per root request. They are attached by one
   * generic `before` handler per class, registered through `prepend` so the hooks are in place before any consumer
   * `before` handler can reject the request.
   *
   * @param handlers - The `REQUEST_LIFECYCLE` handlers of the class.
   * @param entityInstance - The entity instance.
   */
  private registerRequestLifecycleHandlers(handlers: BaseHandler[], entityInstance: Constructable): void {
    // The CAP root context events (+ decorator names, for logging) of the four request lifecycle events.
    const lifecycleEvents = {
      BEFORE_COMMIT: { event: 'commit', decorator: '@BeforeCommit' },
      AFTER_COMMIT: { event: 'succeeded', decorator: '@AfterCommit' },
      AFTER_ROLLBACK: { event: 'failed', decorator: '@AfterRollback' },
      REQUEST_DONE: { event: 'done', decorator: '@OnRequestDone' },
    } as const;

    // 'undefined' for '@UnboundActions' classes (service-wide), '*' for 'ALL_ENTITIES' ones.
    const entity = this.getActiveEntityOrDraft(handlers[0], entityInstance);
    const className = entityInstance.constructor.name;

    // Marker of this class registration: the generic 'before' handler below fires per SUB-request, while the
    // hooks must be attached ONCE per ROOT request. Each '$batch' changeset is a new root context, so the
    // hooks are attached again there - which is exactly the wanted 'once per changeset' semantic.
    const attached = Symbol('CDS_DISPATCHER_REQUEST_LIFECYCLE');

    const attach = (req: Request): void => {
      try {
        const request = req as unknown as RequestLifecycleContext;
        const root = request.context ?? request;

        // Only a REAL event context can host the hooks: 'req.before' / 'req.on' write to the SHARED emitter
        // of the root context ('this.context._emitter || this.context._set("_emitter", ...)'), so a root
        // which can neither hold nor create it is skipped. Not hypothetical - the persistent event queue
        // dispatches its background processing with a real 'cds.Request' (so 'before' / 'on' ARE functions)
        // whose 'context' is the JSON-deserialized, PLAIN-OBJECT task context: attaching there throws
        // 'this.context._set is not a function' inside cds and takes the queue (and the db) down. Those
        // dispatches are queue INFRASTRUCTURE, not consumer requests - they have no lifecycle to hook into.
        // ('root instanceof cds.EventContext' discriminates the same way - verified on the reproduction -
        // but this capability check tests exactly what the emitter getter needs.)
        const canHostHooks = typeof root._set === 'function' || Boolean(root._emitter);
        const hasLifecycleApi = typeof request.before === 'function' && typeof request.on === 'function';

        if (!hasLifecycleApi || !canHostHooks) {
          return;
        }

        if (root[attached]) {
          return;
        }

        root[attached] = true;

        (Object.keys(lifecycleEvents) as REQUEST_LIFECYCLE_EVENTS[]).forEach((kind) => {
          // One listener per event, so the callbacks of the class run sequentially in metadata (declaration)
          // order - 'req.before' is a 'prependListener', which would reverse a per-callback attachment.
          const callbacks = handlers.filter((handler) => handler.event === kind);

          if (callbacks.length === 0) {
            return;
          }

          const { event, decorator } = lifecycleEvents[kind];

          // '@BeforeCommit' runs INSIDE the transaction and vetoes the request by throwing - errors propagate.
          if (kind === 'BEFORE_COMMIT') {
            request.before(event, async () => {
              for (const handler of callbacks) {
                await handler.callback.call(entityInstance, req);
              }
            });

            return;
          }

          // The other three run OUTSIDE any transaction, on an already closed one: an error thrown here would
          // make CAP error the response of a durably committed request, so it is logged and NEVER rethrown.
          request.on(event, async () => {
            for (const handler of callbacks) {
              try {
                await handler.callback.call(entityInstance, req);
              } catch (error) {
                console.error(
                  util.showRedConsole(`[CDS-TS-Dispatcher] ${decorator} handler in '${className}' failed.`),
                  error,
                );
              }
            }
          });
        });
      } catch (error) {
        // Belt and braces: attaching runs in the 'before' phase of EVERY request, so a failure here must
        // degrade to 'no lifecycle hooks for this dispatch' - never to a rejected request or a dead queue.
        console.error(
          util.showRedConsole(`[CDS-TS-Dispatcher] request-lifecycle attach skipped for '${className}'.`),
          error,
        );
      }
    };

    void this.srv.prepend(() => {
      if (entity) {
        this.srv.before('*', entity, attach);
        return;
      }

      this.srv.before('*', attach);
    });
  }

  /**
   * Registers all `SERVER_LIFECYCLE` event handlers (`@OnServed`, `@OnListening`, `@OnShutdown`) of a
   * `@ServerLifecycle` class against CAP's `process-global` `cds.on('served' | 'listening' | 'shutdown', ...)`.
   *
   * `cds.on` is process-global infrastructure, not `srv`-scoped: a class is registered `once per process`, no
   * matter how many `CDSDispatcher` instances (or bootstraps, e.g. in tests) list it - tracked with a
   * module-level `WeakSet` keyed on the class constructor.
   *
   * @param handlers - The `SERVER_LIFECYCLE` handlers of the class.
   * @param entityInstance - The resolved instance hosting the handlers - `handler.callback` is bound to it, so
   * `this` inside the decorated method is the real (DI-resolved) instance.
   */
  private registerServerLifecycleHandlers(handlers: BaseHandler[], entityInstance: Constructable): void {
    const targetClass = entityInstance.constructor as unknown as Constructable;

    if (registeredServerLifecycleClasses.has(targetClass)) {
      return;
    }

    registeredServerLifecycleClasses.add(targetClass);

    handlers.forEach((handler) => {
      if (handler.type !== 'SERVER_LIFECYCLE') {
        return;
      }

      const listener = (...args: unknown[]): unknown => handler.callback.call(entityInstance, ...args);

      // cds.on is typed with one overload per literal event name - an exhaustive switch keeps the
      // literal types intact (a Record<..., string> lookup widens to string and breaks the dts build).
      switch (handler.event) {
        case 'SERVED':
          cds.on('served', listener);
          break;

        case 'LISTENING':
          cds.on('listening', listener);
          break;

        case 'SHUTDOWN':
          cds.on('shutdown', listener);
          break;
      }
    });
  }

  private async registerMessagingEvent(message: {
    options: EventMessagingOptions;
    handlerAndEntity: [BaseHandler, Constructable];
  }) {
    const { showReceiverMessage, consoleStyle, type, eventName } = message.options;

    const callback = async (req: Request, next: Function) => {
      if (showReceiverMessage) {
        if (consoleStyle === 'table') {
          const text = `> received: ${eventName}`;

          console.log(util.showGreenConsole(text));
          console.table(...[req.data]);
        } else {
          const text = `> received: ${eventName}`;

          console.debug(util.showGreenConsole(text), req.data);
        }
      }

      return this.executeOnCallback(message.handlerAndEntity, req, next);
    };

    let eventSource: Service;

    switch (type) {
      case 'SAME_NODE_PROCESS':
        eventSource = this.srv;
        break;

      case 'SAME_NODE_PROCESS_DIFFERENT_SERVICE':
        eventSource = await cds.connect.to(message.options.externalServiceName);
        break;

      default: // 'MESSAGING'
        eventSource = await cds.connect.to('messaging');
    }

    eventSource.on(eventName as string, callback);
  }

  /**
   * Registers all `ON` event handlers.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private async registerOnHandler(handlerAndEntity: [BaseHandler, Constructable]): Promise<void> {
    const getProps = this.getHandlerProps(...handlerAndEntity);

    const { event, entity } = getProps.getDefault();
    const { actionName } = getProps.getAction();
    const { eventName } = getProps.getEvent();

    switch (event) {
      case 'ACTION':
      case 'FUNC': {
        this.srv.on(actionName!, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });

        break;
      }

      case 'BOUND_ACTION':
      case 'BOUND_FUNC': {
        this.srv.on(actionName!, entity!, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });

        break;
      }

      case 'MESSAGING_EVENT': {
        const messagingProps = getProps.getMessagingEvent()!;

        this.registerMessagingEvent({
          options: messagingProps.options,
          handlerAndEntity,
        });

        break;
      }

      case 'EVENT': {
        this.srv.on(eventName!, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });

        break;
      }

      case 'SCHEDULED_EVENT': {
        const { taskName, scheduleOptions } = getProps.getScheduled();

        // Register the task handler `verbatim` - NO dot-stripping (unlike the 'EVENT' case), so
        // fully-qualified task names survive intact.
        this.srv.on(taskName!, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });

        // '@Schedule' additionally schedules the recurring singleton task at bootstrap.
        if (scheduleOptions) {
          this.scheduleRecurringTask(scheduleOptions);
        }

        break;
      }

      case 'ERROR':
        this.srv.on('error', (err, req) => {
          return this.executeOnErrorCallback(handlerAndEntity, err, req);
        });

        break;

      // CRUD_EVENTS[NEW, CANCEL, CREATE, READ, UPDATE, DELETE, EDIT, SAVE]
      default: {
        this.srv.on(event, entity!, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });
      }
    }
  }

  /**
   * Schedules a `recurring singleton` task at bootstrap for a `@Schedule` handler.
   *
   * Deferred to `cds.once('served')` so the service, database and queue are ready. `.every(every).as(name)`
   * makes the task a named singleton, so re-scheduling on every boot `upserts` rather than duplicates.
   *
   * Failures are logged `loudly` (naming the task) but never crash the consumer's boot - scheduling
   * infrastructure (`db` + `queue`) may simply be missing in the current profile.
   *
   * @param options - The `@Schedule` options (task name, recurrence, optional payload).
   */
  private scheduleRecurringTask(options: ScheduleOptions): void {
    const { name, every, data } = options;

    cds.once('served', async () => {
      try {
        // `FluentScheduling` only types `after` / `every`; the runtime builder also exposes `.as(name)`.
        await (this.srv.schedule(name, data).every(every) as unknown as ScheduleTaskBuilder).as(name);
      } catch (error) {
        console.error(
          util.showRedConsole(
            `[CDS-TS-Dispatcher] @Schedule failed to schedule task '${name}'. ` +
              `The scheduling infrastructure (db + queue) may be missing or misconfigured in this profile. ` +
              `The task handler is still registered and will run if the task is dispatched by other means.`,
          ),
          error,
        );
      }
    });
  }

  /**
   * Builds the handler by type.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private buildHandlerBy(handlerAndEntity: [BaseHandler, Constructable]) {
    const [handler] = handlerAndEntity;

    switch (handler.eventKind) {
      case 'BEFORE':
        this.registerBeforeHandler(handlerAndEntity);
        break;

      case 'AFTER':
        this.registerAfterHandler(handlerAndEntity);
        break;

      case 'AFTER_SINGLE': {
        this.registerAfterSingleInstanceHandler(handlerAndEntity);
        break;
      }

      case 'ON':
        this.registerOnHandler(handlerAndEntity);
        break;

      case 'PREPEND': {
        this.registerPrependHandler(handlerAndEntity);
        break;
      }
    }
  }

  /**
   * Builds middleware for the entity instance.
   *
   * @param entityInstance - The entity instance.
   */
  private buildMiddlewareBy(entityInstance: Constructable): void {
    const middlewareRegistry = new MiddlewareEntityRegistry(entityInstance, this.srv);

    if (middlewareRegistry.hasEntityMiddlewaresAttached()) {
      middlewareRegistry.buildMiddlewares();
    }
  }

  /**
   * Gets the handlers for the entity instance.
   *
   * @param entityInstance - The entity instance.
   * @returns The handler registration functions if handlers are found.
   */
  private getHandlersBy(entityInstance: Constructable) {
    const handlers = MetadataDispatcher.getMetadataHandlers(entityInstance);
    const isServerLifecycleClass = MetadataDispatcher.isServerLifecycle(entityInstance);
    const serverLifecycle = (handlers ?? []).filter((handler) => handler.type === 'SERVER_LIFECYCLE');

    if (!isServerLifecycleClass && serverLifecycle.length > 0) {
      util.throwErrorMessage(
        util.buildMessage(constants.MESSAGES.SERVER_LIFECYCLE_WRONG_HOST, {
          className: entityInstance.constructor?.name ?? 'Unknown',
        }),
      );
    }

    if (isServerLifecycleClass) {
      if ((handlers ?? []).some((handler) => handler.type !== 'SERVER_LIFECYCLE')) {
        util.throwErrorMessage(
          util.buildMessage(constants.MESSAGES.SERVER_LIFECYCLE_FOREIGN_HANDLERS, {
            className: entityInstance.constructor?.name ?? 'Unknown',
          }),
        );
      }

      if ((MetadataDispatcher.getMiddlewares(entityInstance) ?? []).length > 0) {
        util.throwErrorMessage(
          util.buildMessage(constants.MESSAGES.SERVER_LIFECYCLE_MIDDLEWARE, {
            className: entityInstance.constructor?.name ?? 'Unknown',
          }),
        );
      }

      if (serverLifecycle.length === 0) {
        return undefined;
      }

      return {
        buildHandlers: (): void => {
          this.registerServerLifecycleHandlers(serverLifecycle, entityInstance);
        },
        buildMiddlewares: (): void => {
          // '@ServerLifecycle' classes host no request handlers - nothing to middleware-wrap.
        },
      };
    }

    if (handlers?.length > 0) {
      return {
        buildHandlers: (): void => {
          // The 'REQUEST_LIFECYCLE' handlers share ONE generic attach handler and are therefore registered
          // once for the whole class, all the other handlers are registered one by one.
          const lifecycle = handlers.filter((handler) => handler.type === 'REQUEST_LIFECYCLE');

          handlers
            .filter((handler) => handler.type !== 'REQUEST_LIFECYCLE')
            .forEach((handler) => {
              this.buildHandlerBy([handler, entityInstance]);
            });

          if (lifecycle.length > 0) {
            this.registerRequestLifecycleHandlers(lifecycle, entityInstance);
          }
        },

        buildMiddlewares: (): void => {
          this.buildMiddlewareBy(entityInstance);
        },
      };
    }

    return undefined;
  }

  /**
   * Registers a service as a constant in the container.
   * @param serviceKey - The key under which the service should be bound.
   * @param serviceValue - The value to bind as a constant.
   */
  private registerServiceAsConstant(serviceKey: string, serviceValue: Service): void {
    if (!this.container.isBound(serviceKey)) {
      this.container.bind<Service>(serviceKey).toConstantValue(serviceValue);
    }
  }

  private registerOutboxedAsConstant() {
    this.registerServiceAsConstant(CDS_DISPATCHER.OUTBOXED_SRV, cds.outboxed(this.srv));
  }

  private readonly registerSrvAsConstant = (): void => {
    this.registerServiceAsConstant(CDS_DISPATCHER.SRV, this.srv);
  };

  /**
   * Resolves dependencies for the entity.
   *
   * @param entity - The entity class.
   * @returns The resolved entity instance.
   */
  private resolveDependencies(entity: Constructable): Constructable {
    return this.container.get<typeof entity>(entity);
  }

  /**
   * Registers handlers for all entities.
   */
  private registerHandlers(): void {
    this.entities.forEach((entity: Constructable) => {
      const createdEntity = this.resolveDependencies(entity);
      const entityHandlers = this.getHandlersBy(createdEntity);

      if (entityHandlers) {
        entityHandlers.buildHandlers();
        entityHandlers.buildMiddlewares();
      }
    });
  }

  /**
   * Builds the service implementation.
   *
   * @returns The function that initializes the service.
   */
  private buildServiceImplementation() {
    return (srv: Service): void => {
      this.storeService(srv);
      this.registerOutboxedAsConstant();
      this.registerSrvAsConstant();
      this.registerHandlers();
    };
  }

  // PUBLIC ROUTINES

  /**
   * Initializes the entities within the `CDSDispatcher`, registering their corresponding handlers.
   *
   * @returns An instance of `ServiceImpl` representing the registered service implementation.
   */
  public initialize(): ServiceImpl {
    return cds.service.impl(this.buildServiceImplementation());
  }
}

export { CDSDispatcher };
