/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import cds from '@sap/cds';

import parameterUtil from '../../../lib/util/parameter/parameterUtil';
import util from '../../../lib/util/util';

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

  // ============================================================================================================
  // Requests without a query / HTTP part (unbound actions, `srv.send`, queued / scheduled / messaging dispatch)
  // ============================================================================================================

  describe('requests without `req.query`', () => {
    const reqWithoutQuery = (): Request => ({}) as unknown as Request;

    test('It should RETURN : false, for @IsColumnSupplied when the request carries no query', () => {
      const args: any[] = [];
      const metadata: MetadataFields[] = [{ type: 'CHECK_COLUMN_VALUE', parameterIndex: 0, property: 'name' }];

      parameterUtil.applyIsColumnSupplied(reqWithoutQuery(), args, metadata);

      expect(args[0]).toBe(false);
    });

    test("It should RETURN : undefined, for @GetQuery('SELECT', 'columns' | 'where' | 'limit.rows') when the request carries no query", () => {
      const args: unknown[] = ['untouched', 'untouched', 'untouched'];
      const metadata: MetadataFields[] = [
        { type: 'QUERY', parameterIndex: 0, property: 'columns', key: 'SELECT' },
        { type: 'QUERY', parameterIndex: 1, property: 'where', key: 'SELECT' },
        { type: 'QUERY', parameterIndex: 2, property: 'limit.rows', key: 'SELECT' },
      ];

      parameterUtil.applyIsPresentOrGetDecorator('Get', metadata, reqWithoutQuery(), args);

      expect(args).toEqual([undefined, undefined, undefined]);
    });

    test("It should RETURN : false, for @IsPresent('SELECT', 'columns' | 'where' | 'limit.rows') when the request carries no query", () => {
      const args: unknown[] = [];
      const metadata: MetadataFields[] = [
        { type: 'QUERY', parameterIndex: 0, property: 'columns', key: 'SELECT' },
        { type: 'QUERY', parameterIndex: 1, property: 'where', key: 'SELECT' },
        { type: 'QUERY', parameterIndex: 2, property: 'limit.rows', key: 'SELECT' },
      ];

      parameterUtil.applyIsPresentOrGetDecorator('IsPresent', metadata, reqWithoutQuery(), args);

      expect(args).toEqual([false, false, false]);
    });
  });

  describe('requests without an HTTP part', () => {
    test('It should RETURN : undefined, for @Jwt when the request has no `req.http`', () => {
      const req = {} as unknown as Request;

      expect(parameterUtil.retrieveJwt(req)).toBeUndefined();
    });

    test('It should RETURN : undefined, for @Jwt when `req.http` carries no incoming request', () => {
      const req = { http: {} } as unknown as Request;

      expect(parameterUtil.retrieveJwt(req)).toBeUndefined();
    });

    test('It should RETURN : undefined, for @Locale when the request carries no locale', () => {
      const req = {} as unknown as Request;

      expect(parameterUtil.retrieveLocale(req)).toBeUndefined();
    });
  });

  // ============================================================================================================
  // parameterUtil.extractArguments / util type guards - `null` and primitive handler arguments
  // ============================================================================================================

  describe('parameterUtil.extractArguments', () => {
    const buildRequest = (): Request => new cds.Request({ event: 'returnNull', data: {} }) as unknown as Request;

    test('It should MAP : a null first argument (after-callback result) to results, next to the request', () => {
      const req = buildRequest();

      const extracted = parameterUtil.extractArguments([null, req]);

      expect(extracted.results).toBeNull();
      expect(extracted.req).toBe(req);
    });

    test('It should MAP : a string first argument (after-callback result) to results, next to the request', () => {
      const req = buildRequest();

      const extracted = parameterUtil.extractArguments(['hi', req]);

      expect(extracted.results).toBe('hi');
      expect(extracted.req).toBe(req);
    });

    test('It should MAP : numbers 42 and 1 in the first argument to results unchanged', () => {
      expect(parameterUtil.extractArguments([42, buildRequest()]).results).toBe(42);
      expect(parameterUtil.extractArguments([1, buildRequest()]).results).toBe(1);
    });

    test('It should NOT THROW : for null, symbol or bigint arguments after the first one, and ignore them', () => {
      const req = buildRequest();

      const extracted = parameterUtil.extractArguments([req, null, Symbol('x'), BigInt(1)]);

      expect(extracted.req).toBe(req);
      expect(extracted.results).toBeUndefined();
    });

    test('It should KEEP : the request / next mapping of an ON handler (regression)', () => {
      const req = buildRequest();
      const next = (): void => {};

      const extracted = parameterUtil.extractArguments([req, next]);

      expect(extracted.req).toBe(req);
      expect(extracted.next).toBe(next);
      expect(extracted.results).toBeUndefined();
    });

    test('It should KEEP : the error / request mapping of an ON error handler (regression)', () => {
      const req = buildRequest();
      const error = new Error('boom');

      const extracted = parameterUtil.extractArguments([error, req]);

      expect(extracted.error).toBe(error);
      expect(extracted.req).toBe(req);
      expect(extracted.results).toBeUndefined();
    });
  });

  describe('util type guards with null', () => {
    test('It should RETURN : false, for util.isMsgEvent(null)', () => {
      expect(util.isMsgEvent(null)).toBe(false);
    });

    test('It should RETURN : true, for util.isMsgEvent on a message-shaped object (regression)', () => {
      expect(util.isMsgEvent({ inbound: {}, event: 'e', data: {}, headers: {} })).toBe(true);
    });

    test('It should RETURN : false, for util.isNextEvent(null) and util.isRequestType(null)', () => {
      expect(util.isNextEvent(null)).toBe(false);
      expect(util.isRequestType(null)).toBe(false);
    });

    test('It should RETURN : undefined, for util.findRequest over null arguments', () => {
      expect(util.findRequest([null, undefined])).toBeUndefined();
    });
  });
});
