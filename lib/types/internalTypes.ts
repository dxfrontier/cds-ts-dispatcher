/* eslint-disable @typescript-eslint/consistent-type-imports */
import { EventContext, Query } from '@sap/cds';

import constants from '../constants/constants';
import { HandlerType } from './enum';

import type { CdsFunction, EVENTS, RequestType, Request, NextEvent } from './types';

// **************************************************************************************************************************
// Common types
// **************************************************************************************************************************

export type TemporaryArgs = {
  req: Request;
  next: NextEvent;
  event: EventContext;
  error: Error;
  results: unknown | unknown[];
};

export type NonEmptyArray<T> = [T, ...T[]];

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
// @IsPresent() & @GetQuery() decorator types
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

type ExtraRequestKey = 'REQ';

export type QueryKeys = Exclude<keyof Query | ExtraRequestKey, 'DROP' | 'CREATE'>;
export type CRUDQueryKeys = Exclude<QueryKeys, 'REQ'>;

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
  type: 'ROLE';
  property: string[];
};

type IsColumnValueSupplied = {
  type: 'CHECK_COLUMN_VALUE';
  property: string;
};

type QueryProperties<Key extends QueryKeys> = {
  type: 'QUERY';
  property: PickQueryPropsByKey<Key>;
  key: Key;
};

export type RequestProperties = {
  type: 'REQ';
  property: keyof Request;
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
  metadataKey: keyof typeof constants.DECORATOR.PARAMETER;
  target: object;
  propertyKey: string | symbol;
  metadataFields: MetadataFields;
};

type ExcludedRequestMethods = 'reject' | 'notify' | 'reply' | 'warn' | 'error';
export type CustomRequest = Exclude<keyof Request, ExcludedRequestMethods>;

// **************************************************************************************************************************
// **************************************************************************************************************************
