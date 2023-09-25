import 'reflect-metadata';
import {
  type CDSTyperAction,
  HandlerType,
  type ReturnRequest,
  type ReturnRequestAndNext,
  type ReturnResultsAndRequest,
  type ReturnSingleInstanceCapable,
  type TypedRequest,
  type CRUD_EVENTS,
  type DRAFT_EVENTS,
} from '../util/types/types';
import { MetadataDispatcher } from '../util/helpers/MetadataDispatcher';
import Constants from '../util/constants/Constants';

/**
 * A decorator function that designates a method as an execution with a single instance constraint.
 * @SingleInstanceHandler decorator should be applied last in the method decorators, as it is the first to evaluate whether the request is for a single request or an entity set.
 *
 * @param {Function} targetMethod - The method to be executed when the request is for a single instance.
 *
 * @returns {MethodDecorator} - A method decorator function that handles single instance execution or an entity set
 *
 */

function SingleInstanceCapable<T, K extends TypedRequest<T>, Target extends Object>() {
  return function (
    target: Target,
    propertyKey: string | symbol,
    _: TypedPropertyDescriptor<ReturnSingleInstanceCapable<T, K>>,
  ) {
    const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.SINGLE_INSTANCE_FLAG_KEY);
    metadataDispatcher.setMethodAsSingleInstanceCapable(propertyKey);
  };
}

/**
 * Decorator function to mark a method as a draft operation.
 * @Draft decorator must be applied last as it will mark all 'upper' decorators as 'draft'
 * @see [SAP-CAP - Draft](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @see [CDS-TS-Dispatcher - Draft](https://github.com/dxfrontier/cds-ts-dispatcher#draft)
 */

function Draft<Target extends Object>() {
  return function (target: Target, propertyKey: string | symbol) {
    const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
    metadataDispatcher.setMethodAsDraft(propertyKey);
  };
}

/**
 * Builds a decorator for handling the .after method.
 *
 * @param {Event} event - The event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildAfter(event: CRUD_EVENTS, handlerType: HandlerType) {
  return function <Target extends Object>() {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnResultsAndRequest>,
    ): void {
      const isDraft: boolean = Reflect.getMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, target, propertyKey);
      const isSingleInstance: boolean = Reflect.getMetadata(
        Constants.DECORATOR.SINGLE_INSTANCE_FLAG_KEY,
        target,
        propertyKey,
      );
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        isDraft: !!isDraft,
        isSingleInstance,
      });
    };
  };
}

/**
 * Builds a decorator for handling the .before method.
 *
 * @param {Event} event - The event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildBefore(event: CRUD_EVENTS, handlerType: HandlerType) {
  return function <Target extends Object>() {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequest>,
    ): void {
      const draftFlag: boolean = Reflect.getMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, target, propertyKey);
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        isDraft: !!draftFlag,
      });
    };
  };
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param {Event} event - The custom action event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildOnDraft(event: CRUD_EVENTS | DRAFT_EVENTS, handlerType: HandlerType) {
  return function <Target extends Object>(name: CDSTyperAction) {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>,
    ): void {
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        actionName: name,
        isDraft: true,
      });
    };
  };
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param {Event} event - The custom action event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildOnBoundActionDraft(event: CRUD_EVENTS | DRAFT_EVENTS, handlerType: HandlerType) {
  return function <Target extends Object>(name: CDSTyperAction) {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>,
    ): void {
      const draftFlag: boolean = Reflect.getMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, target, propertyKey);
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        actionName: name,
        isDraft: !!draftFlag,
      });
    };
  };
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param {Event} event - The custom action event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildOn(event: CRUD_EVENTS | DRAFT_EVENTS, handlerType: HandlerType) {
  return function <Target extends Object>(name: CDSTyperAction) {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>,
    ): void {
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        actionName: name,
        isDraft: false,
      });
    };
  };
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param {Event} event - The custom action event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildOnCRUD<Target extends Object>(event: CRUD_EVENTS | DRAFT_EVENTS, handlerType: HandlerType) {
  return function () {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>,
    ): void {
      const draftFlag: boolean = Reflect.getMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, target, propertyKey);
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        isDraft: !!draftFlag,
      });
    };
  };
}

/**
 * ####################################################################################################################
 * Start `Before` methods
 * ####################################################################################################################
 */

/**
 * This decorator can be applied to methods that need to execute custom logic before a new resource is created.
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request)
 * @see [CDS-TS-Dispatcher - Before read](https://github.com/dxfrontier/cds-ts-dispatcher#beforecreate)
 */
const BeforeCreate = buildBefore('CREATE', HandlerType.Before);

/**
 * This decorator can be applied to methods that need to execute custom logic before a read operation is performed.
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request)
 * @see [CDS-TS-Dispatcher - Before read](https://github.com/dxfrontier/cds-ts-dispatcher#beforeread)
 */
const BeforeRead = buildBefore('READ', HandlerType.Before);

/**

 * This decorator can be applied to methods that need to execute custom logic before an update operation is performed.
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) 
 * @see [CDS-TS-Dispatcher - Before delete](https://github.com/dxfrontier/cds-ts-dispatcher#beforeupdate)
 */
const BeforeUpdate = buildBefore('UPDATE', HandlerType.Before);

/**
 *
 * This decorator can be applied to methods that need to execute custom logic before a delete operation is performed.
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request)
 * @see [CDS-TS-Dispatcher - Before delete](https://github.com/dxfrontier/cds-ts-dispatcher#beforedelete)
 */
const BeforeDelete = buildBefore('DELETE', HandlerType.Before);

/**
 * ####################################################################################################################
 * End `Before` methods
 * ####################################################################################################################
 */

