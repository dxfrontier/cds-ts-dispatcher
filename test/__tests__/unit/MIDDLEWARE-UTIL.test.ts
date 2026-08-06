/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { Request as CdsRequest } from '@sap/cds';

import middlewareUtil from '../../../lib/util/middleware/middlewareUtil';

import type { MiddlewareImpl, NextMiddleware, Request, RequestType } from '../../../lib/types/types';
import type { Constructable } from '../../../lib/types/internalTypes';

/**
 * Minimal fabricated `Request`: `executeMiddlewareChain` only ever checks `isRejectUsed` (`req
 * instanceof Error`) before running the chain, and `registerToMethod`'s req-detection uses
 * `util.isRequestType` (`arg instanceof` the real `@sap/cds` `Request` class) - a real instance is the
 * simplest way to satisfy both call sites with the same fixture.
 */
const buildReq = (): Request => new CdsRequest({ data: {} }) as unknown as Request;

/**
 * Call-counting middleware classes for the M9 (`executeMiddlewareChain`) tests below - each owns its
 * OWN static counter, so a doubled tail is visible per-middleware and not hidden behind an aggregate.
 */
class CountingMiddlewareM1 implements MiddlewareImpl {
  public static callCount = 0;

  public async use(req: Request, next: NextMiddleware): Promise<void> {
    CountingMiddlewareM1.callCount += 1;
    await next();
  }
}

class CountingMiddlewareM2 implements MiddlewareImpl {
  public static callCount = 0;

  public async use(req: Request, next: NextMiddleware): Promise<void> {
    CountingMiddlewareM2.callCount += 1;
    await next();
  }
}

class CountingMiddlewareM3 implements MiddlewareImpl {
  public static callCount = 0;

  public async use(req: Request, next: NextMiddleware): Promise<void> {
    CountingMiddlewareM3.callCount += 1;
    await next();
  }
}

/** Never calls `next()` - the chain must stop right here, on both the entity and the method path. */
class StoppingMiddleware implements MiddlewareImpl {
  public static callCount = 0;

  public async use(req: Request, next: NextMiddleware): Promise<void> {
    StoppingMiddleware.callCount += 1;
  }
}

/** Used only as the `entityInstance` argument - `executeMiddlewareChain` never instantiates it. */
class DummyEntity {}

const resetCounters = (): void => {
  CountingMiddlewareM1.callCount = 0;
  CountingMiddlewareM2.callCount = 0;
  CountingMiddlewareM3.callCount = 0;
  StoppingMiddleware.callCount = 0;
};

describe('MIDDLEWARE-UTIL', () => {
  beforeEach(() => {
    resetCounters();
  });

  // ============================================================================================================
  // M9 - executeMiddlewareChain's `next` closure must run the tail EXACTLY once
  // ============================================================================================================

  describe('executeMiddlewareChain (M9: no doubled tail)', () => {
    test('It should CALL : each middleware exactly once, for a 2-link chain with entityInstance defined (class-level @Use path)', async () => {
      await middlewareUtil.executeMiddlewareChain(
        buildReq(),
        0,
        [CountingMiddlewareM1, CountingMiddlewareM2],
        DummyEntity,
      );

      expect(CountingMiddlewareM1.callCount).toBe(1);
      expect(CountingMiddlewareM2.callCount).toBe(1);
    });

    test('It should CALL : each middleware exactly once, for a 3-link chain with entityInstance defined (pins the growing tail - old code ran calls(index) = index + 1, i.e. M2 twice, M3 three times)', async () => {
      await middlewareUtil.executeMiddlewareChain(
        buildReq(),
        0,
        [CountingMiddlewareM1, CountingMiddlewareM2, CountingMiddlewareM3],
        DummyEntity,
      );

      expect(CountingMiddlewareM1.callCount).toBe(1);
      expect(CountingMiddlewareM2.callCount).toBe(1);
      expect(CountingMiddlewareM3.callCount).toBe(1);
    });

    test('It should CALL : each middleware exactly once, for the SAME 3-link chain WITHOUT entityInstance (method-level @Use path - regression pin, already true today)', async () => {
      await middlewareUtil.executeMiddlewareChain(buildReq(), 0, [
        CountingMiddlewareM1,
        CountingMiddlewareM2,
        CountingMiddlewareM3,
      ]);

      expect(CountingMiddlewareM1.callCount).toBe(1);
      expect(CountingMiddlewareM2.callCount).toBe(1);
      expect(CountingMiddlewareM3.callCount).toBe(1);
    });
  });

  // ============================================================================================================
  // M9 regression - a middleware that never calls next() must still stop the chain, on both paths
  // ============================================================================================================

  describe('executeMiddlewareChain (reject/stop-chain regression, both paths)', () => {
    const entityInstanceCases: Array<[string, Constructable<any> | undefined]> = [
      ['entityInstance defined', DummyEntity],
      ['entityInstance undefined', undefined],
    ];

    test.each(entityInstanceCases)(
      'It should STOP : the chain before later middlewares run, when an earlier one does not call next() (%s)',
      async (_label, entityInstance) => {
        await middlewareUtil.executeMiddlewareChain(
          buildReq(),
          0,
          [StoppingMiddleware, CountingMiddlewareM1],
          entityInstance,
        );

        expect(StoppingMiddleware.callCount).toBe(1);
        expect(CountingMiddlewareM1.callCount).toBe(0);
      },
    );
  });

  // ============================================================================================================
  // M8 - registerToMethod must return the original method's result
  // ============================================================================================================

  describe('registerToMethod (M8: return value propagation)', () => {
    test("It should RUN : the middleware chain once AND RETURN the original method's result, when a Request is present in args", async () => {
      const descriptor: TypedPropertyDescriptor<RequestType> = { value: async () => 'payload' };

      middlewareUtil.registerToMethod([CountingMiddlewareM1], descriptor);

      const result = await descriptor.value!(buildReq());

      expect(result).toBe('payload');
      expect(CountingMiddlewareM1.callCount).toBe(1);
    });

    test("It should SKIP : the middleware chain but still RETURN the original method's result, when no Request is present in args", async () => {
      const descriptor: TypedPropertyDescriptor<RequestType> = { value: async () => 'payload-no-req' };

      middlewareUtil.registerToMethod([CountingMiddlewareM1], descriptor);

      const result = await descriptor.value!('not-a-request', 42);

      expect(result).toBe('payload-no-req');
      expect(CountingMiddlewareM1.callCount).toBe(0);
    });
  });
});
