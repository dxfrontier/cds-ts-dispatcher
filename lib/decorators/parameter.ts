import { ArgumentMethodProcessor } from '../core/ArgumentMethodProcessor';

import type { PickQueryPropsByKey, CustomRequest, CRUDQueryKeys } from '../types/internalTypes';

/**
 * Annotates a parameter of a method to enable `switching` between `single instance` and `entity set` functionality in your method.
 * @example
 * "@SingleInstanceSwitch() isSingleInstance: boolean"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#singleinstanceswitch | CDS-TS-Dispatcher - @SingleInstanceSwitch}
 */
function SingleInstanceSwitch(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'SINGLE_INSTANCE_SWITCH',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the `Error` response.
 * @example
 * "@Error() err: Error"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#error | CDS-TS-Dispatcher - @Error}
 */
function Error(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'ERROR',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the `next` event in the chain of execution.
 * @example
 * "@Next() next: NextEvent"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#next | CDS-TS-Dispatcher - @Next}
 */
function Next(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'NEXT',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the `results`.
 * @example
 * "@Results() results: MyEntity[]"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#results | CDS-TS-Dispatcher - @Results}
 */
function Results(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RESULTS',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the `result`.
 * `NOTE`: This can be used on the `create`, `update`, `delete` when the result contains only an object `(create, update)` or boolean `(delete)`
 *
 * NOTE If the `results` is an `array` use `@Results` decorator.
 *
 * @example
 * "@Result() result: MyEntity"
 * "@Result() deleted: boolean"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#results | CDS-TS-Dispatcher - @Results}
 */
function Result(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RESULTS',
      target,
      propertyKey: propertyKey!,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the `Request` object.
 * @example "@Req() req: Request"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#req | CDS-TS-Dispatcher - @Req}
 */
function Req(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'REQ',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method with the `Req.res (Response)` object.
 * @example "@Res() response: ServerResponse"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#res | CDS-TS-Dispatcher - @Res}
 */
function Res(): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'RES',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

/**
 * Annotates a parameter of a method to `get` the `request.query[INSERT, SELECT, UPDATE, UPSERT, DELETE][property]` properties.
 * @param key The key indicating the type of query operation (`INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`).
 * @param property The specific property to get within the `request.query[key][property]`.
 * @example "GetQuery('SELECT', 'columns') columns: GetColumns"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#get | CDS-TS-Dispatcher - @GetQuery}
 */
function GetQuery<Key extends CRUDQueryKeys>(key: Key, property: PickQueryPropsByKey<Key>): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'GET_QUERY',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'QUERY', parameterIndex, property, key },
    });
  };
}

/**
 * Annotates a parameter of a method to `get` the `Request` properties.
 *
 * `NOTE:` This is a convenient decorator to get only some properties of the `Request` object, to get all properties use `@Req()` decorator.
 *
 * @param  property The `Request` property to get.
 * @example "@GetRequest('locale') locale: string"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#getrequestproperty | CDS-TS-Dispatcher - @GetRequest}
 */
function GetRequest(property: CustomRequest): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'GET_REQUEST',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'REQ', parameterIndex, property },
    });
  };
}

/**
 *
 * Annotates a parameter of a method to `check` existence of `request.query[INSERT, SELECT, UPSERT].columns - item` with the value from `field` parameter.
 * @param field The name of the `column` to verify in the `request.query[INSERT, SELECT, UPSERT].columns`.
 * @example "@IsColumnSupplied('name') isPresent: boolean"
 * @returns boolean
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#iscolumnsupplied | CDS-TS-Dispatcher - @IsColumnSupplied}
 */
function IsColumnSupplied<Key>(field: keyof Key): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_COLUMN_SUPPLIED',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'CHECK_COLUMN_VALUE', parameterIndex, property: field as string },
    });
  };
}

/**
 *
 * Annotates a parameter of a method to `check` the `existence` of specific role values in the request.
 *
 * `NOTE`: `IsRole` applies a logical `OR` between the roles, meaning it checks if at least one of the specified roles exists.
 * @param roles An array of role names to verify in `req.user.is(role)`.
 * @example "@IsRole('name', 'anotherRole') roles: boolean"
 * @returns boolean
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#isrole | CDS-TS-Dispatcher - @IsRole}
 */
function IsRole(...roles: string[]): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_ROLE',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'ROLE', parameterIndex, property: roles },
    });
  };
}

/**
 * Annotates a parameter of a method to `check` existence of `request.query[INSERT, SELECT, UPDATE, UPSERT, DELETE][property]` various properties.
 * @param key The key indicating the type of query operation (`INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`).
 * @param property The specific property to check within the `request.query[key][property]`.
 * @example "@IsPresent('SELECT', 'columns') hasColumns: boolean"
 * @returns boolean
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#ispresent | CDS-TS-Dispatcher - @IsPresent}
 */
function IsPresent<Key extends CRUDQueryKeys>(key: Key, property: PickQueryPropsByKey<Key>): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'IS_PRESENT',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'QUERY', parameterIndex, property, key },
    });
  };
}

/**
 * Annotates a parameter of a method to retrieve the `JWT - (JSON Web Token)` from the request.
 * @example "@Jwt() token: string | undefined"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#jwt | CDS-TS-Dispatcher - @Jwt}
 */
function Jwt(): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    ArgumentMethodProcessor.createMetadataBy({
      metadataKey: 'JWT',
      propertyKey: propertyKey!,
      target,
      metadataFields: { type: 'INDEX_DECORATOR', parameterIndex },
    });
  };
}

export {
  SingleInstanceSwitch,
  Error,
  Next,
  Result,
  Results,
  Req,
  Res,
  GetQuery,
  GetRequest,
  IsColumnSupplied,
  IsRole,
  IsPresent,
  Jwt,
};
