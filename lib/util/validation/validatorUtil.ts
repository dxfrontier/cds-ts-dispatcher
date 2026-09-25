import { StatusCodes } from 'http-status-codes';
import * as validatorActions from 'validator';

import constants from '../../constants/internalConstants';
import util from '../util';

import type { Validators } from '../../types/validator';
import type { Request } from '../../types/types';

/**
 * A validator.js check whose 2nd argument is an options bag specific to that one check (e.g.
 * `isLength`'s `{ min, max }`, `isEmail`'s `IsEmailOptions`, ...). Declared once so the indexed
 * `validatorActions[...]` lookup below can be called through a single, well-defined signature instead
 * of the raw union of every matching validator.js overload, which TypeScript refuses to call directly
 * (TS2349 - "none of those signatures are compatible with each other").
 */
type ValidatorWithOptions = (str: string, options?: unknown) => boolean;

/**
 * Appends the entry index to a rejection message, for a bulk (array) `req.data` payload; returns the
 * message unchanged when `index` is `undefined` (single-object `req.data`).
 * @param message The base rejection message.
 * @param index The zero-based index of the entry within the bulk array, or `undefined`.
 */
function withEntryIndex(message: string, index?: number): string {
  return index === undefined ? message : `${message} (bulk entry index: ${index})`;
}

/**
 * Reads `field` off one entry of a bulk (array) `req.data`. A non-object entry (e.g. `null`) counts as an
 * entry missing the field.
 * @param entry One entry of a bulk `req.data` array.
 * @param field The field to read.
 */
function getEntryFieldValue(entry: unknown, field: string): any {
  return util.lodash.isObjectLike(entry) ? (entry as Record<string, unknown>)[field] : undefined;
}

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
   * @param options.index The index of the entry within a bulk (array) `req.data`, appended to the
   *   rejection message (unless a customMessage is set, which is passed through unchanged); omitted
   *   (or left `undefined`) for a single-object `req.data`.
   */
  showNotValidMessage(options: {
    field: string;
    input: string;
    validator: string;
    message?: string | null;
    req: Request;
    index?: number;
  }) {
    const hasCustomMessage = !!options.message && options.message.trim() !== '' && options.message !== null;

    const message = hasCustomMessage
      ? (options.message as string)
      : util.buildMessage(constants.MESSAGES.VALIDATOR_NOT_VALID, {
          field: options.field,
          input: options.input,
          validator: options.validator,
        });

    // A customMessage is user-authored and, for the CAP `@sap/cds` REST/OData protocol, is looked up as a
    // possible i18n message key (`http.js` `normalized()`) - appending the bulk entry index to it would
    // turn a valid key into an unresolvable string. Only the dispatcher's own templated message gets the
    // index suffix.
    options.req.reject(StatusCodes.BAD_REQUEST, hasCustomMessage ? message : withEntryIndex(message, options.index));
  },

  /**
   * Determines if validation can be applied to the given field in the request.
   * @param req The request object.
   * @param validator The validator object.
   * @param field The field to validate.
   * @returns True if validation can be applied, otherwise false.
   */
  canValidate(req: Request, validator: Validators, field: string): boolean {
    if (!util.lodash.isArray(req.data)) {
      const value = req.data[field];

      if (util.isFieldEmpty(value) && validator.mandatoryFieldValidation && !('customMessage' in validator)) {
        util.raiseBadRequestEmptyField(req, validator, field);
      }

      // If the field is empty, no further validation is needed
      if (util.isFieldEmpty(value)) {
        return false;
      }

      return true;
    }

    // Bulk (array) `req.data` - e.g. a cds 10 bulk INSERT dispatched as one REST POST: every entry is
    // checked in order, the same way a single-object `req.data` would be. The first entry missing a
    // mandatory field rejects immediately, its message identifying the entry index; an entry whose
    // field is simply empty (not mandatory) is skipped, same as the single-object case.
    let canValidateAnyEntry = false;

    for (let index = 0; index < req.data.length; index += 1) {
      const value = getEntryFieldValue(req.data[index], field);

      if (util.isFieldEmpty(value) && validator.mandatoryFieldValidation && !('customMessage' in validator)) {
        util.raiseBadRequestMessage(
          req,
          withEntryIndex(
            util.buildMessage(constants.MESSAGES.VALIDATOR_FIELD_NOT_EXISTS, { action: validator.action, field }),
            index,
          ),
        );

        return false;
      }

      if (!util.isFieldEmpty(value)) {
        canValidateAnyEntry = true;
      }
    }

    return canValidateAnyEntry;
  },

  /**
   * Applies the specified validator to the given field in the request.
   * @param req The request object.
   * @param validator The validator object.
   * @param field The field to validate.
   */
  applyValidator(req: Request, validator: Validators, field: string): Record<Validators['action'], boolean> | void {
    if (!util.lodash.isArray(req.data)) {
      const { exposed } = applyValidatorToValue(req, validator, field, req.data[field]);

      return validator.exposeValidatorResult ? exposed : undefined;
    }

    // Bulk (array) `req.data`: `exposeValidatorResult` is aggregated across every checked entry (true
    // only when ALL of them pass); otherwise the first invalid entry rejects with the same 400 as the
    // single-object case (message identifying the entry index, unless a customMessage is set, which is
    // passed through unchanged) and the remaining entries are left unchecked, mirroring `canValidate`'s
    // "stop at the first problem" rule.
    if (validator.exposeValidatorResult) {
      let allValid = true;

      for (let index = 0; index < req.data.length; index += 1) {
        const value = getEntryFieldValue(req.data[index], field);

        if (util.isFieldEmpty(value)) {
          continue;
        }

        const { isValid } = applyValidatorToValue(req, validator, field, value, index);
        allValid = allValid && isValid;
      }

      return { [validator.action]: allValid } as Record<Validators['action'], boolean>;
    }

    for (let index = 0; index < req.data.length; index += 1) {
      const value = getEntryFieldValue(req.data[index], field);

      if (util.isFieldEmpty(value)) {
        continue;
      }

      const { isValid } = applyValidatorToValue(req, validator, field, value, index);

      if (!isValid) {
        // First invalid entry already rejected above - stop checking the remaining entries.
        return;
      }
    }
  },
};

/**
 * Runs the given validator against a single value (one field of one `req.data` entry) and, unless
 * `exposeValidatorResult` is set, rejects the request when the value fails.
 * @param req The request object.
 * @param validator The validator object.
 * @param field The field being validated.
 * @param value The value to validate.
 * @param index The index of the entry within a bulk (array) `req.data`, appended to the rejection
 *   message (unless a customMessage is set, which is passed through unchanged); omitted for a
 *   single-object `req.data`.
 */
function applyValidatorToValue(
  req: Request,
  validator: Validators,
  field: string,
  value: unknown,
  index?: number,
): { isValid: boolean; exposed: Record<Validators['action'], boolean> } {
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
        return (validatorActions[validator.action] as ValidatorWithOptions)(input, validator.options);

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

  foundValidators[validator.action] = isValid;

  // Handle validation failure cases (never reached when exposeValidatorResult is set - the caller
  // returns the exposed flags instead of rejecting)
  if (!validator.exposeValidatorResult && !isValid) {
    const message = validator.customMessage ?? null;
    validatorUtil.showNotValidMessage({
      field,
      input,
      req,
      validator: validator.action,
      message,
      index,
    });
  }

  return { isValid, exposed: foundValidators };
}

export default validatorUtil;
