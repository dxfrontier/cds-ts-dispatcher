/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { StatusCodes } from 'http-status-codes';
import { Request as CdsRequest } from '@sap/cds';

import validatorUtil from '../../../lib/util/validation/validatorUtil';
import util from '../../../lib/util/util';
import constants from '../../../lib/constants/internalConstants';
import { Validate } from '../../../lib';

import type { Validators } from '../../../lib/types/validator';
import type { Request } from '../../../lib/types/types';

/**
 * Minimal fabricated `Request`: `validatorUtil` only ever reads `.data` and calls `.reject(...)`.
 * A plain object with a jest spy for `reject` is enough - no `@sap/cds` instance needed here.
 */
const buildReq = (data: Record<string, unknown> = {}): Request =>
  ({
    data,
    reject: jest.fn(),
  }) as unknown as Request;

describe('VALIDATOR-UTIL', () => {
  // ============================================================================================================
  // validatorUtil.showNotValidMessage
  // ============================================================================================================

  describe('validatorUtil.showNotValidMessage', () => {
    test('It should REJECT : with the provided custom message when one is given', () => {
      const req = buildReq();

      validatorUtil.showNotValidMessage({
        field: 'email',
        input: 'bad',
        validator: 'isEmail',
        message: 'Custom message',
        req,
      });

      expect(req.reject).toHaveBeenCalledTimes(1);
      expect(req.reject).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, 'Custom message');
    });

    test.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty string', ''],
      ['a whitespace-only string', '   '],
    ])('It should REJECT : with the templated default message when the custom message is %s', (_label, message) => {
      const req = buildReq();

      validatorUtil.showNotValidMessage({ field: 'email', input: 'bad', validator: 'isEmail', message, req });

      const expectedMessage = util.buildMessage(constants.MESSAGES.VALIDATOR_NOT_VALID, {
        field: 'email',
        input: 'bad',
        validator: 'isEmail',
      });

      expect(req.reject).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, expectedMessage);
    });

    test('It should PIN : the exact VALIDATOR_NOT_VALID templated string', () => {
      const req = buildReq();

      validatorUtil.showNotValidMessage({ field: 'email', input: 'bad', validator: 'isEmail', req });

      expect(req.reject).toHaveBeenCalledWith(
        StatusCodes.BAD_REQUEST,
        `{ email : bad } does not meet the constraints of validator 'isEmail' !`,
      );
    });
  });

  // ============================================================================================================
  // validatorUtil.canValidate
  // ============================================================================================================

  describe('validatorUtil.canValidate', () => {
    test('It should RETURN : true and NOT reject, when the field is present', () => {
      const req = buildReq({ email: 'a@b.com' });
      const validator: Validators = { action: 'isEmail' };

      expect(validatorUtil.canValidate(req, validator, 'email')).toBe(true);
      expect(req.reject).not.toHaveBeenCalled();
    });

    test('It should RETURN : true, when the field value is an empty string (not considered "empty")', () => {
      const req = buildReq({ email: '' });
      const validator: Validators = { action: 'isEmail' };

      expect(validatorUtil.canValidate(req, validator, 'email')).toBe(true);
      expect(req.reject).not.toHaveBeenCalled();
    });

    test.each([
      ['undefined', undefined],
      ['null', null],
    ])(
      'It should RETURN : false and NOT reject, when the field value is %s and mandatoryFieldValidation is not set',
      (_label, value) => {
        const req = buildReq({ email: value });
        const validator: Validators = { action: 'isEmail' };

        expect(validatorUtil.canValidate(req, validator, 'email')).toBe(false);
        expect(req.reject).not.toHaveBeenCalled();
      },
    );

    test('It should RETURN : false, when the field is entirely absent from req.data', () => {
      const req = buildReq({});
      const validator: Validators = { action: 'isEmail' };

      expect(validatorUtil.canValidate(req, validator, 'email')).toBe(false);
      expect(req.reject).not.toHaveBeenCalled();
    });

    test.each([
      ['undefined', undefined],
      ['null', null],
    ])(
      'It should REJECT : with the field-not-exists message, when the field value is %s and mandatoryFieldValidation is true',
      (_label, value) => {
        const req = buildReq({ email: value });
        const validator: Validators = { action: 'isEmail', mandatoryFieldValidation: true };

        expect(validatorUtil.canValidate(req, validator, 'email')).toBe(false);
        expect(req.reject).toHaveBeenCalledWith(
          StatusCodes.BAD_REQUEST,
          `Validator 'isEmail' is trying to validate the field 'email'. Field 'email' must be present in the Request body or not to be empty !`,
        );
      },
    );

    test('It should NOT reject, when the field is missing, mandatoryFieldValidation is true, BUT a customMessage is set', () => {
      const req = buildReq({ email: undefined });
      const validator: Validators = {
        action: 'isEmail',
        mandatoryFieldValidation: true,
        customMessage: 'Please provide an email',
      };

      expect(validatorUtil.canValidate(req, validator, 'email')).toBe(false);
      expect(req.reject).not.toHaveBeenCalled();
    });
  });

  // ============================================================================================================
  // validatorUtil.applyValidator - full per-action matrix (pass + fail)
  // ============================================================================================================

  describe('validatorUtil.applyValidator', () => {
    type Case = { name: string; validator: Validators; pass: string; fail: string };

    const cases: Case[] = [
      {
        name: 'startsWith',
        validator: { action: 'startsWith', target: 'Comment:' },
        pass: 'Comment: hi',
        fail: 'Hello there',
      },
      { name: 'endsWith', validator: { action: 'endsWith', target: 'N' }, pass: 'EndsWithN', fail: 'EndsWithX' },
      { name: 'isBoolean', validator: { action: 'isBoolean' }, pass: 'true', fail: 'maybe' },
      { name: 'isDecimal', validator: { action: 'isDecimal' }, pass: '0.1', fail: 'abc' },
      { name: 'isFloat', validator: { action: 'isFloat' }, pass: '3.14', fail: 'abc' },
      { name: 'isInt', validator: { action: 'isInt' }, pass: '42', fail: '3.14' },
      { name: 'isMailtoURI', validator: { action: 'isMailtoURI' }, pass: 'mailto:foo@bar.com', fail: 'http://foo.com' },
      { name: 'isNumeric', validator: { action: 'isNumeric' }, pass: '12345', fail: '12a45' },
      { name: 'isTime', validator: { action: 'isTime' }, pass: '23:59', fail: '25:61' },
      { name: 'isDate', validator: { action: 'isDate' }, pass: '2024-01-01', fail: 'not-a-date' },
      { name: 'isEmail', validator: { action: 'isEmail' }, pass: 'test@example.com', fail: 'not-an-email' },
      { name: 'isCurrency', validator: { action: 'isCurrency' }, pass: '$10,000.00', fail: 'abc' },
      { name: 'isIBAN', validator: { action: 'isIBAN' }, pass: 'DE89370400440532013000', fail: 'invalid' },
      { name: 'isIMEI', validator: { action: 'isIMEI' }, pass: '490154203237518', fail: '12345' },
      { name: 'isURL', validator: { action: 'isURL' }, pass: 'https://example.com', fail: 'not a url' },
      {
        name: 'isUUID',
        validator: { action: 'isUUID' },
        pass: '123e4567-e89b-12d3-a456-426614174000',
        fail: 'not-a-uuid',
      },
      { name: 'isCreditCard', validator: { action: 'isCreditCard' }, pass: '4111111111111111', fail: '1234' },
      {
        name: 'isLength',
        validator: { action: 'isLength', options: { min: 2, max: 5 } },
        pass: 'abc',
        fail: 'a',
      },
      { name: 'isAlpha', validator: { action: 'isAlpha', locale: 'en-US' }, pass: 'abc', fail: 'abc123' },
      {
        name: 'isAlphanumeric',
        validator: { action: 'isAlphanumeric', locale: 'en-US' },
        pass: 'abc123',
        fail: 'abc-123',
      },
      {
        name: 'isMobilePhone',
        validator: { action: 'isMobilePhone', locale: 'en-US' },
        pass: '+14155552671',
        fail: '123',
      },
      { name: 'isBIC', validator: { action: 'isBIC' }, pass: 'DEUTDEFF', fail: 'invalid' },
      { name: 'isEAN', validator: { action: 'isEAN' }, pass: '4006381333931', fail: '123' },
      { name: 'isHexadecimal', validator: { action: 'isHexadecimal' }, pass: '1A2B', fail: 'ZZZZ' },
      { name: 'isLatLong', validator: { action: 'isLatLong' }, pass: '40.741895,-73.989308', fail: 'not-latlong' },
      { name: 'isMD5', validator: { action: 'isMD5' }, pass: 'd41d8cd98f00b204e9800998ecf8427e', fail: 'nothash' },
      { name: 'isMimeType', validator: { action: 'isMimeType' }, pass: 'application/json', fail: 'not-a-mime' },
      { name: 'isPort', validator: { action: 'isPort' }, pass: '8080', fail: '99999999' },
      { name: 'isSlug', validator: { action: 'isSlug' }, pass: 'foo-bar', fail: 'foo bar!' },
      { name: 'isLowercase', validator: { action: 'isLowercase' }, pass: 'abc', fail: 'ABC' },
      { name: 'isUppercase', validator: { action: 'isUppercase' }, pass: 'ABC', fail: 'abc' },
      {
        name: 'isDataURI',
        validator: { action: 'isDataURI' },
        pass: 'data:text/plain;base64,SGVsbG8=',
        fail: 'not-a-datauri',
      },
      { name: 'isJSON', validator: { action: 'isJSON' }, pass: '{"a":1}', fail: '{a:1}' },
      {
        name: 'isJWT',
        validator: { action: 'isJWT' },
        pass: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        fail: 'not.jwt',
      },
      { name: 'isIP', validator: { action: 'isIP' }, pass: '192.168.0.1', fail: 'not-an-ip' },
      { name: 'isISBN', validator: { action: 'isISBN' }, pass: '3-8362-2119-5', fail: '123' },
      { name: 'isEmpty (means: has content)', validator: { action: 'isEmpty' }, pass: 'hello', fail: '' },
      {
        name: 'isPassportNumber',
        validator: { action: 'isPassportNumber', countryCode: 'DE' },
        pass: '123456789',
        fail: 'invalid!!',
      },
      { name: 'isVAT', validator: { action: 'isVAT', countryCode: 'DE' }, pass: 'DE811115931', fail: 'invalid' },
      {
        name: 'isIdentityCard',
        validator: { action: 'isIdentityCard', locale: 'ES' },
        pass: '12345678Z',
        fail: 'invalid',
      },
      {
        name: 'isPostalCode',
        validator: { action: 'isPostalCode', locale: 'US' },
        pass: '12345',
        fail: 'invalid',
      },
      { name: 'isIn', validator: { action: 'isIn', values: ['a', 'b', 'c'] }, pass: 'a', fail: 'z' },
      {
        name: 'isWhitelisted',
        validator: { action: 'isWhitelisted', chars: 'abc' },
        pass: 'abc',
        fail: 'abcd',
      },
      { name: 'equals', validator: { action: 'equals', comparison: 'abc' }, pass: 'abc', fail: 'xyz' },
      {
        name: 'contains',
        validator: { action: 'contains', seed: 'world' },
        pass: 'hello world',
        fail: 'hello there',
      },
      { name: 'matches', validator: { action: 'matches', pattern: /ell/ }, pass: 'hello', fail: 'goodbye' },
      {
        name: 'isHash',
        validator: { action: 'isHash', algorithm: 'md5' },
        pass: 'd41d8cd98f00b204e9800998ecf8427e',
        fail: 'nothash',
      },
      {
        name: 'isBefore',
        validator: { action: 'isBefore', date: '2500-01-01' },
        pass: '2000-01-01',
        fail: '2999-01-01',
      },
      {
        name: 'isAfter',
        validator: { action: 'isAfter', date: '2500-01-01' },
        pass: '2999-01-01',
        fail: '2000-01-01',
      },
    ];

    test.each(cases)('It should VALIDATE (pass) and REJECT (fail) : $name', ({ validator, pass, fail }) => {
      const passReq = buildReq({ field: pass });
      validatorUtil.applyValidator(passReq, validator, 'field');
      expect(passReq.reject).not.toHaveBeenCalled();

      const failReq = buildReq({ field: fail });
      validatorUtil.applyValidator(failReq, validator, 'field');
      expect(failReq.reject).toHaveBeenCalledTimes(1);
      expect(failReq.reject).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, expect.any(String));
    });

    test('It should REJECT : always, for an unsupported/unknown validator action (default branch returns false)', () => {
      const req = buildReq({ field: 'anything' });
      const validator = { action: 'notARealValidator' } as unknown as Validators;

      validatorUtil.applyValidator(req, validator, 'field');

      expect(req.reject).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, expect.any(String));
    });

    test('It should REJECT : with the provided customMessage instead of the templated default', () => {
      const req = buildReq({ field: 'not-an-email' });
      const validator: Validators = { action: 'isEmail', customMessage: 'Please provide a valid email address' };

      validatorUtil.applyValidator(req, validator, 'field');

      expect(req.reject).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, 'Please provide a valid email address');
    });

    describe('exposeValidatorResult: true', () => {
      test('It should RETURN : { [action]: true } and NOT reject, on a passing value', () => {
        const req = buildReq({ field: 'test@example.com' });
        const validator: Validators = { action: 'isEmail', exposeValidatorResult: true };

        const result = validatorUtil.applyValidator(req, validator, 'field');

        expect(result).toEqual({ isEmail: true });
        expect(req.reject).not.toHaveBeenCalled();
      });

      test('It should RETURN : { [action]: false } and NOT reject, on a failing value', () => {
        const req = buildReq({ field: 'not-an-email' });
        const validator: Validators = { action: 'isEmail', exposeValidatorResult: true };

        const result = validatorUtil.applyValidator(req, validator, 'field');

        expect(result).toEqual({ isEmail: false });
        expect(req.reject).not.toHaveBeenCalled();
      });
    });

    describe('edge inputs', () => {
      test('It should STRINGIFY : a missing field to the literal string "undefined" (only reachable by calling applyValidator directly, bypassing canValidate)', () => {
        // NOTE: this documents a real, but practically unreachable, edge case: the public `@Validate`
        // decorator always calls `canValidate` first, which short-circuits (returns false) whenever the
        // field is empty/missing - `applyValidator` is never reached in that case. Calling it directly
        // (as this test does) skips that guard, so `String(undefined)` = `'undefined'` is validated as-is.
        const req = buildReq({}); // 'field' key is entirely absent
        const validator: Validators = { action: 'isAlpha' };

        validatorUtil.applyValidator(req, validator, 'field');

        // 'undefined' is all letters, so isAlpha('undefined') is true - NOT rejected.
        expect(req.reject).not.toHaveBeenCalled();
      });

      test('It should VALIDATE : a numeric field value by coercing it to a string first', () => {
        const req = buildReq({ field: 42 });
        const validator: Validators = { action: 'isInt' };

        validatorUtil.applyValidator(req, validator, 'field');

        expect(req.reject).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================================================
  // Public path: @Validate decorator (covers the decorator glue calling into validatorUtil)
  // ============================================================================================================

  describe('@Validate (public path)', () => {
    class ComplaintHandler {
      public seenComment: string | undefined;

      @Validate<{ comment: string }>({ action: 'startsWith', target: 'Comment:' }, 'comment')
      public async recordComment(req: Request): Promise<string> {
        this.seenComment = (req.data as { comment?: string }).comment;
        return 'handled';
      }

      @Validate<{ comment: string }>(
        { action: 'startsWith', target: 'Comment:', mandatoryFieldValidation: true },
        'comment',
      )
      public async recordMandatoryComment(): Promise<string> {
        return 'handled';
      }

      @Validate<{ comment: string }>(
        { action: 'startsWith', target: 'Comment:', customMessage: 'Comment must start with "Comment:"' },
        'comment',
      )
      public async recordCustomMessageComment(): Promise<string> {
        return 'handled';
      }
    }

    test('It should CALL : the original method, when the field passes validation', async () => {
      const instance = new ComplaintHandler();
      const req = new CdsRequest({ data: { comment: 'Comment: looks good' } });

      const result = await instance.recordComment(req as unknown as Request);

      expect(result).toBe('handled');
      expect(instance.seenComment).toBe('Comment: looks good');
    });

    test('It should THROW : the templated validation error, when the field fails validation', async () => {
      const instance = new ComplaintHandler();
      const req = new CdsRequest({ data: { comment: 'Nope' } });

      await expect(instance.recordComment(req as unknown as Request)).rejects.toThrow(
        `{ comment : Nope } does not meet the constraints of validator 'startsWith' !`,
      );
    });

    test('It should THROW : the mandatory-field message, when the field is missing and mandatoryFieldValidation is true', async () => {
      const instance = new ComplaintHandler();
      const req = new CdsRequest({ data: {} });

      await expect(instance.recordMandatoryComment(req as unknown as Request)).rejects.toThrow(
        `Validator 'startsWith' is trying to validate the field 'comment'. Field 'comment' must be present in the Request body or not to be empty !`,
      );
    });

    test('It should THROW : the customMessage instead of the templated message, when provided', async () => {
      const instance = new ComplaintHandler();
      const req = new CdsRequest({ data: { comment: 'Nope' } });

      await expect(instance.recordCustomMessageComment(req as unknown as Request)).rejects.toThrow(
        'Comment must start with "Comment:"',
      );
    });

    test('It should SKIP : validation (and call the original method), when the field is missing and not mandatory', async () => {
      const instance = new ComplaintHandler();
      const req = new CdsRequest({ data: {} });

      const result = await instance.recordComment(req as unknown as Request);

      expect(result).toBe('handled');
      expect(instance.seenComment).toBeUndefined();
    });
  });
});
