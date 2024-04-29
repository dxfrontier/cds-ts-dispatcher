/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Container } from 'inversify';

import cds from '@sap/cds';

import { SRV } from '../constants/constants';
import { HandlerType } from '../types/enum';
import { MiddlewareEntityRegistry } from '../util/middleware/MiddlewareEntityRegistry';
import util from '../util/util';
import { MetadataDispatcher } from './MetadataDispatcher';

import type { NonEmptyArray, BaseHandler } from '../types/internalTypes';
import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { Request, Service, ServiceImpl } from '../types/types';

class CDSDispatcher {
  private srv: Service;
  private readonly container: Container = new Container({
    skipBaseClassChecks: true,
    autoBindInjectable: true,
  });

  /**
   * @description Creates an instance of `CDS Dispatcher`.
   * @param entities An array of entity classes to manage event handlers for.
   * @example
   * new CDSDispatcher([ Entity-1, Entity-2, Entity-n ]).initialize();
   */
  constructor(private readonly entities: NonEmptyArray<Constructable>) {}

  private storeService(srv: Service): void {
    this.srv = srv;
  }

  private async executeBeforeCallback(handlerAndEntity: [BaseHandler, Constructable], req: Request): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    return await handler.callback.call(entity, req);
  }

  private executeOnErrorCallback(
    handlerAndEntity: [BaseHandler, Constructable],
    err: Error,
    req: Request,
  ): unknown | void {
    const [handler, entity] = handlerAndEntity;
    return handler.callback.call(entity, err, req);
  }

  private async executeOnCallback(
    handlerAndEntity: [BaseHandler, Constructable],
    req: Request,
    next: Function,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    return await handler.callback.call(entity, req, next);
  }

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

  private getActiveEntityOrDraft(handler: BaseHandler, entityInstance: Constructable): Constructable {
    const { isDraft } = handler;
    const entity = MetadataDispatcher.getEntity(entityInstance);

    return isDraft ? entity.drafts : entity;
  }

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

    const getEvent = () => {
      // PRIVATE routine for this func
      const _constructEventName = () => {
        const _getDefaultEvent = () => {
          if (handler.type === 'EVENT') {
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

    return { getDefault, getAction, getEvent, getPrepend };
  }

  /**
   * Registration of all `AFTER, AFTER, ON` events, for `PREPEND` only
   * @private
   */
  private registerPrependHandler(handlerAndEntity: [BaseHandler, Constructable]) {
    const getProps = this.getHandlerProps(...handlerAndEntity);
    const { eventKind } = getProps.getPrepend();

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
   * Registration of `AFTER - SingleInstance` event `@AfterReadSingleInstance`,
   * @private
   */
  private registerAfterSingleInstanceHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity).getDefault();

    this.srv.after(event, entity, async (data, req) => {
      const singleInstance = req.params && req.params.length > 0;

      if (singleInstance) {
        return await this.executeAfterCallback(handlerAndEntity, req, util.getArrayFirstItem(data));
      }
    });
  }

  /**
   * Registration of all `AFTER` events, like : `@AfterRead`, `@AfterUpdate`, ...
   * @private
   */
  private registerAfterHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity).getDefault();

    this.srv.after(event, entity, async (data, req) => {
      return await this.executeAfterCallback(handlerAndEntity, req, data);
    });
  }

  /**
   * Registration of all `BEFORE` events, like : `@BeforeRead`, `@BeforeUpdate`, ...
   * @private
   */
  private registerBeforeHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity).getDefault();

    this.srv.before(event, entity, async (req) => {
      return await this.executeBeforeCallback(handlerAndEntity, req);
    });
  }

  /**
   * Registration of all `ON` events, like : `@OnRead`, `@OnUpdate`, `@OnBoundAction`, ...
   * @private
   */
  private registerOnHandler(handlerAndEntity: [BaseHandler, Constructable]): void {
    const getProps = this.getHandlerProps(...handlerAndEntity);

    const { event, entity } = getProps.getDefault();

    switch (event) {
      case 'ACTION':
      case 'FUNC': {
        const actionName = getProps.getAction().actionName!;

        this.srv.on(actionName, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });
        break;
      }
      case 'BOUND_ACTION':
      case 'BOUND_FUNC': {
        const actionName = getProps.getAction().actionName!;

        this.srv.on(actionName, entity.name, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });
        break;
      }
      case 'EVENT': {
        const eventName = getProps.getEvent().eventName!;

        this.srv.on(eventName, async (req, next) => {
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
      default:
        this.srv.on(event, entity, async (req, next) => {
          return await this.executeOnCallback(handlerAndEntity, req, next);
        });
    }
  }

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

  private buildMiddlewareBy(entityInstance: Constructable): void {
    const middlewareRegistry = new MiddlewareEntityRegistry(entityInstance, this.srv);

    if (middlewareRegistry.hasEntityMiddlewaresAttached()) {
      middlewareRegistry.buildMiddlewares();
    }
  }

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

    return undefined;
  }

  private readonly registerSrvAsConstant = (): void => {
    if (!this.container.isBound(SRV)) {
      this.container.bind<Service>(SRV).toConstantValue(this.srv);
    }
  };

  private resolveDependencies(entity: Constructable): Constructable {
    return this.container.resolve<typeof entity>(entity);
  }

  private registerHandlers(): void {
    this.entities.forEach((entity: Constructable) => {
      const createdEntity = this.resolveDependencies(entity);
      const entityHandlers = this.getHandlersBy(createdEntity);
      const handlersFound = entityHandlers != null;

      if (handlersFound) {
        entityHandlers.buildHandlers();
        entityHandlers.buildMiddlewares();
      }
    });
  }

  private buildServiceImplementation() {
    return (srv: Service): void => {
      this.storeService(srv);
      this.registerSrvAsConstant();
      this.registerHandlers();
    };
  }

  // PUBLIC ROUTINES

  /**
   * @description Initializes the entities within the `CDS Dispatcher`, registering their corresponding handlers.
   * @returns An instance of `ServiceImpl` representing the registered service implementation.
   */
  public initialize(): ServiceImpl {
    return cds.service.impl(this.buildServiceImplementation());
  }
}

export { CDSDispatcher };
