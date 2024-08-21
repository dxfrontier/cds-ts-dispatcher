import type { Query } from '@sap/cds';

import type constants from '../constants/internalConstants';
import { HandlerType } from './enum';

import type {
  CdsFunction,
  RequestType,
  Request,
  NextEvent,
  ON_EVENT,
  ACTION_EVENTS,
  FUNCTION_EVENTS,
  CRUD_EVENTS,
  ERROR_EVENT,
  DRAFT_EVENTS,
  EVENTS,
  CdsEvent,
  RequestResponse,
} from './types';

// **************************************************************************************************************************
// Common types
// **************************************************************************************************************************

export type Entity = { drafts: { name: string }; name: string };

export type Constructable<T = any> = new (...args: any[]) => T;

export type ServiceBeforeHandlers = {
  _handlers: {
    before: any[];
  };
};

export type ExtendedRequestWithResults = Request & {
  results: any;
};

export type TemporaryArgs = {
  req: Request;
  res: RequestResponse;
  next: NextEvent;
  error: Error;
  results: unknown | unknown[];
};

export type NonEmptyArray<T> = [T, ...T[]];

// **************************************************************************************************************************
// @AfterRead, @AfterCreate, @BeforeCreate, @BeforeUpdate, @OnRead, etc decorator types
// **************************************************************************************************************************

export type EventKind = 'BEFORE' | 'AFTER' | 'AFTER_SINGLE' | 'ON';

export type PrependHandler = {
  type: 'PREPEND';
  event: EVENTS;
  options: {
    actionName?: CdsFunction;
    eventName?: string;
  };
};

export type OnHandler = {
  type: 'ACTION_FUNCTION';
  event: ACTION_EVENTS | FUNCTION_EVENTS;
  actionName: CdsFunction;
};

export type EventHandler = {
  type: 'EVENT';
  event: ON_EVENT;
  eventName: string;
};

export type DefaultHandlers = {
  type: 'DEFAULT';
  event: CRUD_EVENTS | DRAFT_EVENTS | ERROR_EVENT;
};

export type BaseHandler = {
  handlerType: HandlerType;
  callback: RequestType;
  eventKind: EventKind;
  isDraft: boolean;
} & (DefaultHandlers | OnHandler | EventHandler | PrependHandler);

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @Prepend decorator types
// **************************************************************************************************************************

export type PrependEvent = {
  eventDecorator: 'OnEvent';
  eventName: CdsEvent;
};

export type PrependAction = {
  eventDecorator: 'OnAction' | 'OnFunction' | 'OnBoundAction' | 'OnBoundFunction';
  actionName: CdsFunction;
};

export type PrependDecorators = {
  eventDecorator:
    | 'AfterCreate'
    | 'AfterRead'
    | 'AfterReadSingleInstance'
    | 'AfterReadEachInstance'
    | 'AfterUpdate'
    | 'AfterDelete'
    | 'AfterAll'
    //
    | 'BeforeCreate'
    | 'BeforeRead'
    | 'BeforeUpdate'
    | 'BeforeDelete'
    | 'BeforeAll'
    //
    | 'OnCreate'
    | 'OnRead'
    | 'OnUpdate'
    | 'OnDelete'
    | 'OnAll'
    | 'OnError';
};

export type PrependBase = {} & (PrependAction | PrependDecorators | PrependEvent);

export type PrependDraftDecorators = {
  eventDecorator:
    | 'AfterCreateDraft'
    | 'AfterReadDraft'
    | 'AfterReadDraftSingleInstance'
    | 'AfterReadDraftEachInstance'
    | 'AfterUpdateDraft'
    | 'AfterDeleteDraft'
    | 'AfterNewDraft'
    | 'AfterCancelDraft'
    | 'AfterEditDraft'
    | 'AfterSaveDraft'
    //
    | 'BeforeCreateDraft'
    | 'BeforeReadDraft'
    | 'BeforeUpdateDraft'
    | 'BeforeDeleteDraft'
    | 'BeforeNewDraft'
    | 'BeforeCancelDraft'
    | 'BeforeEditDraft'
    | 'BeforeSaveDraft'
    //
    | 'OnCreateDraft'
    | 'OnReadDraft'
    | 'OnUpdateDraft'
    | 'OnDeleteDraft'
    | 'OnNewDraft'
    | 'OnCancelDraft'
    | 'OnEditDraft'
    | 'OnSaveDraft';
};

export type PrependDraftAction = {
  eventDecorator: 'OnBoundActionDraft' | 'OnBoundFunctionDraft';
  actionName: CdsFunction;
};

export type PrependBaseDraft = {} & (PrependDraftAction | PrependDraftDecorators);

export type MapPrepend = { event: EVENTS; eventKind: EventKind; actionName?: CdsFunction; eventName?: CdsEvent };

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
