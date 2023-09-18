import { Request, Service } from '@sap/cds'
import { Constructable } from '@sap/cds/apis/internal/inference'

enum ServiceHelper {
  SRV = 'srv',
}

enum HandlerType {
  Before,
  On,
  After,
  Error,
  Event,
  Request,
  OnDraft,
}

type CDSTyperAction = (...args: any[]) => any
type CDSTyperEntity<T> = Constructable<T>

type DRAFT_EVENTS = 'NEW' | 'CANCEL' | 'EDIT' | 'SAVE' | 'ACTION'
type CRUD_EVENTS = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTION' | 'FUNC' | 'BOUND_ACTION' | 'BOUND_FUNC'

type ServiceCallback = (srv: Service) => void

type ReturnRequest = (req: Request) => Promise<any>
type ReturnResultsAndRequest = (results: any[], req: Request) => Promise<any>
type ReturnRequestAndNext = (req: Request, next: Function) => Promise<any>

type Handler = {
  event: CRUD_EVENTS | DRAFT_EVENTS
  handlerType: HandlerType
  callback: any
  actionName?: CDSTyperAction
  isDraft?: boolean
}

export {
  ServiceHelper,
  HandlerType,
  Handler,
  ServiceCallback,
  //
  ReturnRequest,
  ReturnResultsAndRequest,
  ReturnRequestAndNext,
  //
  CDSTyperAction,
  CDSTyperEntity,
  //
  CRUD_EVENTS,
  DRAFT_EVENTS,
}
