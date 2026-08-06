/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import parameterUtil from '../../../lib/util/parameter/parameterUtil';

import type { MetadataFields } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

/**
 * Minimal fabricated `Request`: only `.query` is read by `applyIsColumnSupplied` /
 * `applyIsPresentOrGetDecorator`, so nothing else needs to be present on the mock.
 */
const buildReq = (query: Record<string, unknown>): Request => ({ query }) as unknown as Request;

describe('PARAMETER-QUERY-GUARDS', () => {
  // ============================================================================================================
  // parameterUtil.applyIsColumnSupplied (C3: INSERT/UPSERT `.columns` dereferenced unguarded)
  // ============================================================================================================

  describe('parameterUtil.applyIsColumnSupplied', () => {
    describe('INSERT', () => {
      test('It should RETURN : true, when INSERT carries only `entries` and the field is present in an entry', () => {
        const req = buildReq({ INSERT: { entries: [{ totalAmount: 100 }] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'totalAmount' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(true);
      });

      test('It should RETURN : false, when INSERT carries only `entries` and the field is absent from every entry', () => {
        const req = buildReq({ INSERT: { entries: [{ totalAmount: 100 }] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'createdAt' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(false);
      });

      test('It should RETURN : false (explicit columns WIN), when INSERT carries BOTH columns and entries and the field is only in an entry', () => {
        const req = buildReq({ INSERT: { columns: ['a'], entries: [{ b: 1 }] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'b' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(false);
      });

      test('It should RETURN : true, when INSERT carries an explicit `columns` array containing the field (regression)', () => {
        const req = buildReq({ INSERT: { columns: ['a', 'b'] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'b' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(true);
      });

      test('It should RETURN : false, when INSERT carries NEITHER columns nor entries', () => {
        const req = buildReq({ INSERT: {} });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'x' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(false);
      });

      test('It should RETURN : false (an explicitly EMPTY columns array still WINS over entries)', () => {
        const req = buildReq({ INSERT: { columns: [], entries: [{ a: 1 }] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'a' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(false);
      });
    });

    describe('UPDATE / DELETE (no columns list on these queries)', () => {
      test('It should LEAVE : the argument untouched (undefined) for UPDATE and DELETE requests', () => {
        for (const query of [{ UPDATE: { data: { x: 1 } } }, { DELETE: { from: 'Books' } }]) {
          const req = buildReq(query);
          const args: any[] = [];
          const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'x' }];

          parameterUtil.applyIsColumnSupplied(req, args, metadata);

          expect(args[0]).toBeUndefined();
        }
      });
    });

    describe('UPSERT (mirrors INSERT)', () => {
      test('It should RETURN : true, when UPSERT carries only `entries` and the field is present in an entry', () => {
        const req = buildReq({ UPSERT: { entries: [{ totalAmount: 100 }] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'totalAmount' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(true);
      });

      test('It should RETURN : false, when UPSERT carries only `entries` and the field is absent from every entry', () => {
        const req = buildReq({ UPSERT: { entries: [{ totalAmount: 100 }] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'createdAt' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(false);
      });
    });

    describe('SELECT (regression - untouched semantics)', () => {
      test('It should RETURN : true, for ref-shaped SELECT columns matching the field', () => {
        const req = buildReq({ SELECT: { columns: [{ ref: ['title'] }] } });
        const args: any[] = [];
        const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'title' }];

        parameterUtil.applyIsColumnSupplied(req, args, metadata);

        expect(args[0]).toBe(true);
      });
    });
  });

  // ============================================================================================================
  // parameterUtil.applyIsPresentOrGetDecorator - 'columns' case (C4: IsPresent hardcoded to SELECT)
  // ============================================================================================================

  describe("parameterUtil.applyIsPresentOrGetDecorator - 'columns' case", () => {
    test("It should RETURN : true, for IsPresent('INSERT', 'columns') when req.query.INSERT.columns is set", () => {
      const req = buildReq({ INSERT: { columns: ['totalAmount'] } });
      const args: unknown[] = [];
      const metadata: MetadataFields[] = [{ type: 'QUERY', parameterIndex: 0, property: 'columns', key: 'INSERT' }];

      parameterUtil.applyIsPresentOrGetDecorator('IsPresent', metadata, req, args);

      expect(args[0]).toBe(true);
    });

    test("It should RETURN : false, for IsPresent('INSERT', 'columns') when req.query.INSERT carries no columns", () => {
      const req = buildReq({ INSERT: { entries: [{ totalAmount: 100 }] } });
      const args: unknown[] = [];
      const metadata: MetadataFields[] = [{ type: 'QUERY', parameterIndex: 0, property: 'columns', key: 'INSERT' }];

      parameterUtil.applyIsPresentOrGetDecorator('IsPresent', metadata, req, args);

      expect(args[0]).toBe(false);
    });

    test("It should RETURN : true, for IsPresent('SELECT', 'columns') when req.query.SELECT.columns is set (regression)", () => {
      const req = buildReq({ SELECT: { columns: [{ ref: ['title'] }] } });
      const args: unknown[] = [];
      const metadata: MetadataFields[] = [{ type: 'QUERY', parameterIndex: 0, property: 'columns', key: 'SELECT' }];

      parameterUtil.applyIsPresentOrGetDecorator('IsPresent', metadata, req, args);

      expect(args[0]).toBe(true);
    });

    test("It should RETURN : the columns array itself, for Get('INSERT', 'columns') (regression)", () => {
      const columns = ['totalAmount', 'status'];
      const req = buildReq({ INSERT: { columns } });
      const args: unknown[] = [];
      const metadata: MetadataFields[] = [{ type: 'QUERY', parameterIndex: 0, property: 'columns', key: 'INSERT' }];

      parameterUtil.applyIsPresentOrGetDecorator('Get', metadata, req, args);

      expect(args[0]).toBe(columns);
    });
  });
});
