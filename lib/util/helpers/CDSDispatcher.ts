import { Container } from 'inversify';
import { MetadataDispatcher } from './MetadataDispatcher';
import Util from './Util';

import { type Constructable } from '@sap/cds/apis/internal/inference';
import { type Handler, HandlerType, type ServiceCallback, ServiceHelper, type HandlerBuilder } from '../types/types';
import cds, { type Request, type Service, type ServiceImpl } from '@sap/cds';

/**
 * Manages the registration of event handlers for the entities.
 */

class CDSDispatcher {
  private srv: Service;
  private container: Container;

  /**
   * Creates an instance of CDSDispatcher.
   * @param {Constructable[]} entities - An array of entity classes to manage event handlers for.
   */
  constructor(private readonly entities: Constructable[]) {
    if (Util.isEmptyArray(entities)) {
      throw new Error('The new CDSDispatcher constructor cannot be empty!');
    }
  }

  private initializeContainer(): void {
    this.container = new Container({
      skipBaseClassChecks: true,
      autoBindInjectable: true,
    });
  }

  private storeService(srv: Service): void {
    this.srv = srv;
  }

  private async executeBeforeCallback(handlerAndEntity: [Handler, Constructable], req: Request): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    const { callback } = handler;

    if (Util.isRequest(callback)) {
      return await callback.call(entity, req);
    }
  }

  private async executeOnCallback(
    handlerAndEntity: [Handler, Constructable],
    req: Request,
    next?: Function,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    const { callback } = handler;

    if (Util.isRequestAndNext(callback)) {
      return await callback.call(entity, req, next!);
    }
  }

  private async executeAfterCallback(
    handlerAndEntity: [Handler, Constructable],
    req: Request,
    results: unknown[] | unknown | number,
  ): Promise<unknown> {
    const [handler, entity] = handlerAndEntity;
    const { callback } = handler;
    const isSingleInstance = Util.isRequestSingleInstance(handler, req);

    if (!Array.isArray(results)) {
      if (Util.isRequestAndResults(callback)) {
        return await callback.call(entity, results, req, isSingleInstance);
      }
    }

    if (Array.isArray(results)) {
      if (Util.isRequestAndResults(callback)) {
        return await callback.call(entity, results, req, isSingleInstance);
      }
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
    const { event, actionName } = handler;
    const entity = this.getActiveEntityOrDraft(handler, entityInstance);

    return {
      entity,
      event,
      actionName,
    };
  }

  private registerAfterHandler(handlerAndEntity: [Handler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity);
    // private routine for this func
    const _isDeleted = (data: number): boolean => {
      return data === 1;
    };

    // private routines for this func
    this.srv.after(event, entity, async (data, req) => {
      if (Util.isNumber(data)) {
        data = _isDeleted(data);
      }

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
    const { event, actionName, entity } = this.getHandlerProps(...handlerAndEntity);

    // CRUD_EVENTS.[ACTION, FUNC]
    if (event === 'ACTION' || event === 'FUNC') {
      this.srv.on(actionName!, async (req, next) => {
        return await this.executeOnCallback(handlerAndEntity, req, next);
      });

      return;
    }

    // CRUD_EVENTS.[BOUND_ACTION, BOUND_FUNC]
    if (event === 'BOUND_ACTION' || event === 'BOUND_FUNC') {
      this.srv.on(actionName!, entity.toString(), async (req, next) => {
        return await this.executeOnCallback(handlerAndEntity, req, next);
      });

      return;
    }

    // CRUD_EVENTS.[CREATE, READ, UPDATE, DELETE, EDIT, SAVE]
    this.srv.on(event, entity, async (req, next) => {
      return await this.executeOnCallback(handlerAndEntity, req, next);
    });
  }

  // cap.cloud.sap/docs/node.js/fiori#draft-support
  private registerOnDraftHandler(handlerAndEntity: [Handler, Constructable]): void {
    const { event, entity } = this.getHandlerProps(...handlerAndEntity);

    // CRUD_EVENTS.[NEW, CANCEL]
    this.srv.on(event, entity, async (req, next) => {
      return await this.executeOnCallback(handlerAndEntity, req, next);
    });
  }

  private registerHandlerBy(handlerAndEntity: [Handler, Constructable]): void {
    const [handler] = handlerAndEntity;

    switch (handler.handlerType) {
      case HandlerType.After:
        this.registerAfterHandler(handlerAndEntity);
        break;

      case HandlerType.Before:
        this.registerBeforeHandler(handlerAndEntity);
        break;

      case HandlerType.On:
        this.registerOnHandler(handlerAndEntity);
        break;

      case HandlerType.OnDraft:
        this.registerOnDraftHandler(handlerAndEntity);
        break;

      default:
        throw new Error('No Handler found !');
    }
  }

  private getHandlersBy(entityInstance: Constructable): HandlerBuilder | undefined {
    const handlers = MetadataDispatcher.getMetadataHandlers(entityInstance);

    if (handlers?.length > 0) {
      return {
        buildHandlers: (): void => {
          handlers.forEach((handler) => {
            this.registerHandlerBy([handler, entityInstance]);
          });
        },
      };
    }

    return undefined;
  }

  private readonly registerSrvConstant = (): void => {
    if (!this.container.isBound(ServiceHelper.SRV)) {
      this.container.bind<Service>(ServiceHelper.SRV).toConstantValue(this.srv);
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
      this.initializeContainer();
      this.buildEntityHandlers();
    };
  }

  // PUBLIC ROUTINES
  public initializeEntityHandlers(): ServiceImpl {
    return cds.service.impl(this.buildServiceImplementation());
  }
}

export { CDSDispatcher };
