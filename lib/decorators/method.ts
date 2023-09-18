import 'reflect-metadata'
import {
  CDSTyperAction,
  HandlerType,
  ReturnRequest,
  ReturnRequestAndNext,
  ReturnResultsAndRequest,
  CRUD_EVENTS,
  DRAFT_EVENTS,
} from '../util/types/types'
import { MetadataDispatcher } from '../util/helpers/MetadataDispatcher'
import Constants from '../util/constants/Constants'

/**
 * Decorator function to mark a method as a draft operation.
 * @Draft decorator must be applied last as it will mark all 'upper' decorators as 'draft'
 *
 * @example
 * class CustomerHandler {
 *
 * ...After, Before, On
 * @AfterRead() - AfterRead will be marked as Draft
 * ...
 * @Draft()
 * public async doSomething(results: any[], req: Request) {
 * // handle custom logic
 * }
 *
 * }
 *
 * @see https://cap.cloud.sap/docs/node.js/fiori#draft-support
 */

function Draft() {
  return function (target: any, propertyKey: string) {
    const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME)
    metadataDispatcher.setMethodAsDraft(propertyKey)
  }
}

/**
 * Builds a decorator for handling the .after method.
 *
 * @param {Event} event - The event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildAfter(event: CRUD_EVENTS, handlerType: HandlerType) {
  return function () {
    return function (target: any, propertyKey: any, descriptor: TypedPropertyDescriptor<ReturnResultsAndRequest>): void {
      const isDraft: boolean = Reflect.getMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, target, propertyKey)
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME)

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        isDraft: !!isDraft,
      })
    }
  }
}

/**
 * Builds a decorator for handling the .before method.
 *
 * @param {Event} event - The event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildBefore(event: CRUD_EVENTS, handlerType: HandlerType) {
  return function () {
    return function (target: any, propertyKey: any, descriptor: TypedPropertyDescriptor<ReturnRequest>): void {
      const draftFlag: boolean = Reflect.getMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, target, propertyKey)
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME)

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        isDraft: !!draftFlag,
      })
    }
  }
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param {Event} event - The custom action event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildOnDraft(event: CRUD_EVENTS | DRAFT_EVENTS, handlerType: HandlerType) {
  return function (name: CDSTyperAction) {
    return function (target: any, propertyKey: any, descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>): void {
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME)

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        actionName: name,
        isDraft: true,
      })
    }
  }
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param {Event} event - The custom action event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildOn(event: CRUD_EVENTS | DRAFT_EVENTS, handlerType: HandlerType) {
  return function (name: CDSTyperAction) {
    return function (target: any, propertyKey: any, descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>): void {
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME)

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        actionName: name,
        isDraft: false,
      })
    }
  }
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param {Event} event - The custom action event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildOnCRUD(event: CRUD_EVENTS | DRAFT_EVENTS, handlerType: HandlerType) {
  return function () {
    return function (target: any, propertyKey: any, descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>): void {
      const draftFlag: boolean = Reflect.getMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, target, propertyKey)
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME)

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        isDraft: !!draftFlag,
      })
    }
  }
}

/**
 * ####################################################################################################################
 * Start `Before` methods
 * ####################################################################################################################
 */

/**
 * This decorator can be applied to methods that need to execute custom logic before a new resource is created.
 *
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request)
 * @returns req : Request - The request to be handled further.
 * @example
 * // Apply the decorator to handle the 'BeforeCreate' event.
 * @BeforeCreate
 * function myBeforeCreateHandler(req: Request) {
 *     // Custom logic to be executed before the create operation.
 * }
 */
const BeforeCreate = buildBefore('CREATE', HandlerType.Before)

/**
 * This decorator can be applied to methods that need to execute custom logic before a read operation is performed.
 * The decorated function is called with the request object before the read operation.
 *
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request)
 * @returns req : Request - The request to be handled further.
 * @example
 * // Apply the decorator to handle the 'BeforeRead' event.
 * @BeforeRead
 * function myBeforeReadHandler(req: Request) {
 *     // Custom logic to be executed before the read operation.
 * }
 */
const BeforeRead = buildBefore('READ', HandlerType.Before)

