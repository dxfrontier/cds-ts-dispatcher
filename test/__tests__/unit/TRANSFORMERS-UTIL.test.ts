/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { Request as CdsRequest } from '@sap/cds';

import transformersUtil from '../../../lib/util/transformers/transformersUtil';
import { Exclude, Include, Mask } from '../../../lib';

import type { MaskOptions } from '../../../lib/types/responseTransformers';
import type { Request } from '../../../lib/types/types';

describe('TRANSFORMERS-UTIL', () => {
  // ============================================================================================================
  // transformersUtil.findResults - thin delegation to formatterUtil.findResults (see FORMATTER-UTIL.test.ts
  // for the full matching-algorithm matrix); only the delegation itself is verified here.
  // ============================================================================================================

  describe('transformersUtil.findResults', () => {
    test('It should DELEGATE : to formatterUtil.findResults and return the matching array', () => {
      const req = new CdsRequest({ data: {} });
      const rows = [{ ID: 1 }];
      (req as unknown as { results: unknown }).results = rows;

      expect(transformersUtil.findResults([rows, req])).toBe(rows);
    });

    test('It should RETURN : undefined, when no Request is present in args', () => {
      expect(transformersUtil.findResults([{}])).toBeUndefined();
    });

    test('It should DELEGATE : and match a bare single result object directly (AfterReadSingleInstance-style)', () => {
      const req = new CdsRequest({ data: {} });
      const row = { ID: 1 };
      (req as unknown as { results: unknown }).results = row;

      expect(transformersUtil.findResults([row, req])).toBe(row);
    });
  });

  // ============================================================================================================
  // transformersUtil.excludeFieldsFromItem / excludeFields
  // ============================================================================================================

  describe('transformersUtil.excludeFieldsFromItem', () => {
    test('It should DELETE : the given fields from the item, in place, and return undefined', () => {
      const item: { password?: string; ssn?: string; name: string } = { password: 'secret', ssn: '123', name: 'Bob' };

      const returnValue = transformersUtil.excludeFieldsFromItem(item, ['password', 'ssn']);

      expect(returnValue).toBeUndefined();
      expect(item).toEqual({ name: 'Bob' });
    });
  });

  describe('transformersUtil.excludeFields', () => {
    test('It should NO-OP : when results is undefined', () => {
      expect(transformersUtil.excludeFields(undefined, ['password'])).toBeUndefined();
    });

    test('It should MUTATE : every item of an array in place (same array reference, no clone)', () => {
      const results = [
        { ID: 1, password: 'a' },
        { ID: 2, password: 'b' },
      ];
      const originalRef = results;

      transformersUtil.excludeFields(results, ['password']);

      expect(results).toBe(originalRef);
      expect(results).toEqual([{ ID: 1 }, { ID: 2 }]);
    });

    test('It should MUTATE : a single object in place (same object reference, no clone)', () => {
      const result: { ID: number; password?: string } = { ID: 1, password: 'a' };
      const originalRef = result;

      transformersUtil.excludeFields(result, ['password']);

      expect(result).toBe(originalRef);
      expect(result).toEqual({ ID: 1 });
    });
  });

  // ============================================================================================================
  // transformersUtil.includeOnlyFieldsFromItem / includeFields
  // ============================================================================================================

  describe('transformersUtil.includeOnlyFieldsFromItem', () => {
    test('It should KEEP : only the given fields, deleting everything else, in place', () => {
      const item = { ID: 1, name: 'Bob', password: 'secret', ssn: '123' };

      transformersUtil.includeOnlyFieldsFromItem(item, ['ID', 'name']);

      expect(item).toEqual({ ID: 1, name: 'Bob' });
    });

    test('It should KEEP : nothing, when the include list is empty', () => {
      const item: Record<string, unknown> = { ID: 1, name: 'Bob' };

      transformersUtil.includeOnlyFieldsFromItem(item, []);

      expect(item).toEqual({});
    });
  });

  describe('transformersUtil.includeFields', () => {
    test('It should NO-OP : when results is undefined', () => {
      expect(transformersUtil.includeFields(undefined, ['ID'])).toBeUndefined();
    });

    test('It should MUTATE : every item of an array in place (same array reference, no clone)', () => {
      const results = [
        { ID: 1, name: 'a', password: 'x' },
        { ID: 2, name: 'b', password: 'y' },
      ];
      const originalRef = results;

      transformersUtil.includeFields(results, ['ID', 'name']);

      expect(results).toBe(originalRef);
      expect(results).toEqual([
        { ID: 1, name: 'a' },
        { ID: 2, name: 'b' },
      ]);
    });

    test('It should MUTATE : a single object in place (same object reference, no clone)', () => {
      const result = { ID: 1, name: 'a', password: 'x' };
      const originalRef = result;

      transformersUtil.includeFields(result, ['ID']);

      expect(result).toBe(originalRef);
      expect(result).toEqual({ ID: 1 });
    });
  });

  // ============================================================================================================
  // transformersUtil.maskValue
  // ============================================================================================================

  describe('transformersUtil.maskValue', () => {
    const opts = (overrides: Partial<Required<MaskOptions>> = {}): Required<MaskOptions> => ({
      char: '*',
      visibleStart: 0,
      visibleEnd: 4,
      ...overrides,
    });

    test.each([
      ['null', null],
      ['undefined', undefined],
    ])('It should RETURN : an empty string, for a nil value (%s)', (_label, value) => {
      expect(transformersUtil.maskValue(value, opts())).toBe('');
    });

    test('It should RETURN : the value unchanged, when its length is <= visibleStart + visibleEnd', () => {
      expect(transformersUtil.maskValue('123', opts({ visibleStart: 0, visibleEnd: 4 }))).toBe('123');
    });

    test('It should MASK : the middle, keeping visibleStart chars at the start and visibleEnd chars at the end', () => {
      expect(transformersUtil.maskValue('1234567890', opts({ visibleStart: 2, visibleEnd: 2 }))).toBe('12******90');
    });

    test('It should MASK : with the default-shaped options (visibleStart: 0, visibleEnd: 4)', () => {
      expect(transformersUtil.maskValue('1234567890', opts())).toBe('******7890');
    });

    test('It should MASK : the entire value, when visibleEnd is 0 (handles the `-0` slice edge case)', () => {
      expect(transformersUtil.maskValue('1234567890', opts({ visibleStart: 2, visibleEnd: 0 }))).toBe('12********');
    });

    test('It should USE : a custom mask character', () => {
      expect(transformersUtil.maskValue('1234567890', opts({ char: '#', visibleStart: 0, visibleEnd: 4 }))).toBe(
        '######7890',
      );
    });

    test('It should COERCE : a non-string value to a string before masking', () => {
      expect(transformersUtil.maskValue(1234567890, opts({ visibleStart: 0, visibleEnd: 4 }))).toBe('******7890');
    });
  });

  // ============================================================================================================
  // transformersUtil.maskFieldsInItem / maskFields
  // ============================================================================================================

  describe('transformersUtil.maskFieldsInItem', () => {
    test('It should MASK : only fields that exist on the item, in place', () => {
      const item: { creditCard: string; other: string } = { creditCard: '4111111111111111', other: 'untouched' };

      transformersUtil.maskFieldsInItem(item, ['creditCard'], { char: '*', visibleStart: 0, visibleEnd: 4 });

      expect(item.creditCard).toBe('************1111');
      expect(item.other).toBe('untouched');
    });

    test('It should SKIP : fields that are not present on the item (does not add them)', () => {
      const item: { name: string; creditCard?: string } = { name: 'Bob' };

      transformersUtil.maskFieldsInItem(item, ['creditCard'], { char: '*', visibleStart: 0, visibleEnd: 4 });

      expect('creditCard' in item).toBe(false);
    });
  });

  describe('transformersUtil.maskFields', () => {
    test('It should NO-OP : when results is undefined', () => {
      expect(transformersUtil.maskFields(undefined, ['creditCard'], {})).toBeUndefined();
    });

    test('It should APPLY : default options (char: "*", visibleStart: 0, visibleEnd: 4), when none are given', () => {
      const result = { creditCard: '4111111111111111' };

      transformersUtil.maskFields(result, ['creditCard'], {});

      expect(result.creditCard).toBe('************1111');
    });

    test('It should MUTATE : every item of an array in place, using the resolved options', () => {
      const results = [{ creditCard: '4111111111111111' }, { creditCard: '5500000000000004' }];

      transformersUtil.maskFields(results, ['creditCard'], { char: 'X', visibleStart: 2, visibleEnd: 4 });

      expect(results[0].creditCard).toBe('41XXXXXXXXXX1111');
      expect(results[1].creditCard).toBe('55XXXXXXXXXX0004');
    });

    test('It should MUTATE : a single object in place, using the resolved options', () => {
      const result = { creditCard: '4111111111111111' };
      const originalRef = result;

      transformersUtil.maskFields(result, ['creditCard'], { visibleStart: 2, visibleEnd: 2 });

      expect(result).toBe(originalRef);
      expect(result.creditCard).toBe('41************11');
    });
  });

  // ============================================================================================================
  // Public path: @Exclude, @Include, @Mask decorators (covers the decorator glue calling into transformersUtil)
  // ============================================================================================================

  describe('@Exclude / @Include / @Mask (public path)', () => {
    class UserHandler {
      @Exclude<{ ID: number; password: string }>('password')
      public async afterReadExclude(results: Array<{ ID: number; password?: string }>, req: Request): Promise<string> {
        return 'exclude-done';
      }

      @Include<{ ID: number; name: string; password: string }>('ID', 'name')
      public async afterReadInclude(
        results: Array<{ ID: number; name: string; password?: string }>,
        req: Request,
      ): Promise<string> {
        return 'include-done';
      }

      @Mask<{ ID: number; creditCard: string }>(['creditCard'], { visibleStart: 0, visibleEnd: 4 })
      public async afterReadMask(results: Array<{ ID: number; creditCard: string }>, req: Request): Promise<string> {
        return 'mask-done';
      }

      @Mask<{ ID: number; creditCard: string }>(['creditCard'], { visibleStart: 0, visibleEnd: 4 })
      public async afterReadMaskSingle(result: { ID: number; creditCard: string }, req: Request): Promise<string> {
        return 'mask-single-done';
      }
    }

    const withResults = <T>(rows: T[]) => {
      const req = new CdsRequest({ data: {} });
      (req as unknown as { results: unknown }).results = rows;
      return req as unknown as Request;
    };

    const withSingleResult = <T>(row: T) => {
      const req = new CdsRequest({ data: {} });
      (req as unknown as { results: unknown }).results = row;
      return req as unknown as Request;
    };

    test('It should EXCLUDE : the field from every row AND preserve the original method return value', async () => {
      const instance = new UserHandler();
      const rows = [{ ID: 1, password: 'secret' }];

      const returnValue = await instance.afterReadExclude(rows, withResults(rows));

      expect(returnValue).toBe('exclude-done');
      expect(rows[0]).toEqual({ ID: 1 });
    });

    test('It should INCLUDE : only the listed fields on every row AND preserve the original method return value', async () => {
      const instance = new UserHandler();
      const rows = [{ ID: 1, name: 'Bob', password: 'secret' }];

      const returnValue = await instance.afterReadInclude(rows, withResults(rows));

      expect(returnValue).toBe('include-done');
      expect(rows[0]).toEqual({ ID: 1, name: 'Bob' });
    });

    test('It should MASK : the field on every row AND preserve the original method return value', async () => {
      const instance = new UserHandler();
      const rows = [{ ID: 1, creditCard: '4111111111111111' }];

      const returnValue = await instance.afterReadMask(rows, withResults(rows));

      expect(returnValue).toBe('mask-done');
      expect(rows[0].creditCard).toBe('************1111');
    });

    test('It should MASK : a single BARE result object (AfterReadSingleInstance-style) AND preserve the return value', async () => {
      const instance = new UserHandler();
      const row = { ID: 1, creditCard: '4111111111111111' };

      const returnValue = await instance.afterReadMaskSingle(row, withSingleResult(row));

      expect(returnValue).toBe('mask-single-done');
      expect(row.creditCard).toBe('************1111');
    });
  });
});
