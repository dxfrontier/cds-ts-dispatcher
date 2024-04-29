import type { Request, Service, CdsFunction, column_expr } from '@sap/cds';
import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { ServiceImpl, TypedRequest } from '@sap/cds/apis/services';
import type { ServerResponse } from 'http';

// **************************************************************************************************************************
// Common types
// **************************************************************************************************************************

export type CdsEvent = object;
export type CDSTyperEntity<T> = Constructable<T>;
export type RequestType = (...args: any[]) => Promise<any>;

export type ERROR_EVENT = 'ERROR';
export type ON_EVENT = 'EVENT';
export type ACTION_EVENTS = 'ACTION' | 'BOUND_ACTION';
export type FUNCTION_EVENTS = 'FUNC' | 'BOUND_FUNC';
export type CRUD_EVENTS = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';
export type DRAFT_EVENTS = 'NEW' | 'CANCEL' | 'EDIT' | 'SAVE';

export type EVENTS = CRUD_EVENTS | ACTION_EVENTS | FUNCTION_EVENTS | ERROR_EVENT | ON_EVENT | DRAFT_EVENTS;

export type ValidatorField = string | number | undefined | null | boolean;

// Standard export

/**
 * @description This object is created internally by an HTTP server, not by the user. Contains various methods and properties related to the `response` object.
 */
type RequestResponse = ServerResponse;

// **************************************************************************************************************************
// @Use decorator types
// **************************************************************************************************************************

// **************************************************************************************************************************
// @Use decorator types
// **************************************************************************************************************************

/**
 * @description Use `NextMiddleware` type to annotate the `next` parameter of the implementation of the middleware.
 *
 * @example
 * export class Middleware implements MiddlewareImpl {
 *    public async use(req: TypedRequest<MyEntity>, next: NextMiddleware) {
 *      await next();
 *    }
 * }
 */
export type NextMiddleware = () => Promise<unknown>;

/**
 * @description Use `NextEvent` type to annotate the `next` parameter of the implementation of the `ON` events.
 * @example "@Next() next: NextEvent"
 */
export type NextEvent = (req?: Request) => Function;

export type MiddlewareImpl = {
  use: (req: Request, next: NextMiddleware) => Promise<unknown>;
};

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @OnAction, @OnBoundAction, @OnFunction, @OnBoundFunction types
// **************************************************************************************************************************

/**
 * @description Use `ActionRequest` type to have the `Request` of `@OnAction`, `@OnBoundAction`, `@OnFunction`, `@OnBoundFunction` typed.
 */
export type ActionRequest<T extends CdsFunction> = Omit<Request, 'data'> & { data: T['__parameters'] };

/**
 * @description Use `ActionReturn` type to have the `return` of the `@OnAction`, `@OnBoundAction`, `@OnFunction`, `@OnBoundFunction` typed.
 */
export type ActionReturn<T extends CdsFunction> = Promise<T['__returns'] | void | Error>;

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @GetQuery() decorator types
// **************************************************************************************************************************

export class GetQueryType {
  columns: {
    forSelect: column_expr[];
    forInsert: string[];
    forUpsert: string[];
  };

  distinct: SELECT<any>['SELECT']['distinct'];
  excluding: SELECT<any>['SELECT']['excluding'];
  from: {
    forSelect: SELECT<any>['SELECT']['from'];
    forDelete: DELETE<any>['DELETE']['from'];
  };

  groupBy: SELECT<any>['SELECT']['groupBy'];
  having: SELECT<any>['SELECT']['having'];
  limit: {
    rows: {
      val: number;
    };
    offset: {
      val: number;
    };
  };

  mixin: SELECT<any>['SELECT']['mixin'];
  one: SELECT<any>['SELECT']['one'];
  orderBy: SELECT<any>['SELECT']['orderBy'];
  where: SELECT<any>['SELECT']['where'];

  as: INSERT<any>['INSERT']['as'];
  entries: INSERT<any>['INSERT']['entries'];
  rows: INSERT<any>['INSERT']['rows'];
  values: INSERT<any>['INSERT']['values'];
  into: INSERT<any>['INSERT']['into'];

  data: UPDATE<any>['UPDATE']['data'];
  entity: UPDATE<any>['UPDATE']['entity'];
}

// **************************************************************************************************************************
// **************************************************************************************************************************

export {
  // Standard exports
  Request,
  Service,
  type RequestResponse,
  type CdsFunction,
  type TypedRequest,
  type ServiceImpl,
};
