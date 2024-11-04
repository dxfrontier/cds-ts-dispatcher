import { retrieveJwt } from '@sap-cloud-sdk/connectivity';
import { EventContext, Request as RequestClass } from '@sap/cds';

import util from '../util';

import type { MetadataFields, TemporaryArgs } from '../../types/internalTypes';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Request } from '../../types/types';

/**
 * Utility object for handling parameter operations.
 */
const parameterUtil = {
  /**
   * Applies the 'is role' parameter to the request arguments.
   * @param req The request object.
   * @param args The arguments array.
   * @param metadata The metadata fields array.
   */
  applyIsRole(req: Request, args: any[], metadata: MetadataFields[]): void {
    metadata.forEach((parameter) => {
      if (parameter.type === 'ROLE') {
        args[parameter.parameterIndex] = parameter.property.some((role) => req.user.is(role));
      }
    });
  },

  /**
   * Finds if the execution is allowed based on roles.
   * @param args The arguments array.
   * @param roles The roles array.
   * @returns True if the execution is allowed, otherwise false.
   */
  findExecutionAllowedRoles(args: any[], roles: string[]): boolean {
    const req = util.findRequest(args);

    return roles.some((role: string): boolean => {
      return req.user.is(role);
    });
  },

  /**
   * Applies the 'is column supplied' parameter to the request arguments.
   * @param req The request object.
   * @param args The arguments array.
   * @param metadata The metadata fields array.
   */
  applyIsColumnSupplied(req: Request, args: any[], metadata: MetadataFields[]): void {
    metadata.forEach((parameter) => {
      if (parameter.type === 'CHECK_COLUMN_VALUE') {
        if (req.query.INSERT) {
          args[parameter.parameterIndex] = req.query.INSERT.columns.includes(parameter.property);
          return;
        }

        if (req.query.UPSERT) {
          args[parameter.parameterIndex] = req.query.UPSERT.columns.includes(parameter.property);
          return;
        }

        if (req.query.SELECT?.columns && req.query.SELECT.columns.length > 0) {
          args[parameter.parameterIndex] = req.query.SELECT.columns.some(
            (column) => column.ref && column.ref?.length > 0 && column.ref[0] === parameter.property,
          );
        }
      }
    });
  },

  /**
   * Checks if the request is for a single instance.
   * @param req The request object.
   * @returns True if the request is for a single instance, otherwise false.
   */
  isSingleInstance(req: Request): boolean {
    const hasParameters = req.params && req.params.length > 0;
    const SINGLE_INSTANCE = true;
    const ENTITY_SET = false;

    if (hasParameters) {
      return SINGLE_INSTANCE;
    }

    return ENTITY_SET;
  },

  /**
   * Handles request options and applies them to the arguments.
   * @param req The request object.
   * @param args The arguments array.
   * @param metadata The metadata fields array.
   */
  handleRequestOptions(req: Request, args: unknown[], metadata: MetadataFields[]): void {
    metadata.forEach((parameter) => {
      if (parameter.type === 'REQ') {
        const key = parameter.property;
        args[parameter.parameterIndex] = req[key];
      }
    });
  },

  /**
   * Applies the 'is present' or 'get' decorator to the request arguments.
   * @param type The type of decorator, either 'Get' or 'IsPresent'.
   * @param metadataParameters The metadata parameters array.
   * @param req The request object.
   * @param args The arguments array.
   */

  applyIsPresentOrGetDecorator(
    type: 'Get' | 'IsPresent',
    metadataParameters: MetadataFields[],
    req: Request,
    args: unknown[],
  ): void {
    for (const parameter of metadataParameters) {
      if (parameter.type !== 'QUERY') {
        break;
      }

      const queryOption = parameter.property;

      switch (queryOption) {
        case 'mixin':
        case 'limit':
        case 'orderBy':
        case 'groupBy':
        case 'having':
        case 'excluding':
        case 'distinct':
        case 'one': {
          if (parameter.key === 'SELECT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'limit.offset':
        case 'limit.rows': {
          const words = queryOption.split('.');
          const props = words[words.length - 1] as 'rows' | 'offset';

          args[parameter.parameterIndex] =
            type === 'Get' ? req.query.SELECT?.limit?.[props] : !!req.query.SELECT?.limit?.[props];

          break;
        }

        case 'data':
        case 'entity': {
          if (parameter.key === 'UPDATE') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'as': {
          if (parameter.key === 'INSERT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'rows':
        case 'values':
        case 'entries':
        case 'into': {
          if (parameter.key === 'INSERT' || parameter.key === 'UPSERT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'from': {
          if (parameter.key === 'SELECT' || parameter.key === 'DELETE') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'where': {
          if (parameter.key === 'SELECT' || parameter.key === 'UPDATE' || parameter.key === 'DELETE') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'columns': {
          if (parameter.key === 'SELECT' || parameter.key === 'INSERT' || parameter.key === 'UPSERT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query.SELECT?.[queryOption];
          }

          break;
        }

        default:
          util.throwErrorMessage('Option not handled !');
          break;
      }
    }
  },

  /**
   * Retrieves the JWT from the request.
   * @param req The request object.
   * @returns The JWT string if present, otherwise undefined.
   */
  retrieveJwt(req: Request): string | undefined {
    return retrieveJwt(req.http?.req as IncomingMessage);
  },

  /**
   * Retrieves the response object from the request.
   * @param req The request object.
   * @returns The response object.
   */
  retrieveResponse(req: Request) {
    return req.http?.res as ServerResponse;
  },

  /**
   * Finds the results from the argument.
   * @param arg The argument.
   * @returns The results array, boolean, object, or undefined.
   */
  findResults(arg: any): any[] | boolean | object | undefined {
    if (Array.isArray(arg)) {
      return arg;
    }

    if (util.lodash.isBoolean(arg)) {
      return arg;
    }

    if (!util.lodash.isArray(arg) && util.lodash.isObjectLike(arg)) {
      return arg;
    }
  },

  extractArguments(args: any[]): TemporaryArgs {
    const temporaryArgs: TemporaryArgs = Object.create({});

    args.forEach((arg) => {
      if (arg === undefined) return;

      switch (true) {
        case arg instanceof RequestClass:
          temporaryArgs.req = arg;
          break;

        case arg instanceof Error:
          temporaryArgs.error = arg;
          break;

        case arg instanceof EventContext:
          temporaryArgs.req = arg as Request;
          break;

        case util.isNextEvent(arg):
          temporaryArgs.next = arg;
          break;

        case !util.lodash.isUndefined(this.findResults(arg)):
          temporaryArgs.results = arg;
          break;

        default: {
          const allOthersExceptString = typeof arg !== 'string';
          if (allOthersExceptString) {
            util.throwErrorMessage(`Option ${arg} is not handled for extractArgument method!`);
          }
        }
      }
    });

    return temporaryArgs;
  },

  /**
   * Retrieves the locale language of the current req
   * @param req The request object.
   * @returns The locale language.
   */
  retrieveLocale(req: Request): string {
    return req.locale;
  },
};

export default parameterUtil;
