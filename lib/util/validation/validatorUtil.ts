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
  applyValidator(req: Request, validator: Validators, field: string): Record<Validators['action'], boolean> | void {
    const value = req.data[field];
    const input = String(value);
    const foundValidators: Record<Validators['action'], boolean> = Object.create({});

    // Self invoking func
    const isValid = (() => {
      switch (validator.action) {
        case 'startsWith':
        case 'endsWith':
          return util.lodash[validator.action](input, validator.target, validator.position);

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
        case 'isLength':
          return validatorActions[validator.action](input, validator.options as any);

        case 'isAlpha':
        case 'isAlphanumeric':
        case 'isMobilePhone':
          return validatorActions[validator.action](input, validator.locale as any, validator.options);

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
        case 'isJWT':
          return validatorActions[validator.action](input);

        case 'isIP':
        case 'isISBN':
          return validatorActions[validator.action](input, validator.version as any);

        case 'isEmpty':
          // isEmpty returns false when it's empty and true when not empty
          return !validatorActions[validator.action](input);

        case 'isPassportNumber':
        case 'isVAT':
          return validatorActions[validator.action](input, validator.countryCode as any);

        case 'isIdentityCard':
        case 'isPostalCode':
          return validatorActions[validator.action](input, validator.locale as any);

        case 'isIn':
          return validatorActions[validator.action](input, validator.values);

        case 'isWhitelisted':
          return validatorActions[validator.action](input, validator.chars);

        case 'equals':
          return validatorActions[validator.action](input, validator.comparison);

        case 'contains':
          return validatorActions[validator.action](input, validator.seed, validator.options);

        case 'matches':
          return validatorActions[validator.action](input, validator.pattern);

        case 'isHash':
          return validatorActions[validator.action](input, validator.algorithm);

        case 'isBefore':
        case 'isAfter':
          return validatorActions[validator.action](input, validator.date);

        default:
          return false;
      }
    })();

    if (validator.exposeValidatorResult) {
      foundValidators[validator.action] = isValid;
      return foundValidators;
    }

    // Handle validation failure cases
    if (!isValid) {
      const message = validator.exposeValidatorResult === false ? (validator.customMessage ?? null) : '';
      this.showNotValidMessage({
        field,
        input,
        req,
        validator: validator.action,
        message,
      });
    }
  },
};

export default validatorUtil;
