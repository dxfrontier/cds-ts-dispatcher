import 'reflect-metadata';
import {
  HandlerType,
  type ReturnRequest,
  type ReturnRequestAndNext,
  type ReturnResultsAndRequest,
  type CRUD_EVENTS,
  type DRAFT_EVENTS,
  type CdsFunction,
} from '../util/types/types';
import { MetadataDispatcher } from '../util/helpers/MetadataDispatcher';
import Constants from '../util/constants/Constants';

/**
 * A decorator function that designates a method as an execution with a single instance constraint.
 * @SingleInstanceHandler decorator should be applied last in the method decorators, as it is the first to evaluate whether the request is for a single request or an entity set.
 * Note a third parameter must be added when this decorator is applied :
 * isSingleInstance: boolean
 *
 */

function SingleInstanceCapable<Target extends Object>() {
  // TODO find a way to add TypedPropertyDescriptor
  return function (target: Target, propertyKey: string | symbol, _: PropertyDescriptor) {
    const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.SINGLE_INSTANCE_FLAG_KEY);
    metadataDispatcher.setMethodAsSingleInstanceCapable(propertyKey);
  };
}

/**
 * Builds a decorator for handling the .after method.
 *
 * @param {Event} event - The event to handle.
 * @param {HandlerType} handlerType - The type of handler (Before, After, On).
 */

