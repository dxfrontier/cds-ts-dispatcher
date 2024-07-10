/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { StatusCodes } from 'http-status-codes';
import * as validatorActions from 'validator';

import constants from '../../constants/internalConstants';
import util from '../util';

import type { Validators } from '../../types/validator';
import type { Request } from '../../types/types';

/**
 * Utility object for handling validation operations.
 */
const validatorUtil = {
  /**
   * Displays a message indicating the validation error.
   * @param options An object containing the validation error details.
   * @param options.field The field that failed validation.
   * @param options.input The input value that failed validation.
   * @param options.validator The validator that failed.
   * @param options.message An optional custom message for the validation error.
   * @param options.req The request object.
   */
  showNotValidMessage(options: {
    field: string;
    input: string;
    validator: string;
    message?: string | null;
    req: Request;
  }) {
    const message = `${
      options.message ??
      util.buildMessage(constants.MESSAGES.VALIDATOR_NOT_VALID, {
        field: options.field,
        input: options.input,
        validator: options.validator,
      })
    }`;

    options.req.reject(StatusCodes.BAD_REQUEST, message);
  },

  /**
   * Determines if validation can be applied to the given field in the request.
   * @param req The request object.
   * @param validator The validator object.
   * @param field The field to validate.
   * @returns True if validation can be applied, otherwise false.
   */
  canValidate(req: Request, validator: Validators, field: string): boolean {
    const value = req.data[field];

    if (util.isFieldEmpty(value) && validator.mandatoryFieldValidation) {
      util.raiseBadRequestEmptyField(req, validator, field);
    }

    // If the field is empty, no further validation is needed
    if (util.isFieldEmpty(value)) {
      return false;
    }

    return true;
  },

  /**
   * Applies the specified validator to the given field in the request.
   * @param req The request object.
   * @param validator The validator object.
   * @param field The field to validate.
   */
  applyValidator(req: Request, validator: Validators, field: string): void {
    const value = req.data[field];

    const input = String(value);
    const customMessage: string | null = validator.customMessage ?? null;

    let isValid: boolean = false;

    switch (validator.action) {
      // START 'Lodash' formatters

      case 'startsWith':
      case 'endsWith': {
        isValid = util.lodash[validator.action](input, validator.target, validator.position);
        break;
      }

      // END 'Lodash'

      // -------------------------------------------------------------------------

      // START 'Validator' formatters

      case 'isBoolean':
      case 'isDecimal':
      case 'isFloat':
      case 'isInt':
      case 'isMailtoURI':
      case 'isNumeric':
      case 'isTime':
      case 'isDate':
      case 'isEmail':
      case 'isCurrency':
      case 'isIBAN':
      case 'isIMEI':
      case 'isURL':
      case 'isUUID':
      case 'isCreditCard':
      case 'isLength': {
        isValid = validatorActions[validator.action](input, validator.options as any);
        break;
      }

      case 'isAlpha':
      case 'isAlphanumeric':
      case 'isMobilePhone': {
        isValid = validatorActions[validator.action](input, validator.locale as any, validator.options);
        break;
      }

      case 'isBIC':
      case 'isEAN':
      case 'isHexadecimal':
      case 'isLatLong':
      case 'isMD5':
      case 'isMimeType':
      case 'isPort':
      case 'isSlug':
      case 'isLowercase':
      case 'isUppercase':
      case 'isDataURI':
      case 'isJSON':
      case 'isJWT': {
        isValid = validatorActions[validator.action](input);
        break;
      }

      case 'isIP':
      case 'isISBN': {
        isValid = validatorActions[validator.action](input, validator.version as any);
        break;
      }

      case 'isEmpty': {
        // isEmpty returns 'false' when it's empty and 'true' when is not empty.
        isValid = !validatorActions[validator.action](input);
        break;
      }

      case 'isPassportNumber':
      case 'isVAT': {
        isValid = validatorActions[validator.action](input, validator.countryCode as any);
        break;
      }

      case 'isIdentityCard':
      case 'isPostalCode': {
        isValid = validatorActions[validator.action](input, validator.locale as any);
        break;
      }

      case 'isIn': {
        isValid = validatorActions[validator.action](input, validator.values);
        break;
      }

      case 'isWhitelisted': {
        isValid = validatorActions[validator.action](input, validator.chars);
        break;
      }

      case 'equals': {
        isValid = validatorActions[validator.action](input, validator.comparison);
        break;
      }

      case 'contains': {
        isValid = validatorActions[validator.action](input, validator.seed, validator.options);
        break;
      }

      case 'matches': {
        isValid = validatorActions[validator.action](input, validator.pattern);
        break;
      }

      case 'isHash': {
        isValid = validatorActions[validator.action](input, validator.algorithm);
        break;
      }

      case 'isBefore':
      case 'isAfter': {
        isValid = validatorActions[validator.action](input, validator.date);
        break;
      }

      // END 'Validator'
    }

    if (!isValid) {
      this.showNotValidMessage({ field, input, req, validator: validator.action, message: customMessage });
    }
  },
};

export default validatorUtil;
