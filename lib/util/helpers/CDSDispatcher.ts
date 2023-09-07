import cds from '@sap/cds'
import { Request, Service, ServiceImpl } from '@sap/cds'
import { Constructable } from '@sap/cds/apis/internal/inference'
import { Container } from 'inversify'

import { Handler, HandlerType, ServiceCallback, ServiceHelper } from '../types/types'
import { MetadataDispatcher } from './MetadataDispatcher'

class CDSDispatcher {
  private srv: Service
  private container: Container

  constructor(private entities: Constructable[]) {}

  private storeService(srv: Service) {
    this.srv = srv
    this.container = new Container({
      skipBaseClassChecks: true,
      autoBindInjectable: true,
    })
  }

  private async executeCallback(handler: Handler, entity: Constructable, req: Request, resultsOrNext?: Function | any[]): Promise<any> {
    const callback = handler.callback.bind(entity)
    if (Array.isArray(resultsOrNext)) {
      const results = resultsOrNext
      return await callback(results, req)
    } else {
      const next = resultsOrNext
      return await callback(req, next)
    }
  }

  private getHandlerProps(handler: Handler, entityInstance: Constructable) {
    const { event, isDraft, actionName } = handler
    const entityName = MetadataDispatcher.getEntityName(entityInstance)
    const entity = isDraft ? `${entityName}.drafts` : entityName
    return {
      getEntity: () => entity,
      getEvent: () => event,
      getActionName: () => actionName,
    }
  }

  private async registerAfterHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    if (handlerProps.getEvent() === 'ACTION') {
      this.srv.after(handlerProps.getActionName()!, async (results: any[], req: Request) => {
        return await this.executeCallback(...handlerAndEntity, req, results)
      })

      return
    }

    this.srv.after(handlerProps.getEvent(), handlerProps.getEntity(), async (results: any[], req: Request) => {
      return await this.executeCallback(...handlerAndEntity, req, results)
    })
  }

  private async registerBeforeHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    if (handlerProps.getEvent() === 'ACTION') {
      this.srv.before(handlerProps.getActionName()!, async (req: Request) => {
        return await this.executeCallback(...handlerAndEntity, req)
      })

      return
    }

    this.srv.before(handlerProps.getEvent(), handlerProps.getEntity(), async (req: Request) => {
      return await this.executeCallback(...handlerAndEntity, req)
    })
  }

  private async registerOnHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    // CRUD_METHOD.[ACTION, FUNC]
    if (handlerProps.getEvent() === 'ACTION' || handlerProps.getEvent() === 'FUNC') {
      this.srv.on(handlerProps.getActionName()!, async (req: Request) => {
        return await this.executeCallback(...handlerAndEntity, req)
      })

      return
    }

    // CRUD_METHOD.[CREATE, READ, UPDATE, DELETE, EDIT, SAVE]
    this.srv.on(handlerProps.getEvent(), handlerProps.getEntity(), async (req: Request, next: Function) => {
      return await this.executeCallback(...handlerAndEntity, req, next)
    })
  }

  //cap.cloud.sap/docs/node.js/fiori#draft-support
  private async registerOnDraftHandler(handlerAndEntity: [Handler, Constructable]) {
    const handlerProps = this.getHandlerProps(...handlerAndEntity)

    // CRUD_METHOD.[ACTION]
    if (handlerProps.getEvent() === 'ACTION') {
      this.srv.on(handlerProps.getActionName()!, handlerProps.getEntity(), async (req: Request) => {
        return await this.executeCallback(...handlerAndEntity, req)
      })

      return
    }

    // CRUD_METHOD.[NEW, CANCEL]
    this.srv.on(handlerProps.getEvent(), handlerProps.getEntity(), async (req: Request) => {
      return await this.executeCallback(...handlerAndEntity, req)
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
      this.buildEntityHandlers()
    }
  }

  // PUBLIC ROUTINES
  public initializeEntityHandlers(): ServiceImpl {
    return cds.service.impl(this.buildServiceImplementation())
  }
}

export default CDSDispatcher
