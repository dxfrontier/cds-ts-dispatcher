import { Request, Service as CdsService } from '@sap/cds'

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

type DRAFT_EVENTS = 'NEW' | 'CANCEL' | 'EDIT' | 'SAVE' | 'ACTION'
type CRUD_EVENTS = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTION' | 'FUNC'

type ServiceCallback = (srv: CdsService) => void

type ReturnRequest = (req: Request) => Promise<any>
type ReturnResultsAndRequest = (results: any[], req: Request) => Promise<any>
type ReturnRequestAndNext = (req: Request, next: Function) => Promise<any>

type Handler = {
  event: CRUD_EVENTS | DRAFT_EVENTS
  handlerType: HandlerType
  callback: any
  actionName?: string
  isDraft?: boolean
}

export {
  ServiceHelper,
  HandlerType,
  Handler,
  ServiceCallback,
  CdsService,
  ReturnRequest,
  ReturnResultsAndRequest,
  ReturnRequestAndNext,
  CRUD_EVENTS,
  DRAFT_EVENTS,
}
