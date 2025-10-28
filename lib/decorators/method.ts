import constants from '../constants/internalConstants';
import { ArgumentMethodProcessor } from '../core/ArgumentMethodProcessor';
import { MetadataDispatcher } from '../core/MetadataDispatcher';
import decoratorsUtil from '../util/decorators/decoratorsUtil';
import formatterUtil from '../util/formatter/formatterUtil';
import middlewareUtil from '../util/middleware/middlewareUtil';
import parameterUtil from '../util/parameter/parameterUtil';
import util from '../util/util';
import validatorUtil from '../util/validation/validatorUtil';
// import cds from '@sap/cds';

import type {
  ACTION_EVENTS,
  CRUD_EVENTS,
  CdsEvent,
  CdsFunction,
  DRAFT_EVENTS,
  ERROR_EVENT,
  FUNCTION_EVENTS,
  MiddlewareImpl,
  ON_EVENT,
  Request,
  RequestType,
} from '../types/types';

import type { Validators } from '../types/validator';
import type { Formatters } from '../types/formatter';
import type {
  Constructable,
  EventKind,
  EventMessagingOptions,
  PrependBase,
  PrependBaseDraft,
  StatusCodeMapping,
} from '../types/internalTypes';

/**
 * Use `CatchAndSetErrorCode` decorator to `catch errors` and assigns a `new status code` to the response.
 * @param newStatusCode - The new status code to use when an error occurs.
 * @example
 * "CatchAndSetErrorCode('BAD_REQUEST-400')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#errorCode | CDS-TS-Dispatcher - @CatchAndSetErrorCode}
 */
function CatchAndSetErrorCode(newStatusCode: keyof StatusCodeMapping) {
  return function (_: object, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);

      try {
        return await decoratorsUtil.handleAsyncErrors(originalMethod.bind(this, ...args), req);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        return decoratorsUtil.handleError({ req, code: newStatusCode });
      }
    };

    return descriptor;
  };
}

/**
 * Use `CatchAndSetErrorMessage` to `catch errors` and to provide a `custom error message` along with an `optional` `status code`.
 * @param newMessage - The custom error message to return.
 * @param newStatusCode - (Optional) The new status code to use. If not provided, the original status code is retained.
 * @example
 * "CatchAndSetErrorMessage('Bad request of the call', 'BAD_REQUEST-400')"
 * or
 * "CatchAndSetErrorMessage('Bad request of the call')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#onerrormessage | CDS-TS-Dispatcher - @CatchAndSetErrorMessage}
 */
function CatchAndSetErrorMessage(newMessage: string, newStatusCode?: keyof StatusCodeMapping) {
  return function (_: object, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);

      try {
        return await decoratorsUtil.handleAsyncErrors(originalMethod.bind(this, ...args), req);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        return decoratorsUtil.handleError({ req, message: newMessage, code: newStatusCode });
      }
    };

    return descriptor;
  };
}

/**
 * Use `@PrependDraft` decorator to register an event handler to run before existing ones.
 * @param options - The options object.
 * @param options.eventDecorator - The event decorator name, example `BeforeCreate`, `AfterCreate`, `BeforeDelete`, etc.
 * @param [options.actionName] - `[Optional]` This option will appear when `eventDecorator` is `OnBoundActionDraft`, `OnBoundFunctionDraft`.
 * @example
 * "@PrependDraft({ eventDecoratorName: 'BeforeReadDraft' })"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#prepend | CDS-TS-Dispatcher - @Prepend}
 */
function PrependDraft(options: PrependBaseDraft) {
  return function (target: object, propertyName: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const method = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
      return await method.apply(this, args);
    };

    // ********************************************************************************************************************************
    // Registration of events during start-up : @AfterCreate(), @AfterRead(), @AfterUpdate(), @AfterDelete()
    // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
    // ********************************************************************************************************************************

    const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
    const { event, eventKind, actionName } = decoratorsUtil.mapPrependDraftEvent(options);

    metadataDispatcher.addMethodMetadata({
      type: 'PREPEND',
      event,
      eventKind,
      options: {
        actionName,
      },
      callback: descriptor.value,
      isDraft: true,
    });
  };
}

