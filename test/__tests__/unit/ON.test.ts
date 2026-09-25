import cds from '@sap/cds';

import type { Constructable } from '../../../lib/types/internalTypes';

import {
  EntityHandler,
  OnAction,
  OnBoundAction,
  OnBoundFunction,
  OnCreate,
  OnDelete,
  OnEvent,
  OnFunction,
  OnRead,
  OnUpdate,
  Req,
  Error as ErrorParam,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { OnError } from '../../../lib/index';
import { Book, OrderedBook, submitOrder } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { CRUD_EVENTS, EVENTS, Request } from '../../../lib/types/types';

@EntityHandler(Book)
class BookHandler {
  @OnCreate()
  public async onCreateMethod(req: Request<Request>, next: Function) {}

  @OnRead()
  public async onReadMethod(req: Request, next: Function) {}

  @OnUpdate()
  public async onUpdateMethod(req: Request<Request>, next: Function) {}

  @OnDelete()
  public async onDeleteMethod(req: Request, next: Function) {}

  @OnAction(submitOrder)
  public async onActionMethod(req: Request<Request>, next: Function) {}

  @OnFunction(submitOrder)
  public async onFunctionMethod(req: Request, next: Function) {}

  @OnEvent(OrderedBook)
  public async onEvent(req: Request<OrderedBook>) {}

  @OnError()
  public async onError(error: Error, req: Request) {}

  @OnBoundAction(submitOrder)
  public async onBoundActionMethod(req: Request<Request>, next: Function) {}

  @OnBoundFunction(submitOrder)
  public async onBoundFunctionMethod(req: Request<Request>, next: Function) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

describe('ON', () => {
  function testEvent(event: EVENTS, eventName: string): void {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.isDraft).toBe(false);

        if (foundEvent.event === 'EVENT' && foundEvent.type === 'EVENT') {
          expect(foundEvent.eventName).toStrictEqual(OrderedBook);
        }

        if (
          foundEvent.event === 'ACTION' ||
          foundEvent.event === 'FUNC' ||
          foundEvent.event === 'BOUND_ACTION' ||
          foundEvent.event === 'BOUND_FUNC'
        ) {
          if (foundEvent.type === 'ACTION_FUNCTION') {
            expect(foundEvent.actionName).toStrictEqual(submitOrder);
          }
        }
      });
    });
  }

  // CRUD
  testEvent('CREATE', 'OnCreate');
  testEvent('READ', 'OnRead');
  testEvent('UPDATE', 'OnUpdate');
  testEvent('DELETE', 'OnDelete');

  // ACTION & FUNCTION
  testEvent('ACTION', 'OnAction');
  testEvent('FUNC', 'OnFunction');
  testEvent('EVENT', 'OnEvent');
  testEvent('ERROR', 'OnError');

  // BOUND ACTION & FUNCTION
  testEvent('BOUND_ACTION', 'OnBoundAction');
  testEvent('BOUND_FUNC', 'OnBoundFunction');
});

describe('@OnError - exceptions inside the error handler', () => {
  /**
   * Shaped like a `cds.ql` query: lazy, and only executed once something reads its `then` (see
   * `@sap/cds/lib/ql/cds.ql-Query.js`, `get then()`), never by merely returning it.
   */
  class LazyQuery {
    public executed = false;

    constructor(private readonly failure?: Error) {}

    get then() {
      return (resolve?: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
        this.executed = true;
        const run = this.failure ? Promise.reject(this.failure) : Promise.resolve([{ ID: 1 }]);
        return run.then(resolve, reject);
      };
    }
  }

  class ErrorHandlerSpecimen {
    public query?: LazyQuery;

    public seen: { err?: Error; req?: unknown } = {};

    @OnError()
    public onErrorThrowsSync(@ErrorParam() err: Error, @Req() req: unknown): void {
      this.seen = { err, req };
      throw new Error('sync failure inside @OnError');
    }

    @OnError()
    public async onErrorRejects(@ErrorParam() err: Error): Promise<void> {
      this.seen = { err };
      await Promise.resolve();
      throw new Error('async failure inside @OnError');
    }

    @OnError()
    public onErrorRewrites(@ErrorParam() err: Error): void {
      err.message = 'rewritten';
    }

    @OnError()
    public onErrorReturnsQuery(@ErrorParam() err: Error): LazyQuery {
      return this.query!;
    }
  }

  const callbacks = MetadataDispatcher.getMetadataHandlers(new ErrorHandlerSpecimen())
    .filter((item) => item.event === 'ERROR')
    .map((item) => item.callback);
  const [throwsSync, rejects, rewrites, returnsQuery] = callbacks;

  /** Lets queued microtasks run - CAP never awaits the value an error handler returns. */
  const flushMicrotasks = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('It should LOG and NOT rethrow : an error thrown synchronously inside @OnError', () => {
    const instance = new ErrorHandlerSpecimen();
    const failure = new Error('request failed');
    const rootContext = new cds.EventContext();

    const returned = throwsSync.call(instance, failure, rootContext);
    // Keep a rejected promise (a regression) from crashing the jest worker; the assertion below reports it.
    if (returned instanceof Promise) returned.catch(() => undefined);

    expect(returned).toBeUndefined();
    // Parameter decorators still map the CAP arguments (err, root context).
    expect(instance.seen.err).toBe(failure);
    expect(instance.seen.req).toBe(rootContext);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0][0])).toContain('@OnError');
    expect(errorSpy.mock.calls[0][1]).toMatchObject({ message: 'sync failure inside @OnError' });
  });

  test('It should LOG and NOT reject : an error thrown asynchronously inside @OnError', async () => {
    const instance = new ErrorHandlerSpecimen();

    const returned = rejects.call(instance, new Error('request failed'), new cds.EventContext());

    await expect(returned).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][1]).toMatchObject({ message: 'async failure inside @OnError' });
  });

  test('It should RUN synchronously : a non-async @OnError method returns no promise and its changes are visible at once', () => {
    const failure = new Error('request failed');

    const returned = rewrites.call(new ErrorHandlerSpecimen(), failure, new cds.EventContext());

    expect(returned).toBeUndefined();
    expect(failure.message).toBe('rewritten');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('It should RUN : a cds.ql-like query returned by a non-async @OnError method, without anyone awaiting it', async () => {
    const instance = new ErrorHandlerSpecimen();
    instance.query = new LazyQuery();

    returnsQuery.call(instance, new Error('request failed'), new cds.EventContext());
    await flushMicrotasks();

    expect(instance.query.executed).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('It should LOG and NOT reject : a returned cds.ql-like query that fails', async () => {
    const instance = new ErrorHandlerSpecimen();
    instance.query = new LazyQuery(new Error('insert into ErrorLog failed'));

    const returned = returnsQuery.call(instance, new Error('request failed'), new cds.EventContext());
    await flushMicrotasks();

    expect(instance.query.executed).toBe(true);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][1]).toMatchObject({ message: 'insert into ErrorLog failed' });
    await expect(Promise.resolve(returned)).resolves.toBeUndefined();
  });
});
