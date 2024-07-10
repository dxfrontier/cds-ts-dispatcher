import { StatusCodes } from 'http-status-codes';
import lodash from 'lodash';
import template from 'string-placeholder';

import { Request as RequestClass } from '@sap/cds';

import constants from '../constants/internalConstants';

import type { NextEvent, Request, ValidatorField } from '../types/types';
import type { Validators } from '../types/validator';
import type { Formatters } from '../types/formatter';

/**
 * This util contains common methods for reusable purposes.
 * Methods don't contain business logic.
 */
const util = {
  /**
   * Single point of lodash.
   * @example
   * util.lodash.replace or util.lodash.startsWith ...
   */
  lodash,

  /**
   * Returns the first item of an array if the array is not empty, otherwise returns an empty object.
   * @param data The input array.
   * @returns The first item of the array or an empty object.
   */
  getArrayFirstItem(data: any): object {
    return Array.isArray(data) && !util.lodash.isEmpty(data) ? data[0] : {};
  },

  /**
   * Takes a string as an argument like 'i.am.somebody' and returns 'somebody'.
   * @param str The input string.
   * @returns The last part of the string after the last dot.
   */
  subtractLastDotString(str: string) {
    const lastDotIndex = str.lastIndexOf('.');
    return str.substring(lastDotIndex + 1);
  },

  /**
   * Type guard to check if an argument is a NextEvent function.
   * @param arg The argument to check.
   * @returns True if the argument is a NextEvent function, otherwise false.
   */
  isNextEvent(arg: any): arg is NextEvent {
    return typeof arg === 'function';
  },

  /**
   * Cleans the args array for a clean re-indexation for new decorators.
   * If no decorators are found in the registry, this will be omitted.
   * @param args The arguments array to clean.
   */

  cleanArgs(args: any[]): void {
    args.length = 0;
  },

  /**
   * Type guard to check if an argument is a Request.
   * @param arg The argument to check.
   * @returns True if the argument is a Request, otherwise false.
   */
  isRequestType: (arg: any): arg is Request => {
    return arg instanceof RequestClass;
  },

  /**
   * Builds a message with placeholders.
   * @param message The message template with placeholders.
   * @param placeholders The object containing placeholder values.
   * @returns The message with placeholders replaced by actual values.
   */
  buildMessage(message: string, placeholders: Record<string, any>): string {
    return template(message, placeholders);
  },

  /**
   * Finds the SAP CAP `Request` object from the arguments.
   * @param args The arguments array.
   * @returns The Request object if found.
   */
  findRequest(args: any[]): Request {
    return args.find((arg) => util.lodash.isObjectLike(arg) && util.isRequestType(arg));
  },

  /**
   * Throws an error with the specified message.
   * @param message The error message.
   * @throws An Error with the specified message.
   */
  throwErrorMessage(message: string): void {
    throw new Error(message);
  },

  /**
   * Raises a bad request error from the SAP CAP Request with '400' error code.
   * @param req The SAP CAP Request object.
   * @param message The message to be raised.
   */
  raiseBadRequestMessage(req: Request, message: string): void {
    req.reject(StatusCodes.BAD_REQUEST, message);
  },

  /**
   * Checks if a field is empty.
   * @param value The field value to check.
   * @returns True if the field is empty, otherwise false.
   */
  isFieldEmpty(value: ValidatorField): boolean {
    // Convert non-string values to strings
    const strValue = typeof value !== 'string' && !util.lodash.isUndefined(value) ? String(value) : value;

    // Check if the value is undefined, null, or empty
    return util.lodash.isUndefined(strValue) || util.lodash.isNull(strValue) || util.lodash.isEmpty(strValue);
  },

  /**
   * Raises a bad request error indicating that a required field is empty.
   * @param req The SAP CAP Request object.
   * @param validatorOrFormatter The validator or formatter that identified the empty field.
   * @param field The field that is empty.
   */
  raiseBadRequestEmptyField(req: Request, validatorOrFormatter: Validators | Formatters<any>, field: string): void {
    util.raiseBadRequestMessage(
      req,
      util.buildMessage(constants.MESSAGES.VALIDATOR_FIELD_NOT_EXISTS, {
        action: validatorOrFormatter.action,
        field,
      }),
    );
  },
};

export default util;
