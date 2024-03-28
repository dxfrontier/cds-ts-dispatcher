/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { StatusCodes } from 'http-status-codes';
import * as validatorActions from 'validator';

import constants from '../../constants/constants';
import util from '../util';

import type { Validators } from '../../types/validator';
import type { Request } from '../../types/types';

const validatorUtil = {
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

  applyValidator(req: Request, validator: Validators, field: string): void {
    const value = req.data[field];

    if (util.isFieldEmpty(value) && validator.mandatoryFieldValidation) {
      util.raiseBadRequestEmptyField(req, validator, field);
    }

    // If the field is empty, no further validation is needed
    if (util.isFieldEmpty(value)) {
      return;
    }

    const input = String(value);
    const customMessage: string | null = validator.customMessage ?? null;

    let isValid: boolean = false;

    switch (validator.action) {
      // START 'Lodash' formatters

      case 'startsWith':
      case 'endsWith':
        isValid = util.lodash[validator.action](input, validator.target, validator.position);
        break;

      // END 'Lodash'

      // -------------------------------------------------------------------------

      // START 'Validator' formatters

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

      // END 'Validator'
    }

    if (!isValid) {
      this.showNotValidMessage({ field, input, req, validator: validator.action, message: customMessage });
    }
  },
};

export default validatorUtil;
