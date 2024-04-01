import type { Request, Service } from '@sap/cds';
import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { ServiceImpl, TypedRequest } from '@sap/cds/apis/services';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { HandlerType } from './enum';

/**
 * Use this type to annotate the 'next' parameter of the Middleware use method
 */
export type Next = () => Promise<unknown>;

export type NonEmptyArray<T> = [T, ...T[]];

export type MiddlewareImpl = {
  use: (req: Request, next: Next) => Promise<unknown>;
};

export type CdsFunction = {
  (...args: any[]): any;
  __parameters: object;
  __returns: unknown;
};

export type CdsEvent = object;

export type CDSTyperEntity<T> = Constructable<T>;

export type DRAFT_EVENTS = 'NEW' | 'CANCEL' | 'EDIT' | 'SAVE' | 'ACTION';
export type CRUD_EVENTS =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTION'
  | 'FUNC'
  | 'BOUND_ACTION'
  | 'BOUND_FUNC'
  | 'EVENT'
  | 'ERROR';

export type ServiceCallback = (srv: Service) => void;

export type ReturnRequest = (req: Request, ...args: any[]) => Promise<any>;
export type ReturnResultsAndRequest = (results: any | any[] | boolean, req: Request, ...args: any[]) => Promise<any>;
export type ReturnRequestAndNext = (req: Request, next: Function, ...args: any[]) => Promise<any>;
export type ReturnSingleInstanceCapable = (isSingleInstance: boolean) => Promise<any>;
export type ReturnErrorRequest = (err: Error, req: Request) => any | void;

export type RequestType = (...args: any[]) => Promise<any>;
/**
 * Use this type to have the '@sap/cds - Request' typed.
 */
export type ActionRequest<T extends CdsFunction> = Omit<Request, 'data'> & { data: T['__parameters'] };

/**
 * Use this type to have the 'return' of the action typed.
 */
export type ActionReturn<T extends CdsFunction> = Promise<T['__returns'] | void | Error>;

export type HandlerBuilder = {
  buildHandlers: () => void;
  buildMiddlewares: () => void;
};

export type Handler = {
  event: CRUD_EVENTS | DRAFT_EVENTS;
  handlerType: HandlerType;
  callback: ReturnRequest | ReturnRequestAndNext | ReturnResultsAndRequest;
  actionName?: CdsFunction;
  eventName?: string;
  isDraft?: boolean;
  isSingleInstance?: boolean;
};

export type ValidatorField = string | number | undefined | null | boolean;

export {
  // Standard exports
  type TypedRequest,
  type Request,
  type Service,
  type ServiceImpl,
};
