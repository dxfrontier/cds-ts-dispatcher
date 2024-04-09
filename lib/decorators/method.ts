import 'reflect-metadata';

import constants from '../constants/constants';
import { ArgumentMethodProcessor } from '../core/ArgumentMethodProcessor';
import { MetadataDispatcher } from '../core/MetadataDispatcher';
import { HandlerType } from '../types/enum';
import formatterUtil from '../util/helpers/formatterUtil';
import middlewareUtil from '../util/helpers/middlewareUtil';
import validatorUtil from '../util/helpers/validatorUtil';
import util from '../util/util';

import type { QueryKeys, PickQueryPropsByKey, CustomRequest } from '../types/internalTypes';
import type { CdsEvent, CdsFunction, EVENTS, MiddlewareImpl, Request, RequestType } from '../types/types';

import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { Validators } from '../types/validator';
import type { Formatters } from '../types/formatter';
/**
 * Use `@FieldsFormatter` decorator to `enhance / format` the fields.
 *
 * @param formatter The formatter method to apply.
 * @param fields An array of fields to apply the formatter method on.
 * @example
 * // Enhance the 'title' field of Book entity by removing the letter 'W' using the 'blacklist' action.
 * "@FieldsFormatter<Book>({ action: 'blacklist', charsToRemove: 'W' }, 'title')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#fieldsformatter | CDS-TS-Dispatcher - @FieldsFormatter}
 */