/**

 * This decorator can be applied to methods that need to execute custom logic before an update operation is performed.
 * The decorated function is called with the request object before the update operation.
 * 
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) 
 * @returns req : Request - The request to be handled further.
 * @example
 * // Apply the decorator to handle the 'BeforeUpdate' event.
 * @BeforeUpdate
 * function myBeforeUpdateHandler(req: Request) {
 *     // Custom logic to be executed before the update operation.
 * }
 */
const BeforeUpdate = buildBefore('UPDATE', HandlerType.Before)

/**
 *
 * This decorator can be applied to methods that need to execute custom logic before a delete operation is performed.
 * The decorated function is called with the request object before the delete operation.
 *
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request)
 * @returns req : Request - The request to be handled further.
 * @example
 * // Apply the decorator to handle the 'BeforeDelete' event.
 * @BeforeDelete
 * function myBeforeDeleteHandler(req: Request) {
 *     // Custom logic to be executed before the delete operation.
 * }
 */
const BeforeDelete = buildBefore('DELETE', HandlerType.Before)

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
 *
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 *
 * @example
 * @returns results : any[], req : Request - The result of custom logic execution and the request
 * @AfterCreate
 * function myAfterCreateHandler(results: any[], req: Request) {
 *     // Custom logic to be executed after the create operation.
 * }
 */
const AfterCreate = buildAfter('CREATE', HandlerType.After)

/**
 * Handles the 'AfterRead' event by attaching custom behavior to SAP CAP's `srv.after` method for read requests.
 * The `srv.after` callback response will contain the 'request' object and the 'results'
 *
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 * @returns results : any[], req : Request - The result of custom logic execution and the request
 * @example
 * // Apply the decorator to handle the 'AfterRead' event.
 * @AfterRead
 * function myAfterReadHandler(results: any[], req: Request) {
 *     // Custom logic to be executed after the read operation.
 * }
 */
const AfterRead = buildAfter('READ', HandlerType.After)

/**
 * This decorator can be applied to methods that need to execute custom logic after an update operation is performed on the service.
 * The `srv.after` callback response will contain the 'request' object and the 'results'
 *
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 * @returns results : any[], req : Request - The result of custom logic execution and the request
 * @example
 * // Apply the decorator to handle the 'AfterUpdate' event.
 * @AfterUpdate
 * function myAfterUpdateHandler(results: any[], req: Request) {
 *     // Custom logic to be executed after the update operation.
 * }
 */
const AfterUpdate = buildAfter('UPDATE', HandlerType.After)

/**
 * This decorator can be applied to methods that need to execute custom logic after a delete operation is performed.
 * The `srv.after` callback response will contain the 'request' object and the 'results'
 *
 * @see [CAP srv.after(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 * @returns results : any[], req : Request - The result of custom logic execution.
 * @example
 * // Apply the decorator to handle the 'AfterDelete' event.
 * @AfterDelete
 * function myAfterDeleteHandler(results: any[], req: Request) {
 *     // Custom logic to be executed after the delete operation.
 * }
 */
const AfterDelete = buildAfter('DELETE', HandlerType.After)

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
 * The decorated function is called with the request object before the create operation.
 *
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request)
 *
 * @example
 * // Apply the decorator to handle the 'OnCreate' event.
 * @OnCreate
 * function myOnCreateHandler(req: Request) {
 *     // Custom logic to be executed on the create event.
 * }
 */
const OnCreate = buildOnCRUD('CREATE', HandlerType.On)

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a read event is triggered.
 *
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 *
 * @example
 * // Apply the decorator to handle the 'OnRead' event.
 * @OnRead
 * function myOnReadHandler(req: Request) {
 *     // Custom logic to be executed on the read event.
 * }
 */
const OnRead = buildOnCRUD('READ', HandlerType.On)

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when an update event is triggered.
 *
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 *
 * @example
 * // Apply the decorator to handle the 'OnUpdate' event.
 * @OnUpdate
 * function myOnUpdateHandler(req: Request) {
 *     // Custom logic to be executed on the update event.
 * }
 */
const OnUpdate = buildOnCRUD('UPDATE', HandlerType.On)

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a delete event is triggered.
 *
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 *
 * @example
 * // Apply the decorator to handle the 'OnDelete' event.
 * @OnDelete
 * function myOnDeleteHandler(req: Request) {
 *     // Custom logic to be executed on the delete event.
 * }
 */
