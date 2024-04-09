import type { Request, Service, CdsFunction, column_expr, predicate } from '@sap/cds';
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

export type HandlerBuilder = {
  buildHandlers: () => void;
  buildMiddlewares: () => void;
};

export type ValidatorField = string | number | undefined | null | boolean;

// **************************************************************************************************************************
// @Use decorator types
// **************************************************************************************************************************

// **************************************************************************************************************************
// @Use decorator types
// **************************************************************************************************************************

/**
 * Use `NextFunction` type to annotate the `next` parameter of the `Middleware` use method.
 */
export type NextFunction = () => Promise<unknown>;

export type MiddlewareImpl = {
  use: (req: Request, next: NextFunction) => Promise<unknown>;
};

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @OnAction, @OnBoundAction, @OnFunction, @OnBoundFunction types
// **************************************************************************************************************************

/**
 * Use `ActionRequest` type to have the `@OnAction`, `@OnBoundAction`, `@OnFunction`, `@OnBoundFunction` typed.
 */
export type ActionRequest<T extends CdsFunction> = Omit<Request, 'data'> & { data: T['__parameters'] };

/**
 * Use `ActionReturn` type to have the 'return' of the `@OnAction`, `@OnBoundAction`, `@OnFunction`, `@OnBoundFunction` typed.
 */
export type ActionReturn<T extends CdsFunction> = Promise<T['__returns'] | void | Error>;

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @GetRequestProperty() decorator types
// **************************************************************************************************************************

export type GetUserTypeType = Request['user'];
export type GetTimestampType = Request['timestamp'];
export type GetTenantType = Request['tenant'];
export type GetTargetType = Request['target'];
export type GetSubjectType = Request['subject'];
export type GetQueryType = Request['query'];
export type GetPathType = Request['params'];
export type GetParamsType = Request['params'];
export type GetMethodType = Request['method'];
export type GetIdType = Request['id'];
export type GetHttpType = Request['http'];
export type GetHeadersType = Request['headers'];
export type GetFeaturesType = Request['features'];
export type GetEventType = Request['event'];
export type GetEntityType = Request['entity'];
export type GetLocaleType = Request['locale'];
// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @IsPresent() & @GetQueryProperty() decorator types
// **************************************************************************************************************************

// COMMON for SELECT, INSERT, UPDATE, DELETE
export type GetColumnsType = column_expr[] | string[];
export type GetWhereType = predicate;

// SELECT
export type GetDistinctType = SELECT<any>['SELECT']['distinct'];
export type GetExcludingType = SELECT<any>['SELECT']['excluding'];
export type GetOneType = SELECT<any>['SELECT']['one'];
export type GetLimitType = SELECT<any>['SELECT']['limit'];
export type GetLimitRowsType = number;
export type GetLimitOffsetType = number;
export type GetGroupByType = SELECT<any>['SELECT']['groupBy'];
export type GetHavingType = SELECT<any>['SELECT']['having'];
export type GetOrderByType = SELECT<any>['SELECT']['orderBy'];

// INSERT
export type GetAsType = INSERT<any>['INSERT']['as'];
export type GetEntriesType = INSERT<any>['INSERT']['entries'];
export type GetRowsType = INSERT<any>['INSERT']['rows'];
export type GetValuesType = INSERT<any>['INSERT']['values'];
export type GetIntoType = INSERT<any>['INSERT']['into'];

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
