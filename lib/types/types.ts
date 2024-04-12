import type { Request, Service, CdsFunction, column_expr, predicate, source, ref, name } from '@sap/cds';
import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { ServiceImpl, TypedRequest } from '@sap/cds/apis/services';

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
export type DRAFT_EVENTS = 'NEW' | 'CANCEL' | 'EDIT' | 'SAVE' | 'ACTION';
export type EVENTS = CRUD_EVENTS | ACTION_EVENTS | FUNCTION_EVENTS | ERROR_EVENT | ON_EVENT | DRAFT_EVENTS;

export type ValidatorField = string | number | undefined | null | boolean;

// **************************************************************************************************************************
// @Use decorator types
// **************************************************************************************************************************

// **************************************************************************************************************************
// @Use decorator types
// **************************************************************************************************************************

/**
 * Use `NextMiddleware` type to annotate the `next` parameter of the implementation of the middleware.
 *
 * @example
 * export class Middleware implements MiddlewareImpl {
 *    public async use(req: TypedRequest<MyEntity>, next: NextMiddleware) { // <= NextMiddleware type used
 *      await next();
 *    }
 * }
 */
export type NextMiddleware = () => Promise<unknown>;

/**
 * Use `NextEvent` type to annotate the `next` parameter of the implementation the `ON` events.
 * @example "@Next() next: NextEvent"
 */
export type NextEvent = (req?: Request) => void;

export type MiddlewareImpl = {
  use: (req: Request, next: NextMiddleware) => Promise<unknown>;
};

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @OnAction, @OnBoundAction, @OnFunction, @OnBoundFunction types
// **************************************************************************************************************************

/**
 * Use `ActionRequest` type to have the `Request` of `@OnAction`, `@OnBoundAction`, `@OnFunction`, `@OnBoundFunction` typed.
 */
export type ActionRequest<T extends CdsFunction> = Omit<Request, 'data'> & { data: T['__parameters'] };

/**
 * Use `ActionReturn` type to have the `return` of the `@OnAction`, `@OnBoundAction`, `@OnFunction`, `@OnBoundFunction` typed.
 */
export type ActionReturn<T extends CdsFunction> = Promise<T['__returns'] | void | Error>;

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @GetQuery() decorator types
// **************************************************************************************************************************

export class GetQueryType {
  columns: {
    FOR_SELECT: column_expr[];
    FOR_INSERT: string[];
    FOR_UPSERT: string[];
  };

  where: predicate;
  distinct: SELECT<any>['SELECT']['distinct'];
  excluding: SELECT<any>['SELECT']['excluding'];
  from: {
    FOR_SELECT: source;
    FOR_DELETE: ref | name;
  };

  one: SELECT<any>['SELECT']['one'];
  limit: {
    rows: {
      val: number;
    };
    offset: {
      val: number;
    };
  };

  mixin: SELECT<any>['SELECT']['mixin'];
  groupBy: SELECT<any>['SELECT']['groupBy'];
  having: SELECT<any>['SELECT']['having'];
  orderBy: SELECT<any>['SELECT']['orderBy'];

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
  type CdsFunction,
  type TypedRequest,
  type Request,
  type Service,
  type ServiceImpl,
};
