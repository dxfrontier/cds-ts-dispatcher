/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { StatusCodes } from 'http-status-codes';
import { Request as CdsRequest } from '@sap/cds';

import formatterUtil from '../../../lib/util/formatter/formatterUtil';
import util from '../../../lib/util/util';
import constants from '../../../lib/constants/internalConstants';
import { FieldsFormatter } from '../../../lib';

import type { Formatters } from '../../../lib/types/formatter';
import type { Request } from '../../../lib/types/types';

/**
 * Minimal fabricated `Request`: enough for functions that only read `.data` / call `.reject(...)`
 * (`handleOneItemOfRequest`). Functions that internally call `util.findRequest` (`findResults`)
 * need a REAL `@sap/cds` `Request` instance instead - see the dedicated `findResults` describe block.
 */
const buildReq = (data: Record<string, unknown> = {}): Request =>
  ({
    data,
    reject: jest.fn(),
  }) as unknown as Request;

describe('FORMATTER-UTIL', () => {
  // ============================================================================================================
  // formatterUtil.applyFormatter - one row per formatter action
  // ============================================================================================================

  describe('formatterUtil.applyFormatter', () => {
    type Case = {
      name: string;
      formatter: Exclude<Formatters<unknown>, { action: 'customFormatter' }>;
      input: string;
      expected: string;
    };

    const cases: Case[] = [
      {
        name: 'truncate',
        formatter: { action: 'truncate', options: { length: 5 } },
        input: 'Hello World',
        expected: 'He...',
      },
      {
        name: 'replace',
        formatter: { action: 'replace', pattern: /o/g, replacement: '0' },
        input: 'Hello World',
        expected: 'Hell0 W0rld',
      },
      { name: 'camelCase', formatter: { action: 'camelCase' }, input: 'Hello World', expected: 'helloWorld' },
      { name: 'kebabCase', formatter: { action: 'kebabCase' }, input: 'Hello World', expected: 'hello-world' },
      { name: 'snakeCase', formatter: { action: 'snakeCase' }, input: 'Hello World', expected: 'hello_world' },
      { name: 'toUpper', formatter: { action: 'toUpper' }, input: 'hello', expected: 'HELLO' },
      { name: 'toLower', formatter: { action: 'toLower' }, input: 'HELLO', expected: 'hello' },
      { name: 'upperFirst', formatter: { action: 'upperFirst' }, input: 'hello', expected: 'Hello' },
      { name: 'lowerFirst', formatter: { action: 'lowerFirst' }, input: 'Hello', expected: 'hello' },
      {
        name: 'blacklist',
        formatter: { action: 'blacklist', charsToRemove: '0-9' },
        input: 'Hello123',
        expected: 'Hello',
      },
      { name: 'ltrim', formatter: { action: 'ltrim' }, input: '  hello  ', expected: 'hello  ' },
      { name: 'rtrim', formatter: { action: 'rtrim' }, input: '  hello  ', expected: '  hello' },
      { name: 'trim', formatter: { action: 'trim' }, input: '  hello  ', expected: 'hello' },
      { name: 'escape', formatter: { action: 'escape' }, input: `<a>'"&`, expected: '&lt;a&gt;&#x27;&quot;&amp;' },
      { name: 'unescape', formatter: { action: 'unescape' }, input: '&lt;a&gt;', expected: '<a>' },
    ];

    test.each(cases)('It should FORMAT : $name', ({ formatter, input, expected }) => {
      expect(formatterUtil.applyFormatter(formatter, input)).toBe(expected);
    });

    test('It should RETURN : an empty string, for an unsupported/unknown formatter action (default branch)', () => {
      const formatter = { action: 'notARealFormatter' } as unknown as Formatters<unknown>;

      expect(
        formatterUtil.applyFormatter(
          formatter as Exclude<Formatters<unknown>, { action: 'customFormatter' }>,
          'anything',
        ),
      ).toBe('');
    });

    test('It should COERCE : a non-string field value to a string before formatting', () => {
      expect(formatterUtil.applyFormatter({ action: 'toUpper' }, 42)).toBe('42');
      expect(formatterUtil.applyFormatter({ action: 'toUpper' }, true)).toBe('TRUE');
    });
  });

  // ============================================================================================================
  // formatterUtil.findResults
  // ============================================================================================================

  describe('formatterUtil.findResults', () => {
    test('It should RETURN : undefined, when no Request instance is present in args (rule 1)', () => {
      expect(formatterUtil.findResults([{}, 'not-a-request'])).toBeUndefined();
    });

    test('It should RETURN : undefined, when the Request is found but `.results` was never set (rule 2 - the BEFORE/ON, request-data path `@FieldsFormatter` depends on)', () => {
      const req = new CdsRequest({ data: {} });

      expect(formatterUtil.findResults([req])).toBeUndefined();
    });

    test('It should RETURN : the matching array, when req.results is an array and args contains that same array reference (rule 3)', () => {
      const req = new CdsRequest({ data: {} });
      const rows = [{ ID: 1 }, { ID: 2 }];
      (req as unknown as { results: unknown }).results = rows;

      expect(formatterUtil.findResults([rows, req])).toBe(rows);
    });

    // The non-array branch matches EITHER shape: the bare single result object directly (the common
    // AfterReadSingleInstance-style shape), or an array wrapping it (arg[0] === req.results), kept for
    // backward compatibility with any caller relying on the wrapped shape.
    test('It should RETURN : the wrapping array, when req.results is a single object and one arg is an array whose [0] is that object (rule 3)', () => {
      const req = new CdsRequest({ data: {} });
      const row = { ID: 1 };
      (req as unknown as { results: unknown }).results = row;
      const wrapper = [row];

      expect(formatterUtil.findResults([wrapper, req])).toBe(wrapper);
    });

    test('It should RETURN : the bare object itself, when req.results is a single object passed directly (not wrapped in an array) (rule 3)', () => {
      const req = new CdsRequest({ data: {} });
      const row = { ID: 1 };
      (req as unknown as { results: unknown }).results = row;

      expect(formatterUtil.findResults([row, req])).toBe(row);
    });

    // ----------------------------------------------------------------------------------------------------------
    // Fallback contract (rule 4, C5 fix): once a Request is found AND `.results` is set, but no arg matches it
    // by reference, `findResults` now returns `req.results` itself instead of `undefined` - this is what lets
    // `@Exclude` / `@Include` / `@Mask` / `@FieldsFormatter` actually shape the response on write-AFTER events
    // (`@AfterCreate` / `@AfterUpdate` / `@AfterDelete`), where `CDSDispatcher.executeAfterCallback` swaps the
    // callback argument to `req.data` (or a boolean, for DELETE) and nothing is ever identity-equal to
    // `req.results` any more. The two cases below (arrays with a non-matching arg present, and req.results a
    // single object with no match) previously asserted `undefined` here and directly contradicted this new
    // contract, so their expectations were updated in place rather than duplicated.
    // ----------------------------------------------------------------------------------------------------------

    test('It should RETURN : req.results itself (fallback), when req.results is an array but no arg matches it by reference', () => {
      const req = new CdsRequest({ data: {} });
      const rows = [{ ID: 1 }];
      (req as unknown as { results: unknown }).results = rows;

      expect(formatterUtil.findResults([req])).toBe(rows);
    });

    test('It should RETURN : req.results itself (fallback), when args contains an object that is not identical to req.results (array)', () => {
      const req = new CdsRequest({ data: {} });
      const rows = [{ ID: 1 }, { ID: 2 }];
      (req as unknown as { results: unknown }).results = rows;

      expect(formatterUtil.findResults([{ ID: 999 }, req])).toBe(rows);
    });

    test('It should RETURN : req.results itself (fallback), when req.results is a single object but no arg matches it (neither bare nor wrapped)', () => {
      const req = new CdsRequest({ data: {} });
      const row = { ID: 1 };
      (req as unknown as { results: unknown }).results = row;

      expect(formatterUtil.findResults([{ ID: 999 }, req])).toBe(row);
    });

    test('It should RETURN : req.results itself (fallback), when args contains the AfterDelete boolean swap instead of the real results (booleans never match by reference)', () => {
      const req = new CdsRequest({ data: {} });
      const rows = [{ ID: 1 }];
      (req as unknown as { results: unknown }).results = rows;

      expect(formatterUtil.findResults([true, req])).toBe(rows);
    });

    // These two mirror the REAL `req.results` shapes verified empirically against a live `@sap/cds` 10 /
    // `@cap-js/db-service` boot for a plain CREATE/UPDATE (see TRANSFORMERS-WRITE-EVENTS.test.ts's file
    // header): an `InsertResults`-style key-only row array for CREATE, and a permanently empty array for
    // UPDATE - `args` mirrors `CDSDispatcher.executeAfterCallback`'s actual swap: `[req.data, req]`.
    test('It should RETURN : req.results itself (fallback), for the real CREATE shape (key-only row array)', () => {
      const req = new CdsRequest({ data: { ID: 1, quantity: 9 } });
      const keyOnlyRow = [{ ID: 1 }];
      (req as unknown as { results: unknown }).results = keyOnlyRow;

      expect(formatterUtil.findResults([req.data, req])).toBe(keyOnlyRow);
    });

    test('It should RETURN : req.results itself (fallback), for the real UPDATE shape (permanently empty array)', () => {
      const req = new CdsRequest({ data: { saleDate: '2024-07-02' } });
      const emptyResults: unknown[] = [];
      (req as unknown as { results: unknown }).results = emptyResults;

      expect(formatterUtil.findResults([req.data, req])).toBe(emptyResults);
    });

    // Non-object results are NOT transformable: the fallback must preserve the pre-fix no-op for them
    // instead of handing them to the transformers (`delete null[field]` / `'x' in 1` would throw -> 500).
    test('It should RETURN : undefined (guarded fallback), when req.results is null (custom @On* handler replying null)', () => {
      const req = new CdsRequest({ data: {} });
      (req as unknown as { results: unknown }).results = null;

      expect(formatterUtil.findResults([[], req])).toBeUndefined();
    });

    test('It should RETURN : undefined (guarded fallback), when req.results is a number (legacy_srv_results delete count)', () => {
      const req = new CdsRequest({ data: {} });
      (req as unknown as { results: unknown }).results = 1;

      expect(formatterUtil.findResults([true, req])).toBeUndefined();
    });
  });

  // ============================================================================================================
  // formatterUtil.handleOneItem / handleManyItems
  // ============================================================================================================

  describe('formatterUtil.handleOneItem', () => {
    test('It should MUTATE : the given field on the single item, in place', () => {
      const item = { title: 'hello', keep: 'me' };

      formatterUtil.handleOneItem({ action: 'toUpper' }, item, 'title');

      expect(item).toEqual({ title: 'HELLO', keep: 'me' });
    });
  });

  describe('formatterUtil.handleManyItems', () => {
    test('It should MUTATE : the given field on every item of the array, in place', () => {
      const items = [{ title: 'a' }, { title: 'b' }, { title: 'c' }];

      formatterUtil.handleManyItems({ action: 'toUpper' }, items, 'title');

      expect(items.map((item) => item.title)).toEqual(['A', 'B', 'C']);
    });

    test('It should NOT touch : fields other than the targeted one', () => {
      const items = [{ title: 'a', other: 'z' }];

      formatterUtil.handleManyItems({ action: 'toUpper' }, items, 'title');

      expect(items[0].other).toBe('z');
    });
  });

  // ============================================================================================================
  // formatterUtil.handleOneItemOfRequest
  // ============================================================================================================

  describe('formatterUtil.handleOneItemOfRequest', () => {
    test('It should MUTATE : req.data[field] in place, when the field is present', () => {
      const req = buildReq({ title: 'hello' });

      formatterUtil.handleOneItemOfRequest(req, { action: 'toUpper' }, 'title');

      expect(req.data.title).toBe('HELLO');
      expect(req.reject).not.toHaveBeenCalled();
    });

    test('It should REJECT : with the field-not-exists message, when the field is missing', () => {
      const req = buildReq({});

      formatterUtil.handleOneItemOfRequest(req, { action: 'toUpper' }, 'title');

      const expectedMessage = util.buildMessage(constants.MESSAGES.VALIDATOR_FIELD_NOT_EXISTS, {
        action: 'toUpper',
        field: 'title',
      });

      expect(req.reject).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST, expectedMessage);
    });
  });

  // ============================================================================================================
  // formatterUtil.handleCustomFormatter
  // ============================================================================================================

  describe('formatterUtil.handleCustomFormatter', () => {
    test('It should CALL : the custom formatter callback with (req, results)', async () => {
      const req = buildReq({});
      const results = [{ ID: 1 }];
      const callback = jest.fn().mockResolvedValue(undefined);

      await formatterUtil.handleCustomFormatter(req, { action: 'customFormatter', callback }, results);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(req, results);
    });

    test('It should AWAIT : an async callback before returning', async () => {
      const req = buildReq({});
      let resolved = false;
      const callback = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        resolved = true;
      });

      await formatterUtil.handleCustomFormatter(req, { action: 'customFormatter', callback }, undefined);

      expect(resolved).toBe(true);
    });
  });

  // ============================================================================================================
  // Public path: @FieldsFormatter decorator (covers the decorator glue calling into formatterUtil)
  // ============================================================================================================

  describe('@FieldsFormatter (public path)', () => {
    class ProductHandler {
      @FieldsFormatter<{ title: string }>({ action: 'toUpper' }, 'title')
      public async beforeCreate(req: Request): Promise<void> {
        // BEFORE/ON style: no separate results arg - formatter applies directly to req.data.
      }

      @FieldsFormatter<{ title: string }>({ action: 'toUpper' }, 'title')
      public async afterReadMany(results: Array<{ title: string }>, req: Request): Promise<Array<{ title: string }>> {
        return results;
      }

      @FieldsFormatter<{ title: string }>({ action: 'toUpper' }, 'title')
      public async afterReadSingle(result: { title: string }, req: Request): Promise<{ title: string }> {
        return result;
      }

      @FieldsFormatter<{ title: string }>(
        {
          action: 'customFormatter',
          callback: async (_req, results) => {
            (results as Array<{ title: string }>)[0].title = 'CUSTOM';
          },
        },
        'title',
        'unused-second-field',
      )
      public async afterReadCustom(results: Array<{ title: string }>, req: Request): Promise<Array<{ title: string }>> {
        return results;
      }
    }

    test('It should APPLY : the formatter to req.data[field], for a BEFORE/ON-style call (no results arg)', async () => {
      const instance = new ProductHandler();
      const req = new CdsRequest({ data: { title: 'hello' } });

      await instance.beforeCreate(req as unknown as Request);

      expect((req.data as { title: string }).title).toBe('HELLO');
    });

    test('It should THROW : when the targeted field is missing from req.data (BEFORE/ON-style)', async () => {
      const instance = new ProductHandler();
      const req = new CdsRequest({ data: {} });

      await expect(instance.beforeCreate(req as unknown as Request)).rejects.toThrow(
        `Validator 'toUpper' is trying to validate the field 'title'. Field 'title' must be present in the Request body or not to be empty !`,
      );
    });

    test('It should APPLY : the formatter to every row, for an AFTER-many-style call (results is an array)', async () => {
      const instance = new ProductHandler();
      const rows = [{ title: 'a' }, { title: 'b' }];
      const req = new CdsRequest({ data: {} });
      (req as unknown as { results: unknown }).results = rows;

      const result = await instance.afterReadMany(rows, req as unknown as Request);

      expect(result.map((row) => row.title)).toEqual(['A', 'B']);
    });

    test('It should APPLY : the formatter to a single BARE result object (AfterReadSingleInstance-style, non-array results)', async () => {
      const instance = new ProductHandler();
      const row = { title: 'hello' };
      const req = new CdsRequest({ data: {} });
      // AFTER-single style: args = [singleObject, req], mirroring CDSDispatcher's
      // registerAfterSingleInstanceHandler, which unwraps the array to a single item before calling
      // the user handler - req.results here is that same bare object, not an array.
      (req as unknown as { results: unknown }).results = row;

      const result = await instance.afterReadSingle(row, req as unknown as Request);

      expect(result.title).toBe('HELLO');
    });

    test('It should CALL : the custom formatter callback exactly once, even when multiple fields are listed', async () => {
      const instance = new ProductHandler();
      const rows = [{ title: 'a' }];
      const req = new CdsRequest({ data: {} });
      (req as unknown as { results: unknown }).results = rows;

      const result = await instance.afterReadCustom(rows, req as unknown as Request);

      expect(result[0].title).toBe('CUSTOM');
    });
  });
});