/**
 * ####################################################################################################################
 * Start `After` methods
 * ####################################################################################################################
 */

/**
 * This decorator can be applied to methods that need to execute custom logic after a create operation is performed on the service.
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 * @see [CDS-TS-Dispatcher - After read](https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate)
 */
const AfterCreate = buildAfter('CREATE', HandlerType.After);

/**
 * Handles the 'AfterRead' event by attaching custom behavior to SAP CAP's `srv.after` method for read requests.
 * The `srv.after` callback response will contain the 'request' object and the 'results'
 *
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 * @see [CDS-TS-Dispatcher - After read](https://github.com/dxfrontier/cds-ts-dispatcher#afterread)
 */
const AfterRead = buildAfter('READ', HandlerType.After);

/**
 * This decorator can be applied to methods that need to execute custom logic after an update operation is performed on the service.
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 * @see [CDS-TS-Dispatcher - After update](https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate)
 */
const AfterUpdate = buildAfter('UPDATE', HandlerType.After);

/**
 * This decorator can be applied to methods that need to execute custom logic after a delete operation is performed.
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 * @see [CDS-TS-Dispatcher - After delete](https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete)
 */
const AfterDelete = buildAfter('DELETE', HandlerType.After);

/**
 * ####################################################################################################################
 * END `After` methods
 * ####################################################################################################################
 */

/**
 * ####################################################################################################################
 * Start `On` methods
 * ####################################################################################################################
 */

/**
 * This decorator can be applied to methods that need to execute custom logic when a create event is triggered.
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 * @see [CDS-TS-Dispatcher - On create](https://github.com/dxfrontier/cds-ts-dispatcher#oncreate)
 */
const OnCreate = buildOnCRUD('CREATE', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a read event is triggered.
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 * @see [CDS-TS-Dispatcher - On read](https://github.com/dxfrontier/cds-ts-dispatcher#onread)
 */
const OnRead = buildOnCRUD('READ', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when an update event is triggered.
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 * @see [CDS-TS-Dispatcher - On update](https://github.com/dxfrontier/cds-ts-dispatcher#onupdate)
 */
const OnUpdate = buildOnCRUD('UPDATE', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a delete event is triggered.
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 * @see [CDS-TS-Dispatcher - On delete](https://github.com/dxfrontier/cds-ts-dispatcher#ondelete)
 */
const OnDelete = buildOnCRUD('DELETE', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom action event is triggered.
 * @see [CAP srv.on(event) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-event)
 * @see [CDS-TS-Dispatcher - On action](https://github.com/dxfrontier/cds-ts-dispatcher#onaction)
 */
const OnAction = buildOn('ACTION', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom bound action event is triggered
 * @see [CAP srv.on(event) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-event)
 * @see [CDS-TS-Dispatcher - On bound action](https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction)
 */
const OnBoundAction = buildOnBoundActionDraft('BOUND_ACTION', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom bound action event is triggered
 * @see [CAP srv.on(event) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-event)
 * @see [CDS-TS-Dispatcher - On bound function](https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction)
 */
const OnBoundFunction = buildOnBoundActionDraft('BOUND_FUNC', HandlerType.On);
/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom action event is triggered.
 * @see [CAP srv.on(event) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-event)
 * @see [CDS-TS-Dispatcher - On function](https://github.com/dxfrontier/cds-ts-dispatcher#onfunction)
 */
const OnFunction = buildOn('FUNC', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that will handle when a new draft is created from an active instance
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @see [CDS-TS-Dispatcher - On edit draft](https://github.com/dxfrontier/cds-ts-dispatcher#oneditdraft)
 */
const OnEditDraft = buildOn('EDIT', HandlerType.On);

/**
 *
 * This decorator can be applied to methods that will handle when the 'active entity' is changed
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @see [CDS-TS-Dispatcher - On save draft](https://github.com/dxfrontier/cds-ts-dispatcher#onsavedraft)
 *
 */
const OnSaveDraft = buildOn('SAVE', HandlerType.On);

/**
 * ####################################################################################################################
 * End `ON` methods
 * ####################################################################################################################
 */

/**
 * ####################################################################################################################
 * Start `Draft` methods
 * ####################################################################################################################
 */

/**
 *
 * This decorator can be applied to methods when a 'draft' is created
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @see [CDS-TS-Dispatcher - On new Draft](https://github.com/dxfrontier/cds-ts-dispatcher#onnewdraft)
 */

const OnNewDraft = buildOnDraft('NEW', HandlerType.OnDraft);

/**
 *
 * This decorator can be applied to methods that will handle when 'draft' is cancelled
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @see [CDS-TS-Dispatcher - On Cancel Draft](https://github.com/dxfrontier/cds-ts-dispatcher#oncanceldraft)
 */

const OnCancelDraft = buildOnDraft('CANCEL', HandlerType.OnDraft);

export {
  // BEFORE events
  BeforeCreate,
  BeforeRead,
  BeforeUpdate,
  BeforeDelete,
  //
  // AFTER events
  AfterCreate,
  AfterRead,
  AfterUpdate,
  AfterDelete,
  //
  // ON events
  OnCreate,
  OnRead,
  OnUpdate,
  OnDelete,
  OnAction,
  OnFunction,
  OnBoundAction,
  OnBoundFunction,
  //
  // DRAFT events
  // Triggered on active entity E.g. 'MyEntity.drafts'
  Draft,
  OnNewDraft,
  OnCancelDraft,
  //
  // Triggered on active entity E.g. 'MyEntity'
  OnEditDraft,
  OnSaveDraft,
  //
  // SingleInstanceHandler,
  SingleInstanceCapable,
};
