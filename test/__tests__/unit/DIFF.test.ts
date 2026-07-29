/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import {
  AfterDelete,
  BeforeCreate,
  BeforeUpdate,
  Diff,
  EntityHandler,
  Error,
  OnError,
  Req,
  Result,
} from '../../../lib';
import { ArgumentMethodProcessor } from '../../../lib/core/ArgumentMethodProcessor';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import constants from '../../../lib/constants/internalConstants';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { Constructable } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

@EntityHandler(Book)
class DiffHandler {
  public capturedDiff: unknown = 'NOT_SET';
  public capturedReqOnly: unknown = 'NOT_SET';
  public capturedResult: unknown = 'NOT_SET';
  public syncMarker = false;

  // (a)/(b)/(c): @Diff injects the awaited `req.diff()` result.
  @BeforeUpdate()
  public async diffMethod(@Diff() diff: unknown) {
    this.syncMarker = true;
    this.capturedDiff = diff;
  }

  // (d): a fixture method whose ONLY parameter decorator is @Req (no asynchronous decorator attached).
  @BeforeCreate()
  public async reqOnlyMethod(@Req() req: Request) {
    this.syncMarker = true;
    this.capturedReqOnly = req;
  }

  // (e): regression - a bare numeric argument must classify as `results`, not throw.
  @AfterDelete()
  public async resultMethod(@Result() result: number) {
    this.capturedResult = result;
  }
}

const instanceOf = (Handler: Constructable) => new Handler();
const handlers = MetadataDispatcher.getMetadataHandlers(instanceOf(DiffHandler));

// A request-like object recognized by `parameterUtil.extractArguments` (via the `isMsgEvent` keys).
const buildReq = (extra: Record<string | symbol, unknown> = {}) => ({
  inbound: {},
  event: 'READ',
  data: {},
  headers: {},
  ...extra,
});

describe('@Diff', () => {
  test('It should REGISTER : DIFF parameter metadata at index 0', () => {
    const metadata = Reflect.getOwnMetadata(constants.DECORATOR.PARAMETER.DIFF, DiffHandler.prototype, 'diffMethod');

    expect(metadata).toBeDefined();
    expect(metadata[0].parameterIndex).toBe(0);
    expect(metadata[0].type).toBe('INDEX_DECORATOR');
  });

  test('It should INJECT : the awaited `req.diff()` result into the decorated parameter', async () => {
    const handler = handlers.find((item) => item.eventKind === 'BEFORE' && item.event === 'UPDATE');
    const instance = new DiffHandler();
    const diffResult = { title: { old: 'A', new: 'B' } };
    const req = buildReq({ event: 'UPDATE', diff: async () => diffResult });

    await handler!.callback.call(instance, req);

    expect(instance.capturedDiff).toEqual(diffResult);
  });

  test('It should INJECT : `undefined` when `req.diff` is not a function', async () => {
    const handler = handlers.find((item) => item.eventKind === 'BEFORE' && item.event === 'UPDATE');
    const instance = new DiffHandler();

    await handler!.callback.call(instance, buildReq({ event: 'UPDATE' }));

    expect(instance.capturedDiff).toBeUndefined();
  });
});

describe('ArgumentMethodProcessor.applyDecorators() sync-return guarantee', () => {
  test('It should RETURN : `undefined` synchronously (not a thenable) when no `@Diff` is attached', () => {
    const processor = new ArgumentMethodProcessor(DiffHandler.prototype, 'reqOnlyMethod', [
      buildReq({ event: 'CREATE' }),
    ]);

    const result = processor.applyDecorators();

    expect(result).toBeUndefined();
    expect(typeof (result as PromiseLike<void> | undefined)?.then).not.toBe('function');
  });

  test('It should RETURN : a `Promise` when `@Diff` is attached', async () => {
    const processor = new ArgumentMethodProcessor(DiffHandler.prototype, 'diffMethod', [buildReq({ event: 'UPDATE' })]);

    const result = processor.applyDecorators();

    expect(result).toBeInstanceOf(Promise);

    await result;
  });

  test('It should RUN : the method body synchronously up to its first await, when no `@Diff` is attached (restores @Prepend / sync-prefix ordering)', async () => {
    const handler = handlers.find((item) => item.eventKind === 'BEFORE' && item.event === 'CREATE');
    const instance = new DiffHandler();

    const p = handler!.callback.call(instance, buildReq({ event: 'CREATE' }));

    expect(instance.syncMarker).toBe(true);

    await p;
  });

  test('It should DEFER : the method body to a microtask, when `@Diff` is attached (the documented cost of @Diff)', async () => {
    const handler = handlers.find((item) => item.eventKind === 'BEFORE' && item.event === 'UPDATE');
    const instance = new DiffHandler();

    const p = handler!.callback.call(instance, buildReq({ event: 'UPDATE' }));

    expect(instance.syncMarker).toBe(false);

    await p;
  });
});

describe('@Diff on @OnError (decoration-time guard)', () => {
  test('It should THROW : at decoration time when @Diff is combined with @OnError', () => {
    // No @EntityHandler wrapper needed - the guard fires while the class body is being evaluated,
    // i.e. before `OnError()`'s returned decorator ever wraps a descriptor.
    expect(() => {
      class InvalidOnErrorHandler {
        @OnError()
        public onError(@Error() err: Error, @Diff() diff: unknown): void {
          //
        }
      }

      return InvalidOnErrorHandler;
    }).toThrow('@Diff is not supported on @OnError');
  });
});

describe('extractArguments numeric regression', () => {
  test('It should NOT THROW : and should classify a bare numeric argument as `results`', async () => {
    const handler = handlers.find((item) => item.eventKind === 'AFTER' && item.event === 'DELETE');
    const instance = new DiffHandler();

    await handler!.callback.call(instance, 42);

    expect(instance.capturedResult).toBe(42);
  });
});