function buildAfter(options: { event: CRUD_EVENTS | DRAFT_EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>() {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnResultsAndRequest>,
    ): void {
      const { event, handlerType, isDraft } = options;
      const isSingleInstance = MetadataDispatcher.getSingleInstanceCapableFlag(target, propertyKey);

      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        isDraft,
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

function buildBefore(options: { event: CRUD_EVENTS | DRAFT_EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>() {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequest>,
    ): void {
      const { event, handlerType, isDraft } = options;
      const isSingleInstance = MetadataDispatcher.getSingleInstanceCapableFlag(target, propertyKey);

      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        isDraft,
        isSingleInstance,
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

function buildOnAction(options: { event: CRUD_EVENTS | DRAFT_EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>(name: CdsFunction) {
    return function (
      target: Target,
      _: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>,
    ): void {
      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { event, handlerType, isDraft } = options;

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        actionName: name,
        isDraft,
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

function buildOnCRUD<Target extends Object>(options: {
  event: CRUD_EVENTS | DRAFT_EVENTS;
  handlerType: HandlerType;
  isDraft: boolean;
}) {
  return function () {
    return function (
      target: Target,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<ReturnRequestAndNext>,
    ): void {
      const { event, handlerType, isDraft } = options;
      const isSingleInstance = MetadataDispatcher.getSingleInstanceCapableFlag(target, propertyKey);

      const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value!,
        isDraft,
        isSingleInstance,
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
 * @see [CDS-TS-Dispatcher - BeforeCreate](https://github.com/dxfrontier/cds-ts-dispatcher#beforecreate)
 */
const BeforeCreate = buildBefore({ event: 'CREATE', handlerType: HandlerType.Before, isDraft: false });

/**
 * This decorator can be applied to methods that need to execute custom logic before a new DRAFT resource is created.
 * @see [CDS-TS-Dispatcher - BeforeCreate](https://github.com/dxfrontier/cds-ts-dispatcher#beforecreate)
 */
const BeforeCreateDraft = buildBefore({ event: 'CREATE', handlerType: HandlerType.Before, isDraft: true });

/**
 * This decorator can be applied to methods that need to execute custom logic before a read operation is performed.
 * @see [CDS-TS-Dispatcher - BeforeRead](https://github.com/dxfrontier/cds-ts-dispatcher#beforeread)
 */
const BeforeRead = buildBefore({ event: 'READ', handlerType: HandlerType.Before, isDraft: false });

/**
 * This decorator can be applied to methods that need to execute custom logic before a DRAFT read operation is performed.
 * @see [CAP srv.before(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request)
 * @see [CDS-TS-Dispatcher - BeforeReadDraft](https://github.com/dxfrontier/cds-ts-dispatcher#methods--draft-entity)
 */
const BeforeReadDraft = buildBefore({ event: 'READ', handlerType: HandlerType.Before, isDraft: true });

/**

 * This decorator can be applied to methods that need to execute custom logic before an update operation is performed.
 * @see [CDS-TS-Dispatcher - BeforeUpdate](https://github.com/dxfrontier/cds-ts-dispatcher#beforeupdate)
 */
const BeforeUpdate = buildBefore({ event: 'UPDATE', handlerType: HandlerType.Before, isDraft: false });

/**

 * This decorator can be applied to methods that need to execute custom logic before a DRAFT update operation is performed.
 * @see [CDS-TS-Dispatcher - BeforeUpdateDraft](https://github.com/dxfrontier/cds-ts-dispatcher#methods---active-entity)
 */
const BeforeUpdateDraft = buildBefore({ event: 'UPDATE', handlerType: HandlerType.Before, isDraft: true });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic before a delete operation is performed.
 * @see [CDS-TS-Dispatcher - Before delete](https://github.com/dxfrontier/cds-ts-dispatcher#beforedelete)
 */
const BeforeDelete = buildBefore({ event: 'DELETE', handlerType: HandlerType.Before, isDraft: false });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic before a delete operation is performed on a draft
 * @see [CDS-TS-Dispatcher - Before delete](https://github.com/dxfrontier/cds-ts-dispatcher#methods--draft-entity)
 */
const BeforeDeleteDraft = buildBefore({ event: 'DELETE', handlerType: HandlerType.Before, isDraft: true });

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
 * This decorator can be applied to methods that need to execute custom logic after a create operation is performed.
 * @see [CDS-TS-Dispatcher - After create](https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate)
 */
const AfterCreate = buildAfter({ event: 'CREATE', handlerType: HandlerType.After, isDraft: false });

/**
 * This decorator can be applied to methods that need to execute custom logic after a create operation is performed.
 * @see [CDS-TS-Dispatcher - After create](https://github.com/dxfrontier/cds-ts-dispatcher#after)
 */
const AfterCreateDraft = buildAfter({ event: 'CREATE', handlerType: HandlerType.After, isDraft: true });

/**
 * This decorator can be applied to methods that need to execute custom logic after a read operation is performed.
 * @see [CDS-TS-Dispatcher - After read](https://github.com/dxfrontier/cds-ts-dispatcher#afterread)
 */
const AfterRead = buildAfter({ event: 'READ', handlerType: HandlerType.After, isDraft: false });

/**
 * This decorator can be applied to methods that need to execute custom logic after a read operation is performed as a draft.
 * @see [CDS-TS-Dispatcher - After read](https://github.com/dxfrontier/cds-ts-dispatcher#after)
 */
const AfterReadDraft = buildAfter({ event: 'READ', handlerType: HandlerType.After, isDraft: true });

/**
 * This decorator can be applied to methods that need to execute custom logic after an update operation is performed.
 * @see [CDS-TS-Dispatcher - After update](https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate)
 */
const AfterUpdate = buildAfter({ event: 'UPDATE', handlerType: HandlerType.After, isDraft: false });

/**
 * This decorator can be applied to methods that need to execute custom logic after an update operation is performed as a draft.
 * @see [CDS-TS-Dispatcher - After update](https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate)
 */
const AfterUpdateDraft = buildAfter({ event: 'UPDATE', handlerType: HandlerType.After, isDraft: true });

/**
 * This decorator can be applied to methods that need to execute custom logic after a delete operation is performed.
 * @see [CDS-TS-Dispatcher - After delete](https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete)
 */
const AfterDelete = buildAfter({ event: 'DELETE', handlerType: HandlerType.After, isDraft: false });

/**
 * This decorator can be applied to methods that need to execute custom logic after a delete operation is performed as a draft.
 * @see [CDS-TS-Dispatcher - After delete](https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete)
 */
const AfterDeleteDraft = buildAfter({ event: 'DELETE', handlerType: HandlerType.After, isDraft: true });

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
 * @see [CDS-TS-Dispatcher - On create](https://github.com/dxfrontier/cds-ts-dispatcher#oncreate)
 */
const OnCreate = buildOnCRUD({ event: 'CREATE', handlerType: HandlerType.On, isDraft: false });

/**
 * This decorator can be applied to methods that need to execute custom logic when a create event is triggered on draft.
 * @see [CDS-TS-Dispatcher - On create](https://github.com/dxfrontier/cds-ts-dispatcher#oncreate)
 */
const OnCreateDraft = buildOnCRUD({ event: 'CREATE', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a read event is triggered.
 * @see [CDS-TS-Dispatcher - On read](https://github.com/dxfrontier/cds-ts-dispatcher#onread)
 */
const OnRead = buildOnCRUD({ event: 'READ', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a read event is triggered on draft
 * @see [CDS-TS-Dispatcher - On read](https://github.com/dxfrontier/cds-ts-dispatcher#onread)
 */
const OnReadDraft = buildOnCRUD({ event: 'READ', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when an update event is triggered.
 * @see [CDS-TS-Dispatcher - On update](https://github.com/dxfrontier/cds-ts-dispatcher#onupdate)
 */
const OnUpdate = buildOnCRUD({ event: 'UPDATE', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when an update event is triggered on draft.
 * @see [CAP srv.on(request) Method](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request)
 * @see [CDS-TS-Dispatcher - On update](https://github.com/dxfrontier/cds-ts-dispatcher#onupdate)
 * @see [Draft](https://cap.cloud.sap/docs/node.js/fiori#draft-support)
 */
const OnUpdateDraft = buildOnCRUD({ event: 'UPDATE', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a delete event is triggered.
 * @see [CDS-TS-Dispatcher - On delete](https://github.com/dxfrontier/cds-ts-dispatcher#ondelete)
 */
const OnDelete = buildOnCRUD({ event: 'DELETE', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a delete event is triggered on draft
 * @see [CDS-TS-Dispatcher - On delete](https://github.com/dxfrontier/cds-ts-dispatcher#ondelete)
 */
const OnDeleteDraft = buildOnCRUD({ event: 'DELETE', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom action event is triggered.
 * @see [CDS-TS-Dispatcher - On action](https://github.com/dxfrontier/cds-ts-dispatcher#onaction)
 */
const OnAction = buildOnAction({ event: 'ACTION', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom bound action event is triggered
 * @see [CDS-TS-Dispatcher - On bound action](https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction)
 */
const OnBoundAction = buildOnAction({ event: 'BOUND_ACTION', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom bound action event is triggered as a draft.
 * @see [CDS-TS-Dispatcher - On bound action](https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction)
 */
const OnBoundActionDraft = buildOnAction({ event: 'BOUND_ACTION', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom bound function event is triggered
 * @see [CDS-TS-Dispatcher - On bound function](https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction)
 */
const OnBoundFunction = buildOnAction({ event: 'BOUND_FUNC', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom bound function event is triggered as a draft.
 * @see [CDS-TS-Dispatcher - On bound function](https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction)
 */
const OnBoundFunctionDraft = buildOnAction({ event: 'BOUND_FUNC', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods that need to execute custom logic when a custom function event is triggered.
 * @see [CDS-TS-Dispatcher - On function](https://github.com/dxfrontier/cds-ts-dispatcher#onfunction)
 */
const OnFunction = buildOnAction({ event: 'FUNC', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods when a new draft is created from an active instance.
 * @see [CDS-TS-Dispatcher - On edit draft](https://github.com/dxfrontier/cds-ts-dispatcher#oneditdraft)
 */
const OnEditDraft = buildOnCRUD({ event: 'EDIT', handlerType: HandlerType.On, isDraft: false });

/**
 *
 * This decorator can be applied to methods when the 'active entity' is changed.
 * @see [CDS-TS-Dispatcher - On save draft](https://github.com/dxfrontier/cds-ts-dispatcher#onsavedraft)
 *
 */
const OnSaveDraft = buildOnCRUD({ event: 'SAVE', handlerType: HandlerType.On, isDraft: false });

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
 * This decorator can be applied to methods when a 'draft' is created.
 * @see [CDS-TS-Dispatcher - On new draft](https://github.com/dxfrontier/cds-ts-dispatcher#onnewdraft)
 */

const OnNewDraft = buildOnCRUD({ event: 'NEW', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods when a 'draft' is cancelled.
 * @see [CDS-TS-Dispatcher - On cancel draft](https://github.com/dxfrontier/cds-ts-dispatcher#oncanceldraft)
 */

const OnCancelDraft = buildOnCRUD({ event: 'CANCEL', handlerType: HandlerType.On, isDraft: true });

/**
 *
 * This decorator can be applied to methods when before a 'draft' is created.
 * @see [CDS-TS-Dispatcher - Before new draft](https://github.com/dxfrontier/cds-ts-dispatcher#beforenewdraft)
 */

const BeforeNewDraft = buildBefore({ event: 'NEW', handlerType: HandlerType.Before, isDraft: true });

/**
 *
 * This decorator can be applied to methods when before a 'draft' is canceled.
 * @see [CDS-TS-Dispatcher - Before cancel draft](https://github.com/dxfrontier/cds-ts-dispatcher#beforecanceldraft)
 */

const BeforeCancelDraft = buildBefore({ event: 'CANCEL', handlerType: HandlerType.Before, isDraft: true });

/**
 *
 * This decorator can be applied to methods when before a 'draft' is edited.
 * @see [CDS-TS-Dispatcher - Before edit draft](https://github.com/dxfrontier/cds-ts-dispatcher#beforeeditdraft)
 */

const BeforeEditDraft = buildBefore({ event: 'EDIT', handlerType: HandlerType.Before, isDraft: false });

/**
 *
 * This decorator can be applied to methods when before a 'draft' is saved.
 * @see [CDS-TS-Dispatcher - Before save draft](https://github.com/dxfrontier/cds-ts-dispatcher#beforesavedraft)
 */

const BeforeSaveDraft = buildBefore({ event: 'SAVE', handlerType: HandlerType.Before, isDraft: false });

/**
 *
 * This decorator can be applied to methods when after a new 'draft' is created.
 * @see [CDS-TS-Dispatcher - After new draft](https://github.com/dxfrontier/cds-ts-dispatcher#afternewdraft)
 */

const AfterNewDraft = buildAfter({ event: 'NEW', handlerType: HandlerType.After, isDraft: true });

/**
 *
 * This decorator can be applied to methods when after a 'draft' is saved.
 * @see [CDS-TS-Dispatcher - After cancel draft](https://github.com/dxfrontier/cds-ts-dispatcher#aftercanceldraft)
 */

const AfterCancelDraft = buildAfter({ event: 'CANCEL', handlerType: HandlerType.After, isDraft: true });

/**
 *
 * This decorator can be applied to methods when after a 'draft' is edited.
 * @see [CDS-TS-Dispatcher - After edit draft](https://github.com/dxfrontier/cds-ts-dispatcher#aftereditdraft)
 */

const AfterEditDraft = buildAfter({ event: 'EDIT', handlerType: HandlerType.After, isDraft: false });

/**
 *
 * This decorator can be applied to methods when after a 'draft' is saved.
 * @see [CDS-TS-Dispatcher - After save draft](https://github.com/dxfrontier/cds-ts-dispatcher#aftersavedraft)
 */

const AfterSaveDraft = buildAfter({ event: 'SAVE', handlerType: HandlerType.After, isDraft: false });

export {
  SingleInstanceCapable,
  // ========================================================================================================================================================
  // BEFORE events - Active entity
  BeforeCreate,
  BeforeRead,
  BeforeUpdate,
  BeforeDelete,

  // BEFORE events - Draft
  BeforeCreateDraft,
  BeforeReadDraft,
  BeforeUpdateDraft,
  BeforeDeleteDraft,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // AFTER events - Active entity
  AfterCreate,
  AfterRead,
  AfterUpdate,
  AfterDelete,
  // After events - Draft
  AfterCreateDraft,
  AfterReadDraft,
  AfterUpdateDraft,
  AfterDeleteDraft,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // ON events
  OnCreate,
  OnRead,
  OnUpdate,
  OnDelete,
  OnAction,
  OnFunction,
  OnBoundAction,
  OnBoundFunction,
  // ON events - Draft
  OnCreateDraft,
  OnReadDraft,
  OnUpdateDraft,
  OnDeleteDraft,
  OnBoundActionDraft,
  OnBoundFunctionDraft,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // DRAFT specific events
  // Triggered on draft entity 'MyEntity.drafts'

  // Before events
  BeforeNewDraft,
  BeforeCancelDraft,
  BeforeEditDraft,
  BeforeSaveDraft,

  // After events
  AfterNewDraft,
  AfterCancelDraft,
  AfterEditDraft,
  AfterSaveDraft,

  // Action events
  OnNewDraft,
  OnCancelDraft,

  // Triggered on active entity 'MyEntity'
  OnEditDraft,
  OnSaveDraft,
};