function FieldsFormatter<T>(formatter: Formatters<T>, ...fields: Array<keyof T>) {
  return function <Target>(_: Target, __: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const results = formatterUtil.getResults<T>(args);
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
 *
 * @param validator The validation method to apply.
 * @param fields An array of fields to validate.
 * @example
 * // Validates the 'comment' field of 'MyEntity' entity using the 'contains' validator with the seed 'text'.
 * "@Validate<MyEntity>({ validator: 'contains', seed: 'text' }, 'comment')"
 * // If 'comment' contains 'text', the validation will not raise an error message.
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#validate | CDS-TS-Dispatcher - @Validate}
 */

function Validate<T>(validator: Validators, ...fields: Array<keyof T>) {
  return function <Target>(_: Target, __: string | symbol, descriptor: TypedPropertyDescriptor<RequestType>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);

      for (const field of fields) {
        const options: [Request, Validators, string] = [req, validator, field as string];

        if (validatorUtil.canValidate(...options)) {
          validatorUtil.applyValidator(...options);
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

function SingleInstanceCapable<Target extends Object>() {
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
 * Use `@SingleInstanceSwitch` to enable `switching` between `single instance` and `entity set` functionality in your method.
 *
 * @example
 * "@SingleInstanceSwitch() isSingleInstance: boolean"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#singleinstanceswitch | CDS-TS-Dispatcher - @SingleInstanceSwitch}
 */
function SingleInstanceSwitch() {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'SINGLE_INSTANCE_SWITCH',
      target,
      propertyKey,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Use decorator `@Use` to associate a method or a class with a specified middleware classes.
 * @param ...MiddlewareClasses[] - The middleware classes to be applied.
 *
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

/**
 * Use `@Error` decorator to associate a `parameter` of a method with the `Error` response.
 *
 * @example
 * "@Error() err: Error"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#error | CDS-TS-Dispatcher - @Error}
 */
export function Error() {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'ERROR',
      target,
      propertyKey,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Use `@Next` decorator to associate a `parameter` of a method with the `next` function.
 *
 *  @example
 * "@Next() next: Function"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#next | CDS-TS-Dispatcher - @Next}
 */
export function Next() {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'NEXT_FUNCTION',
      target,
      propertyKey,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Use `@Results` decorator to associate a `parameter` of a method with the `results`.
 *
 * @example
 * "@Results() results: MyEntity[]"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#results | CDS-TS-Dispatcher - @Results}
 */
export function Results() {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RESULTS',
      target,
      propertyKey,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Use `@Result` decorator to associate a `parameter` of a method with the `result`.
 *
 * `Note:` This can be used on the `create`, `update`, `delete` when the result contains only an object `(create, update)` or boolean `(delete)` if the `results` is an array use `@Results` decorator.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#result | CDS-TS-Dispatcher - @Result}
 */
export function Result() {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RESULTS',
      target,
      propertyKey,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Use `@Req` decorator to associate a `parameter` of a method with the `Request` object
 *
 * @example "@Req() req: Request"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#req | CDS-TS-Dispatcher - @Req}
 */
export function Req() {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'REQUEST',
      target,
      propertyKey,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Use `@GetQueryProperty` decorator to annotate a `parameter` of a method to `get` `request.query.[INSERT, SELECT, UPDATE, UPSERT, DELETE]` various properties.
 *
 * @param {string} requestQueryKey The key indicating the type of query operation (`INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`).
 * @param {string} property The specific property to get within the `request.query[INSERT, SELECT, UPDATE, UPSERT, DELETE][property]`.
 *
 * @example "GetQueryProperty('SELECT', 'columns') columns: GetColumns"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#get | CDS-TS-Dispatcher - @GetQueryProperty}
 */
export function GetQueryProperty<Key extends QueryKeys>(requestQueryKey: Key, property: PickQueryPropsByKey<Key>) {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'GET_QUERY_PROPERTY',
      target,
      propertyKey,
      metadataFields: { type: 'QUERY', parameterIndex, property, requestQueryKey },
    });
  };
}

/**
 * Use `@GetRequestProperty` decorator to annotate a `parameter` of a method to to be capable to get `Request` properties.
 *
 * This is a convenient decorator to get only some properties of the `Request` object, to get all properties use `@Req()` decorator.
 * @param {string} property The `Request` property to get.
 *
 * @example "@GetRequestProperty('locale') locale: string"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#getrequestproperty | CDS-TS-Dispatcher - @GetRequestProperty}
 */
export function GetRequestProperty(property: CustomRequest) {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'GET_REQUEST_PROPERTY',
      target,
      propertyKey,
      metadataFields: { type: 'REQUEST', parameterIndex, property },
    });
  };
}

/**
 *
 * Use `@IsColumnSupplied` decorator to annotate a `parameter` of a method to `verify` existence of `request.query.[INSERT, SELECT, UPSERT].columns - item` with the value from `field` parameter.
 *
 * @param {string} field The name of the `column` to verify in the `request.query.[INSERT, SELECT, UPSERT].columns`.
 *
 * @example "@IsColumnSupplied('name') isPresent: boolean"
 *
 * @returns boolean
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#isColumnSupplied | CDS-TS-Dispatcher - @IsColumnSupplied}
 */
export function IsColumnSupplied<Key>(field: keyof Key) {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_COLUMN_SUPPLIED',
      propertyKey,
      target,
      metadataFields: { type: 'CHECK_COLUMN_VALUE', parameterIndex, property: field },
    });
  };
}

/**
 *
 * Use `@IsRole` decorator to annotate a `parameter` of a method to `verify` existence of `req.roles` with the value from `roles` parameter.
 * @param {string} role The name of the `role` to verify in the `req.user.is(role)`.
 *
 * @example "@IsRole('name') role: boolean"
 *
 * @returns boolean
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#isrole | CDS-TS-Dispatcher - @IsRole}
 */
export function IsRole(role: string) {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_ROLE',
      propertyKey,
      target,
      metadataFields: { type: 'USER', parameterIndex, property: role },
    });
  };
}

/**
 * Use `@IsPresent` decorator to annotate a `parameter` of a method to `check` existence of `request.query.[INSERT, SELECT, UPDATE, UPSERT, DELETE]` various properties.
 *
 * @param {string} requestQueryKey The key indicating the type of query operation (`INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`).
 * @param {string} property The specific property to check within the `request.query[INSERT, SELECT, UPDATE, UPSERT, DELETE][property]`.
 *
 * @example "@IsPresent('SELECT', 'columns') hasColumns: boolean"
 *
 * @returns boolean
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#ispresent | CDS-TS-Dispatcher - @IsPresent}
 */
