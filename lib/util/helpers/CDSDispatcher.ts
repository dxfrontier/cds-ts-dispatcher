import cds from '@sap/cds'
import { Request, Service, ServiceImpl } from '@sap/cds'
import { Constructable } from '@sap/cds/apis/internal/inference'
import { Container } from 'inversify'

import { Handler, HandlerType, ServiceCallback, ServiceHelper } from '../types/types'
import { MetadataDispatcher } from './MetadataDispatcher'

/**
 * Manages the registration of event handlers for the entities.
 */
class CDSDispatcher {
  private srv: Service
  private container: Container

  /**
   * Creates an instance of CDSDispatcher.
   * @param {Constructable[]} entities - An array of entity classes to manage event handlers for.
   */
  constructor(private entities: Constructable[]) {}

  private initializeContainer() {
    this.container = new Container({
      skipBaseClassChecks: true,
      autoBindInjectable: true,
    })
  }

  private storeService(srv: Service) {
    this.srv = srv
  }

  private async executeCallback(handlerAndEntity: [Handler, Constructable], req: Request, resultsOrNext?: Function | any[]): Promise<any> {
    const [handler, entity] = handlerAndEntity
    const callback = handler.callback.bind(entity)
    if (Array.isArray(resultsOrNext)) {
      const results = resultsOrNext
      return await callback(results, req)
    } else {
      const next = resultsOrNext
      return await callback(req, next)
    }
  }

  private getActiveEntityOrDraft(handler: Handler, entityInstance: Constructable) {
    const { isDraft } = handler
    const entityConstructable = MetadataDispatcher.getEntity(entityInstance)
    const entity = isDraft ? entityConstructable.drafts : entityConstructable
    return entity
  }

  private getHandlerProps(handler: Handler, entityInstance: Constructable) {
    const { event, actionName } = handler
    const entity = this.getActiveEntityOrDraft(handler, entityInstance)

    return {
      getEntity: () => entity,
      getEvent: () => event,
      getActionName: () => actionName,
    }
  }

  private async registerAfterHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    this.srv.after(handlerProps.getEvent(), handlerProps.getEntity(), async (data, req) => {
      return await this.executeCallback(handlerAndEntity, req, data)
    })
  }

  private async registerBeforeHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    this.srv.before(handlerProps.getEvent(), handlerProps.getEntity(), async (req) => {
      return await this.executeCallback(handlerAndEntity, req)
    })
  }

  private async registerOnHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    // CRUD_EVENTS.[ACTION, FUNC]
    if (handlerProps.getEvent() === 'ACTION' || handlerProps.getEvent() === 'FUNC') {
      this.srv.on(handlerProps.getActionName()!, async (req, next) => {
        return await this.executeCallback(handlerAndEntity, req, next)
      })

      return
    }

    if (handlerProps.getEvent() === 'BOUND_ACTION') {
      this.srv.on(handlerProps.getActionName()!, handlerProps.getEntity().name, async (req, next) => {
        return await this.executeCallback(handlerAndEntity, req, next)
      })

      return
    }

    // CRUD_EVENTS.[CREATE, READ, UPDATE, DELETE, EDIT, SAVE]
    this.srv.on(handlerProps.getEvent(), handlerProps.getEntity(), async (req, next) => {
      return await this.executeCallback(handlerAndEntity, req, next)
    })
  }

  //cap.cloud.sap/docs/node.js/fiori#draft-support
  private async registerOnDraftHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    // CRUD_EVENTS.[BOUND_ACTION, BOUND_FUNC]
    if (handlerProps.getEvent() === 'BOUND_ACTION') {
      this.srv.on(handlerProps.getActionName()!, handlerProps.getEntity().name, async (req, next) => {
        return await this.executeCallback(handlerAndEntity, req, next)
      })

      return
    }

    // CRUD_EVENTS.[NEW, CANCEL]
    this.srv.on(handlerProps.getEvent(), handlerProps.getEntity(), async (req, next) => {
      return await this.executeCallback(handlerAndEntity, req, next)
    })
  }

  private registerHandlerBy(handlerAndEntity: [Handler, Constructable]): void {
    const [handler] = handlerAndEntity

    switch (handler.handlerType) {
      case HandlerType.After:
        this.registerAfterHandler(handlerAndEntity)
        break

      case HandlerType.Before:
        this.registerBeforeHandler(handlerAndEntity)
        break

      case HandlerType.On:
        this.registerOnHandler(handlerAndEntity)
        break

      case HandlerType.OnDraft:
        this.registerOnDraftHandler(handlerAndEntity)
        break

      default:
        throw new Error('No Handler found !')
    }
  }

  private getHandlersBy(entityInstance: Constructable) {
    const handlers: Handler[] = MetadataDispatcher.getMetadataHandlers(entityInstance)

    return {
      buildHandlers: (): void => {
        handlers.forEach((handler: Handler) => {
          this.registerHandlerBy([handler, entityInstance])
        })
      },
    }
  }

  private registerSrvConstant = (): void => {
    if (!this.container.isBound(ServiceHelper.SRV)) {
      this.container.bind<Service>(ServiceHelper.SRV).toConstantValue(this.srv)
    }
  }

  private resolveDependencies(entity: Constructable): Constructable {
    return this.container.resolve<typeof entity>(entity)
  }

  private registerHandlers(): void {
    this.entities.forEach((entity: Constructable) => {
      const createdEntity = this.resolveDependencies(entity)

      this.getHandlersBy(createdEntity).buildHandlers()
    })
  }

  private buildEntityHandlers(): void {
    this.registerSrvConstant()
    this.registerHandlers()
  }

  private buildServiceImplementation(): ServiceCallback {
    return (srv: Service) => {
      this.storeService(srv)
      this.initializeContainer()
      this.buildEntityHandlers()
    }
  }
  // PUBLIC ROUTINES
  public initializeEntityHandlers(): ServiceImpl {
    return cds.service.impl(this.buildServiceImplementation())
  }
}

export default CDSDispatcher
