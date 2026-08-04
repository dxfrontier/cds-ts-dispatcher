import constants from '../constants/internalConstants';
import { ArgumentMethodProcessor } from '../core/ArgumentMethodProcessor';
import { MetadataDispatcher } from '../core/MetadataDispatcher';
import decoratorsUtil from '../util/decorators/decoratorsUtil';
import formatterUtil from '../util/formatter/formatterUtil';
import loggingUtil from '../util/logging/loggingUtil';
import middlewareUtil from '../util/middleware/middlewareUtil';
import parameterUtil from '../util/parameter/parameterUtil';
import throttleUtil from '../util/decorators/throttleUtil';
import util from '../util/util';
import validatorUtil from '../util/validation/validatorUtil';
import transformersUtil from '../util/transformers/transformersUtil';
import streamUtil from '../util/stream/streamUtil';
import { StatusCodes } from 'http-status-codes';
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
  StreamContentType,
  ThrottleOptions,
} from '../types/types';

import type { ThrottleStore } from '../util/decorators/throttleUtil';
import type { Validators } from '../types/validator';
import type { Formatters } from '../types/formatter';
import type {
  Constructable,
  EventKind,
  EventMessagingOptions,
  PrependBase,
  PrependBaseDraft,
  REQUEST_LIFECYCLE_EVENTS,
  SERVER_LIFECYCLE_EVENTS,
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
 * Rate-limits the decorated handler with a fixed window, counted per user (default) or per tenant.
 *
 * Counters are per app instance and per decorated method (in-memory). Over the limit the request is
 * rejected with HTTP 429. Place `@Throttle()` BELOW the handler decorator (closer to the method),
 * like every wrapping decorator - otherwise it is not part of the registered callback.
 *
 * @example
 * "@OnAction(GenerateReport)"
 * "@Throttle({ limit: 10, window: 60_000 })"
 * public async generate(@Req() req: Request) { ... }
 */
function Throttle(options: ThrottleOptions) {
  if (!Number.isFinite(options.limit) || options.limit < 1) {
    util.throwErrorMessage(`@Throttle() 'limit' must be a number >= 1, got '${options.limit}'`);
  }

  if (!Number.isFinite(options.window) || options.window < 1) {
    util.throwErrorMessage(`@Throttle() 'window' must be a number (ms) >= 1, got '${options.window}'`);
  }

  const store: ThrottleStore = new Map();

  return function <Target extends object>(
    target: Target,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ) {
    Reflect.defineMetadata(
      constants.DECORATOR.THROTTLE_KEY,
      { limit: options.limit, window: options.window },
      target,
      propertyName,
    );

    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);

      if (!req) {
        util.throwErrorMessage(
          util.buildMessage(constants.MESSAGES.THROTTLE_NO_REQUEST, {
            className: (target as any).constructor?.name ?? 'Unknown',
            methodName: String(propertyName),
          }),
        );
      }

      const key = throttleUtil.resolveKey(req, options.by);
      const outcome = throttleUtil.consume(store, key, options.limit, options.window, Date.now());

      if (!outcome.allowed) {
        req.reject(
          StatusCodes.TOO_MANY_REQUESTS,
          util.buildMessage(constants.MESSAGES.THROTTLE_LIMIT_EXCEEDED, {
            limit: options.limit,
            window: options.window,
            by: options.by ?? 'user',
            retryAfter: outcome.retryAfterMs,
          }),
        );
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

/**
 * Internal factory for the `@ServerLifecycle` method decorators (`@OnServed`, `@OnListening`, `@OnShutdown`).
 *
 * Unlike every other handler factory in this file, the descriptor is recorded `as-is` - it is NOT wrapped with
 * `ArgumentMethodProcessor`: these three events register against CAP's `process-global` `cds.on(...)` (not
 * `srv.*`), so `@Req()`-style parameter decorators do not apply and CAP's native arguments pass through verbatim.
 */
function buildServerLifecycle(options: { event: SERVER_LIFECYCLE_EVENTS }) {
  return function <Target extends object>() {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        type: 'SERVER_LIFECYCLE',
        eventKind: 'SERVER_LIFECYCLE',
        event: options.event,
        callback: descriptor.value!,
        isDraft: false,
      });
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

      const throttled = Reflect.getOwnMetadata(constants.DECORATOR.THROTTLE_KEY, target, propertyName);

      if (throttled) {
        util.throwErrorMessage(
          `${constants.MESSAGES.THROTTLE_ON_ERROR} [class: ${(target as any).constructor?.name ?? 'Unknown'}, method: ${String(propertyName)}]`,
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
 * Executes custom logic before every CRUD event on the host entity (`CREATE`, `READ`, `UPDATE`,
 * `DELETE`, bound actions, bound functions).
 * Registers `srv.before('*', <Entity>, callback)`.
 *
 * @remarks
 * `'*'` matches every `BEFORE`-phase event on the entity — the narrower siblings (`@BeforeCreate`,
 * `@BeforeRead`, `@BeforeUpdate`, `@BeforeDelete`, `@BeforeBoundAction`, `@BeforeBoundFunction`) still
 * fire too when their specific event matches; both run. Registers ONLY against the active entity — use
 * `@BeforeAllDraft` for the equivalent wildcard on `<Entity>.drafts`. `@BeforeEditDraft` /
 * `@BeforeSaveDraft` also target the active entity, so those draft-lifecycle moments already reach this
 * handler.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeAll()
 *   private async beforeAny(@Req() req: Request<Book>): Promise<void> {
 *     // ... runs ahead of every CREATE/READ/UPDATE/DELETE on Book
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeall | CDS-TS-Dispatcher - @BeforeAll}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeAll
 */
const BeforeAll = buildBefore({ event: '*', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before every draft-lifecycle event on the host entity's `.drafts` table (`NEW`,
 * `CANCEL`, `PATCH`, `DISCARD`, plus `CREATE` / `READ` / `UPDATE` / `DELETE` issued directly against
 * `.drafts`).
 * Registers `srv.before('*', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@BeforeAll` — same wildcard, scoped to `<Entity>.drafts` instead of the
 * active entity. It does NOT see `@BeforeEditDraft` / `@BeforeSaveDraft`, which register against the
 * ACTIVE entity (`EDIT` / `SAVE` are not `.drafts` events); use `@BeforeAll` for those.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeAllDraft()
 *   private async beforeAnyDraft(@Req() req: Request<Book>): Promise<void> {
 *     // ... runs ahead of every NEW/CANCEL/PATCH/DISCARD on Book.drafts
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeall | CDS-TS-Dispatcher - @BeforeAllDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeAll
 */
const BeforeAllDraft = buildBefore({ event: '*', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before a new instance of the host entity is created.
 * Registers `srv.before('CREATE', <Entity>, callback)`.
 *
 * @remarks
 * The classic input-validation hook — reject or mutate `req.data` before `@OnCreate` (or CAP's generic
 * handler) writes it. Fires alongside `@BeforeAll`, if also present. Draft variant: `@BeforeCreateDraft`
 * (a literal `CREATE` issued directly against `<Entity>.drafts` — NOT the Fiori Elements "New" action,
 * which is `@BeforeNewDraft`).
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeCreate()
 *   private async beforeCreate(@Req() req: Request<Book>): Promise<void> {
 *     if (!req.data.title) req.reject(400, 'title is required');
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecreate | CDS-TS-Dispatcher - @BeforeCreate}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeCreate
 */
const BeforeCreate = buildBefore({ event: 'CREATE', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before a `CREATE` request is applied directly against the host entity's
 * `.drafts` table.
 * Registers `srv.before('CREATE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * NOT the Fiori Elements "New" draft action — that is CAP's `NEW` event, handled by `@BeforeNewDraft`.
 * `@BeforeCreateDraft` only fires for a literal `CREATE` (`INSERT`) issued straight at `<Entity>.drafts`
 * (e.g. a plain OData `POST` against the drafts collection, or a programmatic `INSERT`). Active-entity
 * counterpart: `@BeforeCreate`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeCreateDraft()
 *   private async beforeCreateDraft(@Req() req: Request<Book>): Promise<void> {
 *     // ... runs only for a direct INSERT into Book.drafts
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeCreateDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Before
 */
const BeforeCreateDraft = buildBefore({ event: 'CREATE', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before a read operation on the host entity.
 * Registers `srv.before('READ', <Entity>, callback)`.
 *
 * @remarks
 * Fires for both the entity-set and single-instance `READ` request shapes — pair with
 * `@SingleInstanceSwitch` to tell them apart, or read `req.params` directly. Draft variant:
 * `@BeforeReadDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeRead()
 *   private async beforeRead(@Req() req: Request<Book>): Promise<void> {
 *     // ... e.g. inspect/adjust req.query before it runs
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeread | CDS-TS-Dispatcher - @BeforeRead}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeRead
 */
const BeforeRead = buildBefore({ event: 'READ', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before a read operation on the host entity's `.drafts` table.
 * Registers `srv.before('READ', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@BeforeRead` — same entity-set/single-instance shapes, scoped to
 * `<Entity>.drafts` (e.g. re-opening an in-progress draft in the Fiori Elements UI).
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeReadDraft()
 *   private async beforeReadDraft(@Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeReadDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Before
 */
const BeforeReadDraft = buildBefore({ event: 'READ', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before an update operation on the host entity.
 * Registers `srv.before('UPDATE', <Entity>, callback)`.
 *
 * @remarks
 * Commonly paired with `@Diff` to inspect the incoming change-set before it is applied. Draft variant:
 * `@BeforeUpdateDraft`; the more specific field-level draft edit is `@BeforePatchDraft` (`PATCH`, CAP's
 * canonical alias of `UPDATE` on `.drafts` since `@sap/cds` 10).
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeUpdate()
 *   private async beforeUpdate(@Req() req: Request<Book>, @Diff() diff: Book): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeupdate | CDS-TS-Dispatcher - @BeforeUpdate}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeUpdate
 */
const BeforeUpdate = buildBefore({ event: 'UPDATE', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before an `UPDATE` request is applied directly against the host entity's
 * `.drafts` table.
 * Registers `srv.before('UPDATE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `@BeforePatchDraft` (`PATCH`) is CAP's canonical alias of this same `UPDATE` event on `.drafts` since
 * `@sap/cds` 10 — the field-level draft-edit moment a Fiori Elements user triggers by typing into a
 * field; prefer it for that scenario. Active-entity counterpart: `@BeforeUpdate`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeUpdateDraft()
 *   private async beforeUpdateDraft(@Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeUpdateDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Before
 */
const BeforeUpdateDraft = buildBefore({ event: 'UPDATE', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before an instance of the host entity is deleted.
 * Registers `srv.before('DELETE', <Entity>, callback)`.
 *
 * @remarks
 * The usual spot for last-chance authorization checks (`req.reject(...)`) before the row disappears.
 * Draft variant: `@BeforeDeleteDraft`; abandoning an in-progress draft through the Fiori Elements UI is
 * a different event — `@BeforeDiscardDraft` / `@BeforeCancelDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeDelete()
 *   private async beforeDelete(@Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforedelete | CDS-TS-Dispatcher - @BeforeDelete}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeDelete
 */
const BeforeDelete = buildBefore({ event: 'DELETE', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before a `DELETE` request is applied directly against the host entity's
 * `.drafts` table.
 * Registers `srv.before('DELETE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * A literal `DELETE` against `<Entity>.drafts`, distinct from abandoning a draft through the Fiori
 * Elements UI (`@BeforeDiscardDraft` / `@BeforeCancelDraft`). Active-entity counterpart: `@BeforeDelete`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeDeleteDraft()
 *   private async beforeDeleteDraft(@Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeDeleteDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Before
 */
const BeforeDeleteDraft = buildBefore({ event: 'DELETE', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before an unbound action is invoked.
 * Registers `srv.before(name, callback)`.
 *
 * @remarks
 * Conventionally hosted in an `@UnboundActions` class (service-wide, not entity-scoped). Sibling for
 * unbound functions: `@BeforeFunction`; bound counterpart: `@BeforeBoundAction`. Runs ahead of
 * `@OnAction` / `@AfterAction` for the same action.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ActionsHandler {
 *   /@BeforeAction(SubmitOrder)
 *   private async beforeSubmitOrder(@Req() req: ActionRequest<typeof SubmitOrder>): Promise<void> {
 *     if (!req.data.orderId) req.reject(400, 'orderId is required');
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeaction | CDS-TS-Dispatcher - @BeforeAction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeAction
 */
const BeforeAction = buildAction({ event: 'ACTION', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before a bound action is invoked on a specific instance of the host entity.
 * Registers `srv.before(name, <Entity>, callback)`.
 *
 * @remarks
 * Must be hosted in an `@EntityHandler` class — the registration needs that class's resolved entity;
 * hosting it elsewhere leaves the entity argument `undefined`. Sibling for bound functions:
 * `@BeforeBoundFunction`; unbound counterpart: `@BeforeAction`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeBoundAction(Book.actions.approve)
 *   private async beforeApprove(@Req() req: ActionRequest<typeof Book.actions.approve>): Promise<void> {
 *     // ... validate before the bound action runs
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeboundaction | CDS-TS-Dispatcher - @BeforeBoundAction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeBoundAction
 */
const BeforeBoundAction = buildAction({ event: 'BOUND_ACTION', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before an unbound function is invoked.
 * Registers `srv.before(name, callback)`.
 *
 * @remarks
 * Conventionally hosted in an `@UnboundActions` class (service-wide, not entity-scoped). Sibling for
 * unbound actions: `@BeforeAction`; bound counterpart: `@BeforeBoundFunction`.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ActionsHandler {
 *   /@BeforeFunction(GetTopSellers)
 *   private async beforeGetTopSellers(@Req() req: ActionRequest<typeof GetTopSellers>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforefunction | CDS-TS-Dispatcher - @BeforeFunction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeFunction
 */
const BeforeFunction = buildAction({ event: 'FUNC', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before a bound function is invoked on a specific instance of the host entity.
 * Registers `srv.before(name, <Entity>, callback)`.
 *
 * @remarks
 * Must be hosted in an `@EntityHandler` class — the registration needs that class's resolved entity;
 * hosting it elsewhere leaves the entity argument `undefined`. Sibling for bound actions:
 * `@BeforeBoundAction`; unbound counterpart: `@BeforeFunction`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeBoundFunction(Book.actions.someFunction)
 *   private async beforeSomeFunction(@Req() req: ActionRequest<typeof Book.actions.someFunction>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeboundfunction | CDS-TS-Dispatcher - @BeforeBoundFunction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeBoundFunction
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
 * Executes custom logic after every CRUD event on the host entity (`CREATE`, `READ`, `UPDATE`,
 * `DELETE`, bound actions, bound functions).
 * Registers `srv.after('*', <Entity>, callback)`.
 *
 * @remarks
 * `'*'` matches every `AFTER`-phase event on the entity — the narrower siblings (`@AfterCreate`,
 * `@AfterRead`, `@AfterUpdate`, `@AfterDelete`, `@AfterBoundAction`, `@AfterBoundFunction`) still fire
 * too when their specific event matches; both run. The injected payload shape varies with the event —
 * an array for `READ`, a single object for `CREATE`/`UPDATE`, a `boolean` for `DELETE` — narrow it at
 * runtime (`Array.isArray(result)`, `typeof result === 'boolean'`). Registers ONLY against the active
 * entity — use `@AfterAllDraft` for the equivalent wildcard on `<Entity>.drafts`. `@AfterEditDraft` /
 * `@AfterSaveDraft` also target the active entity, so those draft-lifecycle moments already reach this
 * handler.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterAll()
 *   private async afterAny(@Result() result: Book | Book[] | boolean, @Req() req: Request<Book>): Promise<void> {
 *     if (Array.isArray(result)) {
 *       // READ (entity set)
 *     } else if (typeof result === 'boolean') {
 *       // DELETE
 *     } else {
 *       // CREATE / UPDATE
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterall | CDS-TS-Dispatcher - @AfterAll}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterAll
 */
const AfterAll = buildAfter({ event: '*', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after every draft-lifecycle event on the host entity's `.drafts` table (`NEW`,
 * `CANCEL`, `PATCH`, `DISCARD`, plus `CREATE` / `READ` / `UPDATE` / `DELETE` issued directly against
 * `.drafts`).
 * Registers `srv.after('*', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@AfterAll` — same wildcard, scoped to `<Entity>.drafts` instead of the
 * active entity. It does NOT see `@AfterEditDraft` / `@AfterSaveDraft`, which register against the
 * ACTIVE entity; use `@AfterAll` for those.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterAllDraft()
 *   private async afterAnyDraft(@Result() result: unknown, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterall | CDS-TS-Dispatcher - @AfterAllDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterAll
 */
const AfterAllDraft = buildAfter({ event: '*', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after a new instance of the host entity is created.
 * Registers `srv.after('CREATE', <Entity>, callback)`.
 *
 * @remarks
 * Receives the created row as a single object (`@Result`), NOT an array — pair with `@Results` only on
 * `@AfterRead`. On `@sap/cds` >= 10 the framework's raw write result carries an `.affected` count
 * instead; the dispatcher restores the pre-10 contract here, so `@Result` still gets the entity data.
 * Use `@Affected` if you need the raw row count. Draft variant: `@AfterCreateDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterCreate()
 *   private async afterCreate(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate | CDS-TS-Dispatcher - @AfterCreate}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterCreate
 */
const AfterCreate = buildAfter({ event: 'CREATE', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after a `CREATE` request is applied directly against the host entity's
 * `.drafts` table.
 * Registers `srv.after('CREATE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * NOT the Fiori Elements "New" draft action — that is CAP's `NEW` event, handled by `@AfterNewDraft`.
 * `@AfterCreateDraft` only fires for a literal `CREATE` issued straight at `<Entity>.drafts`.
 * Active-entity counterpart: `@AfterCreate`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterCreateDraft()
 *   private async afterCreateDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate | CDS-TS-Dispatcher - @AfterCreateDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterCreate
 */
const AfterCreateDraft = buildAfter({ event: 'CREATE', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after a read operation, on the full result set.
 * Registers `srv.after('READ', <Entity>, callback)`.
 *
 * @remarks
 * Operates on the whole result array; use `@AfterReadEachInstance` for per-row logic and
 * `@AfterReadSingleInstance` when a single entity is requested by key. Draft variant: `@AfterReadDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterRead()
 *   private async enrich(@Results() results: Book[], @Req() req: Request): Promise<void> {
 *     results.forEach((book) => (book.discount = '10%'));
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | CDS-TS-Dispatcher - @AfterRead}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterRead
 */
const AfterRead = buildAfter({ event: 'READ', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after a read operation on the host entity's `.drafts` table, on the full
 * result set.
 * Registers `srv.after('READ', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@AfterRead` — same whole-array payload, scoped to `<Entity>.drafts`. Use
 * `@AfterReadDraftEachInstance` for per-row logic and `@AfterReadDraftSingleInstance` when a single
 * draft is requested by key.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterReadDraft()
 *   private async afterReadDraft(@Results() results: Book[], @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | CDS-TS-Dispatcher - @AfterReadDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterRead
 */
const AfterReadDraft = buildAfter({ event: 'READ', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic once per instance after a read operation on the host entity — analogous to
 * `Array.prototype.forEach`.
 * Registers `srv.after('each', <Entity>, callback)`.
 *
 * @remarks
 * Invoked once per row with a single object (`@Result`), NOT the whole array — use `@AfterRead` for
 * bulk/whole-array logic and `@AfterReadSingleInstance` when a single entity is requested by key. Draft
 * variant: `@AfterReadDraftEachInstance`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterReadEachInstance()
 *   private async afterEach(@Result() result: Book, @Req() req: Request<Book>): Promise<void> {
 *     result.discount = '10%';
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadeachinstance | CDS-TS-Dispatcher - @AfterReadEachInstance}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterReadEachInstance
 */
const AfterReadEachInstance = buildAfter({ event: 'each', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic once per instance after a read operation on the host entity's `.drafts` table —
 * analogous to `Array.prototype.forEach`.
 * Registers `srv.after('each', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@AfterReadEachInstance` — same per-row `@Result` payload, scoped to
 * `<Entity>.drafts`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterReadDraftEachInstance()
 *   private async afterEachDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadeachinstance | CDS-TS-Dispatcher - @AfterReadDraftEachInstance}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterReadEachInstance
 */
const AfterReadDraftEachInstance = buildAfter({ event: 'each', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after a read operation, only when the request targets a single instance by key.
 * Registers `srv.after('READ', <Entity>, callback)` — the same CAP registration as `@AfterRead`.
 *
 * @remarks
 * The dispatcher's wrapper only invokes your callback when `req.params.length > 0` (a single-instance
 * request), passing that one row (`@Result`) instead of the array; entity-set requests never reach it.
 * Combining this with `@AfterRead` in the same class fires BOTH for the same single-instance request —
 * use `@AfterRead` with `@SingleInstanceSwitch` instead if you want one handler for both shapes. Use
 * `@AfterReadEachInstance` for per-row logic across an entity-set read. Draft variant:
 * `@AfterReadDraftSingleInstance`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterReadSingleInstance()
 *   private async afterReadOne(@Result() result: Book, @Req() req: Request<Book>): Promise<void> {
 *     // ... only for GET .../Book(ID=...)
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadsingleinstance | CDS-TS-Dispatcher - @AfterReadSingleInstance}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterReadSingleInstance
 */
const AfterReadSingleInstance = buildAfter({
  event: 'READ',
  eventKind: 'AFTER_SINGLE',
  isDraft: false,
});

/**
 * Executes custom logic after a read operation on the host entity's `.drafts` table, only when the
 * request targets a single draft instance by key.
 * Registers `srv.after('READ', <Entity>.drafts, callback)` — the same CAP registration as
 * `@AfterReadDraft`.
 *
 * @remarks
 * The draft counterpart of `@AfterReadSingleInstance` — same `req.params.length > 0` gate and
 * single-row `@Result` payload, scoped to `<Entity>.drafts`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterReadDraftSingleInstance()
 *   private async afterReadOneDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterreadsingleinstance | CDS-TS-Dispatcher - @AfterReadDraftSingleInstance}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterReadSingleInstance
 */
const AfterReadDraftSingleInstance = buildAfter({
  event: 'READ',
  eventKind: 'AFTER_SINGLE',
  isDraft: true,
});

/**
 * Executes custom logic after an update operation on the host entity.
 * Registers `srv.after('UPDATE', <Entity>, callback)`.
 *
 * @remarks
 * Receives the updated row as a single object (`@Result`), NOT an array. On `@sap/cds` >= 10 the
 * dispatcher restores the pre-10 contract (entity data instead of the raw `.affected`-carrying write
 * result) — use `@Affected` if you need the raw row count. Draft variant: `@AfterUpdateDraft`; the more
 * specific field-level draft edit is `@AfterPatchDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterUpdate()
 *   private async afterUpdate(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate | CDS-TS-Dispatcher - @AfterUpdate}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterUpdate
 */
const AfterUpdate = buildAfter({ event: 'UPDATE', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after an `UPDATE` request is applied directly against the host entity's
 * `.drafts` table.
 * Registers `srv.after('UPDATE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `@AfterPatchDraft` (`PATCH`) is CAP's canonical alias of this same `UPDATE` event on `.drafts` since
 * `@sap/cds` 10 — the field-level draft-edit moment a Fiori Elements user triggers by typing into a
 * field; prefer it for that scenario. Active-entity counterpart: `@AfterUpdate`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterUpdateDraft()
 *   private async afterUpdateDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate | CDS-TS-Dispatcher - @AfterUpdateDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterUpdate
 */
const AfterUpdateDraft = buildAfter({ event: 'UPDATE', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after an instance of the host entity is deleted.
 * Registers `srv.after('DELETE', <Entity>, callback)`.
 *
 * @remarks
 * Receives a `boolean` (`@Result`), NOT the deleted row — the dispatcher normalizes both the pre-10 and
 * the `@sap/cds` >= 10 (`.affected`-carrying) write result down to `affected === 1`. Use `@Affected` if
 * you need the raw row count instead of the boolean. Draft variant: `@AfterDeleteDraft`; abandoning an
 * in-progress draft through the Fiori Elements UI is a different event — `@AfterDiscardDraft` /
 * `@AfterCancelDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterDelete()
 *   private async afterDelete(@Result() deleted: boolean, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete | CDS-TS-Dispatcher - @AfterDelete}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterDelete
 */
const AfterDelete = buildAfter({ event: 'DELETE', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after a `DELETE` request is applied directly against the host entity's
 * `.drafts` table.
 * Registers `srv.after('DELETE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * A literal `DELETE` against `<Entity>.drafts`, distinct from abandoning a draft through the Fiori
 * Elements UI (`@AfterDiscardDraft` / `@AfterCancelDraft`). Active-entity counterpart: `@AfterDelete`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterDeleteDraft()
 *   private async afterDeleteDraft(@Result() deleted: boolean, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete | CDS-TS-Dispatcher - @AfterDeleteDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterDelete
 */
const AfterDeleteDraft = buildAfter({ event: 'DELETE', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after an unbound action has completed.
 * Registers `srv.after(name, callback)`.
 *
 * @remarks
 * Conventionally hosted in an `@UnboundActions` class (service-wide, not entity-scoped). Sibling for
 * unbound functions: `@AfterFunction`; bound counterpart: `@AfterBoundAction`. Typical use: audit
 * logging, notifications, cleanup after the action's own implementation (`@OnAction`) has run.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ActionsHandler {
 *   /@AfterAction(SubmitOrder)
 *   private async afterSubmitOrder(@Result() result: unknown, @Req() req: ActionRequest<typeof SubmitOrder>): Promise<void> {
 *     // ... e.g. audit logging
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afteraction | CDS-TS-Dispatcher - @AfterAction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterAction
 */
const AfterAction = buildAction({ event: 'ACTION', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after a bound action has completed on a specific instance of the host entity.
 * Registers `srv.after(name, <Entity>, callback)`.
 *
 * @remarks
 * Must be hosted in an `@EntityHandler` class — the registration needs that class's resolved entity;
 * hosting it elsewhere leaves the entity argument `undefined`. Sibling for bound functions:
 * `@AfterBoundFunction`; unbound counterpart: `@AfterAction`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterBoundAction(Book.actions.approve)
 *   private async afterApprove(@Result() result: unknown, @Req() req: ActionRequest<typeof Book.actions.approve>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeboundaction | CDS-TS-Dispatcher - @AfterBoundAction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeBoundAction
 */
const AfterBoundAction = buildAction({ event: 'BOUND_ACTION', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after an unbound function has completed.
 * Registers `srv.after(name, callback)`.
 *
 * @remarks
 * Conventionally hosted in an `@UnboundActions` class (service-wide, not entity-scoped). Sibling for
 * unbound actions: `@AfterAction`; bound counterpart: `@AfterBoundFunction`.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ActionsHandler {
 *   /@AfterFunction(GetTopSellers)
 *   private async afterGetTopSellers(@Result() result: unknown, @Req() req: ActionRequest<typeof GetTopSellers>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforefunction | CDS-TS-Dispatcher - @AfterFunction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeFunction
 */
const AfterFunction = buildAction({ event: 'FUNC', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after a bound function has completed on a specific instance of the host entity.
 * Registers `srv.after(name, <Entity>, callback)`.
 *
 * @remarks
 * Must be hosted in an `@EntityHandler` class — the registration needs that class's resolved entity;
 * hosting it elsewhere leaves the entity argument `undefined`. Sibling for bound actions:
 * `@AfterBoundAction`; unbound counterpart: `@AfterFunction`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterBoundFunction(Book.actions.someFunction)
 *   private async afterSomeFunction(@Result() result: unknown, @Req() req: ActionRequest<typeof Book.actions.someFunction>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeboundfunction | CDS-TS-Dispatcher - @AfterBoundFunction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeBoundFunction
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
 * Handles an incoming websocket operation/event by name (`@cap-js-community/websocket` services).
 * Sugar for `@OnEvent(name)`; requires the websocket plugin in the consumer app and a
 * `@protocol: 'websocket'` (or `@ws`) service whose impl hosts this `@UnboundActions` class.
 * @param name string - name of the websocket operation, as sent in the `event` field of the wire payload.
 * `NOTE:` like `@OnEvent`, everything before the last dot is stripped at registration time
 * (`'ChatService.sendMessage'` registers as `'sendMessage'`) - the ws plugin routes by the local
 * operation name, so pass the plain name.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onwebsocketmessage | CDS-TS-Dispatcher - @OnWebSocketMessage}
 */
const OnWebSocketMessage = (name: string) => OnEvent(name);

/**
 * Fires when a websocket client connects. Sugar for `@OnEvent('wsConnect')`; the CDS service must
 * model `action wsConnect();`.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onwebsocketconnect | CDS-TS-Dispatcher - @OnWebSocketConnect}
 */
const OnWebSocketConnect = () => OnEvent('wsConnect');

/**
 * Fires when a websocket client disconnects. Sugar for `@OnEvent('wsDisconnect')`; model
 * `action wsDisconnect(reason: String);` to receive a disconnect detail in `req.data.reason`.
 * `NOTE:` under the plugin's default `kind: 'ws'` the delivered value is the socket `close code` as a
 * string (e.g. `'1000'`, `'1005'`), not a reason phrase - raw `ws` passes `(code, reason)` and the
 * plugin forwards the first argument.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onwebsocketdisconnect | CDS-TS-Dispatcher - @OnWebSocketDisconnect}
 */
const OnWebSocketDisconnect = () => OnEvent('wsDisconnect');

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
 * Executes custom logic before a new draft is created (the Fiori Elements "New" action).
 * Registers `srv.before('NEW', <Entity>.drafts, callback)`.
 *
 * @remarks
 * NOT a literal `CREATE` against `.drafts` — that is `@BeforeCreateDraft`. `@BeforeNewDraft` is CAP's
 * dedicated draft-creation event, fired when a user starts editing a brand-new instance. Pairs with
 * `@AfterNewDraft` / `@OnNewDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeNewDraft()
 *   private async beforeNewDraft(@Req() req: Request<Book>): Promise<void> {
 *     // ... e.g. pre-fill or validate defaults for the new draft
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforenewdraft | CDS-TS-Dispatcher - @BeforeNewDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeNewDraft
 */
const BeforeNewDraft = buildBefore({ event: 'NEW', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before an in-progress draft is cancelled.
 * Registers `srv.before('CANCEL', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `@BeforeDiscardDraft` (`DISCARD`) is CAP's canonical alias of this same `CANCEL` event on `.drafts`
 * since `@sap/cds` 10 — the same draft-abandon moment under a different, newer event name. Pairs with
 * `@AfterCancelDraft` / `@OnCancelDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeCancelDraft()
 *   private async beforeCancelDraft(@Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecanceldraft | CDS-TS-Dispatcher - @BeforeCancelDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeCancelDraft
 */
const BeforeCancelDraft = buildBefore({ event: 'CANCEL', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before a new draft is created FROM an existing active instance (the Fiori
 * Elements "Edit" action).
 * Registers `srv.before('EDIT', <Entity>, callback)` — against the ACTIVE entity, NOT `.drafts`.
 *
 * @remarks
 * Despite the "Draft" in its name this registers on the active entity: `EDIT` is the moment a user
 * starts editing an already-saved instance (as opposed to `@BeforeNewDraft`, which starts a brand-new
 * one). Pairs with `@AfterEditDraft` / `@OnEditDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeEditDraft()
 *   private async beforeEditDraft(@Req() req: Request<Book>): Promise<void> {
 *     // ... e.g. reject editing a locked Book
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeeditdraft | CDS-TS-Dispatcher - @BeforeEditDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeEditDraft
 */
const BeforeEditDraft = buildBefore({ event: 'EDIT', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic before a draft is activated — written back to the active entity (the Fiori
 * Elements "Save" action).
 * Registers `srv.before('SAVE', <Entity>, callback)` — against the ACTIVE entity, NOT `.drafts`.
 *
 * @remarks
 * Despite the "Draft" in its name this registers on the active entity: `SAVE` is the final validation
 * gate before the draft's data becomes the active instance's data. Pairs with `@AfterSaveDraft` /
 * `@OnSaveDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeSaveDraft()
 *   private async beforeSaveDraft(@Req() req: Request<Book>): Promise<void> {
 *     if (!req.data.title) req.reject(400, 'title is required before saving');
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforesavedraft | CDS-TS-Dispatcher - @BeforeSaveDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeSaveDraft
 */
const BeforeSaveDraft = buildBefore({ event: 'SAVE', eventKind: 'BEFORE', isDraft: false });

/**
 * Executes custom logic after a new draft is created (the Fiori Elements "New" action).
 * Registers `srv.after('NEW', <Entity>.drafts, callback)`.
 *
 * @remarks
 * NOT a literal `CREATE` against `.drafts` — that is `@AfterCreateDraft`. Pairs with `@BeforeNewDraft` /
 * `@OnNewDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterNewDraft()
 *   private async afterNewDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afternewdraft | CDS-TS-Dispatcher - @AfterNewDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterNewDraft
 */
const AfterNewDraft = buildAfter({ event: 'NEW', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after an in-progress draft has been cancelled.
 * Registers `srv.after('CANCEL', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `@AfterDiscardDraft` (`DISCARD`) is CAP's canonical alias of this same `CANCEL` event on `.drafts`
 * since `@sap/cds` 10 — the same draft-abandon moment under a different, newer event name. Pairs with
 * `@BeforeCancelDraft` / `@OnCancelDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterCancelDraft()
 *   private async afterCancelDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercanceldraft | CDS-TS-Dispatcher - @AfterCancelDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterCancelDraft
 */
const AfterCancelDraft = buildAfter({ event: 'CANCEL', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after a new draft has been created FROM an existing active instance (the
 * Fiori Elements "Edit" action).
 * Registers `srv.after('EDIT', <Entity>, callback)` — against the ACTIVE entity, NOT `.drafts`.
 *
 * @remarks
 * Despite the "Draft" in its name this registers on the active entity, mirroring `@BeforeEditDraft`.
 * Pairs with `@OnEditDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterEditDraft()
 *   private async afterEditDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftereditdraft | CDS-TS-Dispatcher - @AfterEditDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterEditDraft
 */
const AfterEditDraft = buildAfter({ event: 'EDIT', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic after a draft has been activated — written back to the active entity (the
 * Fiori Elements "Save" action).
 * Registers `srv.after('SAVE', <Entity>, callback)` — against the ACTIVE entity, NOT `.drafts`.
 *
 * @remarks
 * Despite the "Draft" in its name this registers on the active entity, mirroring `@BeforeSaveDraft`.
 * `@Result` receives the now-active entity data. Pairs with `@OnSaveDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterSaveDraft()
 *   private async afterSaveDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftersavedraft | CDS-TS-Dispatcher - @AfterSaveDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterSaveDraft
 */
const AfterSaveDraft = buildAfter({ event: 'SAVE', eventKind: 'AFTER', isDraft: false });

/**
 * Executes custom logic before a field of an in-progress draft is changed.
 * Registers `srv.before('PATCH', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `PATCH` is CAP's canonical field-level draft-edit event — an alias of `UPDATE` on `.drafts` since
 * `@sap/cds` 10 — fired every time a Fiori Elements user changes a field of an in-progress draft.
 * `@BeforeUpdateDraft` (`UPDATE`) is the same moment under the older event name.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforePatchDraft()
 *   private async beforePatchDraft(@Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforepatchdraft | CDS-TS-Dispatcher - @BeforePatchDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforePatchDraft
 */
const BeforePatchDraft = buildBefore({ event: 'PATCH', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic before an in-progress draft is discarded.
 * Registers `srv.before('DISCARD', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `DISCARD` is CAP's canonical alias of `CANCEL` on `.drafts` since `@sap/cds` 10. `@BeforeCancelDraft`
 * (`CANCEL`) is the same moment under the older event name.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeDiscardDraft()
 *   private async beforeDiscardDraft(@Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforediscarddraft | CDS-TS-Dispatcher - @BeforeDiscardDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeDiscardDraft
 */
const BeforeDiscardDraft = buildBefore({ event: 'DISCARD', eventKind: 'BEFORE', isDraft: true });

/**
 * Executes custom logic after a field of an in-progress draft has been changed.
 * Registers `srv.after('PATCH', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `PATCH` is CAP's canonical field-level draft-edit event — an alias of `UPDATE` on `.drafts` since
 * `@sap/cds` 10. `@AfterUpdateDraft` (`UPDATE`) is the same moment under the older event name.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterPatchDraft()
 *   private async afterPatchDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterpatchdraft | CDS-TS-Dispatcher - @AfterPatchDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterPatchDraft
 */
const AfterPatchDraft = buildAfter({ event: 'PATCH', eventKind: 'AFTER', isDraft: true });

/**
 * Executes custom logic after an in-progress draft has been discarded.
 * Registers `srv.after('DISCARD', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `DISCARD` is CAP's canonical alias of `CANCEL` on `.drafts` since `@sap/cds` 10. `@AfterCancelDraft`
 * (`CANCEL`) is the same moment under the older event name.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterDiscardDraft()
 *   private async afterDiscardDraft(@Result() result: Book, @Req() req: Request<Book>): Promise<void> { ... }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdiscarddraft | CDS-TS-Dispatcher - @AfterDiscardDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterDiscardDraft
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
 * Start `Server lifecycle` methods
 * ####################################################################################################################
 */

/**
 * Use `@OnServed` decorator to execute custom logic once, right before the CAP server starts `listening` for requests.
 *
 * Must be hosted in a [@ServerLifecycle](#serverlifecycle) class. The handler receives `cds.services` (the
 * bootstrapped services) as its only argument. CAP `awaits` every `@OnServed` handler `sequentially` - in
 * `declaration order` inside a class, and in `CDSDispatcher` array order across classes - `before` `app.listen`
 * runs. A `thrown` error `fails` server startup.
 *
 * `NOTE:` these arguments come straight from `cds.on('served', ...)` - no `@Req()`-style parameter decorator
 * applies, the callback is invoked with CAP's native arguments `verbatim`.
 * @example
 * ```typescript
 * /@ServerLifecycle()
 * export class Bootstrap {
 *   /@OnServed()
 *   public async seed(services: object) {
 *     // ... one-time startup work, may throw to abort the boot
 *   }
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onserved | CDS-TS-Dispatcher - @OnServed}
 */
const OnServed = buildServerLifecycle({ event: 'SERVED' });

/**
 * Use `@OnListening` decorator to execute custom logic once the CAP server is `listening` for requests.
 *
 * Must be hosted in a [@ServerLifecycle](#serverlifecycle) class. The handler receives `{ server, url }`. CAP
 * dispatches `@OnListening` `synchronously` - any return value (including a `Promise`) is `discarded`, so treat
 * the handler as `fire-and-forget`.
 *
 * `NOTE:` these arguments come straight from `cds.on('listening', ...)` - no `@Req()`-style parameter decorator
 * applies, the callback is invoked with CAP's native arguments `verbatim`.
 * @example
 * ```typescript
 * /@ServerLifecycle()
 * export class Bootstrap {
 *   /@OnListening()
 *   public logUrl(payload: { server: unknown; url: string }) {
 *     console.log(`Listening on ${payload.url}`);
 *   }
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onlistening | CDS-TS-Dispatcher - @OnListening}
 */
const OnListening = buildServerLifecycle({ event: 'LISTENING' });

/**
 * Use `@OnShutdown` decorator to execute custom logic while the CAP server is shutting down.
 *
 * Must be hosted in a [@ServerLifecycle](#serverlifecycle) class. The handler receives `err: Error | null`. CAP
 * runs `all` `@OnShutdown` handlers (of every class) `in parallel` and `awaits` them `before` the server closes.
 *
 * `NOTE:` CAP has `NO once-guard` on `shutdown` - unlike `served` / `listening`, this callback `may fire more than
 * once` per process. Make the handler idempotent.
 *
 * `NOTE:` catch your own errors: a `rejected` `@OnShutdown` handler propagates out of CAP's shutdown dispatch,
 * so `server.close` (and the force-exit fallback timer) never run - the process stays alive with an
 * `unhandled rejection` instead of shutting down.
 *
 * `NOTE:` these arguments come straight from `cds.on('shutdown', ...)` - no `@Req()`-style parameter decorator
 * applies, the callback is invoked with CAP's native arguments `verbatim`.
 * @example
 * ```typescript
 * /@ServerLifecycle()
 * export class Bootstrap {
 *   /@OnShutdown()
 *   public async cleanup(err: Error | null) {
 *     // ... release resources, may run more than once
 *   }
 * }
 * ```
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onshutdown | CDS-TS-Dispatcher - @OnShutdown}
 */
const OnShutdown = buildServerLifecycle({ event: 'SHUTDOWN' });

/**
 * ####################################################################################################################
 * End `Server lifecycle` methods
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
function Stream(contentType: StreamContentType = 'application/octet-stream') {
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
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // Rate limiting
  Throttle,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // Server lifecycle (cds.on 'served' / 'listening' / 'shutdown', hosted by @ServerLifecycle)
  OnServed,
  OnListening,
  OnShutdown,
  // ========================================================================================================================================================

  // ========================================================================================================================================================
  // WebSocket (plugin: @cap-js-community/websocket)
  OnWebSocketMessage,
  OnWebSocketConnect,
  OnWebSocketDisconnect,
  // ========================================================================================================================================================
};