/**
 * Use `@Prepend` decorator to register an event handler to be executed **before existing handlers**.
 * @param options - Configuration options for the decorator.
 * @param options.eventDecorator - The event decorator name (e.g., `BeforeCreate`, `AfterCreate`, `BeforeDelete`, etc.).
 * @param [options.actionName] - (Optional) Applicable when `eventDecorator` is `OnAction`, `OnFunction`, `OnBoundAction`, or `OnBoundFunction`.
 * @param [options.eventName] - (Optional) Applicable when `eventDecorator` is `OnEvent`.
 *
 * **Important:** When using `@Prepend` on decorators like [@OnCreate](#oncreate), [@OnRead](#onread), [@OnUpdate](#onupdate), [@OnDelete](#ondelete), [@OnAction](#onaction), [@OnFunction](#onfunction), [@OnEvent](#onevent), [@OnSubscribe](#onsubscribe), [@OnError](#onerror), [@OnBoundAction](#onboundaction), [@OnBoundFunction](#onboundfunction), [@OnAll](#onall) **calling** `return next()` **is mandatory** to ensure the actual action is executed.
 *
 * @example
 * "@Prepend({ eventDecoratorName: 'BeforeRead' })"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#prepend | CDS-TS-Dispatcher - @Prepend}
 */
function Prepend(options: PrependBase) {
  return function (target: object, propertyName: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const method = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
      return await method.apply(this, args);
    };

    // ********************************************************************************************************************************
    // Registration of events during start-up : @AfterCreate(), @AfterRead(), @AfterUpdate(), @AfterDelete()
    // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
    // ********************************************************************************************************************************

    const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
    const { event, eventKind, actionName, eventName } = decoratorsUtil.mapPrependEvent(options);

    metadataDispatcher.addMethodMetadata({
      type: 'PREPEND',
      event,
      eventKind,
      options: {
        actionName,
        eventName: eventName as unknown as string,
      },
      callback: descriptor.value,
      isDraft: false,
    });
  };
}

/**
 * Use `@ExecutionAllowedForRole` decorator to enforce role-based access control ensuring that only `Users` with specific role are authorized to execute the `event` (`AfterRead`, `AfterCreate`, ...) and the custom logic inside of the event.
 * @param ...roles[] An array of roles that are permitted to execute the event logic.
 * @example
 * "@ExecutionAllowedForRole('Manager', 'CEO')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#ExecutionAllowedForRole | CDS-TS-Dispatcher - @ExecutionAllowedForRole}
 */

function ExecutionAllowedForRole(...roles: string[]) {
  return function <Target>(_: Target, __: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const found = parameterUtil.findExecutionAllowedRoles(args, roles);

      if (!found) {
        return;
      }

      return await originalMethod.apply(this, args);
    };
  };
}

/**
 * Use `@FieldsFormatter` decorator to `enhance / format` the fields.
 * @param formatter The formatter method to apply.
 * @param fields An array of fields to apply the formatter method on.
 * @example
 * // Enhance the 'title' field of Book entity by removing the letter 'W' using the 'blacklist' action.
 * "@FieldsFormatter<Book>({ action: 'blacklist', charsToRemove: 'W' }, 'title')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#fieldsformatter | CDS-TS-Dispatcher - @FieldsFormatter}
 */
function FieldsFormatter<T>(formatter: Formatters<T>, ...fields: (keyof T)[]) {
  return function <Target>(_: Target, __: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const results = formatterUtil.findResults<T>(args);
      const req = util.findRequest(args);

      const isAfterEventManyResults = util.lodash.isArray(results);
      const isAfterEventOneResult = !util.lodash.isUndefined(results) && !isAfterEventManyResults;
      const isCustomFormatter = formatter.action === 'customFormatter';

      for (const field of fields) {
        // All 3 if's are applied on 'Results' (AFTER events)
        if (isCustomFormatter) {
          await formatterUtil.handleCustomFormatter(req, formatter, results);
          break;
        }

        if (isAfterEventManyResults) {
          formatterUtil.handleManyItems<T>(formatter, results, field);
          break;
        }

        if (isAfterEventOneResult) {
          formatterUtil.handleOneItem<T>(formatter, results, field);
          break;
        }

        // Applied only for 'Request' (ON, BEFORE events)
        formatterUtil.handleOneItemOfRequest<T>(req, formatter, field);
      }

      return await originalMethod.apply(this, args);
    };
  };
}

/**
 * Use `@Validate` decorator to validate fields.
 * @param validator The validation method to apply.
 * @param fields An array of fields to validate.
 * @example
 * // Validates the 'comment' field of 'MyEntity' entity using the 'contains' validator with the seed 'text'.
 * "@Validate<MyEntity>({ validator: 'contains', seed: 'text' }, 'comment')"
 * // If 'comment' contains 'text', the validation will not raise an error message.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#validate | CDS-TS-Dispatcher - @Validate}
 */