export function IsPresent<Key extends QueryKeys>(requestQueryKey: Key, property: PickQueryPropsByKey<Key>) {
  return function (target: object, propertyKey: string | symbol, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_PRESENT',
      propertyKey,
      target,
      metadataFields: { type: 'QUERY', parameterIndex, property, requestQueryKey },
    });
  };
}

/**
 * Builds a decorator for handling the .after method.
 *
 * @param event - The event to handle.
 * @param handlerType - The type of handler (Before, After, On).
 */

function buildAfter(options: { event: EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>() {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyArgumentDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @AfterCreate(), @AfterRead(), @AfterUpdate(), @AfterDelete()
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQueryProperty() decorators
      // ********************************************************************************************************************************

      const { event, handlerType, isDraft } = options;
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

/**
 * Builds a decorator for handling the .before method.
 *
 * @param event - The event to handle.
 * @param handlerType - The type of handler (Before, After, On).
 */

function buildBefore(options: { event: EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>() {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyArgumentDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @BeforeCreate(), @BeforeRead(), @beforeUpdate(), @BeforeDelete()
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQueryProperty() decorators
      // ********************************************************************************************************************************

      const { event, handlerType, isDraft } = options;
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param event - The custom action event to handle.
 * @param handlerType - The type of handler (Before, After, On).
 */

function buildOnAction(options: { event: EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>(name: CdsFunction) {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyArgumentDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @OnAction(), @OnFunction(), @OnBoundAction(), @OnBoundFunction() + draft versions
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQueryProperty() decorators
      // ********************************************************************************************************************************

      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { event, handlerType, isDraft } = options;

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        actionName: name,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

/**
 * Builds a decorator for handling the .on (event) method.
 *
 * @param event - The custom action event to handle.
 * @param handlerType - The type of handler (Before, After, On).
 */

function buildOnEvent(options: { event: EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>(name: CdsEvent) {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyArgumentDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @OnEvent
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQueryProperty() decorators
      // ********************************************************************************************************************************

      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { event, handlerType, isDraft } = options;

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        eventName: name as unknown as string,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

/**
 * Builds a decorator for handling the .on('error) method.
 *
 * @param event - The custom action event to handle.
 * @param handlerType - The type of handler (Before, After, On).
 */

function buildOnError(options: { event: EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function <Target extends Object>() {
    return function (target: Target, propertyName: string | symbol, descriptor: TypedPropertyDescriptor<any>): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyArgumentDecorators();
        return method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of event during start-up : @OnError() decorator
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQueryProperty() decorators
      // ********************************************************************************************************************************

      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);
      const { event, handlerType, isDraft } = options;

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
        callback: descriptor.value,
        isDraft,
      });

      // ********************************************************************************************************************************
      // ********************************************************************************************************************************
    };
  };
}

/**
 * Builds a decorator for handling the .on method.
 *
 * @param event - The custom action event to handle.
 * @param handlerType - The type of handler (Before, After, On).
 */
function buildOnCRUD<Target extends Object>(options: { event: EVENTS; handlerType: HandlerType; isDraft: boolean }) {
  return function () {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const method = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        new ArgumentMethodProcessor(target, propertyName, args).applyArgumentDecorators();
        return await method.apply(this, args);
      };

      // ********************************************************************************************************************************
      // Registration of events during start-up : @OnCreate(), @OnRead(), @OnUpdate(), @OnDelete(), @OnEditDraft(), @OnSaveDraft(), @OnNewDraft(), @OnCancelDraft
      // Note: descriptor.value will contain the logic for @Req(), @Results(), @Next(), @IsPresent(), @GetQueryProperty() decorators
      // ********************************************************************************************************************************

      const { event, handlerType, isDraft } = options;
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        event,
        handlerType,
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
 * Use `@BeforeCreate` decorator to execute custom logic before creating a new resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecreate | CDS-TS-Dispatcher - @BeforeCreate}
 */
const BeforeCreate = buildBefore({ event: 'CREATE', handlerType: HandlerType.Before, isDraft: false });

/**
 * Use `@BeforeCreateDraft` decorator to execute custom logic before creating a new DRAFT resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeCreateDraft}
 */
const BeforeCreateDraft = buildBefore({ event: 'CREATE', handlerType: HandlerType.Before, isDraft: true });

/**
 * Use `@BeforeRead` decorator to execute custom logic before performing a read operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeread | CDS-TS-Dispatcher - @BeforeRead}
 */
const BeforeRead = buildBefore({ event: 'READ', handlerType: HandlerType.Before, isDraft: false });

/**
 * Use `@BeforeReadDraft` decorator to execute custom logic before performing a DRAFT read operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeReadDraft}
 */
const BeforeReadDraft = buildBefore({ event: 'READ', handlerType: HandlerType.Before, isDraft: true });

/**
 * Use `@BeforeUpdate` decorator to execute custom logic before performing an update operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeupdate | CDS-TS-Dispatcher - @BeforeUpdate}
 */
const BeforeUpdate = buildBefore({ event: 'UPDATE', handlerType: HandlerType.Before, isDraft: false });

/**
 * Use `@BeforeUpdateDraft` decorator to execute custom logic before performing a DRAFT update operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeUpdateDraft}
 */
const BeforeUpdateDraft = buildBefore({ event: 'UPDATE', handlerType: HandlerType.Before, isDraft: true });

/**
 * Use `@BeforeDelete` decorator to execute custom logic before performing a delete operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforedelete | CDS-TS-Dispatcher - @BeforeDelete}
 */
const BeforeDelete = buildBefore({ event: 'DELETE', handlerType: HandlerType.Before, isDraft: false });

/**
 * Use `@BeforeDeleteDraft` decorator to execute custom logic before performing a delete operation on a draft.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#before | CDS-TS-Dispatcher - @BeforeDeleteDraft}
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
 * Use `@AfterCreate` decorator to execute custom logic after creating a new resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate | CDS-TS-Dispatcher - @AfterCreate}
 */
const AfterCreate = buildAfter({ event: 'CREATE', handlerType: HandlerType.After, isDraft: false });

/**
 * Use `@AfterCreateDraft` decorator to execute custom logic after creating a new DRAFT resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercreate | CDS-TS-Dispatcher - @AfterCreateDraft}
 */
const AfterCreateDraft = buildAfter({ event: 'CREATE', handlerType: HandlerType.After, isDraft: true });

/**
 * Use `@AfterRead` decorator to execute custom logic after performing a read operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | CDS-TS-Dispatcher - @AfterRead}
 */
const AfterRead = buildAfter({ event: 'READ', handlerType: HandlerType.After, isDraft: false });

/**
 * Use `@AfterReadDraft` decorator to execute custom logic after performing a DRAFT read operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterread | CDS-TS-Dispatcher - @AfterReadDraft}
 */
const AfterReadDraft = buildAfter({ event: 'READ', handlerType: HandlerType.After, isDraft: true });

/**
 * Use `@AfterUpdate` decorator to execute custom logic after performing an update operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate | CDS-TS-Dispatcher - @AfterUpdate}
 */
const AfterUpdate = buildAfter({ event: 'UPDATE', handlerType: HandlerType.After, isDraft: false });

/**
 * Use `@AfterUpdateDraft` decorator to execute custom logic after performing a DRAFT update operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterupdate | CDS-TS-Dispatcher - @AfterUpdateDraft}
 */
const AfterUpdateDraft = buildAfter({ event: 'UPDATE', handlerType: HandlerType.After, isDraft: true });

/**
 * Use `@AfterDelete` decorator to execute custom logic after performing a delete operation.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete | CDS-TS-Dispatcher - @AfterDelete}
 */
const AfterDelete = buildAfter({ event: 'DELETE', handlerType: HandlerType.After, isDraft: false });

/**
 * Use `@AfterDeleteDraft` decorator to execute custom logic after performing a delete operation on a draft.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afterdelete | CDS-TS-Dispatcher - @AfterDeleteDraft}
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
 * Use `@OnCreate` decorator to execute custom logic when a new resource is created.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncreate | CDS-TS-Dispatcher - @OnCreate}
 */
const OnCreate = buildOnCRUD({ event: 'CREATE', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnCreateDraft` decorator to execute custom logic when a new DRAFT resource is created.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncreate | CDS-TS-Dispatcher - @OnCreateDraft}
 */
const OnCreateDraft = buildOnCRUD({ event: 'CREATE', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@OnRead` decorator to execute custom logic when a read operation is performed.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onread | CDS-TS-Dispatcher - @OnRead}
 */
const OnRead = buildOnCRUD({ event: 'READ', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnReadDraft` decorator to execute custom logic when a read operation is performed on a DRAFT resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onread | CDS-TS-Dispatcher - @OnReadDraft}
 */
const OnReadDraft = buildOnCRUD({ event: 'READ', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@OnUpdate` decorator to execute custom logic when an update operation is performed.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onupdate | CDS-TS-Dispatcher - @OnUpdate}
 */
const OnUpdate = buildOnCRUD({ event: 'UPDATE', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnUpdateDraft` decorator to execute custom logic when an update operation is performed on a DRAFT resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onupdate | CDS-TS-Dispatcher - @OnUpdateDraft}
 */
const OnUpdateDraft = buildOnCRUD({ event: 'UPDATE', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@OnDelete` decorator to execute custom logic when a delete operation is performed.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondelete | CDS-TS-Dispatcher - @OnDelete}
 */
const OnDelete = buildOnCRUD({ event: 'DELETE', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnDeleteDraft` decorator to execute custom logic when a delete operation is performed on a DRAFT resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#ondelete | CDS-TS-Dispatcher - @OnDeleteDraft}
 */
const OnDeleteDraft = buildOnCRUD({ event: 'DELETE', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@OnAction` decorator to execute custom logic when a custom action event is triggered.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onaction | CDS-TS-Dispatcher - @OnAction}
 */
const OnAction = buildOnAction({ event: 'ACTION', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnBoundAction` decorator to execute custom logic when a custom bound action event is triggered.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction | CDS-TS-Dispatcher - @OnBoundAction}
 */
const OnBoundAction = buildOnAction({ event: 'BOUND_ACTION', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnBoundActionDraft` decorator to execute custom logic when a custom bound action event is triggered on a DRAFT resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundaction | CDS-TS-Dispatcher - @OnBoundActionDraft}
 */
const OnBoundActionDraft = buildOnAction({ event: 'BOUND_ACTION', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@OnBoundFunction` decorator to execute custom logic when a custom bound function event is triggered.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction | CDS-TS-Dispatcher - @OnBoundFunction}
 */
const OnBoundFunction = buildOnAction({ event: 'BOUND_FUNC', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnBoundFunctionDraft` decorator to execute custom logic when a custom bound function event is triggered on a DRAFT resource.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onboundfunction | CDS-TS-Dispatcher - @OnBoundFunctionDraft}
 */
const OnBoundFunctionDraft = buildOnAction({ event: 'BOUND_FUNC', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@OnFunction` decorator to execute custom logic when a custom function event is triggered.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onfunction | CDS-TS-Dispatcher - @OnFunction}
 */
const OnFunction = buildOnAction({ event: 'FUNC', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnEvent` decorator to execute custom logic when a custom event is triggered.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onevent | CDS-TS-Dispatcher - @OnEvent}
 */
const OnEvent = buildOnEvent({ event: 'EVENT', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnError` decorator to execute custom logic when an error occurs.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onerror | CDS-TS-Dispatcher - @OnError}
 */
const OnError = buildOnError({ event: 'ERROR', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnEditDraft` decorator to execute custom logic when a new draft is created from an active instance.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oneditdraft | CDS-TS-Dispatcher - @OnEditDraft}
 */
const OnEditDraft = buildOnCRUD({ event: 'EDIT', handlerType: HandlerType.On, isDraft: false });

/**
 * Use `@OnSaveDraft` decorator to execute custom logic when the 'active entity' is changed.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onsavedraft | CDS-TS-Dispatcher - @OnSaveDraft}
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
 * Use `@OnNewDraft` decorator to execute custom logic when a 'draft' is created.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#onnewdraft | CDS-TS-Dispatcher - @OnNewDraft}
 */
const OnNewDraft = buildOnCRUD({ event: 'NEW', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@OnCancelDraft` decorator to execute custom logic when a 'draft' is cancelled.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#oncanceldraft | CDS-TS-Dispatcher - @OnCancelDraft}
 */
const OnCancelDraft = buildOnCRUD({ event: 'CANCEL', handlerType: HandlerType.On, isDraft: true });

/**
 * Use `@BeforeNewDraft` decorator to execute custom logic before a 'draft' is created.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforenewdraft | CDS-TS-Dispatcher - @BeforeNewDraft}
 */
const BeforeNewDraft = buildBefore({ event: 'NEW', handlerType: HandlerType.Before, isDraft: true });

/**
 * Use `@BeforeCancelDraft` decorator to execute custom logic before a 'draft' is cancelled.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforecanceldraft | CDS-TS-Dispatcher - @BeforeCancelDraft}
 */
const BeforeCancelDraft = buildBefore({ event: 'CANCEL', handlerType: HandlerType.Before, isDraft: true });

/**
 * Use `@BeforeEditDraft` decorator to execute custom logic before a 'draft' is edited.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforeeditdraft | CDS-TS-Dispatcher - @BeforeEditDraft}
 */
const BeforeEditDraft = buildBefore({ event: 'EDIT', handlerType: HandlerType.Before, isDraft: false });

/**
 * Use `@BeforeSaveDraft` decorator to execute custom logic before a 'draft' is saved.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#beforesavedraft | CDS-TS-Dispatcher - @BeforeSaveDraft}
 */
const BeforeSaveDraft = buildBefore({ event: 'SAVE', handlerType: HandlerType.Before, isDraft: false });

/**
 * Use `@AfterNewDraft` decorator to execute custom logic after a new 'draft' is created.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#afternewdraft | CDS-TS-Dispatcher - @AfterNewDraft}
 */
const AfterNewDraft = buildAfter({ event: 'NEW', handlerType: HandlerType.After, isDraft: true });

/**
 * Use `@AfterCancelDraft` decorator to execute custom logic after a 'draft' is cancelled.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftercanceldraft | CDS-TS-Dispatcher - @AfterCancelDraft}
 */
const AfterCancelDraft = buildAfter({ event: 'CANCEL', handlerType: HandlerType.After, isDraft: true });

/**
 * Use `@AfterEditDraft` decorator to execute custom logic after a 'draft' is edited.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftereditdraft | CDS-TS-Dispatcher - @AfterEditDraft}
 */
const AfterEditDraft = buildAfter({ event: 'EDIT', handlerType: HandlerType.After, isDraft: false });

/**
 * Use `@AfterSaveDraft` decorator to execute custom logic after a 'draft' is saved.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#aftersavedraft | CDS-TS-Dispatcher - @AfterSaveDraft}
 */
const AfterSaveDraft = buildAfter({ event: 'SAVE', handlerType: HandlerType.After, isDraft: false });

export {
  // Standalone events
  Use,
  SingleInstanceCapable,
  SingleInstanceSwitch,
  Validate,
  FieldsFormatter,
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
  // AFTER events - Draft
  AfterCreateDraft,
  AfterReadDraft,
  AfterUpdateDraft,
  AfterDeleteDraft,
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
