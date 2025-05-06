/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import cds from '@sap/cds';

import util from '../util/util';
import CDS_DISPATCHER from '../constants/constants';

import { Container } from 'inversify';
import { HandlerType } from '../types/enum';
import { MiddlewareEntityRegistry } from '../util/middleware/MiddlewareEntityRegistry';
import { MetadataDispatcher } from './MetadataDispatcher';

import type { NonEmptyArray, BaseHandler, Constructable, EventMessagingOptions } from '../types/internalTypes';
import type { Request, Service, ServiceImpl, SubscriberType } from '../types/types';

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
    req: Request | SubscriberType<any>,
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

    // DELETE single request
    if (!Array.isArray(results)) {
      // private routine for this func
      const _isDeleted = (result: unknown): boolean => result === 1;

      if (util.lodash.isNumber(results)) {
        results = _isDeleted(results);
      }
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

    return { getDefault, getAction, getEvent, getPrepend, getMessagingEvent };
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
    const { event, entity } = this.getHandlerProps(...handlerAndEntity).getDefault();

    this.srv.after(event, entity!, async (data, req) => {
      return await this.executeAfterCallback(handlerAndEntity, req, data);
    });
  }

  /**
   * Registers all `BEFORE` event handlers.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private registerBeforeHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity).getDefault();

    this.srv.before(event, entity!, async (req) => {
      return await this.executeBeforeCallback(handlerAndEntity, req);
    });
  }

  private async registerMessagingEvent(message: {
    options: EventMessagingOptions;
    handlerAndEntity: [BaseHandler, Constructable];
  }) {
    const { showReceiverMessage, consoleStyle, type, eventName } = message.options;

    const callback = async (req: Request | SubscriberType<any>, next: Function) => {
      if (showReceiverMessage) {
        if (consoleStyle === 'table') {
          const text = `> received: ${eventName}`;

          console.log(util.showGreenConsole(text));
          console.table([req.data]);
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
   * Builds the handler by type.
   *
   * @param handlerAndEntity - A tuple containing the handler and entity.
   */
  private buildHandlerBy(handlerAndEntity: [BaseHandler, Constructable]) {
    const [handler] = handlerAndEntity;

    switch (handler.handlerType) {
      case HandlerType.Before:
        this.registerBeforeHandler(handlerAndEntity);
        break;

      case HandlerType.After:
        this.registerAfterHandler(handlerAndEntity);
        break;

      case HandlerType.AfterSingleInstance: {
        this.registerAfterSingleInstanceHandler(handlerAndEntity);
        break;
      }

      case HandlerType.On:
        this.registerOnHandler(handlerAndEntity);
        break;

      case HandlerType.Prepend: {
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
        buildHandlers: () => {
          handlers.forEach((handler) => {
            this.buildHandlerBy([handler, entityInstance]);
          });
        },

        buildMiddlewares: () => {
          this.buildMiddlewareBy(entityInstance);
        },
      };
    }
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
      const handlersFound = entityHandlers !== undefined;

      if (handlersFound) {
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
