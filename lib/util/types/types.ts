/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request, type Service } from '@sap/cds';
import { type Constructable } from '@sap/cds/apis/internal/inference';

/**
 * Use this helper to inject the SRV constant
 */
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

interface CdsFunction {
  (...args: any[]): any;
  __parameters: object;
  __returns: unknown;
}

type CDSTyperEntity<T> = Constructable<T>;

type DRAFT_EVENTS = 'NEW' | 'CANCEL' | 'EDIT' | 'SAVE' | 'ACTION';
type CRUD_EVENTS = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTION' | 'FUNC' | 'BOUND_ACTION' | 'BOUND_FUNC';

type ServiceCallback = (srv: Service) => void;

type ReturnRequest = (req: Request, ...args: any[]) => Promise<any>;
type ReturnResultsAndRequest = (results: any | any[] | boolean, req: Request, ...args: any[]) => Promise<any>;
type ReturnRequestAndNext = (req: Request, next: Function) => Promise<any>;
type ReturnSingleInstanceCapable<T, K> = (results: T[], req: K, isSingleInstance: boolean) => Promise<any>;

/**
 * Use this type to have the '@sap/cds - Request' typed.
 */
type TypedRequest<T> = Omit<Request, 'data'> & { data: T };

/**
 * Use this type to have the '@sap/cds - Request' typed.
 */
type ActionRequest<T extends CdsFunction> = Omit<Request, 'data'> & { data: T['__parameters'] };

/**
 * Use this type to have the 'return' of the action typed.
 */
type ActionReturn<T extends CdsFunction> = Promise<T['__returns']>;
interface HandlerBuilder {
  buildHandlers: () => void;
}

interface Handler {
  event: CRUD_EVENTS | DRAFT_EVENTS;
  handlerType: HandlerType;
  callback: ReturnRequest | ReturnRequestAndNext | ReturnResultsAndRequest;
  actionName?: CdsFunction;
  isDraft?: boolean;
  isSingleInstance?: boolean;
}

export {
  ServiceHelper,
  HandlerType,
  type HandlerBuilder,
  type Handler,
  type ServiceCallback,
  //
  type ReturnRequest,
  type ReturnResultsAndRequest,
  type ReturnRequestAndNext,
  type ReturnSingleInstanceCapable,
  //
  type CDSTyperEntity,
  type CdsFunction,
  //
  type TypedRequest,
  type ActionRequest,
  type ActionReturn,
  //
  type CRUD_EVENTS,
  type DRAFT_EVENTS,
};
