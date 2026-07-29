import constants from '../constants/internalConstants';
import { ArgumentMethodProcessor } from '../core/ArgumentMethodProcessor';
import { MetadataDispatcher } from '../core/MetadataDispatcher';
import decoratorsUtil from '../util/decorators/decoratorsUtil';
import formatterUtil from '../util/formatter/formatterUtil';
import loggingUtil from '../util/logging/loggingUtil';
import middlewareUtil from '../util/middleware/middlewareUtil';
import parameterUtil from '../util/parameter/parameterUtil';
import util from '../util/util';
import validatorUtil from '../util/validation/validatorUtil';
import transformersUtil from '../util/transformers/transformersUtil';
import streamUtil from '../util/stream/streamUtil';
import cds from '@sap/cds';

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
  ScheduleOptions,
} from '../types/types';

import type { Validators } from '../types/validator';
import type { Formatters } from '../types/formatter';
import type {
  Constructable,
  EventKind,
  EventMessagingOptions,
  PrependBase,
  PrependBaseDraft,
  REQUEST_LIFECYCLE_EVENTS,
  StatusCodeMapping,
} from '../types/internalTypes';
import type { LogExecutionOptions, MaskOptions } from '../types/responseTransformers';

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
      const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
      if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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
      const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
      if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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

// ========================================================================================================================================================
// Response Transformer Decorators (@Exclude, @Include, @Mask, @LogExecution)
// ========================================================================================================================================================

/**
 * Use `@Exclude` decorator to remove specified fields from the response after a read operation.
 * @param fields - The fields to exclude from the response.
 * @example
 * // Remove 'password' and 'ssn' fields from User response
 * "@Exclude<User>('password', 'ssn')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#exclude | CDS-TS-Dispatcher - @Exclude}
 */
function Exclude<T>(...fields: (keyof T)[]) {
  return function <Target>(_: Target, __: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const results = transformersUtil.findResults<T>(args);
      transformersUtil.excludeFields(results, fields);

      return result;
    };
  };
}

/**
 * Use `@Include` decorator to keep only specified fields in the response after a read operation.
 * All other fields will be removed.
 * @param fields - The fields to include in the response.
 * @example
 * // Only include 'ID', 'name', and 'email' fields in User response
 * "@Include<User>('ID', 'name', 'email')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#include | CDS-TS-Dispatcher - @Include}
 */
function Include<T>(...fields: (keyof T)[]) {
  return function <Target>(_: Target, __: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const results = transformersUtil.findResults<T>(args);
      transformersUtil.includeFields(results, fields);

      return result;
    };
  };
}

/**
 * Use `@Mask` decorator to partially hide sensitive field values in the response.
 * @param fields - The fields to mask.
 * @param options - Optional masking options (char, visibleStart, visibleEnd).
 * @example
 * // Mask 'creditCard' and 'phone' showing only last 4 characters
 * "@Mask<User>(['creditCard', 'phone'])"
 * // Mask with custom options: show first 2 and last 4 characters
 * "@Mask<User>(['creditCard'], { char: 'X', visibleStart: 2, visibleEnd: 4 })"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#mask | CDS-TS-Dispatcher - @Mask}
 */
function Mask<T>(fields: (keyof T)[], options?: MaskOptions) {
  return function <Target>(_: Target, __: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const results = transformersUtil.findResults<T>(args);
      transformersUtil.maskFields(results, fields, options ?? {});

      return result;
    };
  };
}

/**
 * Use `@LogExecution` decorator to log method execution details including arguments, result, and duration.
 * @param options - Optional logging options.
 * @example
 * // Log only execution duration
 * "@LogExecution({ logDuration: true })"
 * // Log arguments and duration
 * "@LogExecution({ logArgs: true, logDuration: true })"
 * // Log everything with custom prefix
 * "@LogExecution({ logArgs: true, logResult: true, logDuration: true, prefix: '[DEBUG]' })"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#logexecution | CDS-TS-Dispatcher - @LogExecution}
 */
function LogExecution(options?: LogExecutionOptions) {
  return function <Target>(
    target: Target,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ) {
    const originalMethod = descriptor.value!;
    const className = (target as any).constructor?.name ?? 'Unknown';
    const methodName = String(propertyKey);
    const resolvedOptions = loggingUtil.resolveOptions(options);

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);

      if (loggingUtil.shouldSkip(resolvedOptions, req)) {
        return await originalMethod.apply(this, args);
      }

      const startTime = Date.now();
      loggingUtil.logArgs(resolvedOptions, className, methodName, args);

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        loggingUtil.logResult(resolvedOptions, className, methodName, result);
        loggingUtil.logDuration(resolvedOptions, className, methodName, duration);

        return result;
      } catch (error) {
        loggingUtil.logError(resolvedOptions, className, methodName, Date.now() - startTime, error);
        throw error;
      }
    };
  };
}