const OnDelete = buildOnCRUD('DELETE', HandlerType.On)

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom action event is triggered.
 *
 * @see [CAP srv.on(event) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-event)
 *
 * @example
 * // Apply the decorator to handle the 'OnAction' event.
 * @OnAction('nameOfTheAction')
 * function myOnActionHandler(req: Request) {
 *     // Custom logic to be executed on the custom action event.
 * }
 */
const OnAction = buildOn('ACTION', HandlerType.On)

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom action event is triggered.
 *
 * @see [CAP srv.on(event) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-event)
 *
 * @example
 * // Apply the decorator to handle the 'OnAction' event.
 * @OnAction('nameOfTheAction')
 * function myOnActionHandler(req: Request) {
 *     // Custom logic to be executed on the custom action event.
 * }
 */
const OnBoundAction = buildOn('BOUND_ACTION', HandlerType.On)
const OnBoundFunction = buildOn('BOUND_FUNC', HandlerType.On)
/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom action event is triggered.
 *
 * @see [CAP srv.on(event) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-event)
 *
 * @example
 * // Apply the decorator to handle the 'OnAction' event.
 * @OnFunction('nameOfTheAction')
 * function myOnActionHandler(req: Request) {
 *     // Custom logic to be executed on the custom action event.
 * }
 */
const OnFunction = buildOn('FUNC', HandlerType.On)

/**
 *
 * This decorator can be applied to methods that will handle when a new draft is created from an active instance
 *
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @example
 * @OnCreateDraftFromActiveInstance
 * function myCancelDraft(req: Request) {
 *     // Custom logic to be executed on the custom action event.
 * }
 *
 * Above decorator will be translated to
 * srv.on('EDIT', 'MyEntity', ...)
 *
 */
const OnEditDraft = buildOn('EDIT', HandlerType.On)

/**
 *
 * This decorator can be applied to methods that will handle When the active entity is changed
 *
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @example
 * @OnChangeDraftFromActiveEntity
 * function myDraft(req: Request) {
 *     // Custom logic to be executed on the custom action event.
 * }
 *
 * Above decorator will be translated to
 * srv.on('SAVE', 'MyEntity', ...)
 *
 */
const OnSaveDraft = buildOn('SAVE', HandlerType.On)

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
 *
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @example
 * @OnCreateDraft
 * function myOnActionHandler(req: Request) {
 *     // Custom logic to be executed on the custom action event.
 * }
 *
 * Above decorator will be translated to
 * srv.on('NEW', 'MyEntity.drafts', (req : Request) => {} )
 *
 */

const OnNewDraft = buildOnDraft('NEW', HandlerType.OnDraft)

/**
 *
 * This decorator can be applied to methods that will handle when 'draft' is cancelled
 *
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @example
 * @OnCancelDraft
 * function myCancelDraft(req: Request) {
 *     // Custom logic to be executed on the custom action event.
 * }
 *
 * Above decorator will be translated to
 * srv.on('CANCEL', 'MyEntity.drafts', (req : Request) => {})
 *
 */

const OnCancelDraft = buildOnDraft('CANCEL', HandlerType.OnDraft)

/**
 *
 * This decorator can be applied to methods that will handle when 'draft' is cancelled
 *
 * @see [CAP Draft Method](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 * @example
 * @OnCancelDraft
 * function myBoundActionOrFunction(req : Request, next : Function) {
 *     // Custom logic to be executed on the custom action event.
 * }
 *
 * Above decorator will be translated to
 * srv.on('boundActionOrFunction', 'MyEntity.drafts', (req : Request, next : Function) => {})
 *
 */

const OnBoundActionDraft = buildOnDraft('BOUND_ACTION', HandlerType.OnDraft)
const OnBoundFunctionDraft = buildOnDraft('BOUND_FUNC', HandlerType.OnDraft)

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
  Draft,
  OnNewDraft,
  OnCancelDraft,
  OnBoundActionDraft,
  OnBoundFunctionDraft,
  //
  // Triggered on active entity E.g. 'MyEntity'
  OnEditDraft,
  OnSaveDraft,
}
