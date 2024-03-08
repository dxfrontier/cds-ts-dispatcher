import { Container } from 'inversify';
import { MetadataDispatcher } from './MetadataDispatcher';
import Util from './Util';

import { type Constructable } from '@sap/cds/apis/internal/inference';
import {
  HandlerType,
  type Handler,
  type ServiceCallback,
  type HandlerBuilder,
  type ReturnRequestAndNext,
  type ReturnResultsAndRequest,
  type ReturnRequest,
  type Service,
  type ServiceImpl,
  type Request,
  type ReturnErrorRequest,
  type NonEmptyArray,
} from '../types/types';
import { SRV } from '../constants/Constants';

import cds from '@sap/cds';

class CDSDispatcher {
  private srv: Service;
  private readonly container: Container = new Container({
    skipBaseClassChecks: true,
    autoBindInjectable: true,
  });

  /**
   * Creates an instance of CDSDispatcher.
   * @param entities An array of entity classes to manage event handlers for.
   * @example
   * new CDSDispatcher([ Entity-1, Entity-2, Entity-n ]).initialize();
   */
  constructor(private readonly entities: NonEmptyArray<Constructable>) {}

  private storeService(srv: Service): void {
    this.srv = srv;
  }

  private async executeBeforeCallback(handlerAndEntity: [Handler, Constructable], req: Request): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    const callback = handler.callback as ReturnRequest;
    const isSingleInstance = Util.isRequestSingleInstance(handler, req);

