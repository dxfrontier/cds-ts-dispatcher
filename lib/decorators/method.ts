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
 * Catches any error thrown or rejected by the decorated method and rewrites the response with the given
 * HTTP status code, discarding the original error's message.
 *
 * @remarks
 * Resolves the error via `req.reject({ code, message: <standard HTTP reason phrase for code> })` — the
 * ORIGINAL error message is replaced by the generic reason phrase of `newStatusCode` (e.g.
 * `'BAD_REQUEST-400'` → `'Bad Request'`); use `@CatchAndSetErrorMessage` instead to keep control over the
 * message. Like `@Throttle`, place it BELOW the handler decorator (`@AfterRead`, `@OnCreate`, ...), closer
 * to the method: decorators wrap `descriptor.value` bottom-up and the handler decorator freezes a
 * snapshot of `descriptor.value` into the registered callback at ITS OWN decoration time, so a wrapper
 * applied above it never becomes part of what CAP calls. Also usable on a `MiddlewareImpl.use` method.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterRead()
 *   /@CatchAndSetErrorCode('BAD_REQUEST-400')
 *   private async afterRead(@Req() req: Request, @Results() results: Book[]): Promise<void> {
 *     await axios.get('https://example.invalid'); // any thrown/rejected error becomes HTTP 400
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#catchandseterrorcode | CDS-TS-Dispatcher - @CatchAndSetErrorCode}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § CatchAndSetErrorCode
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
 * Catches any error thrown or rejected by the decorated method and rewrites the response with a custom
 * message and an optional new HTTP status code.
 *
 * @remarks
 * Resolves the error via `req.reject(...)` — with only `newMessage` given, the original status code is
 * retained and just the message changes; passing `newStatusCode` (e.g. `'NOT_FOUND-404'`) additionally
 * overwrites the status code. Sibling: `@CatchAndSetErrorCode` overwrites the status code but replaces
 * the message with that code's generic reason phrase instead of a custom one. Like `@Throttle`, place it
 * BELOW the handler decorator (`@AfterRead`, `@OnCreate`, ...), closer to the method — a wrapper applied
 * above the handler decorator never becomes part of the registered callback. Also usable on a
 * `MiddlewareImpl.use` method.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnUpdate()
 *   /@CatchAndSetErrorMessage('User data could not be retrieved', 'NOT_FOUND-404')
 *   private async onUpdate(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Book> {
 *     await axios.get(`https://example.invalid/users/${req.data.ID}`); // any error becomes 404 with this message
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#catchandseterrormessage | CDS-TS-Dispatcher - @CatchAndSetErrorMessage}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § CatchAndSetErrorMessage
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
 * Registers a callback that runs BEFORE all other registered handlers of the given draft-lifecycle event
 * (the draft counterpart of `@Prepend`).
 * Registers `srv.prepend(callback)`.
 *
 * @remarks
 * `options.eventDecorator` names the target Draft-suffixed decorator (e.g. `'BeforeReadDraft'`,
 * `'AfterUpdateDraft'`, `'OnNewDraft'`, ...); `options.actionName` is required only when the target is
 * `'OnBoundActionDraft'` / `'OnBoundFunctionDraft'`. On an `ON`-phase target, `return next()` is mandatory
 * in the prepended callback to let the actual event still run. Active-entity counterpart: `@Prepend`.
 * README has no dedicated `@PrependDraft` section; the closest coverage is `@Prepend`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@PrependDraft({ eventDecorator: 'BeforeReadDraft' })
 *   private async prepend(@Req() req: Request<Book>): Promise<void> {
 *     req.locale = 'de-DE'; // runs before every @BeforeReadDraft handler
 *   }
 *
 *   /@BeforeReadDraft()
 *   private async beforeReadDraft(@Req() req: Request<Book>): Promise<void> {
 *     // ... req.locale is already 'de-DE' here
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#prepend | CDS-TS-Dispatcher - @PrependDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Prepend
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
 * Registers a callback that runs BEFORE all other registered handlers of the given event (whichever
 * decorator `options.eventDecorator` names).
 * Registers `srv.prepend(callback)`.
 *
 * @remarks
 * `options.eventDecorator` accepts the BEFORE (`'BeforeCreate'`, ..., `'BeforeAll'`), AFTER
 * (`'AfterCreate'`, ..., `'AfterAll'`) and ON (`'OnCreate'`, ..., `'OnAll'`, `'OnError'`) decorator names;
 * `options.actionName` is required when the target is `'OnAction'` / `'OnFunction'` / `'OnBoundAction'` /
 * `'OnBoundFunction'` (or their `Before`/`After` counterparts), `options.eventName` when it is
 * `'OnEvent'`. On an `ON`-phase target, `return next()` in the prepended callback is mandatory —
 * otherwise the actual event handler never runs. Draft variant: `@PrependDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@Prepend({ eventDecorator: 'AfterRead' })
 *   private async prepend(@Req() req: Request<Book>): Promise<void> {
 *     req.locale = 'de-DE'; // runs before every @AfterRead handler
 *   }
 *
 *   /@AfterRead()
 *   private async afterRead(@Results() results: Book[], @Req() req: Request<Book>): Promise<void> {
 *     // ... req.locale is already 'de-DE' here
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#prepend | CDS-TS-Dispatcher - @Prepend}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Prepend
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
 * Guards the decorated handler so its body only runs when the current user has at least one of the given
 * roles (`req.user.is(role)`); otherwise the handler is silently skipped (no `req.reject`).
 *
 * @remarks
 * Logical `OR` across `roles`. Role names correspond to the `@requires` / `@restrict.grants.to`
 * annotations in your CDS models — see also the `@IsRole` parameter decorator for a `boolean` check
 * inside a handler that must still run for every role. Like `@Throttle`, place `@ExecutionAllowedForRole`
 * BELOW the handler decorator (closer to the method): decorators wrap `descriptor.value` bottom-up and
 * the handler decorator freezes a snapshot of `descriptor.value` into the registered callback at ITS OWN
 * decoration time, so a wrapper applied above it never becomes part of what CAP calls.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterRead()
 *   /@ExecutionAllowedForRole('Manager', 'CEO')
 *   private async afterRead(@Req() req: Request, @Results() results: Book[]): Promise<void> {
 *     // ... only runs for a Manager or CEO
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#executionallowedforrole | CDS-TS-Dispatcher - @ExecutionAllowedForRole}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § ExecutionAllowedForRole
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
 * Rate-limits the decorated handler with a fixed window, counted per `user` (default) or per `tenant`;
 * over the limit the request is rejected with HTTP 429 and the handler body never runs.
 *
 * @remarks
 * Counters are `in-memory`, kept per app instance AND per decorated method (a multi-instance deployment
 * limits per pod, not globally); each OData `$batch` sub-request is counted individually. `by: 'user'`
 * keys on `req.user.id` (fallback `'anonymous'`), `by: 'tenant'` on `req.tenant` (fallback `'no-tenant'`).
 * Requires a real `cds.Request` among the handler arguments — throws at DECORATION time on `@OnError`
 * (which is rejected outright, since error handlers run synchronously) and throws at RUNTIME on
 * messaging handlers (`@OnEvent` / `@OnSubscribe`), which carry no `cds.Request`. Place `@Throttle` BELOW
 * the handler decorator (closer to the method), like every wrapping decorator: decorators wrap
 * `descriptor.value` bottom-up, and the handler decorator freezes a snapshot of `descriptor.value` into
 * the registered callback at ITS OWN decoration time, so a wrapper applied above it never becomes part of
 * what CAP calls.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ReportHandler {
 *   /@OnAction(GenerateReport)
 *   /@Throttle({ limit: 10, window: 60_000 }) // 10 calls per minute, per user
 *   public async generate(@Req() req: ActionRequest<typeof GenerateReport>): ActionReturn<typeof GenerateReport> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#throttle | CDS-TS-Dispatcher - @Throttle}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Throttle
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
 * Applies a built-in (or custom) formatter to one or more fields, on `@After*` results or `@Before*` /
 * `@On*` request data.
 *
 * @remarks
 * On `@AfterRead`, formats `results` (array or single row); on `@BeforeCreate` / `@BeforeUpdate` /
 * `@OnCreate` / `@OnUpdate` / `@OnAction` / `@OnBoundAction` / `@OnFunction` / `@OnBoundFunction`, formats
 * `req.data` instead. `formatter.action` picks a built-in (`'blacklist'`, `'trim'`, `'toUpper'`,
 * `'camelCase'`, `'truncate'`, ...) or `'customFormatter'` with your own `callback(req, results)`.
 * Sibling: `@Validate` runs the same `BEFORE`/`ON` pass but rejects instead of transforming. Like
 * `@Throttle`, place it BELOW the handler decorator (closer to the method) — a wrapper applied above the
 * handler decorator never becomes part of the registered callback.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterRead()
 *   /@FieldsFormatter<Book>({ action: 'blacklist', charsToRemove: 'W' }, 'title')
 *   private async afterRead(@Results() results: Book[], @Req() req: Request<Book>): Promise<void> {
 *     // ... 'title' has every 'W' removed
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#fieldsformatter | CDS-TS-Dispatcher - @FieldsFormatter}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § FieldsFormatter
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
 * Validates one or more fields against a built-in validator before the decorated handler runs; on
 * failure the decorator itself calls `req.reject(...)` and the handler body never executes.
 *
 * @remarks
 * Valid on `@BeforeCreate`, `@BeforeUpdate`, `@OnCreate`, `@OnUpdate`, `@OnAction`, `@OnBoundAction`,
 * `@OnFunction`, `@OnBoundFunction` — anywhere `req.data` carries the fields to check. `validator.action`
 * picks a built-in check (`'isEmail'`, `'isLength'`, `'contains'`, `'matches'`, ..., see the validator.js
 * catalogue in the README); `validator.options.exposeValidatorResult: true` additionally makes the
 * pass/fail flags readable via the `@ValidationResults` parameter decorator instead of just rejecting.
 * Sibling: `@FieldsFormatter` runs the same `BEFORE`/`ON` pass but transforms instead of rejecting. Stack
 * multiple `@Validate` decorators to check multiple fields/rules on the same handler.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeCreate()
 *   /@Validate<Book>({ action: 'isLowercase' }, 'comment')
 *   private async beforeCreate(@Req() req: Request<Book>): Promise<void> {
 *     // ... only reached if 'comment' is already lowercase
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#validate | CDS-TS-Dispatcher - @Validate}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Validate
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
 * Removes the given fields from the response, in place, after the decorated `@After*` handler resolves.
 *
 * @remarks
 * Runs on whatever `results` shape the wrapped handler exposes — the array from `@AfterRead` / `@AfterAll`,
 * or the single row from `@AfterCreate` / `@AfterUpdate`. Complements `@Include` (keep only) and `@Mask`
 * (partially hide instead of remove). Place it directly below the handler decorator; multiple response
 * transformers (`@Exclude`, `@Include`, `@Mask`) may be stacked on the same handler.
 *
 * @example
 * ```ts
 * /@EntityHandler(User)
 * class UserHandler {
 *   /@AfterRead()
 *   /@Exclude<User>('password', 'ssn')
 *   private async afterRead(@Results() results: User[], @Req() req: Request<User>): Promise<void> {
 *     // ... the response omits 'password' and 'ssn'
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#exclude | CDS-TS-Dispatcher - @Exclude}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Exclude
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
 * Keeps only the given fields in the response, in place, after the decorated `@After*` handler resolves —
 * every other field is removed.
 *
 * @remarks
 * Runs on whatever `results` shape the wrapped handler exposes — the array from `@AfterRead` / `@AfterAll`,
 * or the single row from `@AfterCreate` / `@AfterUpdate`. Complements `@Exclude` (remove specific fields
 * instead of keeping only a set) and `@Mask` (partially hide instead of remove). Useful for minimal
 * list/summary responses.
 *
 * @example
 * ```ts
 * /@EntityHandler(User)
 * class UserHandler {
 *   /@AfterRead()
 *   /@Include<User>('ID', 'name', 'email')
 *   private async afterRead(@Results() results: User[], @Req() req: Request<User>): Promise<void> {
 *     // ... the response contains only 'ID', 'name', 'email'
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#include | CDS-TS-Dispatcher - @Include}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Include
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
 * Partially masks the given fields in the response, in place, after the decorated `@After*` handler
 * resolves — keeps a configurable number of characters visible and replaces the rest.
 *
 * @remarks
 * Runs on whatever `results` shape the wrapped handler exposes — the array from `@AfterRead` / `@AfterAll`,
 * or the single row from `@AfterCreate` / `@AfterUpdate`. `options.char` (default `'*'`),
 * `options.visibleEnd` (default `4`) and `options.visibleStart` (default `0`) control the mask; e.g.
 * `'1234567890123456'` with defaults becomes `'************3456'`. Complements `@Exclude` / `@Include`
 * (remove instead of mask).
 *
 * @example
 * ```ts
 * /@EntityHandler(User)
 * class UserHandler {
 *   /@AfterRead()
 *   /@Mask<User>(['creditCard'], { char: 'X', visibleStart: 2, visibleEnd: 4 })
 *   private async afterRead(@Results() results: User[], @Req() req: Request<User>): Promise<void> {
 *     // ... 'creditCard' keeps its first 2 and last 4 characters visible
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#mask | CDS-TS-Dispatcher - @Mask}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Mask
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
 * Logs the decorated method's execution — arguments, return value and/or duration — around whatever it
 * wraps.
 *
 * @remarks
 * Measures only the method BODY itself, not the full request lifecycle — `@Use` middleware and other
 * stacked response transformers (`@Exclude`, `@Mask`, ...) are not included in the duration; database/
 * network calls count only if `await`ed inside the method. `options.logDuration` defaults to `true`,
 * `logArgs` / `logResult` default to `false` (avoid logging sensitive request/response data in
 * production). `options.condition` can skip logging per-request; `options.prefix` (default `'[LOG]'`) and
 * `options.logLevel` (default `'info'`) control the console output.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterRead()
 *   /@LogExecution({ logDuration: true })
 *   private async afterRead(@Results() results: Book[], @Req() req: Request<Book>): Promise<void> {
 *     // ... logs '[LOG] BookHandler.afterRead - Duration: <n>ms'
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#logexecution | CDS-TS-Dispatcher - @LogExecution}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § LogExecution
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
 * Appends a synthetic `boolean` argument to the handler's argument list — `true` for a single-instance
 * request, `false` for an entity-set request (derived from `req.params.length > 0`).
 *
 * @deprecated Use the `@SingleInstanceSwitch` parameter decorator instead — it injects the same `boolean`
 * directly, without a positional, un-annotated trailing argument.
 *
 * @remarks
 * Kept only for source compatibility with handlers written before `@SingleInstanceSwitch` existed.
 * README has no dedicated `@SingleInstanceCapable` section; the closest coverage is
 * `@SingleInstanceSwitch`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterRead()
 *   /@SingleInstanceCapable()
 *   private async afterRead(@Results() results: Book[], @Req() req: Request, isSingleInstance: boolean): Promise<void> {
 *     if (isSingleInstance) {
 *       // ...
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#singleinstanceswitch | CDS-TS-Dispatcher - @SingleInstanceSwitch}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § SingleInstanceSwitch
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
 * Wires one or more middleware classes into the request pipeline — as a CLASS decorator (all handlers of
 * the class) or a METHOD decorator (that one handler only), depending on how many arguments TypeScript
 * hands the decorator function.
 * At class level: registers `srv.before('*', <Entity>, callback)` (plus one `srv.before` per action /
 * function / event / error handler of the class) that runs the middleware chain before the matched
 * handler. At method level: wraps the method directly and runs the chain before it.
 *
 * @remarks
 * A middleware class implements `MiddlewareImpl` (`use(req, next): Promise<void>`); call `next()` to
 * continue the chain, or end the response (`req.reject(...)`) to stop it — chained middlewares run in
 * declaration order, class-level ones before method-level ones. NOT applicable to `@ServerLifecycle`
 * classes — lifecycle hooks are not request handlers, and stacking `@Use` on one throws at bootstrap.
 * Like `@Throttle`, place the method-level form BELOW the handler decorator (closer to the method) — a
 * wrapper applied above the handler decorator never becomes part of the registered callback.
 * `@CatchAndSetErrorCode` / `@CatchAndSetErrorMessage` may be used inside a middleware's own `use` method.
 *
 * @example
 * ```ts
 * class LocaleMiddleware implements MiddlewareImpl {
 *   public async use(req: Request, next: NextMiddleware): Promise<void> {
 *     req.locale = 'de-DE';
 *     await next();
 *   }
 * }
 *
 * /@EntityHandler(Book)
 * /@Use(LocaleMiddleware) // class-level: runs before every handler of BookHandler
 * class BookHandler {
 *   /@AfterRead()
 *   /@Use(LocaleMiddleware) // method-level: runs before only this handler
 *   private async afterRead(@Results() results: Book[], @Req() req: Request<Book>): Promise<void> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#use | CDS-TS-Dispatcher - @Use}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Use (class-level and method-level sections)
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
 * fire too when their specific event matches; both run. Registers against whatever the host
 * `@EntityHandler` resolved: the specific active entity for a normal host — pair with `@BeforeAllDraft`
 * for the equivalent wildcard on `<Entity>.drafts` there (`@BeforeEditDraft` / `@BeforeSaveDraft` already
 * reach this handler, since those also target the active entity) — or `'*'` (every entity, DRAFTS
 * INCLUDED, since CAP drops the path filter entirely for a `'*'` target) when the class is
 * `@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)`. On that host the `Draft` variant has no additional
 * effect — both register the identical `srv.before('*', '*', callback)`, so adding `@BeforeAllDraft`
 * there only double-fires every draft event.
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
 * active entity. Meaningful ONLY on a normal, entity-scoped `@EntityHandler` host: there it does NOT see
 * `@BeforeEditDraft` / `@BeforeSaveDraft`, which register against the ACTIVE entity (`EDIT` / `SAVE` are
 * not `.drafts` events) — use `@BeforeAll` for those. On an `@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)`
 * host, `@BeforeAll` ALREADY registers `srv.before('*', '*', callback)` — CAP drops the path filter
 * entirely for `'*'`, so drafts of every entity are included there too, and adding this decorator only
 * double-fires every draft event.
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
 * NOT the Fiori Elements "New" draft action — a protocol-borne (HTTP/OData) `POST` against a
 * draft-enabled entity is itself rewritten to CAP's `NEW` event (handled by `@BeforeNewDraft`) unless the
 * payload explicitly sets `IsActiveEntity: true`. `@BeforeCreateDraft` only fires for a literal `CREATE`
 * issued WITHOUT a protocol straight at `<Entity>.drafts` — a programmatic `INSERT.into(<Entity>.drafts)`
 * or `srv.send('CREATE', <Entity>.drafts, ...)`. Active-entity counterpart: `@BeforeCreate`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeCreateDraft()
 *   private async beforeCreateDraft(@Req() req: Request<Book>): Promise<void> {
 *     // ... runs only for a protocol-less INSERT straight into Book.drafts (e.g. srv.send)
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
 * runtime (`Array.isArray(result)`, `typeof result === 'boolean'`). Registers against whatever the host
 * `@EntityHandler` resolved: the specific active entity for a normal host — pair with `@AfterAllDraft`
 * for the equivalent wildcard on `<Entity>.drafts` there (`@AfterEditDraft` / `@AfterSaveDraft` already
 * reach this handler, since those also target the active entity) — or `'*'` (every entity, DRAFTS
 * INCLUDED, since CAP drops the path filter entirely for a `'*'` target) when the class is
 * `@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)`. On that host the `Draft` variant has no additional
 * effect — both register the identical `srv.after('*', '*', callback)`, so adding `@AfterAllDraft` there
 * only double-fires every draft event.
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
 * active entity. Meaningful ONLY on a normal, entity-scoped `@EntityHandler` host: there it does NOT see
 * `@AfterEditDraft` / `@AfterSaveDraft`, which register against the ACTIVE entity — use `@AfterAll` for
 * those. On an `@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)` host, `@AfterAll` ALREADY registers
 * `srv.after('*', '*', callback)` — CAP drops the path filter entirely for `'*'`, so drafts of every
 * entity are included there too, and adding this decorator only double-fires every draft event.
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
 * NOT the Fiori Elements "New" draft action — a protocol-borne (HTTP/OData) `POST` against a
 * draft-enabled entity is itself rewritten to CAP's `NEW` event (handled by `@AfterNewDraft`) unless the
 * payload explicitly sets `IsActiveEntity: true`. `@AfterCreateDraft` only fires for a literal `CREATE`
 * issued WITHOUT a protocol straight at `<Entity>.drafts` — a programmatic `INSERT.into(<Entity>.drafts)`
 * or `srv.send('CREATE', <Entity>.drafts, ...)`. Active-entity counterpart: `@AfterCreate`.
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
 * `@AfterBoundFunction`; unbound counterpart: `@AfterAction`. README has no dedicated `@AfterBoundAction`
 * section; the closest coverage is `@BeforeBoundAction`.
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
 * unbound actions: `@AfterAction`; bound counterpart: `@AfterBoundFunction`. README has no dedicated
 * `@AfterFunction` section; the closest coverage is `@BeforeFunction`.
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
 * `@AfterBoundAction`; unbound counterpart: `@AfterFunction`. README has no dedicated
 * `@AfterBoundFunction` section; the closest coverage is `@BeforeBoundFunction`.
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
 * Replaces the default implementation for every CRUD event on the host entity (`CREATE`, `READ`,
 * `UPDATE`, `DELETE`, bound actions, bound functions) — call `next()` to continue to the next handler (a
 * narrower `@On*` handler, or CAP's generic database implementation).
 * Registers `srv.on('*', <Entity>, callback)`.
 *
 * @remarks
 * `'*'` matches every `ON`-phase event on the entity — the narrower siblings (`@OnCreate`, `@OnRead`,
 * `@OnUpdate`, `@OnDelete`, `@OnBoundAction`, `@OnBoundFunction`) still fire too when their specific event
 * matches. `@OnAction`, `@OnFunction`, `@OnEvent`, `@OnError` are excluded — they are bound to the
 * service itself, not to an entity, so a `'*'` scoped to `<Entity>` never reaches them. Registers against
 * whatever the host `@EntityHandler` resolved: the specific active entity for a normal host — pair with
 * `@OnAllDraft` for the equivalent wildcard on `<Entity>.drafts` there — or `'*'` (every entity, DRAFTS
 * INCLUDED, since CAP drops the path filter entirely for a `'*'` target) when the class is
 * `@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)`. On that host the `Draft` variant has no additional
 * effect — both register the identical `srv.on('*', '*', callback)`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnAll()
 *   private async onAny(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     // ... runs instead of CREATE/READ/UPDATE/DELETE on Book
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onall | CDS-TS-Dispatcher - @OnAll}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnAll
 */
const OnAll = buildOnCRUD({ event: '*', eventKind: 'ON', isDraft: false });

/**
 * Replaces the default implementation for every draft-lifecycle event on the host entity's `.drafts`
 * table (`NEW`, `CANCEL`, `PATCH`, `DISCARD`, plus `CREATE`/`READ`/`UPDATE`/`DELETE` issued directly
 * against `.drafts`) — call `next()` to continue the chain.
 * Registers `srv.on('*', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@OnAll` — same wildcard, scoped to `<Entity>.drafts` instead of the active
 * entity. Meaningful ONLY on a normal, entity-scoped `@EntityHandler` host: there it does NOT see
 * `@OnEditDraft` / `@OnSaveDraft`, which register against the ACTIVE entity (`EDIT`/`SAVE` are not
 * `.drafts` events) — use `@OnAll` for those. On an `@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)` host,
 * `@OnAll` ALREADY registers `srv.on('*', '*', callback)` — CAP drops the path filter entirely for `'*'`,
 * so drafts of every entity are included there too, and adding this decorator only double-fires every
 * draft event.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnAllDraft()
 *   private async onAnyDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onall | CDS-TS-Dispatcher - @OnAllDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnAll
 */
const OnAllDraft = buildOnCRUD({ event: '*', eventKind: 'ON', isDraft: true });

/**
 * Replaces the default CREATE implementation of the host entity — call `next()` to fall back to CAP's
 * generic database implementation (or the next registered `ON` handler).
 * Registers `srv.on('CREATE', <Entity>, callback)`.
 *
 * @remarks
 * Unlike `@BeforeCreate` (validation before the write) or `@AfterCreate` (post-processing after it), this
 * REPLACES the write itself — without `return next()` (or your own persistence call), nothing is ever
 * written. Fires alongside `@OnAll`, if also present. Draft variant: `@OnCreateDraft` (a literal `CREATE`
 * issued directly against `<Entity>.drafts` — NOT the Fiori Elements "New" action, which is
 * `@OnNewDraft`).
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnCreate()
 *   private async onCreate(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Book> {
 *     // ... custom persistence, or:
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncreate | CDS-TS-Dispatcher - @OnCreate}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnCreate
 */
const OnCreate = buildOnCRUD({ event: 'CREATE', eventKind: 'ON', isDraft: false });

/**
 * Replaces the default implementation of a `CREATE` request applied directly against the host entity's
 * `.drafts` table — call `next()` to fall back to CAP's generic implementation.
 * Registers `srv.on('CREATE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * NOT the Fiori Elements "New" draft action — a protocol-borne (HTTP/OData) `POST` against a
 * draft-enabled entity is itself rewritten to CAP's `NEW` event (handled by `@OnNewDraft`) unless the
 * payload explicitly sets `IsActiveEntity: true`. `@OnCreateDraft` only fires for a literal `CREATE`
 * issued WITHOUT a protocol straight at `<Entity>.drafts` — a programmatic `INSERT.into(<Entity>.drafts)`
 * or `srv.send('CREATE', <Entity>.drafts, ...)`. Active-entity counterpart: `@OnCreate`. README has no
 * dedicated `@OnCreateDraft` section; the closest coverage is `@OnCreate`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnCreateDraft()
 *   private async onCreateDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Book> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncreate | CDS-TS-Dispatcher - @OnCreateDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnCreate
 */
const OnCreateDraft = buildOnCRUD({ event: 'CREATE', eventKind: 'ON', isDraft: true });

/**
 * Replaces the default READ implementation of the host entity — call `next()` to fall back to CAP's
 * generic database implementation (or the next registered `ON` handler).
 * Registers `srv.on('READ', <Entity>, callback)`.
 *
 * @remarks
 * Unlike `@AfterRead` (post-processes the array CAP already fetched), `@OnRead` REPLACES the fetch itself
 * — without `return next()` (or your own query), nothing is ever read. Fires for both the entity-set and
 * single-instance shapes — pair with `@SingleInstanceSwitch` to tell them apart. Draft variant:
 * `@OnReadDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnRead()
 *   private async onRead(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Book[]> {
 *     // ... custom fetch, or:
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onread | CDS-TS-Dispatcher - @OnRead}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnRead
 */
const OnRead = buildOnCRUD({ event: 'READ', eventKind: 'ON', isDraft: false });

/**
 * Replaces the default READ implementation on the host entity's `.drafts` table — call `next()` to fall
 * back to CAP's generic implementation.
 * Registers `srv.on('READ', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@OnRead` — same entity-set/single-instance shapes, scoped to
 * `<Entity>.drafts` (e.g. re-opening an in-progress draft in the Fiori Elements UI). README has no
 * dedicated `@OnReadDraft` section; the closest coverage is `@OnRead`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnReadDraft()
 *   private async onReadDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Book[]> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onread | CDS-TS-Dispatcher - @OnReadDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnRead
 */
const OnReadDraft = buildOnCRUD({ event: 'READ', eventKind: 'ON', isDraft: true });

/**
 * Replaces the default UPDATE implementation of the host entity — call `next()` to fall back to CAP's
 * generic database implementation (or the next registered `ON` handler).
 * Registers `srv.on('UPDATE', <Entity>, callback)`.
 *
 * @remarks
 * Unlike `@BeforeUpdate` (validation before the write) or `@AfterUpdate` (post-processing after it), this
 * REPLACES the write itself — without `return next()` (or your own persistence call), nothing is ever
 * written. Draft variant: `@OnUpdateDraft`; the more specific field-level draft edit is `@OnPatchDraft`
 * (`PATCH`, CAP's canonical alias of `UPDATE` on `.drafts` since `@sap/cds` 10).
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnUpdate()
 *   private async onUpdate(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Book> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onupdate | CDS-TS-Dispatcher - @OnUpdate}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnUpdate
 */
const OnUpdate = buildOnCRUD({ event: 'UPDATE', eventKind: 'ON', isDraft: false });

/**
 * Replaces the default implementation of an `UPDATE` request applied directly against the host entity's
 * `.drafts` table — call `next()` to fall back to CAP's generic implementation.
 * Registers `srv.on('UPDATE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `@OnPatchDraft` (`PATCH`) is CAP's canonical alias of this same `UPDATE` event on `.drafts` since
 * `@sap/cds` 10 — the field-level draft-edit moment a Fiori Elements user triggers by typing into a
 * field; prefer it for that scenario. Active-entity counterpart: `@OnUpdate`. README has no dedicated
 * `@OnUpdateDraft` section; the closest coverage is `@OnUpdate`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnUpdateDraft()
 *   private async onUpdateDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<Book> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onupdate | CDS-TS-Dispatcher - @OnUpdateDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnUpdate
 */
const OnUpdateDraft = buildOnCRUD({ event: 'UPDATE', eventKind: 'ON', isDraft: true });

/**
 * Replaces the default DELETE implementation of the host entity — call `next()` to fall back to CAP's
 * generic database implementation (or the next registered `ON` handler).
 * Registers `srv.on('DELETE', <Entity>, callback)`.
 *
 * @remarks
 * Unlike `@BeforeDelete` (last-chance authorization) or `@AfterDelete` (post-processing), this REPLACES
 * the deletion itself — without `return next()` (or your own persistence call), the row is never removed.
 * Draft variant: `@OnDeleteDraft`; abandoning an in-progress draft through the Fiori Elements UI is a
 * different event — `@OnDiscardDraft` / `@OnCancelDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnDelete()
 *   private async onDelete(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondelete | CDS-TS-Dispatcher - @OnDelete}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnDelete
 */
const OnDelete = buildOnCRUD({ event: 'DELETE', eventKind: 'ON', isDraft: false });

/**
 * Replaces the default implementation of a `DELETE` request applied directly against the host entity's
 * `.drafts` table — call `next()` to fall back to CAP's generic implementation.
 * Registers `srv.on('DELETE', <Entity>.drafts, callback)`.
 *
 * @remarks
 * A literal `DELETE` against `<Entity>.drafts`, distinct from abandoning a draft through the Fiori
 * Elements UI (`@OnDiscardDraft` / `@OnCancelDraft`). Active-entity counterpart: `@OnDelete`. README has
 * no dedicated `@OnDeleteDraft` section; the closest coverage is `@OnDelete`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnDeleteDraft()
 *   private async onDeleteDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondelete | CDS-TS-Dispatcher - @OnDeleteDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnDelete
 */
const OnDeleteDraft = buildOnCRUD({ event: 'DELETE', eventKind: 'ON', isDraft: true });

/**
 * Handles an unbound action — call `next()` to continue to the next registered handler, or return the
 * action's result directly.
 * Registers `srv.on(name, callback)`.
 *
 * @remarks
 * Conventionally hosted in an `@UnboundActions` class (service-wide, not entity-scoped). Sibling for
 * unbound functions: `@OnFunction`; bound counterpart: `@OnBoundAction`. Runs after `@BeforeAction`,
 * before `@AfterAction`, for the same action.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ActionsHandler {
 *   /@OnAction(SubmitOrder)
 *   private async onSubmitOrder(@Req() req: ActionRequest<typeof SubmitOrder>, @Next() next: NextEvent): ActionReturn<typeof SubmitOrder> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onaction | CDS-TS-Dispatcher - @OnAction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnAction
 */
const OnAction = buildAction({ event: 'ACTION', eventKind: 'ON', isDraft: false });

/**
 * Handles a bound action on a specific instance of the host entity — call `next()` to continue, or
 * return the action's result directly.
 * Registers `srv.on(name, <Entity>, callback)`.
 *
 * @remarks
 * Must be hosted in an `@EntityHandler` class — the registration needs that class's resolved entity;
 * hosting it elsewhere leaves the entity argument `undefined`. Sibling for bound functions:
 * `@OnBoundFunction`; unbound counterpart: `@OnAction`. Draft variant: `@OnBoundActionDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnBoundAction(Book.actions.approve)
 *   private async onApprove(@Req() req: ActionRequest<typeof Book.actions.approve>, @Next() next: NextEvent): ActionReturn<typeof Book.actions.approve> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction | CDS-TS-Dispatcher - @OnBoundAction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnBoundAction
 */
const OnBoundAction = buildAction({ event: 'BOUND_ACTION', eventKind: 'ON', isDraft: false });

/**
 * Handles a bound action on a specific DRAFT instance of the host entity — call `next()` to continue, or
 * return the action's result directly.
 * Registers `srv.on(name, <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@OnBoundAction` — same bound-action shape, scoped to `<Entity>.drafts`. Must
 * be hosted in an `@EntityHandler` class. README has no dedicated `@OnBoundActionDraft` section; the
 * closest coverage is `@OnBoundAction`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnBoundActionDraft(Book.actions.approve)
 *   private async onApproveDraft(@Req() req: ActionRequest<typeof Book.actions.approve>, @Next() next: NextEvent): ActionReturn<typeof Book.actions.approve> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction | CDS-TS-Dispatcher - @OnBoundActionDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnBoundAction
 */
const OnBoundActionDraft = buildAction({ event: 'BOUND_ACTION', eventKind: 'ON', isDraft: true });

/**
 * Handles a bound function on a specific instance of the host entity — call `next()` to continue, or
 * return the function's result directly.
 * Registers `srv.on(name, <Entity>, callback)`.
 *
 * @remarks
 * Must be hosted in an `@EntityHandler` class — the registration needs that class's resolved entity;
 * hosting it elsewhere leaves the entity argument `undefined`. Sibling for bound actions:
 * `@OnBoundAction`; unbound counterpart: `@OnFunction`. Draft variant: `@OnBoundFunctionDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnBoundFunction(Book.actions.someFunction)
 *   private async onSomeFunction(@Req() req: ActionRequest<typeof Book.actions.someFunction>, @Next() next: NextEvent): ActionReturn<typeof Book.actions.someFunction> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction | CDS-TS-Dispatcher - @OnBoundFunction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnBoundFunction
 */
const OnBoundFunction = buildAction({ event: 'BOUND_FUNC', eventKind: 'ON', isDraft: false });

/**
 * Handles a bound function on a specific DRAFT instance of the host entity — call `next()` to continue,
 * or return the function's result directly.
 * Registers `srv.on(name, <Entity>.drafts, callback)`.
 *
 * @remarks
 * The draft counterpart of `@OnBoundFunction` — same bound-function shape, scoped to `<Entity>.drafts`.
 * Must be hosted in an `@EntityHandler` class. README has no dedicated `@OnBoundFunctionDraft` section;
 * the closest coverage is `@OnBoundFunction`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnBoundFunctionDraft(Book.actions.someFunction)
 *   private async onSomeFunctionDraft(@Req() req: ActionRequest<typeof Book.actions.someFunction>, @Next() next: NextEvent): ActionReturn<typeof Book.actions.someFunction> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction | CDS-TS-Dispatcher - @OnBoundFunctionDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnBoundFunction
 */
const OnBoundFunctionDraft = buildAction({ event: 'BOUND_FUNC', eventKind: 'ON', isDraft: true });

/**
 * Handles an unbound function — call `next()` to continue to the next registered handler, or return the
 * function's result directly.
 * Registers `srv.on(name, callback)`.
 *
 * @remarks
 * Conventionally hosted in an `@UnboundActions` class (service-wide, not entity-scoped). Sibling for
 * unbound actions: `@OnAction`; bound counterpart: `@OnBoundFunction`.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ActionsHandler {
 *   /@OnFunction(GetTopSellers)
 *   private async onGetTopSellers(@Req() req: ActionRequest<typeof GetTopSellers>, @Next() next: NextEvent): ActionReturn<typeof GetTopSellers> {
 *     // ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onfunction | CDS-TS-Dispatcher - @OnFunction}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnFunction
 */
const OnFunction = buildAction({ event: 'FUNC', eventKind: 'ON', isDraft: false });

/**
 * Handles a custom CDS event emitted in-process on the SAME service (`srv.emit(...)` / `this.emit(...)`).
 * Registers `srv.on(name, callback)` — `name` has everything before its LAST dot stripped first (a
 * `@cds-model` event's fully-qualified name like `'CatalogService.SendData'` registers as `'SendData'`).
 *
 * @remarks
 * For emitter and receiver in the same Node process but on DIFFERENT services, or over an external
 * message broker, use `@OnSubscribe` instead — `@OnEvent(name)` is exactly `@OnSubscribe({ eventName:
 * name, type: 'SAME_NODE_PROCESS' })`. Conventionally hosted in an `@UnboundActions` class (service-wide,
 * not entity-scoped) — excluded from `@OnAll` / `@BeforeAll` / `@AfterAll` firing, since it is not
 * entity-scoped. The websocket decorators (`@OnWebSocketConnect`, `@OnWebSocketDisconnect`,
 * `@OnWebSocketMessage`) are sugar built on top of this one.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class CatalogEventsHandler {
 *   /@OnEvent(SendData)
 *   private async onSendData(@Req() req: Request<SendData>): Promise<void> {
 *     // req.data.foo, req.data.bar, req.headers, ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onevent | CDS-TS-Dispatcher - @OnEvent}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnEvent
 */
const OnEvent = buildOnEvent({ event: 'EVENT', eventKind: 'ON', isDraft: false });

/**
 * Handles an incoming websocket operation/event by name, over the `@cap-js-community/websocket` plugin.
 * Registers `srv.on(name, callback)` — pure sugar for `@OnEvent(name)`.
 *
 * @remarks
 * Requires the websocket plugin (an OPTIONAL peer the consumer app installs separately) and a
 * `@protocol: 'websocket'` (or `@ws`) service whose impl hosts this `@UnboundActions` class — there is no
 * dedicated websocket host class, a websocket service impl is a regular CAP service impl. `name` is
 * matched against the `event` field of the wire payload (`{"event":"<name>","data":{...}}`); like
 * `@OnEvent`, everything before the LAST dot is stripped at registration time
 * (`'ChatService.sendMessage'` registers as `'sendMessage'`), so pass the plain operation name. Siblings
 * for the fixed connect/disconnect events: `@OnWebSocketConnect`, `@OnWebSocketDisconnect`. Observed on
 * plugin `1.11.x`/kind `'ws'`: the handler's return value is NOT echoed back as a reply frame — use
 * `srv.emit(...)` / `srv.broadcast(...)` if the client needs a message back.
 *
 * @example
 * ```ts
 * /@UnboundActions() // bound as ChatService's impl via CDSDispatcher
 * class ChatHandler {
 *   /@OnWebSocketMessage('sendMessage')
 *   private async onMessage(@Req() req: Request<{ text: string }>): Promise<string> {
 *     return req.data.text;
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onwebsocketmessage | CDS-TS-Dispatcher - @OnWebSocketMessage}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnWebSocketMessage
 */
const OnWebSocketMessage = (name: string) => OnEvent(name);

/**
 * Fires when a websocket client connects, over the `@cap-js-community/websocket` plugin.
 * Registers `srv.on('wsConnect', callback)` — pure sugar for `@OnEvent('wsConnect')`.
 *
 * @remarks
 * The service must model `action wsConnect();` — the plugin's adapter only calls MODELED operations, it
 * does not synthesize a connect event for services that omit it. Hosted the same way as
 * `@OnWebSocketMessage` / `@OnWebSocketDisconnect`, in an `@UnboundActions` class bound to the
 * websocket-protocol service.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ChatHandler {
 *   /@OnWebSocketConnect()
 *   private async onConnect(@Req() req: Request): Promise<void> {
 *     console.log('[Chat] connect');
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onwebsocketconnect | CDS-TS-Dispatcher - @OnWebSocketConnect}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnWebSocketConnect
 */
const OnWebSocketConnect = () => OnEvent('wsConnect');

/**
 * Fires when a websocket client disconnects, over the `@cap-js-community/websocket` plugin.
 * Registers `srv.on('wsDisconnect', callback)` — pure sugar for `@OnEvent('wsDisconnect')`.
 *
 * @remarks
 * Model `action wsDisconnect(reason: String);` to receive a disconnect detail in `req.data.reason` — the
 * plugin's adapter only calls MODELED operations. Under the plugin's default `kind: 'ws'` the delivered
 * value is the socket CLOSE CODE as a string (e.g. `'1000'`, `'1005'`), NOT a reason phrase — raw `ws`
 * passes `(code, reason)` and the plugin forwards only the first argument. Siblings:
 * `@OnWebSocketConnect`, `@OnWebSocketMessage`.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ChatHandler {
 *   /@OnWebSocketDisconnect()
 *   private async onDisconnect(@Req() req: Request<{ reason?: string }>): Promise<void> {
 *     console.log(`[Chat] disconnect ${req.data?.reason ?? ''}`);
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onwebsocketdisconnect | CDS-TS-Dispatcher - @OnWebSocketDisconnect}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnWebSocketDisconnect
 */
const OnWebSocketDisconnect = () => OnEvent('wsDisconnect');

/**
 * Handles a custom messaging event (event bus / publish-subscribe), in-process or over an external
 * broker.
 * Registers `eventSource.on(eventName, callback)` where `eventSource` depends on `options.type`: the
 * host service itself for `'SAME_NODE_PROCESS'`, `cds.connect.to(options.externalServiceName)` for
 * `'SAME_NODE_PROCESS_DIFFERENT_SERVICE'`, or `cds.connect.to('messaging')` for `'MESSAGE_BROKER'`.
 *
 * @remarks
 * `options.eventName` matches everything after its LAST dot only (same stripping as `@OnEvent`).
 * `'SAME_NODE_PROCESS'` is exactly what `@OnEvent(eventName)` does — reach for that shorthand when
 * emitter and receiver share the same service. `options.showReceiverMessage` (default `false`) plus
 * `options.consoleStyle` (`'table'` | `'debug'`, default `'debug'`) log inbound payloads for debugging.
 * Conventionally hosted in an `@UnboundActions` class, though an `@EntityHandler` class works too.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class CatalogEventsHandler {
 *   /@OnSubscribe({ eventName: SendData, type: 'SAME_NODE_PROCESS' })
 *   private async onSendData(@Req() req: Request<SendData>): Promise<void> {
 *     // req.data.foo, req.data.bar, req.headers, ...
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onsubscribe | CDS-TS-Dispatcher - @OnSubscribe}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnSubscribe
 */
const OnSubscribe = buildOnMessagingEvent({ event: 'MESSAGING_EVENT', eventKind: 'ON', isDraft: false });

/**
 * Registers a custom error handler, invoked whenever an error occurs during event processing of any
 * request, to augment or replace the error before it reaches the client.
 * Registers `srv.on('error', callback)`.
 *
 * @remarks
 * MUST be a `sync` function — no `await`, no returned `Promise`; CAP invokes error handlers
 * SYNCHRONOUSLY while the transaction unwinds. Consequently `@Diff` (the only asynchronous parameter
 * decorator) and `@Throttle` are both REJECTED here — the dispatcher throws at decoration time if either
 * is stacked on an `@OnError` handler. Mutate the injected `@Error` (or `@Req`) synchronously instead
 * (`err.message = '...'`); do any async work (logging, notifications) fire-and-forget, uncoupled from the
 * handler's own return. Conventionally hosted in an `@UnboundActions` class (service-wide, not
 * entity-scoped) — excluded from `@OnAll` / `@BeforeAll` / `@AfterAll` firing.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ErrorHandler {
 *   /@OnError()
 *   private onError(@Error() err: Error, @Req() req: Request): void {
 *     err.message = 'New message';
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onerror | CDS-TS-Dispatcher - @OnError}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnError
 */
const OnError = buildOnError({ eventKind: 'ON', isDraft: false });

/**
 * Replaces the default implementation for creating a new draft FROM an existing active instance (the
 * Fiori Elements "Edit" action) — call `next()` to fall back to CAP's generic implementation.
 * Registers `srv.on('EDIT', <Entity>, callback)` — against the ACTIVE entity, NOT `.drafts`.
 *
 * @remarks
 * Despite the "Draft" in its name this registers on the active entity: `EDIT` is the moment a user
 * starts editing an already-saved instance (as opposed to `@OnNewDraft`, which starts a brand-new one).
 * Pairs with `@BeforeEditDraft` / `@AfterEditDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnEditDraft()
 *   private async onEditDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oneditdraft | CDS-TS-Dispatcher - @OnEditDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnEditDraft
 */
const OnEditDraft = buildOnCRUD({ event: 'EDIT', eventKind: 'ON', isDraft: false });

/**
 * Replaces the default implementation for activating a draft — writing it back to the active entity (the
 * Fiori Elements "Save" action) — call `next()` to fall back to CAP's generic implementation.
 * Registers `srv.on('SAVE', <Entity>, callback)` — against the ACTIVE entity, NOT `.drafts`.
 *
 * @remarks
 * Despite the "Draft" in its name this registers on the active entity, mirroring `@BeforeSaveDraft` /
 * `@AfterSaveDraft`. CAP expands a `SAVE` registration into `[CREATE, UPSERT, UPDATE]` on the given path;
 * the "only during draft-activation" gate CAP applies to that expansion is keyed on the path ending in
 * `.drafts` — since this decorator's path is the ACTIVE entity, the gate never applies, so the handler
 * ALSO runs for ordinary direct writes on the active entity, not only for genuine draft activation.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnSaveDraft()
 *   private async onSaveDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onsavedraft | CDS-TS-Dispatcher - @OnSaveDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnSaveDraft
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
 * Replaces the default implementation for creating a new draft (the Fiori Elements "New" action) — call
 * `next()` to fall back to CAP's generic implementation.
 * Registers `srv.on('NEW', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The event a real, protocol-borne (HTTP/OData) "New" request actually dispatches as — CAP rewrites a
 * `POST` against a draft-enabled entity from `CREATE` to `NEW` unless the payload explicitly sets
 * `IsActiveEntity: true`. A literal, protocol-less `CREATE` straight against `.drafts` is the separate,
 * narrower `@OnCreateDraft`. Pairs with `@BeforeNewDraft` / `@AfterNewDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnNewDraft()
 *   private async onNewDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onnewdraft | CDS-TS-Dispatcher - @OnNewDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnNewDraft
 */
const OnNewDraft = buildOnCRUD({ event: 'NEW', eventKind: 'ON', isDraft: true });

/**
 * Replaces the default implementation for cancelling an in-progress draft — call `next()` to fall back to
 * CAP's generic implementation.
 * Registers `srv.on('CANCEL', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `@OnDiscardDraft` (`DISCARD`) is CAP's canonical alias of this same `CANCEL` event on `.drafts` since
 * `@sap/cds` 10 — the same draft-abandon moment under a different, newer event name. Pairs with
 * `@BeforeCancelDraft` / `@AfterCancelDraft`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnCancelDraft()
 *   private async onCancelDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next();
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncanceldraft | CDS-TS-Dispatcher - @OnCancelDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnCancelDraft
 */
const OnCancelDraft = buildOnCRUD({ event: 'CANCEL', eventKind: 'ON', isDraft: true });

/**
 * Executes custom logic before a new draft is created (the Fiori Elements "New" action).
 * Registers `srv.before('NEW', <Entity>.drafts, callback)`.
 *
 * @remarks
 * The event a real, protocol-borne (HTTP/OData) "New" request actually dispatches as — CAP rewrites a
 * `POST` against a draft-enabled entity from `CREATE` to `NEW` unless the payload explicitly sets
 * `IsActiveEntity: true`. A literal, protocol-less `CREATE` straight against `.drafts` (e.g. a
 * programmatic `INSERT`/`srv.send`) is the separate, narrower `@BeforeCreateDraft`. Pairs with
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
 * `@OnSaveDraft`. CAP expands a `SAVE` registration into `[CREATE, UPSERT, UPDATE]` on the given path;
 * the "only during draft-activation" gate CAP applies to that expansion is keyed on the path ending in
 * `.drafts` — since this decorator's path is the ACTIVE entity, the gate never applies, so the handler
 * ALSO runs for ordinary direct writes on the active entity (e.g. a `@sap/cds` 10 `PATCH
 * ...IsActiveEntity=true` under `cds.fiori.bypass_draft`), not only for genuine draft activation.
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
 * The event a real, protocol-borne (HTTP/OData) "New" request actually dispatches as — CAP rewrites a
 * `POST` against a draft-enabled entity from `CREATE` to `NEW` unless the payload explicitly sets
 * `IsActiveEntity: true`. A literal, protocol-less `CREATE` straight against `.drafts` is the separate,
 * narrower `@AfterCreateDraft`. Pairs with `@BeforeNewDraft` / `@OnNewDraft`.
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
 * `@Result` receives the now-active entity data. Pairs with `@OnSaveDraft`. CAP expands a `SAVE`
 * registration into `[CREATE, UPSERT, UPDATE]` on the given path; the "only during draft-activation" gate
 * CAP applies to that expansion is keyed on the path ending in `.drafts` — since this decorator's path is
 * the ACTIVE entity, the gate never applies, so the handler ALSO runs for ordinary direct writes on the
 * active entity (e.g. a `@sap/cds` 10 `PATCH ...IsActiveEntity=true` under `cds.fiori.bypass_draft`), not
 * only for genuine draft activation.
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
 * Replaces the default implementation for changing a field of an in-progress draft — call `next()` to
 * fall back to CAP's generic implementation.
 * Registers `srv.on('PATCH', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `PATCH` is CAP's canonical field-level draft-edit event — an alias of `UPDATE` on `.drafts` since
 * `@sap/cds` 10 — fired every time a Fiori Elements user changes a field of an in-progress draft.
 * `@OnUpdateDraft` (`UPDATE`) is the same moment under the older event name.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnPatchDraft()
 *   private async onPatchDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next(); // preserve the default draft PATCH behavior
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onpatchdraft | CDS-TS-Dispatcher - @OnPatchDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnPatchDraft
 */
const OnPatchDraft = buildOnCRUD({ event: 'PATCH', eventKind: 'ON', isDraft: true });

/**
 * Replaces the default implementation for discarding an in-progress draft — call `next()` to fall back to
 * CAP's generic implementation.
 * Registers `srv.on('DISCARD', <Entity>.drafts, callback)`.
 *
 * @remarks
 * `DISCARD` is CAP's canonical alias of `CANCEL` on `.drafts` since `@sap/cds` 10. `@OnCancelDraft`
 * (`CANCEL`) is the same moment under the older event name.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnDiscardDraft()
 *   private async onDiscardDraft(@Req() req: Request<Book>, @Next() next: NextEvent): Promise<unknown> {
 *     return next(); // preserve the default draft DISCARD behavior
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondiscarddraft | CDS-TS-Dispatcher - @OnDiscardDraft}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnDiscardDraft
 */
const OnDiscardDraft = buildOnCRUD({ event: 'DISCARD', eventKind: 'ON', isDraft: true });

/**
 * ####################################################################################################################
 * Start `Request lifecycle` methods
 * ####################################################################################################################
 */

/**
 * Executes custom logic INSIDE the transaction, immediately before commit, after all other handlers of
 * the request (including handlers of other services touched by the same request) have run — throwing
 * here VETOES the commit and the error is returned to the client.
 * Registers via the request's root event context — `req.context.before('commit', callback)` — attached
 * once per root request through a `srv.prepend`-installed `srv.before('*', ...)` hook.
 *
 * @remarks
 * Runs `once` per ROOT request (once per OData `$batch` changeset). Hosted in an `@EntityHandler` class
 * it is scoped to requests targeting that entity; hosted in an `@UnboundActions` class it applies to
 * every request of the service. The injected `req` is the FIRST sub-request of the root request that
 * reached this hook — validate PER OPERATION in `@BeforeCreate` & co, and keep `@BeforeCommit` for
 * CROSS-REQUEST / final-state invariants that need to read the current database state. Registers on the
 * ACTIVE entity only — for `@odata.draft.enabled` entities the draft-editing roundtrip
 * (`NEW`/`PATCH`/`CANCEL` on `.drafts`) does NOT fire it, only draft ACTIVATION (`CREATE`/`UPDATE` on the
 * active entity) does. Across multiple handler classes, `@BeforeCommit` callbacks run in
 * `CDSDispatcher([...])` array order (see `@AfterCommit` / `@AfterRollback` / `@OnRequestDone` for the
 * reverse-order siblings).
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@BeforeCommit()
 *   private async beforeCommit(@Req() req: Request<Book>): Promise<void> {
 *     const invariantViolated = false; // ... e.g. a cross-entity stock check
 *     if (invariantViolated) {
 *       throw new Error('Total stock must stay non-negative'); // vetoes the commit
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecommit | CDS-TS-Dispatcher - @BeforeCommit}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § BeforeCommit
 */
const BeforeCommit = buildRequestLifecycle({ event: 'BEFORE_COMMIT' });

/**
 * Executes custom logic only AFTER the transaction of the current request was durably committed, OUTSIDE
 * any transaction — errors CANNOT veto anything anymore, they are caught and logged by the dispatcher.
 * Registers via the request's root event context — `req.context.on('succeeded', callback)` — attached
 * once per root request through a `srv.prepend`-installed `srv.before('*', ...)` hook.
 *
 * @remarks
 * Runs `once` per ROOT request (once per OData `$batch` changeset). Hosted in an `@EntityHandler` class
 * it is scoped to requests targeting that entity; hosted in an `@UnboundActions` class it applies to
 * every request of the service. The request's transaction is already CLOSED by the time this handler
 * runs — a plain query fails; open a NEW transaction with `await cds.tx(async () => { ... })` for any
 * database work. Registers on the ACTIVE entity only — for `@odata.draft.enabled` entities the
 * draft-editing roundtrip does NOT fire it, only draft ACTIVATION does. Across multiple handler classes,
 * `@AfterCommit` callbacks run in REVERSE `CDSDispatcher([...])` array order (`@BeforeCommit` runs in
 * forward order). Sibling for a failed transaction: `@AfterRollback`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterCommit()
 *   private async afterCommit(@Req() req: Request<Book>): Promise<void> {
 *     await cds.tx(async () => {
 *       // ... e.g. send a confirmation e-mail, invalidate a cache
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercommit | CDS-TS-Dispatcher - @AfterCommit}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterCommit
 */
const AfterCommit = buildRequestLifecycle({ event: 'AFTER_COMMIT' });

/**
 * Executes custom logic AFTER the transaction of the current request was rolled back, OUTSIDE any
 * transaction — errors CANNOT veto anything anymore, they are caught and logged by the dispatcher.
 * Registers via the request's root event context — `req.context.on('failed', callback)` — attached once
 * per root request through a `srv.prepend`-installed `srv.before('*', ...)` hook.
 *
 * @remarks
 * Runs `once` per ROOT request (once per OData `$batch` changeset). Hosted in an `@EntityHandler` class
 * it is scoped to requests targeting that entity; hosted in an `@UnboundActions` class it applies to
 * every request of the service. The request's transaction is already CLOSED (rolled back) by the time
 * this handler runs — a plain query fails; open a NEW transaction with `await cds.tx(async () => { ...
 * })` for any database work. Registers on the ACTIVE entity only — for `@odata.draft.enabled` entities
 * the draft-editing roundtrip does NOT fire it, only draft ACTIVATION does. Across multiple handler
 * classes, `@AfterRollback` callbacks run in REVERSE `CDSDispatcher([...])` array order (`@BeforeCommit`
 * runs in forward order). Sibling for a successful transaction: `@AfterCommit`.
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@AfterRollback()
 *   private async afterRollback(@Req() req: Request<Book>): Promise<void> {
 *     await cds.tx(async () => {
 *       // ... e.g. release a reservation in a remote system, alert on the failure
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterrollback | CDS-TS-Dispatcher - @AfterRollback}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § AfterRollback
 */
const AfterRollback = buildRequestLifecycle({ event: 'AFTER_ROLLBACK' });

/**
 * Executes custom logic when the current request is done, no matter if it succeeded or failed —
 * `finally` semantics — OUTSIDE any transaction; errors CANNOT veto anything anymore, they are caught and
 * logged by the dispatcher.
 * Registers via the request's root event context — `req.context.on('done', callback)` — attached once
 * per root request through a `srv.prepend`-installed `srv.before('*', ...)` hook.
 *
 * @remarks
 * Runs `once` per ROOT request (once per OData `$batch` changeset). Hosted in an `@EntityHandler` class
 * it is scoped to requests targeting that entity; hosted in an `@UnboundActions` class it applies to
 * every request of the service. The request's transaction is already CLOSED by the time this handler
 * runs — a plain query fails; open a NEW transaction with `await cds.tx(async () => { ... })` for any
 * database work. Registers on the ACTIVE entity only — for `@odata.draft.enabled` entities the
 * draft-editing roundtrip does NOT fire it, only draft ACTIVATION does. Across multiple handler classes,
 * `@OnRequestDone` callbacks run in REVERSE `CDSDispatcher([...])` array order (`@BeforeCommit` runs in
 * forward order).
 *
 * @example
 * ```ts
 * /@EntityHandler(Book)
 * class BookHandler {
 *   /@OnRequestDone()
 *   private async requestDone(@Req() req: Request<Book>): Promise<void> {
 *     await cds.tx(async () => {
 *       // ... e.g. release a lock, stop a timer, emit duration metrics
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onrequestdone | CDS-TS-Dispatcher - @OnRequestDone}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnRequestDone
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
 * Executes custom logic once, right before the CAP server starts listening for requests. The handler
 * receives `cds.services` (the bootstrapped services) as its only argument.
 * Registers `cds.on('served', callback)`.
 *
 * @remarks
 * Must be hosted in a `@ServerLifecycle` class. CAP `await`s every `@OnServed` handler SEQUENTIALLY — in
 * declaration order inside a class, and in `CDSDispatcher` array order across classes — before
 * `app.listen` runs; a thrown error fails server startup. Registers ONCE PER PROCESS: no matter how many
 * `CDSDispatcher` instances (or bootstraps, e.g. in tests) list the class, only the first one's resolved
 * instance stays bound. Unlike every other method decorator in this library, no `@Req()`-style parameter
 * decorator applies here — the callback receives CAP's native arguments verbatim. Siblings:
 * `@OnListening`, `@OnShutdown`.
 *
 * @example
 * ```ts
 * /@ServerLifecycle()
 * export class Bootstrap {
 *   /@OnServed()
 *   public async seed(services: object): Promise<void> {
 *     // ... one-time startup work, may throw to abort the boot
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onserved | CDS-TS-Dispatcher - @OnServed}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnServed
 */
const OnServed = buildServerLifecycle({ event: 'SERVED' });

/**
 * Executes custom logic once the CAP server is listening for requests. The handler receives `{ server,
 * url }`.
 * Registers `cds.on('listening', callback)`.
 *
 * @remarks
 * Must be hosted in a `@ServerLifecycle` class. CAP dispatches `@OnListening` SYNCHRONOUSLY — any return
 * value (including a `Promise`) is DISCARDED, so treat the handler as fire-and-forget. Unlike every other
 * method decorator in this library, no `@Req()`-style parameter decorator applies here — the callback
 * receives CAP's native arguments verbatim. Siblings: `@OnServed`, `@OnShutdown`.
 *
 * @example
 * ```ts
 * /@ServerLifecycle()
 * export class Bootstrap {
 *   /@OnListening()
 *   public logUrl(payload: { server: unknown; url: string }): void {
 *     console.log(`Listening on ${payload.url}`);
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onlistening | CDS-TS-Dispatcher - @OnListening}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnListening
 */
const OnListening = buildServerLifecycle({ event: 'LISTENING' });

/**
 * Executes custom logic while the CAP server is shutting down. The handler receives `err: Error | null`.
 * Registers `cds.on('shutdown', callback)`.
 *
 * @remarks
 * Must be hosted in a `@ServerLifecycle` class. CAP runs ALL `@OnShutdown` handlers (of every class) IN
 * PARALLEL and awaits them before the server closes. CAP has NO once-guard on `shutdown` — unlike
 * `served`/`listening`, this callback MAY FIRE MORE THAN ONCE per process; make the handler idempotent.
 * Catch your own errors: a REJECTED `@OnShutdown` handler propagates out of CAP's shutdown dispatch, so
 * `server.close` (and the force-exit fallback timer) never run — the process stays alive with an
 * unhandled rejection instead of shutting down. Unlike every other method decorator in this library, no
 * `@Req()`-style parameter decorator applies here — the callback receives CAP's native arguments
 * verbatim. Siblings: `@OnServed`, `@OnListening`.
 *
 * @example
 * ```ts
 * /@ServerLifecycle()
 * export class Bootstrap {
 *   /@OnShutdown()
 *   public async cleanup(error: Error | null): Promise<void> {
 *     // ... release resources, may run more than once
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onshutdown | CDS-TS-Dispatcher - @OnShutdown}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnShutdown
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
 * Handles a `@sap/cds` 10 event-queue scheduled task by name — a normal `ON` handler on the (queued) app
 * service; read the task payload off `req.data`.
 * Registers `srv.on(name, callback)` — `name` is registered VERBATIM, dots are NOT stripped, so
 * fully-qualified task names like `'my.namespace.Task'` match exactly.
 *
 * @remarks
 * `@OnScheduled` only HANDLES the task; to also SCHEDULE it recurrently at bootstrap use `@Schedule`
 * instead (which does everything `@OnScheduled` does, plus the scheduling call).
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ScheduledTasksHandler {
 *   /@OnScheduled('my.namespace.reindexCatalog')
 *   public async reindex(@Req() req: Request): Promise<void> {
 *     // req.data holds the task payload
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onscheduled | CDS-TS-Dispatcher - @OnScheduled}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnScheduled
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
 * Handles AND recurrently schedules a `@sap/cds` 10 event-queue task — everything `@OnScheduled` does,
 * plus scheduling it as a recurring task at bootstrap.
 * Registers `srv.on(options.name, callback)` (verbatim, like `@OnScheduled`) AND, at bootstrap,
 * `srv.schedule(options.name, options.data).every(options.every).as(options.name)`.
 *
 * @remarks
 * `.every().as(name)` makes the task a NAMED SINGLETON, so re-scheduling on every boot UPSERTS rather
 * than duplicates it. `options.every` accepts an interval string (e.g. `'10m'`) or a `cron` expression,
 * passed through verbatim (CAP's `ms4`/`cron` parse it). If the scheduling infrastructure (`db` + `queue`)
 * is missing or misconfigured, scheduling fails LOUDLY in the logs but never crashes boot — the task
 * handler stays registered. One-shot scheduling (`.after`) is intentionally NOT a decorator — inject
 * `CDS_DISPATCHER.SRV` and call `srv.schedule(name, data).after(delay).as(name)` programmatically instead.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ScheduledTasksHandler {
 *   /@Schedule({ name: 'cleanupExpiredCarts', every: '2m' })
 *   public async cleanup(@Req() req: Request): Promise<void> {
 *     // ... runs on the bootstrap-scheduled recurrence
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#schedule | CDS-TS-Dispatcher - @Schedule}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Schedule
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
 * Handles the SUCCESSFUL outcome of a `@sap/cds` 10 event-queue scheduled task — receives the `result`
 * returned by the task handler (`@OnScheduled` / `@Schedule`).
 * Registers `srv.after('<name>/#succeeded', callback)` — `name` is registered VERBATIM (dots are NOT
 * stripped), so fully-qualified task names like `'my.namespace.Task'` match exactly.
 *
 * @remarks
 * Bypasses the normal `@After*` `.affected` normalization (which would corrupt a numeric task result,
 * e.g. turning `1` into `true`) — the task's `result` reaches `@Result` untouched. Sibling for the failed
 * outcome: `@OnScheduledFailure`.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ScheduledTasksHandler {
 *   /@OnScheduledSuccess('cleanupExpiredCarts')
 *   public async succeeded(@Result() result: unknown, @Req() req: Request): Promise<void> {
 *     // ... e.g. kick off follow-up work now that the task ran through
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onscheduledsuccess | CDS-TS-Dispatcher - @OnScheduledSuccess}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnScheduledSuccess
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
 * Handles the FAILED outcome of a `@sap/cds` 10 event-queue scheduled task, once its retries are
 * exhausted.
 * Registers `srv.after('<name>/#failed', callback)` — `name` is registered VERBATIM (dots are NOT
 * stripped), so fully-qualified task names like `'my.namespace.Task'` match exactly.
 *
 * @remarks
 * Only fires once the task's retries are EXHAUSTED (event-queue `maxAttempts`, `10` by default) — not on
 * every failed attempt. The failure is delivered as a SERIALIZED PLAIN OBJECT (`{ name, message, stack,
 * code, ... }`), NOT an `Error` instance — CAP serializes it into the queued callback task, so it
 * survives a JSON round-trip. Pick it up with `@Result`; `@Error` will NOT populate here, as it only
 * matches real `Error` instances. Sibling for the successful outcome: `@OnScheduledSuccess`.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class ScheduledTasksHandler {
 *   /@OnScheduledFailure('cleanupExpiredCarts')
 *   public async failed(@Result() failure: { message?: string }, @Req() req: Request): Promise<void> {
 *     // ... e.g. alert ops
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onscheduledfailure | CDS-TS-Dispatcher - @OnScheduledFailure}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § OnScheduledFailure
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
 * Pipes a `Readable` return value straight to the HTTP response, from an `ON` handler (`@OnRead`,
 * `@OnFunction`, `@OnBoundFunction`).
 *
 * @remarks
 * If the wrapped method resolves to a `Readable` (an object exposing a `.pipe` function — e.g. from
 * `SELECT.pipeline()`, `SELECT.foreach()`, or `for-await` iteration over a `@sap/cds` 10 streaming read),
 * `@Stream` sets the response `Content-Type` (default `'application/octet-stream'`) and pipes it to the
 * express response, destroying the response if the stream errors; any NON-stream return value passes
 * through unchanged. `contentType` accepts the `StreamContentType` union (`'application/json'`,
 * `'text/csv'`, `'application/pdf'`, `'image/png'`, ...) for editor suggestions, or any other MIME type
 * string. Place `@Stream` DIRECTLY on the method, BELOW the `ON` decorator, so it wraps the returned value
 * — decorators wrap `descriptor.value` bottom-up, and a wrapper applied above the handler decorator never
 * becomes part of the registered callback.
 *
 * @example
 * ```ts
 * /@UnboundActions()
 * class BookHandler {
 *   /@OnFunction('streamBooks')
 *   /@Stream('application/json')
 *   public async streamBooks(@Req() req: Request): Promise<Readable> {
 *     const books = await SELECT.from('CatalogService.Books').columns('ID', 'title');
 *     return Readable.from([books.map((b) => JSON.stringify(b)).join('\n')]); // NDJSON
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#stream | CDS-TS-Dispatcher - @Stream}
 * Full docs ship with this package: node_modules/@dxfrontier/cds-ts-dispatcher/README.md § Stream
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
