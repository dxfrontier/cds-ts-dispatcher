import { StatusCodes } from 'http-status-codes';
import lodash from 'lodash';
import template from 'string-placeholder';

import { Request as RequestClass } from '@sap/cds';

import constants from '../constants/constants';

import type { Validators } from '../types/validator';
import type { NextEvent, Request, ValidatorField } from '../types/types';
import type { Formatters } from '../types/formatter';

const util = {
  /**
   * Single point of lodash.
   * @example
   * util.lodash.replace or util.lodash.startsWith ...
   */
  lodash,

  isNextEvent(arg: any): arg is NextEvent {
    return typeof arg === 'function';
  },

  /**
   * This method will clean the args for a clean re-indexation for the new decorators.
   * If no decorators are found in the registry, this will be omitted.
   */
  cleanArgs(args: any[]): void {
    args.length = 0;
  },

  isRequestType: (arg: any): arg is Request => {
    if (arg instanceof RequestClass) {
      return true;
    }

    return false;
  },

  /**
   * Use this method when you want to build a message with placeholders
   *
   * @param {string} message The message to build with placeholders, the placeholders must match the message, Example : 'A message with `{name}` and `{lastName}`', this should be mentioned in the placeholders param.
   * @param {Record<string, any>} placeholders Placeholders, example : {name : 'name', lastName : 'last_name' }
   * @returns {string}
   */
  buildMessage(message: string, placeholders: Record<string, any>): string {
    return template(message, placeholders);
  },

  /**
   * Use this method if you want to find the SAP CAP `Request` object
   * @param {any[]} args
   * @returns {Request}
   */
  findRequest(args: any[]): Request {
    const foundRequest = args.filter((arg) => {
      // Include elements that are objectLike and Request
      if (util.lodash.isObjectLike(arg) && util.isRequestType(arg)) {
        return true;
      }

      // Exclude all other elements
      return false;
    });

    // The 'request' property
    return foundRequest[0];
  },

  /**
   * Use this method to `throw new Error()`
   *
   * @param {string} message The message to be thrown
   * @returns {void}
   */
  throwErrorMessage(message: string): void {
    throw new Error(message);
  },

  /**
   * Use this method when you want to raise a reject error from the SAP CAP Request, this bad request uses '400' error code.
   *
   * @param {Request} req - SAP CAP Request object
   * @param {string} message - The message to be raised
   * @returns {void}
   */
  raiseBadRequestMessage(req: Request, message: string): void {
    req.reject(StatusCodes.BAD_REQUEST, message);
  },

  isFieldEmpty(value: ValidatorField): boolean {
    // Convert non-string values to strings
    const strValue = typeof value !== 'string' && !util.lodash.isUndefined(value) ? String(value) : value;

    // Check if the value is undefined, null, or empty
    return util.lodash.isUndefined(strValue) || util.lodash.isNull(strValue) || util.lodash.isEmpty(strValue);
  },

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
