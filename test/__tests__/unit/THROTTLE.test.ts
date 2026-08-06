/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { EntityHandler, OnAction, OnError, Throttle } from '../../../lib';
import constants from '../../../lib/constants/internalConstants';
import throttleUtil from '../../../lib/util/decorators/throttleUtil';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { Request } from '../../../lib/types/types';

const buildReq = (extra: Record<string, unknown> = {}) =>
  ({ user: { id: 'alice' }, tenant: 't1', reject: jest.fn(), data: {}, headers: {}, ...extra }) as unknown as Request;

describe('THROTTLE', () => {
  describe('throttleUtil.consume', () => {
    test('It should ALLOW : the first `limit` hits inside one window', () => {
      const store = new Map<string, { count: number; start: number }>();
      expect(throttleUtil.consume(store, 'alice', 2, 1000, 0).allowed).toBe(true);
      expect(throttleUtil.consume(store, 'alice', 2, 1000, 10).allowed).toBe(true);
    });

    test('It should REJECT : hit limit+1 inside the window and report retryAfterMs', () => {
      const store = new Map<string, { count: number; start: number }>();
      throttleUtil.consume(store, 'alice', 2, 1000, 0);
      throttleUtil.consume(store, 'alice', 2, 1000, 10);
      const third = throttleUtil.consume(store, 'alice', 2, 1000, 20);
      expect(third.allowed).toBe(false);
      expect(third.retryAfterMs).toBe(980);
    });

    test('It should RESET : a hit at/after window expiry opens a fresh window', () => {
      const store = new Map<string, { count: number; start: number }>();
      throttleUtil.consume(store, 'alice', 1, 1000, 0);
      expect(throttleUtil.consume(store, 'alice', 1, 1000, 1000).allowed).toBe(true);
    });

    test('It should SWEEP : expired foreign keys are removed lazily on hit', () => {
      const store = new Map<string, { count: number; start: number }>();
      throttleUtil.consume(store, 'alice', 1, 1000, 0);
      throttleUtil.consume(store, 'bob', 1, 1000, 2000);
      expect(store.has('alice')).toBe(false);
    });

    test('It should ISOLATE : different keys count independently', () => {
      const store = new Map<string, { count: number; start: number }>();
      expect(throttleUtil.consume(store, 'alice', 1, 1000, 0).allowed).toBe(true);
      expect(throttleUtil.consume(store, 'bob', 1, 1000, 0).allowed).toBe(true);
      expect(throttleUtil.consume(store, 'alice', 1, 1000, 10).allowed).toBe(false);
    });
  });

  describe('throttleUtil.resolveKey', () => {
    test('It should KEY : by user id per default and fall back to anonymous', () => {
      expect(throttleUtil.resolveKey(buildReq(), undefined)).toBe('alice');
      expect(throttleUtil.resolveKey(buildReq({ user: undefined }), 'user')).toBe('anonymous');
    });

    test('It should KEY : by tenant with a no-tenant fallback', () => {
      expect(throttleUtil.resolveKey(buildReq(), 'tenant')).toBe('t1');
      expect(throttleUtil.resolveKey(buildReq({ tenant: undefined }), 'tenant')).toBe('no-tenant');
    });
  });

  describe('decorator wiring', () => {
    test('It should MARK : the method with the THROTTLE_KEY metadata marker', () => {
      @EntityHandler(Book)
      class Marked {
        @OnAction('CatalogService.throttledPing')
        @Throttle({ limit: 3, window: 10_000 })
        public async ping(req: Request) {
          return req;
        }
      }
      expect(Reflect.getOwnMetadata(constants.DECORATOR.THROTTLE_KEY, Marked.prototype, 'ping')).toEqual({
        limit: 3,
        window: 10_000,
      });
    });

    test('It should THROW : at decoration time for limit < 1 or window < 1', () => {
      expect(() => {
        class Bad {
          @Throttle({ limit: 0, window: 1000 })
          public async m(req: Request) {
            return req;
          }
        }
        return Bad;
      }).toThrow(/limit/i);
      expect(() => {
        class Bad2 {
          @Throttle({ limit: 1, window: 0 })
          public async m(req: Request) {
            return req;
          }
        }
        return Bad2;
      }).toThrow(/window/i);
    });

    test('It should THROW : at decoration time when @OnError is stacked on a throttled method', () => {
      expect(() => {
        @EntityHandler(Book)
        class Bad {
          @OnError()
          @Throttle({ limit: 1, window: 1000 })
          public onError(err: Error, req: Request) {
            return [err, req];
          }
        }
        return Bad;
      }).toThrow(/@Throttle.*@OnError|@OnError.*@Throttle/);
    });

    test('It should REJECT : with 429 through req.reject once the limit is exhausted', async () => {
      class Wrapped {
        @Throttle({ limit: 1, window: 60_000 })
        public async ping(req: Request) {
          return 'pong';
        }
      }
      const instance = new Wrapped();
      const first = buildReq();
      // req must be an actual cds.Request for util.findRequest - emulate with prototype trick:
      const cds = require('@sap/cds');
      Object.setPrototypeOf(first, cds.Request.prototype);
      await expect(instance.ping(first)).resolves.toBe('pong');

      const second = buildReq();
      Object.setPrototypeOf(second, cds.Request.prototype);
      (second as any).reject = jest.fn(() => {
        throw new Error('429');
      });
      await expect(instance.ping(second)).rejects.toThrow('429');
      expect((second as any).reject).toHaveBeenCalledWith(429, expect.stringContaining('1'));
    });

    test('It should KEY : by tenant through the decorator - same tenant, different users share one window', async () => {
      class TenantWrapped {
        @Throttle({ limit: 1, window: 60_000, by: 'tenant' })
        public async ping(req: Request) {
          return 'pong';
        }
      }
      const instance = new TenantWrapped();
      const cds = require('@sap/cds');

      const first = buildReq({ user: { id: 'alice' }, tenant: 'shared-tenant' });
      Object.setPrototypeOf(first, cds.Request.prototype);
      await expect(instance.ping(first as unknown as Request)).resolves.toBe('pong');

      const second = buildReq({ user: { id: 'bob' }, tenant: 'shared-tenant' });
      Object.setPrototypeOf(second, cds.Request.prototype);
      (second as any).reject = jest.fn(() => {
        throw new Error('429');
      });
      await expect(instance.ping(second as unknown as Request)).rejects.toThrow('429');
      expect((second as any).reject).toHaveBeenCalledWith(429, expect.stringContaining('tenant'));
    });

    test('It should THROW : a descriptive error when no cds.Request is among the arguments', async () => {
      class NoReq {
        @Throttle({ limit: 1, window: 1000 })
        public async m(payload: { x: number }) {
          return payload.x;
        }
      }
      await expect(new NoReq().m({ x: 1 })).rejects.toThrow(/@Throttle.*Request/);
    });
  });
});