// ========================================================================================================================================================
// END Response Transformer Decorators
// ========================================================================================================================================================

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
        const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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
        const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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

function buildRequestLifecycle(options: { event: REQUEST_LIFECYCLE_EVENTS }) {
  return function <Target extends object>() {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @BeforeCommit(), @AfterCommit(), @AfterRollback(), @OnRequestDone()
      // Note: descriptor.value will contain the logic for @Req(), @Res(), @Results(), @Next(), @IsPresent(), @GetQuery() decorators
      // ********************************************************************************************************************************

      const { event } = options;
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        type: 'REQUEST_LIFECYCLE',
        eventKind: 'REQUEST_LIFECYCLE',
        event,
        callback: descriptor.value,
        isDraft: false,
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
        const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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
        const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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
        const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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
      // Parameter decorators run before method decorators, so `@Diff` metadata (if any) is already present here.
      // Fail fast at DECORATION time: `@OnError` never awaits `applyDecorators()` (see the NOTE below), so a
      // `@Diff` there would both inject `undefined` silently AND float `applyDiffDecorator()`'s promise - an
      // unhandled rejection from the real `req.diff()` call could crash the consumer's process.
      const hasDiff = Reflect.getOwnMetadata(constants.DECORATOR.PARAMETER.DIFF, target, propertyName);

      if (hasDiff) {
        const className = (target as any).constructor?.name ?? 'Unknown';

        util.throwErrorMessage(
          `@Diff is not supported on @OnError (error handlers run synchronously while the transaction unwinds). Remove @Diff from ${className}.${String(propertyName)}.`,
        );
      }

      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        // NOTE: `applyDecorators()` is intentionally NOT awaited here - CAP invokes error handlers synchronously,
        // and awaiting it (even `await undefined`) would defer this method to a microtask. This is why `@Diff` -
        // the only asynchronous parameter decorator - is unsupported on `@OnError`.
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
        const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
        if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
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

/**
 * Use `@BeforePatchDraft` decorator to execute custom logic before a 'draft' field is patched.
 *
 * `PATCH` is CAP's canonical `field-level draft-edit` event (an alias of `UPDATE` on `.drafts` since `@sap/cds` 10) - it is triggered on the draft entity `MyEntity.drafts` every time a field of an in-progress draft is changed.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforepatchdraft | CDS-TS-Dispatcher - @BeforePatchDraft}
 */
const BeforePatchDraft = buildBefore({ event: 'PATCH', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@BeforeDiscardDraft` decorator to execute custom logic before a 'draft' is discarded.
 *
 * `DISCARD` is CAP's canonical alias of `CANCEL` since `@sap/cds` 10 - it is triggered on the draft entity `MyEntity.drafts` when an in-progress draft is discarded.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforediscarddraft | CDS-TS-Dispatcher - @BeforeDiscardDraft}
 */
const BeforeDiscardDraft = buildBefore({ event: 'DISCARD', eventKind: 'BEFORE', isDraft: true });

/**
 * Use `@AfterPatchDraft` decorator to execute custom logic after a 'draft' field is patched.
 *
 * `PATCH` is CAP's canonical `field-level draft-edit` event (an alias of `UPDATE` on `.drafts` since `@sap/cds` 10) - it is triggered on the draft entity `MyEntity.drafts` every time a field of an in-progress draft is changed.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterpatchdraft | CDS-TS-Dispatcher - @AfterPatchDraft}
 */
const AfterPatchDraft = buildAfter({ event: 'PATCH', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@AfterDiscardDraft` decorator to execute custom logic after a 'draft' is discarded.
 *
 * `DISCARD` is CAP's canonical alias of `CANCEL` since `@sap/cds` 10 - it is triggered on the draft entity `MyEntity.drafts` when an in-progress draft is discarded.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdiscarddraft | CDS-TS-Dispatcher - @AfterDiscardDraft}
 */
const AfterDiscardDraft = buildAfter({ event: 'DISCARD', eventKind: 'AFTER', isDraft: true });

/**
 * Use `@OnPatchDraft` decorator to execute custom logic when a 'draft' field is patched.
 *
 * `PATCH` is CAP's canonical `field-level draft-edit` event (an alias of `UPDATE` on `.drafts` since `@sap/cds` 10) - it is triggered on the draft entity `MyEntity.drafts` every time a field of an in-progress draft is changed.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onpatchdraft | CDS-TS-Dispatcher - @OnPatchDraft}
 */
const OnPatchDraft = buildOnCRUD({ event: 'PATCH', eventKind: 'ON', isDraft: true });

/**
 * Use `@OnDiscardDraft` decorator to execute custom logic when a 'draft' is discarded.
 *
 * `DISCARD` is CAP's canonical alias of `CANCEL` since `@sap/cds` 10 - it is triggered on the draft entity `MyEntity.drafts` when an in-progress draft is discarded.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondiscarddraft | CDS-TS-Dispatcher - @OnDiscardDraft}
 */
const OnDiscardDraft = buildOnCRUD({ event: 'DISCARD', eventKind: 'ON', isDraft: true });

/**
 * ####################################################################################################################
 * Start `Request lifecycle` methods
 * ####################################################################################################################
 */

/**
 * Use `@BeforeCommit` decorator to execute custom logic `before` the database transaction of the current request is `committed`.
 *
 * It runs `once` per `ROOT` request (once per `$batch` changeset), `inside` the request transaction, so any database
 * work joins the same transaction. Throwing here `vetoes` the request - the transaction is rolled back and the error
 * is returned to the client.
 *
 * Hosted in an [@EntityHandler](#entityhandler) class it is scoped to the requests targeting that entity, hosted in an
 * [@UnboundActions](#unboundactions) class it applies to every request of the service.
 *
 * `NOTE:` the hooks register on the `ACTIVE` entity only - for `@odata.draft.enabled` entities the draft-editing
 * roundtrip (`NEW` / `PATCH` / `CANCEL` on `MyEntity.drafts`) does **not** fire them, they fire when the draft is
 * `activated` (`CREATE` / `UPDATE` on the active entity).
 *
 * `NOTE:` the `req` handed over is the `FIRST` sub-request of the root request which reached this class - in a
 * `$batch` changeset carrying several operations, `req.data` belongs to that `first` operation only. Validate
 * `per operation` in [@BeforeCreate](#beforecreate) & co and keep `@BeforeCommit` for `cross-request` /
 * `final state` invariants (read the database state, not `req.data`).
 * @example
 * ```typescript
 * /@BeforeCommit()
 * public async beforeCommit(/@Req() req: Request) {
 *   // ... throw to veto the commit
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecommit | CDS-TS-Dispatcher - @BeforeCommit}
 */
const BeforeCommit = buildRequestLifecycle({ event: 'BEFORE_COMMIT' });

/**
 * Use `@AfterCommit` decorator to execute custom logic `after` the database transaction of the current request was `committed`.
 *
 * It runs `once` per `ROOT` request (once per `$batch` changeset) and `OUTSIDE` any transaction - the commit is already
 * durable, so database work needs its own transaction (`await cds.tx(async () => { ... })`). Errors `cannot` veto
 * anything anymore, they are `caught` and `logged` by the dispatcher.
 *
 * Hosted in an [@EntityHandler](#entityhandler) class it is scoped to the requests targeting that entity, hosted in an
 * [@UnboundActions](#unboundactions) class it applies to every request of the service.
 *
 * `NOTE:` the hooks register on the `ACTIVE` entity only - for `@odata.draft.enabled` entities the draft-editing
 * roundtrip (`NEW` / `PATCH` / `CANCEL` on `MyEntity.drafts`) does **not** fire them, they fire when the draft is
 * `activated` (`CREATE` / `UPDATE` on the active entity).
 * @example
 * ```typescript
 * /@AfterCommit()
 * public async afterCommit(/@Req() req: Request) {
 *   await cds.tx(async () => { ... }); // needs its own transaction
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercommit | CDS-TS-Dispatcher - @AfterCommit}
 */
const AfterCommit = buildRequestLifecycle({ event: 'AFTER_COMMIT' });

/**
 * Use `@AfterRollback` decorator to execute custom logic `after` the database transaction of the current request was `rolled back`.
 *
 * It runs `once` per `ROOT` request (once per `$batch` changeset) and `OUTSIDE` any transaction - the failed one is
 * gone, so database work needs its own transaction (`await cds.tx(async () => { ... })`). Errors `cannot` veto
 * anything anymore, they are `caught` and `logged` by the dispatcher.
 *
 * Hosted in an [@EntityHandler](#entityhandler) class it is scoped to the requests targeting that entity, hosted in an
 * [@UnboundActions](#unboundactions) class it applies to every request of the service.
 *
 * `NOTE:` the hooks register on the `ACTIVE` entity only - for `@odata.draft.enabled` entities the draft-editing
 * roundtrip (`NEW` / `PATCH` / `CANCEL` on `MyEntity.drafts`) does **not** fire them, they fire when the draft is
 * `activated` (`CREATE` / `UPDATE` on the active entity).
 * @example
 * ```typescript
 * /@AfterRollback()
 * public async afterRollback(/@Req() req: Request) {
 *   // ... compensate the failed request
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterrollback | CDS-TS-Dispatcher - @AfterRollback}
 */
const AfterRollback = buildRequestLifecycle({ event: 'AFTER_ROLLBACK' });

/**
 * Use `@OnRequestDone` decorator to execute custom logic when the current request is `done`, no matter if it `succeeded` or `failed`.
 *
 * It runs `once` per `ROOT` request (once per `$batch` changeset) and `OUTSIDE` any transaction, so database work needs
 * its own transaction (`await cds.tx(async () => { ... })`). Errors `cannot` veto anything anymore, they are `caught`
 * and `logged` by the dispatcher.
 *
 * Hosted in an [@EntityHandler](#entityhandler) class it is scoped to the requests targeting that entity, hosted in an
 * [@UnboundActions](#unboundactions) class it applies to every request of the service.
 *
 * `NOTE:` the hooks register on the `ACTIVE` entity only - for `@odata.draft.enabled` entities the draft-editing
 * roundtrip (`NEW` / `PATCH` / `CANCEL` on `MyEntity.drafts`) does **not** fire them, they fire when the draft is
 * `activated` (`CREATE` / `UPDATE` on the active entity).
 * @example
 * ```typescript
 * /@OnRequestDone()
 * public async requestDone(/@Req() req: Request) {
 *   // ... cleanup, always runs
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onrequestdone | CDS-TS-Dispatcher - @OnRequestDone}
 */
const OnRequestDone = buildRequestLifecycle({ event: 'REQUEST_DONE' });

/**
 * ####################################################################################################################
 * End `Request lifecycle` methods
 * ####################################################################################################################
 */

/**
 * ####################################################################################################################
 * Start `Scheduling` methods
 * ####################################################################################################################
 */

/**
 * Internal helper: wraps the method with the `ArgumentMethodProcessor` and records a `SCHEDULED` handler.
 * @param target - The target object.
 * @param propertyName - The name of the property.
 * @param descriptor - The property descriptor.
 * @param taskName - The task name, registered `verbatim` (dots are preserved).
 * @param scheduleOptions - `[Optional]` The `@Schedule` options that also schedule the recurring task at bootstrap.
 */
function registerScheduledHandler(
  target: object,
  propertyName: string | symbol,
  descriptor: TypedPropertyDescriptor<RequestType>,
  taskName: string,
  scheduleOptions?: ScheduleOptions,
): void {
  const method = descriptor.value!;

  descriptor.value = async function (...args: any[]) {
    const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
    if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
    return await method.apply(this, args);
  };

  const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

  metadataDispatcher.addMethodMetadata({
    type: 'SCHEDULED',
    eventKind: 'ON',
    event: 'SCHEDULED_EVENT',
    taskName,
    scheduleOptions,
    callback: descriptor.value,
    isDraft: false,
  });
}

/**
 * Internal helper: wraps the method with the `ArgumentMethodProcessor` and records a `SCHEDULED_OUTCOME` handler.
 * @param target - The target object.
 * @param propertyName - The name of the property.
 * @param descriptor - The property descriptor.
 * @param event - The outcome of the task to handle, `success` or `failure`.
 * @param taskName - The task name, registered `verbatim` (dots are preserved).
 */
function registerScheduledOutcomeHandler(
  target: object,
  propertyName: string | symbol,
  descriptor: TypedPropertyDescriptor<RequestType>,
  event: 'SCHEDULED_SUCCESS' | 'SCHEDULED_FAILURE',
  taskName: string,
): void {
  const method = descriptor.value!;

  descriptor.value = async function (...args: any[]) {
    const applied = new ArgumentMethodProcessor(target, propertyName, args).applyDecorators();
    if (applied) await applied; // only @Diff (async resolution) pays a microtask; all else stays synchronous
    return await method.apply(this, args);
  };

  const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

  metadataDispatcher.addMethodMetadata({
    type: 'SCHEDULED_OUTCOME',
    eventKind: 'AFTER',
    event,
    taskName,
    callback: descriptor.value,
    isDraft: false,
  });
}

/**
 * Use `@OnScheduled` decorator to handle a `@sap/cds` 10 event-queue `scheduled task` by its name.
 *
 * It registers `srv.on(name, cb)` for the task - handling a scheduled task is just a normal `ON` handler on the
 * (queued) app service. The `name` is registered `verbatim` (dots are **not** stripped), so fully-qualified task
 * names like `'my.namespace.Task'` are matched exactly.
 *
 * `NOTE:` `@OnScheduled` only `handles` the task. To also `schedule` it recurrently at bootstrap use [@Schedule](#schedule).
 *
 * @param name - The task name to handle.
 * @example
 * ```typescript
 * /@OnScheduled('cleanupExpiredCarts')
 * public async cleanup(/@Req() req: Request) {
 *   // ... runs whenever the 'cleanupExpiredCarts' task is dispatched
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onscheduled | CDS-TS-Dispatcher - @OnScheduled}
 */
function OnScheduled(name: string) {
  return function <Target extends object>(
    target: Target,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ): void {
    registerScheduledHandler(target, propertyName, descriptor, name);
  };
}

/**
 * Use `@Schedule` decorator to `handle` **and** recurrently `schedule` a `@sap/cds` 10 event-queue task.
 *
 * It does everything [@OnScheduled](#onscheduled) does (registers `srv.on(name, cb)`) **and** schedules the task as a
 * `recurring singleton` at bootstrap via `srv.schedule(name, data).every(every).as(name)`. Because `.every().as(name)`
 * makes the task a `named singleton`, re-scheduling on every boot `upserts` rather than duplicates it.
 *
 * `every` accepts an `interval` string (e.g. `'10m'`) or a `cron` expression - it is passed through verbatim (CAP's
 * `ms4` / `cron` parse it).
 *
 * `NOTE:` `one-shot` scheduling (`.after`) is intentionally **not** a decorator - inject the service
 * (`CDS_DISPATCHER.SRV`) and call `srv.schedule(name, data).after(delay).as(name)` programmatically when you need it.
 *
 * @param options - The schedule options.
 * @param options.name - The task name (registered `verbatim` and used as the singleton identity).
 * @param options.every - The recurrence as an `interval` string (`'10m'`) or a `cron` expression.
 * @param [options.data] - `[Optional]` The payload delivered to the handler on every run (as `req.data`).
 * @example
 * ```typescript
 * /@Schedule({ name: 'sendDailyDigest', every: '24h' })
 * public async digest(/@Req() req: Request) {
 *   // ... runs on bootstrap-scheduled recurrence
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#schedule | CDS-TS-Dispatcher - @Schedule}
 */
function Schedule(options: ScheduleOptions) {
  return function <Target extends object>(
    target: Target,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ): void {
    registerScheduledHandler(target, propertyName, descriptor, options.name, options);
  };
}

/**
 * Use `@OnScheduledSuccess` decorator to handle the `successful` outcome of a `@sap/cds` 10 event-queue `scheduled task`.
 *
 * It registers `srv.after('<name>/#succeeded', cb)` for the task - the handler receives the `result` returned by the
 * task handler ([@OnScheduled](#onscheduled) / [@Schedule](#schedule)) and the request. The `name` is registered
 * `verbatim` (dots are **not** stripped), so fully-qualified task names like `'my.namespace.Task'` are matched exactly.
 *
 * @param name - The task name whose success to handle.
 * @example
 * ```typescript
 * /@OnScheduledSuccess('cleanupExpiredCarts')
 * public async succeeded(/@Result() result: unknown, /@Req() req: Request) {
 *   // ... runs after the task ran through
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onscheduledsuccess | CDS-TS-Dispatcher - @OnScheduledSuccess}
 */
function OnScheduledSuccess(name: string) {
  return function <Target extends object>(
    target: Target,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ): void {
    registerScheduledOutcomeHandler(target, propertyName, descriptor, 'SCHEDULED_SUCCESS', name);
  };
}

/**
 * Use `@OnScheduledFailure` decorator to handle the `failed` outcome of a `@sap/cds` 10 event-queue `scheduled task`.
 *
 * It registers `srv.after('<name>/#failed', cb)` for the task - the handler receives the `failure` and the request. It
 * only fires once the `retries` of the task are `exhausted` (event-queue `maxAttempts`, `10` by default), not on every
 * failed attempt. The `name` is registered `verbatim` (dots are **not** stripped), so fully-qualified task names like
 * `'my.namespace.Task'` are matched exactly.
 *
 * `NOTE:` the failure is delivered as a `serialized plain object` (`{ name, message, stack, code, ... }`), **not** as
 * an `Error` instance - CAP serializes it into the queued callback task, so it survives a `JSON` round-trip. Pick it
 * up with [@Result](#result); [@Error](#error) will **not** populate here, as it only matches real `Error` instances.
 *
 * @param name - The task name whose failure to handle.
 * @example
 * ```typescript
 * /@OnScheduledFailure('cleanupExpiredCarts')
 * public async failed(/@Result() failure: { message?: string }, /@Req() req: Request) {
 *   // ... runs after the last attempt failed
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onscheduledfailure | CDS-TS-Dispatcher - @OnScheduledFailure}
 */
function OnScheduledFailure(name: string) {
  return function <Target extends object>(
    target: Target,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ): void {
    registerScheduledOutcomeHandler(target, propertyName, descriptor, 'SCHEDULED_FAILURE', name);
  };
}

/**
 * ####################################################################################################################
 * End `Scheduling` methods
 * ####################################################################################################################
 */

/**
 * Use `@Stream` decorator to stream a `@sap/cds` 10 streaming read (`SELECT.pipeline()`, `SELECT.foreach()`,
 * `for-await` iteration) straight to the HTTP response from an `ON` handler ([@OnRead](#onread),
 * [@OnFunction](#onfunction), [@OnBoundFunction](#onboundfunction)).
 *
 * If the decorated method returns a `Readable` (an object exposing a `.pipe` function), `@Stream` sets the response
 * `Content-Type` (default `'application/octet-stream'`) and pipes the stream to the express response, destroying the
 * response if the stream errors. Any `non-stream` return value is passed through unchanged.
 *
 * `NOTE:` place `@Stream` **directly on the method, below** the `ON` decorator so it wraps the returned value:
 * ```typescript
 * /@OnBoundFunction(Book.actions.download)
 * /@Stream('application/json')
 * public async download(/@Req() req: Request) {
 *   return SELECT.from(Book).stream(); // a Readable
 * }
 * ```
 *
 * @param contentType - `[Optional]` The `Content-Type` header for the streamed response. Defaults to `'application/octet-stream'`.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#stream | CDS-TS-Dispatcher - @Stream}
 */
function Stream(contentType = 'application/octet-stream') {
  return function <Target extends object>(
    _: Target,
    __: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ): void {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Non-stream return values pass through unchanged.
      if (!streamUtil.isReadableStream(result)) {
        return result;
      }

      // Resolve the HTTP response from the current request context (robust to argument re-indexing).
      const req = (cds.context as Request | undefined) ?? util.findRequest(args);
      const res = req ? parameterUtil.retrieveResponse(req) : undefined;

      // No HTTP response to pipe to (e.g. non-HTTP invocation) → passthrough.
      if (!res) {
        return result;
      }

      await streamUtil.pipeToResponse(res, result, contentType);
    };
  };
}

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
  // Response Transformer decorators
  Exclude,
  Include,
  Mask,
  LogExecution,
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
  BeforePatchDraft,
  BeforeDiscardDraft,
  BeforeEditDraft,
  BeforeSaveDraft,

  // AFTER events
  AfterNewDraft,
  AfterCancelDraft,
  AfterPatchDraft,
  AfterDiscardDraft,
  AfterEditDraft,
  AfterSaveDraft,

  // ACTION events
  OnNewDraft,
  OnCancelDraft,
  OnPatchDraft,
  OnDiscardDraft,

  // Triggered on active entity 'MyEntity'
  OnEditDraft,
  OnSaveDraft,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // REQUEST LIFECYCLE events (per-root-request commit/succeeded/failed/done)
  BeforeCommit,
  AfterCommit,
  AfterRollback,
  OnRequestDone,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // SCHEDULING events (@sap/cds 10 event-queue)
  OnScheduled,
  Schedule,
  OnScheduledSuccess,
  OnScheduledFailure,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // STREAMING
  Stream,
};
