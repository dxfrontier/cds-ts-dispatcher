/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Query } from '@sap/cds';

import constants from '../constants/constants';
import { HandlerType } from './enum';

import type { CdsFunction, EVENTS, RequestType, Request } from './types';

// **************************************************************************************************************************
// Common types
// **************************************************************************************************************************

export type NonEmptyArray<T> = [T, ...T[]];

export type HandlerBuilder = {
  buildHandlers: () => void;
  buildMiddlewares: () => void;
};

export type Handler = {
  event: EVENTS;
  handlerType: HandlerType;
  callback: RequestType;
  actionName?: CdsFunction;
  eventName?: string;
  isDraft?: boolean;
};

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @IsPresent() & @GetQueryProperty() decorator types
// **************************************************************************************************************************

type ExtraProperties = 'limit.rows' | 'limit.offset';
type ExcludedSelectProperties = 'count' | 'forUpdate' | 'forShareLock' | 'search';

export type QueryInsertProps = {
  type: 'INSERT';
  props: keyof INSERT<any>['INSERT'];
};

export type QuerySelectProps = {
  type: 'SELECT';
  props: keyof Omit<SELECT<any>['SELECT'], ExcludedSelectProperties> | ExtraProperties;
};

export type QueryUpdateProps = {
  type: 'UPDATE';
  props: keyof UPDATE<any>['UPDATE'];
};

export type QueryUpsertProps = {
  type: 'UPSERT';
  props: keyof UPSERT<any>['UPSERT'];
};

export type QueryDeleteProps = {
  type: 'DELETE';
  props: keyof DELETE<any>['DELETE'];
};

// FIXME: 'REQUEST' should not be on QueryKeys

type ExtraRequestKey = 'REQUEST';
export type QueryKeys = Exclude<keyof Query | ExtraRequestKey, 'DROP' | 'CREATE'>;

export type PickQueryPropsByKey<Key extends QueryKeys> = Key extends QueryInsertProps['type']
  ? QueryInsertProps['props']
  : Key extends QuerySelectProps['type']
    ? QuerySelectProps['props']
    : Key extends QueryUpdateProps['type']
      ? QueryUpdateProps['props']
      : Key extends QueryDeleteProps['type']
        ? QueryDeleteProps['props']
        : Key extends QueryUpsertProps['type']
          ? QueryUpsertProps['props']
          : never;

type OnlyParameterIndexDecorator = {
  type: 'INDEX_DECORATOR';
};

type IsRoleProperties = {
  type: 'USER';
  property: string;
};

type RequestProperties = {
  type: 'REQUEST';
  property: keyof Request;
};

type IsColumnValueSupplied = {
  type: 'CHECK_COLUMN_VALUE';
  property: string | number | symbol;
};

type QueryProperties<Key extends QueryKeys> = {
  type: 'QUERY';
  property: PickQueryPropsByKey<Key>;
  requestQueryKey: Key;
};

export type MetadataFields = {
  parameterIndex: number;
} & (
  | QueryProperties<QueryKeys>
  | RequestProperties
  | OnlyParameterIndexDecorator
  | IsColumnValueSupplied
  | IsRoleProperties
);

export type MetadataInputs = {
  metadataKey: keyof typeof constants.DECORATOR;
  target: object;
  propertyKey: string | symbol;
  metadataFields: MetadataFields;
};

type ExcludedRequestMethods = 'reject' | 'notify' | 'reply' | 'warn' | 'error';
export type CustomRequest = Exclude<keyof Request, ExcludedRequestMethods>;

// **************************************************************************************************************************
// **************************************************************************************************************************
