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
  ScheduleTaskBuilder,
} from '../types/internalTypes';
import type { Request, ScheduleOptions, Service, ServiceImpl } from '../types/types';

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

    // Get the verbatim task name and (optional) schedule options for '@OnScheduled' / '@Schedule'
    const getScheduled = () => {
      if (handler.type === 'SCHEDULED') {
        return { taskName: handler.taskName, scheduleOptions: handler.scheduleOptions };
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

    if (handlers?.length > 0) {
      return {
        buildHandlers: (): void => {
          handlers.forEach((handler) => {
            this.buildHandlerBy([handler, entityInstance]);
          });
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
