import type { Query } from '@sap/cds';

import { StatusCodes } from 'http-status-codes';

import type constants from '../constants/internalConstants';

import type {
  CdsFunction,
  RequestType,
  Request,
  NextEvent,
  // ON_EVENT,
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
  msg: Request;
};

export type NonEmptyArray<T> = [T, ...T[]];

export type ParameterDecorators = keyof typeof constants.DECORATOR.PARAMETER;

// **************************************************************************************************************************
// @AfterRead, @AfterCreate, @BeforeCreate, @BeforeUpdate, @OnRead, etc decorator types
// **************************************************************************************************************************

export type EventKind = 'BEFORE' | 'AFTER' | 'AFTER_SINGLE' | 'ON' | 'PREPEND';

type MessagingTypes = {
  SAME_NODE_PROCESS: {
    /**
     * Use when both `emitter` and `receiver` run in the same `CAP server instance` & `same service`.
     *
     * @example
     * // Emitting event
     * this.emit('NameOfTheEvent', { ID: '123', amount: 99.99 }); // where this is the service
     *
     * // Subscribing to event
     * /@OnSubscribe({
     *  eventName: 'NameOfTheEvent',
     *  type: 'SAME_NODE_PROCESS',
     * })
     *
     * */
    type: 'SAME_NODE_PROCESS';
  };
  SAME_NODE_PROCESS_DIFFERENT_SERVICE: {
    /**
     * Use when `emitter` can be found in E.g. `Service A` and `receiver` can reside in E.g. `Service B`, having same `CAP server instance` & `different services`.
     *
     * @example
     * // Emitting event from `Service A`
     * const service = cds.connect.to('Service_A');
     *       service.emit('NameOfTheEvent', { ID: '123', amount: 99.99 });
     * // or use this.emit ... assuming `this` is the service `Service_A`
     *
     * // Subscribing to event from `Service B`
     * /@OnSubscribe({
     *  eventName: 'NameOfTheEvent',
     *  type: 'SAME_NODE_PROCESS_DIFFERENT_SERVICE',
     *  externalService: 'Service_A'
     * })
     * */
    type: 'SAME_NODE_PROCESS_DIFFERENT_SERVICE';
  };
  MESSAGING: {
    /**
     * Recommended for production with external message brokers
     *
     * @example
     * // Emitting event
     * const msg = await cds.connect.to('messaging');
     *       msg.emit('NameOfTheEvent', { foo: 11, bar: '22' });
     *
     * // Subscribing to event
     * /@OnSubscribe({
     *  eventName: 'NameOfTheEvent',
     *  type: 'MESSAGE_BROKER',
     * })
     * */
    type: 'MESSAGE_BROKER';
  };
};

export type MessagingDifferentServices = {
  /**
   * Name of the external service to which you are subscribing to.
   *
   * @example
   * ```ts
   * service CatalogService {
   *  // ... projections on entities
   * }
   * ```
   */
  externalServiceName: string;
} & MessagingTypes['SAME_NODE_PROCESS_DIFFERENT_SERVICE'];

export type EventMessagingOptions = {
  /**
   * Name of the event to subscribe to.
   */
  eventName: string | object;
  /**
   * When enabled, displays inbound message payloads in the specified format.
   *
   * @example // With showReceiverMessage: true
   * > received: EventName { ID: '123', amount: 99.99 }
   *
   * @default false
   */
  showReceiverMessage?: boolean;

  /**
   * Specifies the log output format for received messages (when `showReceiverMessage` is true).
   *
   * - `'table'`: Displays data using `console.table()`, ideal for structured messages.
   * - `'debug'`: Displays data using  `console.debug()`, ideal for nested or dynamic messages.
   *
   * @example
   * // With consoleStyle: 'table'
   * ┌─────────┬──────┬────────┐
   * │ (index) │  ID  │ amount │
   * ├─────────┼──────┼────────┤
   * │    0    │ '123'│ 99.99  │
   * └─────────┴──────┴────────┘
   *
   * @default 'debug'
   */
  consoleStyle?: 'table' | 'debug';
} & (MessagingTypes['SAME_NODE_PROCESS'] | MessagingTypes['MESSAGING'] | MessagingDifferentServices);

export type PrependHandler = {
  type: 'PREPEND';
  event: EVENTS;
  options: {
    actionName?: CdsFunction | string;
    eventName?: string;
  };
};

export type OnHandler = {
  type: 'ACTION_FUNCTION';
  event: ACTION_EVENTS | FUNCTION_EVENTS;
  actionName: CdsFunction | string;
};

export type EventMessagingHandler = {
  type: 'EVENT';
  event: 'MESSAGING_EVENT';
  options: EventMessagingOptions;
};

export type EventHandler = {
  type: 'EVENT';
  event: 'EVENT';
  eventName: string;
};

export type DefaultHandlers = {
  type: 'DEFAULT';
  event: CRUD_EVENTS | DRAFT_EVENTS | ERROR_EVENT;
};

export type BaseHandler = {
  callback: RequestType;
  eventKind: EventKind;
  isDraft: boolean;
} & (DefaultHandlers | OnHandler | EventHandler | EventMessagingHandler | PrependHandler);

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
  eventDecorator:
    | 'OnAction'
    | 'OnFunction'
    | 'OnBoundAction'
    | 'OnBoundFunction'
    //
    | 'BeforeAction'
    | 'BeforeFunction'
    | 'BeforeBoundAction'
    | 'BeforeBoundFunction'
    //
    | 'AfterAction'
    | 'AfterFunction'
    | 'AfterBoundAction'
    | 'AfterBoundFunction';
  actionName: CdsFunction | string;
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

export type MapPrepend = {
  event: EVENTS;
  eventKind: EventKind;
  actionName?: CdsFunction | string;
  eventName?: CdsEvent;
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

type EnvProperty = {
  type: 'ENV';
  property: string;
};

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
  | EnvProperty
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

// **************************************************************************************************************************
// @Env types
// **************************************************************************************************************************

type Primitive = string | number | bigint | boolean | undefined | symbol;

export type PropertyStringPath<T, Prefix = ''> = {
  [K in keyof T]: K extends 'valueOf' | 'toString'
    ? never
    : T[K] extends Primitive | any[]
      ? `${string & Prefix}${string & K}`
      : `${string & Prefix}${string & K}` | PropertyStringPath<T[K], `${string & Prefix}${string & K}.`>;
}[keyof T];

// **************************************************************************************************************************
// **************************************************************************************************************************

// **************************************************************************************************************************
// @OnErrorMessage types
// **************************************************************************************************************************

export type StatusCodeMapping = {
  [K in keyof typeof StatusCodes as `${K}-${Extract<(typeof StatusCodes)[K], number>}`]: (typeof StatusCodes)[K];
};

// **************************************************************************************************************************
// **************************************************************************************************************************
