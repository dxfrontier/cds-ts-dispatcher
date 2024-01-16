/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request } from '@sap/cds/apis/events';
import { type Constructable } from '@sap/cds/apis/internal/inference';
import { type ServiceImpl, type TypedRequest } from '@sap/cds/apis/services';

import type { Service } from '@sap/cds';

enum HandlerType {
  Before,
  On,
  After,
  Error,
  Event,
  Request,
  OnDraft,
}

type CdsFunction = {
  (...args: any[]): any;
  __parameters: object;
  __returns: unknown;
};

type CdsEvent = object;

type CDSTyperEntity<T> = Constructable<T>;

type DRAFT_EVENTS = 'NEW' | 'CANCEL' | 'EDIT' | 'SAVE' | 'ACTION';
type CRUD_EVENTS =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTION'
  | 'FUNC'
  | 'BOUND_ACTION'
  | 'BOUND_FUNC'
  | 'EVENT';

type ServiceCallback = (srv: Service) => void;

type ReturnRequest = (req: Request, ...args: any[]) => Promise<any>;
type ReturnResultsAndRequest = (results: any | any[] | boolean, req: Request, ...args: any[]) => Promise<any>;
type ReturnRequestAndNext = (req: Request, next: Function, ...args: any[]) => Promise<any>;
type ReturnSingleInstanceCapable = (isSingleInstance: boolean) => Promise<any>;

/**
 * Use this type to have the '@sap/cds - Request' typed.
 */
type ActionRequest<T extends CdsFunction> = Omit<Request, 'data'> & { data: T['__parameters'] };

/**
 * Use this type to have the 'return' of the action typed.
 */
type ActionReturn<T extends CdsFunction> = Promise<T['__returns'] | void | Error>;

type HandlerBuilder = {
  buildHandlers: () => void;
};

type Handler = {
  event: CRUD_EVENTS | DRAFT_EVENTS;
  handlerType: HandlerType;
  callback: ReturnRequest | ReturnRequestAndNext | ReturnResultsAndRequest;
  actionName?: CdsFunction;
  eventName?: string;
  isDraft?: boolean;
  isSingleInstance?: boolean;
};

export {
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
  type CdsEvent,
  //
  type TypedRequest,
  type ActionRequest,
  type ActionReturn,
  //
  type CRUD_EVENTS,
  type DRAFT_EVENTS,

  // Standard exports
  type Request,
  type Service,
  type ServiceImpl,
};