function Validate<T>(validator: Validators, ...fields: (keyof T)[]) {
  return function <Target extends object>(
    target: Target,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);
      const argumentProcessor = new ArgumentMethodProcessor(target, propertyKey, args);

      for (const field of fields) {
        const options: [Request, Validators, string] = [req, validator, field as string];

        if (validatorUtil.canValidate(...options)) {
          const validators = validatorUtil.applyValidator(...options);

          if (validators) {
            argumentProcessor.setValidatorFlags(validators);
          }
        }
      }

      return await originalMethod.apply(this, args);
    };
  };
}

/**
 * @deprecated
 * @see  {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#singleinstanceswitch | CDS-TS-Dispatcher - @SingleInstanceSwitch}
 */

function SingleInstanceCapable<Target extends object>() {
  return function (target: Target, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);
      const hasParameters = req.params.length > 0;

      const SINGLE_INSTANCE = true;
      const ENTITY_SET = false;

      if (hasParameters) {
        args.push(SINGLE_INSTANCE);
      } else {
        args.push(ENTITY_SET);
      }

      return await originalMethod.apply(this, args);
    };
  };
}

/**
 * Use the `@Use` decorator to associate a method or a class with a specified middleware classes, mainly used to `verify`, `enhance`, `validate` various request related-information.
 * @param MiddlewareClasses - The middleware classes to be applied.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#use | CDS-TS-Dispatcher - @Use}
 */
function Use<Middleware extends Constructable<MiddlewareImpl>>(...MiddlewareClasses: Middleware[]) {
  return function <Target extends object>(
    target: Target,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<RequestType>,
  ) {
    const isMethod = propertyKey !== undefined && descriptor !== undefined;

    if (isMethod) {
      // Method-level usage
      middlewareUtil.registerToMethod(MiddlewareClasses, descriptor);
      return;
    }

    // Class-level usage
    middlewareUtil.registerToClass(target, MiddlewareClasses);
  };
}