    return await callback.call(entity, req, isSingleInstance);
  }

  private executeOnErrorCallback(handlerAndEntity: [Handler, Constructable], err: Error, req: Request): unknown | void {
    const [handler, entity] = handlerAndEntity;
    const callback = handler.callback as ReturnErrorRequest;

    return callback.call(entity, err, req);
  }

  private async executeOnCallback(
    handlerAndEntity: [Handler, Constructable],
    req: Request,
    next: Function,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    const callback = handler.callback as ReturnRequestAndNext;
    const isSingleInstance = Util.isRequestSingleInstance(handler, req);

    return await callback.call(entity, req, next, isSingleInstance);
  }

  private async executeAfterCallback(
    handlerAndEntity: [Handler, Constructable],
    req: Request,
    results: unknown | unknown[] | number,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    const callback = handler.callback as ReturnResultsAndRequest;
    const isSingleInstance = Util.isRequestSingleInstance(handler, req);

    if (!Array.isArray(results)) {
      if (Util.isNumber(results)) {
        // private routine for this func
        const _isDeleted = (data: unknown): boolean => data === 1;
        const deleted = _isDeleted(results);

        // DELETE single request
        return await callback.call(entity, deleted, req, isSingleInstance);
      }

      // READ, UPDATE single request
      return await callback.call(entity, results, req, isSingleInstance);
    }

    if (Array.isArray(results)) {
      // READ entity set
      return await callback.call(entity, results, req, isSingleInstance);
    }
  }

  private getActiveEntityOrDraft(handler: Handler, entityInstance: Constructable): Constructable {
    const { isDraft } = handler;
    const entityConstructable = MetadataDispatcher.getEntity(entityInstance);
    const entity = isDraft === true ? entityConstructable.drafts : entityConstructable;
    return entity;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private getHandlerProps(handler: Handler, entityInstance: Constructable) {
    const { event, actionName, eventName } = handler;
    const entity = this.getActiveEntityOrDraft(handler, entityInstance);

    // private routine for this func
    const _formatEventName = (): string => {
      const lastDotIndex = eventName!.lastIndexOf('.');
      const subtractedEventName = eventName!.substring(lastDotIndex + 1);

      return subtractedEventName;
    };

    return {
      entity,
      event,
      actionName,
      getEventName: _formatEventName,
    };
  }

  private registerAfterHandler(handlerAndEntity: [Handler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity);

    this.srv.after(event, entity, async (data, req) => {
      return await this.executeAfterCallback(handlerAndEntity, req, data);
    });
  }

  private registerBeforeHandler(handlerAndEntity: [Handler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity);

    this.srv.before(event, entity, async (req) => {
      return await this.executeBeforeCallback(handlerAndEntity, req);
    });
  }

  private registerOnHandler(handlerAndEntity: [Handler, Constructable]): void {
    const { event, actionName, getEventName, entity } = this.getHandlerProps(...handlerAndEntity);

    if (event === 'ACTION' || event === 'FUNC') {
      this.srv.on(actionName!, async (req, next) => {
        return await this.executeOnCallback(handlerAndEntity, req, next);
      });

      return;
    }

    if (event === 'BOUND_ACTION' || event === 'BOUND_FUNC') {
      this.srv.on(actionName!, entity.name, async (req, next) => {
        return await this.executeOnCallback(handlerAndEntity, req, next);
      });

      return;
    }

    if (event === 'EVENT') {
      this.srv.on(getEventName(), async (req, next) => {
        return await this.executeOnCallback(handlerAndEntity, req, next);
      });

      return;
    }

    if (event === 'ERROR') {
      this.srv.on('error', (err, req) => {
        return this.executeOnErrorCallback(handlerAndEntity, err, req);
      });

      return;
    }

    // CRUD_EVENTS[NEW, CANCEL, CREATE, READ, UPDATE, DELETE, EDIT, SAVE]
    this.srv.on(event, entity, async (req, next) => {
      return await this.executeOnCallback(handlerAndEntity, req, next);
    });
  }

  private buildHandlerBy(handlerAndEntity: [Handler, Constructable]): void {
    const [handler] = handlerAndEntity;

    switch (handler.handlerType) {
      case HandlerType.Before:
        this.registerBeforeHandler(handlerAndEntity);
        break;

      case HandlerType.After:
        this.registerAfterHandler(handlerAndEntity);
        break;

      case HandlerType.On:
        this.registerOnHandler(handlerAndEntity);
        break;

      default:
        throw new Error('No Handler found !');
    }
  }

  private async executeMiddlewareChain(req: Request, entityInstance: Constructable, index: number = 0): Promise<void> {
    const middlewares = MetadataDispatcher.getMiddlewares(entityInstance);

    // stop the chain if req.reject was used
    if (Util.isRejectUsed(req)) {
      return;
    }

    if (index < middlewares.length) {
      const CurrentMiddleware = middlewares[index];
      const currentMiddlewareInstance = new CurrentMiddleware();

      const next = async (): Promise<void> => {
        await this.executeMiddlewareChain(req, entityInstance, index + 1);
      };

      await currentMiddlewareInstance.use(req, next);
    }
  }

  private constructMiddleware(entityInstance: Constructable): void {
    const ALL_EVENTS = '*';
    const entity = MetadataDispatcher.getEntity(entityInstance);

    // Active entity
    if (entity?.name && entity?.drafts === null) {
      this.srv.before(ALL_EVENTS, entity.name, async (req: Request) => {
        await this.executeMiddlewareChain(req, entityInstance);
      });

      return;
    }

    // Draft entity
    if (entity?.drafts) {
      this.srv.before(ALL_EVENTS, entity.drafts, async (req: Request) => {
        await this.executeMiddlewareChain(req, entityInstance);
      });

      return;
    }

    // @UnboundActions() events
    if (entity === undefined) {
      const handlers = MetadataDispatcher.getMetadataHandlers(entityInstance);

      handlers.forEach((handler) => {
        if (handler.event === 'ACTION' || handler.event === 'FUNC') {
          this.srv.before(handler.actionName!.toString(), async (req: Request) => {
            await this.executeMiddlewareChain(req, entityInstance);
          });

          return;
        }

        if (handler.event === 'EVENT') {
          this.srv.before(handler.eventName!, async (req: Request) => {
            await this.executeMiddlewareChain(req, entityInstance);
          });

          return;
        }

        if (handler.event === 'ERROR') {
          this.srv.before('error', async (req: Request) => {
            await this.executeMiddlewareChain(req, entityInstance);
          });
        }
      });
    }
  }

  private registerMiddlewares(entityInstance: Constructable): void {
    const middlewares = MetadataDispatcher.getMiddlewares(entityInstance);

    // Step out if no middlewares
    if (!middlewares) {
      return;
    }

    this.constructMiddleware(entityInstance);
  }

  private buildMiddlewareBy(entityInstance: Constructable): void {
    this.registerMiddlewares(entityInstance);

    // This routine will sort the 'Before' events over '*'. The '*' will be firstly and after the named ones as events are triggered in order.
    Util.sortBeforeEvents(this.srv);
  }

  private getHandlersBy(entityInstance: Constructable): HandlerBuilder | undefined {
    const handlers = MetadataDispatcher.getMetadataHandlers(entityInstance);

    if (handlers?.length > 0) {
      // private routines for this func
      const buildHandlers = (): void => {
        handlers.forEach((handler) => {
          this.buildHandlerBy([handler, entityInstance]);
        });
      };

      const buildMiddlewares = (): void => {
        this.buildMiddlewareBy(entityInstance);
      };

      return {
        buildHandlers,
        buildMiddlewares,
      };
    }

    return undefined;
  }

  private readonly registerSrvConstant = (): void => {
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

  private buildEntityHandlers(): void {
    this.registerSrvConstant();
    this.registerHandlers();
  }

  private buildServiceImplementation(): ServiceCallback {
    return (srv: Service) => {
      this.storeService(srv);
      this.buildEntityHandlers();
    };
  }

  // PUBLIC ROUTINES
  /**
   * Initializes the entities within the CDSDispatcher, registering their corresponding handlers.
   *
   * @returns An instance of ServiceImpl representing the initialized service implementation.
   */
  public initialize(): ServiceImpl {
    return cds.service.impl(this.buildServiceImplementation());
  }
}

export { CDSDispatcher };