function buildAfter(options: {
  event: CRUD_EVENTS | DRAFT_EVENTS | ERROR_EVENT;
  eventKind: EventKind;
  isDraft: boolean;
}) {
  return function <Target extends object>() {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @AfterCreate(), @AfterRead(), @AfterUpdate(), @AfterDelete()
      // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const { event, eventKind, isDraft } = options;
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        type: 'DEFAULT',
        eventKind,
        event,
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

function buildBefore(options: {
  event: CRUD_EVENTS | DRAFT_EVENTS | ERROR_EVENT;
  eventKind: EventKind;
  isDraft: boolean;
}) {
  return function <Target extends object>() {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @BeforeCreate(), @BeforeRead(), @beforeUpdate(), @BeforeDelete()
      // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const { event, eventKind, isDraft } = options;
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        type: 'DEFAULT',
        eventKind,
        event,
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

function buildAction(options: { event: ACTION_EVENTS | FUNCTION_EVENTS; eventKind: EventKind; isDraft: boolean }) {
  return function <Target extends object>(name: CdsFunction | string) {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @OnAction(), @OnFunction(), @OnBoundAction(), @OnBoundFunction() + draft versions
      // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { event, eventKind, isDraft } = options;

      metadataDispatcher.addMethodMetadata({
        type: 'ACTION_FUNCTION',
        eventKind,
        event,
        callback: descriptor.value,
        actionName: name,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

function buildOnMessagingEvent(params: { event: 'MESSAGING_EVENT'; eventKind: EventKind; isDraft: boolean }) {
  return function <Target extends object>(options: EventMessagingOptions) {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @OnSubscribe
      // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { eventKind, isDraft } = params;

      metadataDispatcher.addMethodMetadata({
        type: 'EVENT',
        eventKind,
        event: params.event,
        options,
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

function buildOnEvent(options: { event: ON_EVENT; eventKind: EventKind; isDraft: boolean }) {
  return function <Target extends object>(name: CdsEvent) {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @OnEvent
      // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { isDraft, eventKind } = options;

      metadataDispatcher.addMethodMetadata({
        type: 'EVENT',
        eventKind,
        event: options.event,
        callback: descriptor.value,
        eventName: name as string,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

function buildOnError(options: { eventKind: EventKind; isDraft: boolean }) {
  return function <Target extends object>() {
    return function (target: Target, propertyName: string | symbol, descriptor: TypedPropertyDescriptor<any>): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        return method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of event during start-up : @OnError() decorator
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { eventKind, isDraft } = options;

      metadataDispatcher.addMethodMetadata({
        type: 'DEFAULT',
        eventKind,
        event: 'ERROR',
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

function buildOnCRUD<Target extends object>(options: {
  event: CRUD_EVENTS | DRAFT_EVENTS;
  eventKind: EventKind;
  isDraft: boolean;
}) {
  return function () {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @OnCreate(), @OnRead(), @OnUpdate(), @OnDelete(), @OnEditDraft(), @OnSaveDraft(), @OnNewDraft(), @OnCancelDraft
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const { event, eventKind, isDraft } = options;
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        type: 'DEFAULT',
        eventKind,
        event,
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

/**
 * ####################################################################################################################
 * Start `Before` methods
 * ####################################################################################################################
 */

/**
 * Use `@BeforeAll` decorator to execute custom logic before creating a new resource for all events `('CREATE', 'READ', 'UPDATE', 'DELETE', 'BOUND ACTION', 'BOUND FUNCTION')`
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeall | CDS-TS-Dispatcher - @BeforeAll}
 */
const BeforeAll = buildBefore({ event: '*', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeAllDraft` decorator to execute custom logic before creating a new `draft` resource for all events `('CREATE', 'READ', 'UPDATE', 'DELETE', 'BOUND ACTION', 'BOUND FUNCTION')`
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeall | CDS-TS-Dispatcher - @BeforeAll}
 */
const BeforeAllDraft = buildBefore({ event: '*', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeCreate` decorator to execute custom logic before creating a new resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecreate | CDS-TS-Dispatcher - @BeforeCreate}
 */
const BeforeCreate = buildBefore({ event: 'CREATE', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeCreateDraft` decorator to execute custom logic before creating a new DRAFT resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeCreateDraft}
 */
const BeforeCreateDraft = buildBefore({ event: 'CREATE', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeRead` decorator to execute custom logic before performing a read operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeread | CDS-TS-Dispatcher - @BeforeRead}
 */
const BeforeRead = buildBefore({ event: 'READ', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeReadDraft` decorator to execute custom logic before performing a DRAFT read operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeReadDraft}
 */
const BeforeReadDraft = buildBefore({ event: 'READ', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeUpdate` decorator to execute custom logic before performing an update operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeupdate | CDS-TS-Dispatcher - @BeforeUpdate}
 */
const BeforeUpdate = buildBefore({ event: 'UPDATE', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeUpdateDraft` decorator to execute custom logic before performing a DRAFT update operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeUpdateDraft}
 */
const BeforeUpdateDraft = buildBefore({ event: 'UPDATE', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeDelete` decorator to execute custom logic before performing a delete operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforedelete | CDS-TS-Dispatcher - @BeforeDelete}
 */
const BeforeDelete = buildBefore({ event: 'DELETE', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeDeleteDraft` decorator to execute custom logic before performing a delete operation on a draft.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeDeleteDraft}
 */
const BeforeDeleteDraft = buildBefore({ event: 'DELETE', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeAction` decorator to execute custom logic before an unbound action is triggered.
 *
 * This decorator allows you to run validation, authorization, or preparation logic
 * before the actual action implementation is executed.
 *
 * @param name - The name of the action, which can be a string or a CDS-Typer generated action.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeaction | CDS-TS-Dispatcher - @BeforeAction}
 */
const BeforeAction = buildAction({ event: 'ACTION', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeBoundAction` decorator to execute custom logic before a bound action is triggered on an entity.
 *
 * This decorator allows you to run validation, authorization, or preparation logic
 * before the actual bound action implementation is executed on a specific entity instance.
 *
 * @param name - The name of the bound action, which can be a string or a CDS-Typer generated bound action.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeboundaction | CDS-TS-Dispatcher - @BeforeBoundAction}
 */
const BeforeBoundAction = buildAction({ event: 'BOUND_ACTION', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeFunction` decorator to execute custom logic before an unbound function is triggered.
 *
 * This decorator allows you to run validation, authorization, or preparation logic
 * before the actual function implementation is executed.
 *
 * @param name - The name of the function, which can be a string or a CDS-Typer generated function.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforefunction | CDS-TS-Dispatcher - @BeforeFunction}
 */
const BeforeFunction = buildAction({ event: 'FUNC', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeBoundFunction` decorator to execute custom logic before a bound function is triggered on an entity.
 *
 * This decorator allows you to run validation, authorization, or preparation logic
 * before the actual bound function implementation is executed on a specific entity instance.
 *
 * @param name - The name of the bound function, which can be a string or a CDS-Typer generated bound function.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeboundfunction | CDS-TS-Dispatcher - @BeforeBoundFunction}
 */
const BeforeBoundFunction = buildAction({ event: 'BOUND_FUNC', eventKind: 'BEFORE', isDraft: false });

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
 * Use `@AfterAll` decorator to execute custom logic after creating a new resource for all events `('CREATE', 'READ', 'UPDATE', 'DELETE', 'BOUND ACTION', 'BOUND FUNCTION')`
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreateall | CDS-TS-Dispatcher - @AfterCreateAll}
 */
const AfterAll = buildAfter({ event: '*', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterCreateAll` decorator to execute custom logic after creating a new draft resource for all events `('CREATE', 'READ', 'UPDATE', 'DELETE', 'BOUND ACTION', 'BOUND FUNCTION')`
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreateall | CDS-TS-Dispatcher - @AfterCreateAll}
 */
const AfterAllDraft = buildAfter({ event: '*', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterCreate` decorator to execute custom logic after creating a new resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate | CDS-TS-Dispatcher - @AfterCreate}
 */
const AfterCreate = buildAfter({ event: 'CREATE', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterCreateDraft` decorator to execute custom logic after creating a new DRAFT resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate | CDS-TS-Dispatcher - @AfterCreateDraft}
 */
const AfterCreateDraft = buildAfter({ event: 'CREATE', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterRead` decorator to execute custom logic after performing a read operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | CDS-TS-Dispatcher - @AfterRead}
 */
const AfterRead = buildAfter({ event: 'READ', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterReadDraft` decorator to execute custom logic after performing a draft read operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | CDS-TS-Dispatcher - @AfterReadDraft}
 */
const AfterReadDraft = buildAfter({ event: 'READ', eventKind: 'AFTER', isDraft: true });

/**
 * The `@AfterReadEachInstance` decorator is used to execute custom logic after performing a read operation on `each individual instance`. This behavior is analogous to the JavaScript `Array.prototype.forEach` method.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadeachinstance | CDS-TS-Dispatcher - @AfterReadEachInstance}
 */
const AfterReadEachInstance = buildAfter({ event: 'each', eventKind: 'AFTER', isDraft: false });

/**
 * The `@AfterReadDraftEachInstance` decorator is used to execute custom logic after performing a read operation on `each individual draft instance`. This behavior is analogous to the JavaScript `Array.prototype.forEach` method.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadeachinstance | CDS-TS-Dispatcher - @AfterReadEachInstance}
 */
const AfterReadDraftEachInstance = buildAfter({ event: 'each', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterReadSingleInstance` decorator to execute custom logic after creating a new single instance resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadsingleinstance | CDS-TS-Dispatcher - @AfterReadSingleInstance}
 */
const AfterReadSingleInstance = buildAfter({
  event: 'READ',
  eventKind: 'AFTER_SINGLE',
  isDraft: false,
});

/**
 * Use `@AfterReadDraftSingleInstance` decorator to execute custom logic after creating a new DRAFT single instance resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadsingleinstance | CDS-TS-Dispatcher - @AfterReadSingleInstance}
 */
const AfterReadDraftSingleInstance = buildAfter({
  event: 'READ',
  eventKind: 'AFTER_SINGLE',
  isDraft: true,
});

/**
 * Use `@AfterUpdate` decorator to execute custom logic after performing an update operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate | CDS-TS-Dispatcher - @AfterUpdate}
 */
const AfterUpdate = buildAfter({ event: 'UPDATE', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterUpdateDraft` decorator to execute custom logic after performing a DRAFT update operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate | CDS-TS-Dispatcher - @AfterUpdateDraft}
 */
const AfterUpdateDraft = buildAfter({ event: 'UPDATE', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterDelete` decorator to execute custom logic after performing a delete operation.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete | CDS-TS-Dispatcher - @AfterDelete}
 */
const AfterDelete = buildAfter({ event: 'DELETE', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterDeleteDraft` decorator to execute custom logic after performing a delete operation on a draft.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete | CDS-TS-Dispatcher - @AfterDeleteDraft}
 */
const AfterDeleteDraft = buildAfter({ event: 'DELETE', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterAction` decorator to execute custom logic after an unbound action has been executed.
 *
 * This decorator allows you to run post-processing logic, such as logging, data cleanup,
 * or triggering subsequent operations after the actual action implementation has completed.
 *
 * @param name - The name of the action, which can be a string or a CDS-Typer generated action.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afteraction | CDS-TS-Dispatcher - @AfterAction}
 */
const AfterAction = buildAction({ event: 'ACTION', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterBoundAction` decorator to execute custom logic after a bound action has been executed on an entity.
 *
 * This decorator allows you to run post-processing logic, such as logging, data cleanup,
 * or triggering subsequent operations after the actual bound action implementation has completed on a specific entity instance.
 *
 * @param name - The name of the bound action, which can be a string or a CDS-Typer generated bound action.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterboundaction | CDS-TS-Dispatcher - @AfterBoundAction}
 */
const AfterBoundAction = buildAction({ event: 'BOUND_ACTION', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterFunction` decorator to execute custom logic after an unbound function has been executed.
 *
 * This decorator allows you to run post-processing logic, such as logging, data cleanup,
 * or triggering subsequent operations after the actual function implementation has completed.
 *
 * @param name - The name of the function, which can be a string or a CDS-Typer generated function.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterfunction | CDS-TS-Dispatcher - @AfterFunction}
 */
const AfterFunction = buildAction({ event: 'FUNC', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterBoundFunction` decorator to execute custom logic after a bound function has been executed on an entity.
 *
 * This decorator allows you to run post-processing logic, such as logging, data cleanup,
 * or triggering subsequent operations after the actual bound function implementation has completed on a specific entity instance.
 *
 * @param name - The name of the bound function, which can be a string or a CDS-Typer generated bound function.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterboundfunction | CDS-TS-Dispatcher - @AfterBoundFunction}
 */
const AfterBoundFunction = buildAction({ event: 'BOUND_FUNC', eventKind: 'AFTER', isDraft: false });

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
 * Use `@OnAll` decorator to execute custom logic when a new resource is (READ, CREATED, UPDATED, DELETED)
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onall | CDS-TS-Dispatcher - @OnAll}
 */
const OnAll = buildOnCRUD({ event: '*', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnAllDraft` decorator to execute custom logic.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onall | CDS-TS-Dispatcher - @OnAllDraft}
 */
const OnAllDraft = buildOnCRUD({ event: '*', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnCreate` decorator to execute custom logic when a new resource is created.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncreate | CDS-TS-Dispatcher - @OnCreate}
 */
const OnCreate = buildOnCRUD({ event: 'CREATE', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnCreateDraft` decorator to execute custom logic when a new DRAFT resource is created.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncreate | CDS-TS-Dispatcher - @OnCreateDraft}
 */
const OnCreateDraft = buildOnCRUD({ event: 'CREATE', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnRead` decorator to execute custom logic when a read operation is performed.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onread | CDS-TS-Dispatcher - @OnRead}
 */
const OnRead = buildOnCRUD({ event: 'READ', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnReadDraft` decorator to execute custom logic when a read operation is performed on a DRAFT resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onread | CDS-TS-Dispatcher - @OnReadDraft}
 */
const OnReadDraft = buildOnCRUD({ event: 'READ', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnUpdate` decorator to execute custom logic when an update operation is performed.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onupdate | CDS-TS-Dispatcher - @OnUpdate}
 */
const OnUpdate = buildOnCRUD({ event: 'UPDATE', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnUpdateDraft` decorator to execute custom logic when an update operation is performed on a DRAFT resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onupdate | CDS-TS-Dispatcher - @OnUpdateDraft}
 */
const OnUpdateDraft = buildOnCRUD({ event: 'UPDATE', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnDelete` decorator to execute custom logic when a delete operation is performed.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondelete | CDS-TS-Dispatcher - @OnDelete}
 */
const OnDelete = buildOnCRUD({ event: 'DELETE', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnDeleteDraft` decorator to execute custom logic when a delete operation is performed on a DRAFT resource.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondelete | CDS-TS-Dispatcher - @OnDeleteDraft}
 */
const OnDeleteDraft = buildOnCRUD({ event: 'DELETE', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnAction` decorator to execute custom logic when a custom action event is triggered.
 * @param name CdsFunction - name of the action, which can be a `string` or a `@cds-model` event.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onaction | CDS-TS-Dispatcher - @OnAction}
 */
const OnAction = buildAction({ event: 'ACTION', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnBoundAction` decorator to execute custom logic when a custom bound action event is triggered.
 * @param name CdsFunction - name of the action, which can be a `string` or a `@cds-model` event.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction | CDS-TS-Dispatcher - @OnBoundAction}
 */
const OnBoundAction = buildAction({ event: 'BOUND_ACTION', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnBoundActionDraft` decorator to execute custom logic when a custom bound action event is triggered on a DRAFT resource.
 * @param name CdsFunction - name of the action, which can be a `string` or a `@cds-model` event.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction | CDS-TS-Dispatcher - @OnBoundActionDraft}
 */
const OnBoundActionDraft = buildAction({ event: 'BOUND_ACTION', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnBoundFunction` decorator to execute custom logic when a custom bound function event is triggered.
 * @param name CdsFunction - name of the function, which can be a `string` or a `@cds-model` event.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction | CDS-TS-Dispatcher - @OnBoundFunction}
 */
const OnBoundFunction = buildAction({ event: 'BOUND_FUNC', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnBoundFunctionDraft` decorator to execute custom logic when a custom bound function event is triggered on a DRAFT resource.
 * @param name CdsFunction - name of the function, which can be a `string` or a `@cds-model` event.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction | CDS-TS-Dispatcher - @OnBoundFunctionDraft}
 */
const OnBoundFunctionDraft = buildAction({ event: 'BOUND_FUNC', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnFunction` decorator to execute custom logic when a custom function event is triggered.
 * @param name CdsFunction - name of the function, which can be a `string` or a `@cds-model` event.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onfunction | CDS-TS-Dispatcher - @OnFunction}
 */
const OnFunction = buildAction({ event: 'FUNC', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnEvent` decorator to execute custom logic when a custom event is triggered.
 * @param name CdsEvent - name of the event, which can be a `string` or a `@cds-model` event.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onevent | CDS-TS-Dispatcher - @OnEvent}
 */
const OnEvent = buildOnEvent({ event: 'EVENT', eventKind: 'ON', isDraft: false });

/**
 *
 * Use `@OnSubscribe` decorator to execute custom logic when a custom messaging event is triggered.
 * - Executes custom logic when a specific messaging event is triggered
 * - Built on CAP's intrinsic eventing system
 * - Compatible with both in-process and external messaging
 * @param options - The options object
 * @param options.eventName string | object (@cds-model) - Name of the event, which can be a `string` or a `@cds-model` event.
 * @param options.type `'SAME_NODE_PROCESS'` | `'SAME_NODE_PROCESS_DIFFERENT_SERVICE'` | `'MESSAGE_BROKER'` - Type of the subscriber
 * @param options.externalServiceName string - Name of the external service - applicable only for `SAME_NODE_PROCESS_DIFFERENT_SERVICE`
 * @param options.showReceiverMessage [optional] - When enabled, displays inbound message payloads in the specified format. (Default `false`)
 * @param options.consoleStyle [optional] - 'table' : 'debug' - Specifies the log output format for received messages (when `showReceiverMessage` is true). (Default `'debug'`).
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onsubscribe | CDS-TS-Dispatcher - @OnSubscribe}
 */
const OnSubscribe = buildOnMessagingEvent({ event: 'MESSAGING_EVENT', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnError` decorator to execute custom logic when an error occurs.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onerror | CDS-TS-Dispatcher - @OnError}
 */
const OnError = buildOnError({ eventKind: 'ON', isDraft: false });

/**
 * Use `@OnEditDraft` decorator to execute custom logic when a new draft is created from an active instance.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oneditdraft | CDS-TS-Dispatcher - @OnEditDraft}
 */
const OnEditDraft = buildOnCRUD({ event: 'EDIT', eventKind: 'ON', isDraft: false });

/**
 * Use `@OnSaveDraft` decorator to execute custom logic when the 'active entity' is changed.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onsavedraft | CDS-TS-Dispatcher - @OnSaveDraft}
 */
const OnSaveDraft = buildOnCRUD({ event: 'SAVE', eventKind: 'ON', isDraft: false });

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
 * Use `@OnNewDraft` decorator to execute custom logic when a 'draft' is created.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onnewdraft | CDS-TS-Dispatcher - @OnNewDraft}
 */
const OnNewDraft = buildOnCRUD({ event: 'NEW', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnCancelDraft` decorator to execute custom logic when a 'draft' is cancelled.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncanceldraft | CDS-TS-Dispatcher - @OnCancelDraft}
 */
const OnCancelDraft = buildOnCRUD({ event: 'CANCEL', eventKind: 'ON', isDraft: true });

/**
 * Use `@BeforeNewDraft` decorator to execute custom logic before a 'draft' is created.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforenewdraft | CDS-TS-Dispatcher - @BeforeNewDraft}
 */
const BeforeNewDraft = buildBefore({ event: 'NEW', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeCancelDraft` decorator to execute custom logic before a 'draft' is cancelled.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecanceldraft | CDS-TS-Dispatcher - @BeforeCancelDraft}
 */
const BeforeCancelDraft = buildBefore({ event: 'CANCEL', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeEditDraft` decorator to execute custom logic before a 'draft' is edited.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeeditdraft | CDS-TS-Dispatcher - @BeforeEditDraft}
 */
const BeforeEditDraft = buildBefore({ event: 'EDIT', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@BeforeSaveDraft` decorator to execute custom logic before a 'draft' is saved.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforesavedraft | CDS-TS-Dispatcher - @BeforeSaveDraft}
 */
const BeforeSaveDraft = buildBefore({ event: 'SAVE', eventKind: 'BEFORE', isDraft: false });

/**
 * Use `@AfterNewDraft` decorator to execute custom logic after a new 'draft' is created.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afternewdraft | CDS-TS-Dispatcher - @AfterNewDraft}
 */
const AfterNewDraft = buildAfter({ event: 'NEW', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterCancelDraft` decorator to execute custom logic after a 'draft' is cancelled.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercanceldraft | CDS-TS-Dispatcher - @AfterCancelDraft}
 */
const AfterCancelDraft = buildAfter({ event: 'CANCEL', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterEditDraft` decorator to execute custom logic after a 'draft' is edited.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftereditdraft | CDS-TS-Dispatcher - @AfterEditDraft}
 */
const AfterEditDraft = buildAfter({ event: 'EDIT', eventKind: 'AFTER', isDraft: false });

/**
 * Use `@AfterSaveDraft` decorator to execute custom logic after a 'draft' is saved.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftersavedraft | CDS-TS-Dispatcher - @AfterSaveDraft}
 */
const AfterSaveDraft = buildAfter({ event: 'SAVE', eventKind: 'AFTER', isDraft: false });

export {
  // Standalone events
  OnSubscribe,
  Use,
  AfterReadSingleInstance,
  AfterReadDraftSingleInstance,
  Prepend,
  PrependDraft,
  ExecutionAllowedForRole,
  SingleInstanceCapable,
  Validate,
  FieldsFormatter,
  CatchAndSetErrorMessage,
  CatchAndSetErrorCode,
  // ========================================================================================================================================================
  // BEFORE events - Active entity
  BeforeAll,
  BeforeCreate,
  BeforeRead,
  BeforeUpdate,
  BeforeDelete,
  BeforeAction,
  BeforeFunction,
  BeforeBoundAction,
  BeforeBoundFunction,
  // BEFORE events - Draft
  BeforeCreateDraft,
  BeforeReadDraft,
  BeforeUpdateDraft,
  BeforeDeleteDraft,
  BeforeAllDraft,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // AFTER events - Active entity
  AfterAll,
  AfterCreate,
  AfterRead,
  AfterReadEachInstance,
  AfterUpdate,
  AfterDelete,
  AfterAction,
  AfterFunction,
  AfterBoundAction,
  AfterBoundFunction,
  // AFTER events - Draft
  AfterCreateDraft,
  AfterReadDraft,
  AfterReadDraftEachInstance,
  AfterUpdateDraft,
  AfterDeleteDraft,
  AfterAllDraft,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // ON events - Active entity
  OnCreate,
  OnRead,
  OnUpdate,
  OnDelete,
  OnAction,
  OnFunction,
  OnEvent,
  OnError,
  OnBoundAction,
  OnBoundFunction,
  OnAll,

  // ON events - Draft
  OnCreateDraft,
  OnReadDraft,
  OnUpdateDraft,
  OnDeleteDraft,
  OnBoundActionDraft,
  OnBoundFunctionDraft,
  OnAllDraft,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // DRAFT specific events
  // Triggered on draft entity 'MyEntity.drafts'

  // BEFORE events
  BeforeNewDraft,
  BeforeCancelDraft,
  BeforeEditDraft,
  BeforeSaveDraft,

  // AFTER events
  AfterNewDraft,
  AfterCancelDraft,
  AfterEditDraft,
  AfterSaveDraft,

  // ACTION events
  OnNewDraft,
  OnCancelDraft,

  // Triggered on active entity 'MyEntity'
  OnEditDraft,
  OnSaveDraft,
};
