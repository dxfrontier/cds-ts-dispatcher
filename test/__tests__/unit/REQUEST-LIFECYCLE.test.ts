/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import {
  AfterCommit,
  AfterRollback,
  BeforeCommit,
  BeforeCreate,
  CDSDispatcher,
  EntityHandler,
  OnRequestDone,
  OnScheduledSuccess,
  UnboundActions,
  Use,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';
import { MiddlewareEntity1 } from '../../util/middleware/MiddlewareEntity1';

import type { BaseHandler, Constructable, REQUEST_LIFECYCLE_EVENTS } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

// Execution markers pushed by the fixture methods, asserted for ordering / continuation.
const CALLS: string[] = [];

@EntityHandler(Book)
class BookLifecycleHandler {
  @BeforeCommit()
  public async beforeCommit(req: Request) {
    CALLS.push('beforeCommit');
  }

  // The awaited delay makes the ordering assertions meaningful: a parallel execution ('Promise.all')
  // would let the second callback push its marker first.
  @AfterCommit()
  public async afterCommitFirst(req: Request) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    CALLS.push('afterCommitFirst');
  }

  @AfterCommit()
  public async afterCommitSecond(req: Request) {
    CALLS.push('afterCommitSecond');
  }

  @AfterRollback()
  public async afterRollback(req: Request) {
    CALLS.push('afterRollback');
  }

  @OnRequestDone()
  public async requestDone(req: Request) {
    CALLS.push('requestDone');
  }
}

@UnboundActions()
class ServiceLifecycleHandler {
  @BeforeCommit()
  public async beforeCommit(req: Request) {
    CALLS.push('serviceBeforeCommit');
  }

  @AfterCommit()
  public async afterCommit(req: Request) {
    CALLS.push('serviceAfterCommit');
  }

  @AfterRollback()
  public async afterRollback(req: Request) {
    CALLS.push('serviceAfterRollback');
  }

  @OnRequestDone()
  public async requestDone(req: Request) {
    CALLS.push('serviceRequestDone');
  }
}

@EntityHandler(Book)
class FailingLifecycleHandler {
  @BeforeCommit()
  public async vetoCommit(req: Request) {
    throw new Error('BeforeCommit veto');
  }

  @AfterCommit()
  public async explodingAfterCommit(req: Request) {
    CALLS.push('explodingAfterCommit');
    throw new Error('AfterCommit boom');
  }

  @AfterCommit()
  public async survivingAfterCommit(req: Request) {
    CALLS.push('survivingAfterCommit');
  }
}

@EntityHandler(Book)
class MixedLifecycleHandler {
  @BeforeCreate()
  public async beforeCreate(req: Request) {
    CALLS.push('beforeCreate');
  }

  @AfterCommit()
  public async afterCommit(req: Request) {
    CALLS.push('mixedAfterCommit');
  }
}

@UnboundActions()
@Use(MiddlewareEntity1)
class MiddlewareLifecycleHandler {
  @AfterCommit()
  public async afterCommit(req: Request) {
    CALLS.push('middlewareAfterCommit');
  }

  @OnScheduledSuccess('cleanupExpiredCarts')
  public async taskSucceeded(result: unknown, req: Request) {
    CALLS.push('middlewareTaskSucceeded');
  }
}

const instanceOf = (Handler: Constructable) => new Handler();

const lifecycleHandlersOf = (instance: Constructable): BaseHandler[] =>
  MetadataDispatcher.getMetadataHandlers(instance).filter((item) => item.type === 'REQUEST_LIFECYCLE');

const findByEvent = (instance: Constructable, event: REQUEST_LIFECYCLE_EVENTS): BaseHandler[] =>
  lifecycleHandlersOf(instance).filter((item) => item.event === event);

type CapturedListener = [string, (...args: any[]) => unknown];

/**
 * A `ROOT` event context able to host the shared emitter - `_set` mirrors `EventContext._set`, which
 * `req.before` / `req.on` need to create `_emitter` on. A root WITHOUT it cannot host the hooks.
 */
const buildRoot = (): Record<string, unknown> => ({ _set: (_property: string, value: unknown) => value });

/**
 * A request-like object recognized by `parameterUtil.extractArguments` (via the `isMsgEvent` keys), which
 * additionally captures the `req.before(...)` / `req.on(...)` registrations of the root event context.
 */
const buildReq = (root?: object) => {
  const before: CapturedListener[] = [];
  const on: CapturedListener[] = [];

  const req: any = {
    inbound: {},
    event: 'CREATE',
    data: {},
    headers: {},
    ...buildRoot(),
    before: (event: string, listener: (...args: any[]) => unknown) => before.push([event, listener]),
    on: (event: string, listener: (...args: any[]) => unknown) => on.push([event, listener]),
  };

  req.context = root ?? req;

  return { req, before, on };
};

/**
 * Minimal service seam: `srv.prepend` runs its callback inline and `srv.before` captures the generic
 * attach handler (plus the entity it was scoped to).
 */
const registerLifecycleOf = (Handler: Constructable) => {
  const instance = instanceOf(Handler);
  const dispatcher: any = new CDSDispatcher([Handler]);

  let attach: (req: unknown) => void;
  let entity: string | undefined;

  dispatcher.srv = {
    prepend: (callback: () => void) => callback(),
    before: (event: string, first: any, second?: any) => {
      const isEntityScoped = typeof second === 'function';

      entity = isEntityScoped ? first : undefined;
      attach = isEntityScoped ? second : first;
    },
  };

  dispatcher['registerRequestLifecycleHandlers'](lifecycleHandlersOf(instance), instance);

  return { attach: (req: unknown) => attach(req), entity, instance };
};

/**
 * Drives the PUBLIC bootstrap path: `new CDSDispatcher([Handler]).initialize()` returns the
 * `cds.service.impl` function, which is handed a hand-built service recording WHAT was registered and
 * WHEN (`order`), so the `getHandlersBy` partition and the `srv.prepend` wrapper stay pinned.
 */
const bootstrap = (Handler: Constructable) => {
  const dispatcher = new CDSDispatcher([Handler]);
  const impl = dispatcher.initialize() as unknown as (srv: unknown) => void;
  const buildHandlerBy = jest.spyOn(dispatcher as any, 'buildHandlerBy');

  const order: string[] = [];
  const srv = {
    prepend: jest.fn((callback: () => void) => {
      order.push('prepend:enter');
      callback();
      order.push('prepend:exit');
    }),
    before: jest.fn((event: string) => order.push(`before:${String(event)}`)),
    after: jest.fn(),
    on: jest.fn(),
    handlers: { before: [] as unknown[] },
  };

  impl(srv);

  return { srv, order, buildHandlerBy };
};

describe('REQUEST LIFECYCLE', () => {
  beforeEach(() => {
    CALLS.length = 0;
  });

  describe('metadata', () => {
    const testEvent = (event: REQUEST_LIFECYCLE_EVENTS, decoratorName: string) => {
      test(`It should RECORD : a REQUEST_LIFECYCLE handler for the @${decoratorName} decorator`, () => {
        const [handler] = findByEvent(instanceOf(BookLifecycleHandler), event);

        expect(handler).toBeDefined();
        expect(handler.type).toBe('REQUEST_LIFECYCLE');
        expect(handler.event).toBe(event);
        expect(handler.eventKind).toBe('REQUEST_LIFECYCLE');
        expect(handler.isDraft).toBe(false);
        expect(handler.callback).toBeDefined();
      });
    };

    testEvent('BEFORE_COMMIT', 'BeforeCommit');
    testEvent('AFTER_COMMIT', 'AfterCommit');
    testEvent('AFTER_ROLLBACK', 'AfterRollback');
    testEvent('REQUEST_DONE', 'OnRequestDone');

    test('It should RECORD : the same four handlers when hosted in an @UnboundActions class', () => {
      const handlers = lifecycleHandlersOf(instanceOf(ServiceLifecycleHandler));

      expect(handlers).toHaveLength(4);
      expect(handlers.map((item) => item.event)).toEqual([
        'BEFORE_COMMIT',
        'AFTER_COMMIT',
        'AFTER_ROLLBACK',
        'REQUEST_DONE',
      ]);
      handlers.forEach((handler) => {
        expect(handler.type).toBe('REQUEST_LIFECYCLE');
        expect(handler.eventKind).toBe('REQUEST_LIFECYCLE');
        expect(handler.isDraft).toBe(false);
      });
    });

    test('It should ACCUMULATE : several handlers of the same event in declaration order', async () => {
      const instance = instanceOf(BookLifecycleHandler);
      const handlers = findByEvent(instance, 'AFTER_COMMIT');
      const { req } = buildReq();

      expect(handlers).toHaveLength(2);

      await handlers[0].callback.call(instance, req);
      await handlers[1].callback.call(instance, req);

      expect(CALLS).toEqual(['afterCommitFirst', 'afterCommitSecond']);
    });
  });

  describe('registration', () => {
    test('It should ATTACH : one listener per event - `req.before` for commit, `req.on` for the rest', () => {
      const { attach } = registerLifecycleOf(BookLifecycleHandler);
      const { req, before, on } = buildReq();

      attach(req);

      expect(before.map(([event]) => event)).toEqual(['commit']);
      expect(on.map(([event]) => event)).toEqual(['succeeded', 'failed', 'done']);
    });

    test('It should SCOPE : the attach handler to the entity, service-wide for @UnboundActions', () => {
      expect(registerLifecycleOf(BookLifecycleHandler).entity).toBe('CatalogService.Books');
      expect(registerLifecycleOf(ServiceLifecycleHandler).entity).toBeUndefined();
    });

    test('It should ATTACH ONCE : per root request context', () => {
      const { attach } = registerLifecycleOf(BookLifecycleHandler);
      const root = buildRoot();
      const first = buildReq(root);
      const second = buildReq(root);

      attach(first.req);
      attach(second.req);

      expect(first.before).toHaveLength(1);
      expect(first.on).toHaveLength(3);
      expect(second.before).toHaveLength(0);
      expect(second.on).toHaveLength(0);
    });

    test('It should RE-ATTACH : for a request having a different root context', () => {
      const { attach } = registerLifecycleOf(BookLifecycleHandler);
      const first = buildReq(buildRoot());
      const second = buildReq(buildRoot());

      attach(first.req);
      attach(second.req);

      expect(first.on).toHaveLength(3);
      expect(second.on).toHaveLength(3);
    });

    test('It should EXECUTE : the @AfterCommit callbacks sequentially in declaration order', async () => {
      const { attach } = registerLifecycleOf(BookLifecycleHandler);
      const { req, on } = buildReq();

      attach(req);

      const [, succeeded] = on.find(([event]) => event === 'succeeded')!;
      await succeeded(req);

      expect(CALLS).toEqual(['afterCommitFirst', 'afterCommitSecond']);
    });

    test('It should CATCH : errors of @AfterCommit callbacks and continue with the remaining ones', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { attach } = registerLifecycleOf(FailingLifecycleHandler);
      const { req, on } = buildReq();

      attach(req);

      const [, succeeded] = on.find(([event]) => event === 'succeeded')!;
      await expect(succeeded(req)).resolves.toBeUndefined();

      expect(CALLS).toEqual(['explodingAfterCommit', 'survivingAfterCommit']);
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    test('It should PROPAGATE : errors of @BeforeCommit callbacks (the commit veto)', async () => {
      const { attach } = registerLifecycleOf(FailingLifecycleHandler);
      const { req, before } = buildReq();

      attach(req);

      const [, commit] = before.find(([event]) => event === 'commit')!;
      await expect(commit(req)).rejects.toThrow('BeforeCommit veto');
    });

    test('It should SKIP : contexts without the `before` / `on` lifecycle API (hand-rolled dispatches)', () => {
      const { attach } = registerLifecycleOf(BookLifecycleHandler);

      expect(() => attach({ inbound: {}, event: 'CREATE', data: {}, headers: {} })).not.toThrow();
    });

    test('It should SKIP : requests whose ROOT cannot host the emitter (event-queue internal dispatches)', () => {
      const { attach } = registerLifecycleOf(BookLifecycleHandler);

      // The queue dispatches its background processing with a REAL 'cds.Request' ('before' / 'on' are
      // functions) whose 'context' is the JSON-deserialized, plain-object task context - no '_set', no
      // '_emitter'. Attaching there throws 'this.context._set is not a function' inside cds.
      const { req, before, on } = buildReq({ tenant: 'anonymous', user: { id: 'internal' } });

      expect(() => attach(req)).not.toThrow();
      expect(before).toHaveLength(0);
      expect(on).toHaveLength(0);
    });
  });

  describe('wiring (public bootstrap path)', () => {
    test('It should REGISTER : ONE generic `before` handler per class, INSIDE the prepend callback', () => {
      const { srv, order, buildHandlerBy } = bootstrap(BookLifecycleHandler);

      // The lifecycle records never reach the per-handler routing ...
      expect(buildHandlerBy).not.toHaveBeenCalled();

      // ... they share ONE entity-scoped generic registration for the whole class ...
      const generic = srv.before.mock.calls.filter(([event]) => event === '*');
      expect(generic).toHaveLength(1);
      expect(generic[0][1]).toBe('CatalogService.Books');

      // ... which happens INSIDE the 'srv.prepend' callback.
      expect(srv.prepend).toHaveBeenCalledTimes(1);
      expect(order).toEqual(['prepend:enter', 'before:*', 'prepend:exit']);
    });

    test('It should ROUTE : the non-lifecycle handlers of a mixed class through the normal path', () => {
      const { srv, order, buildHandlerBy } = bootstrap(MixedLifecycleHandler);

      expect(buildHandlerBy).toHaveBeenCalledTimes(1);
      expect(buildHandlerBy.mock.calls[0][0][0].event).toBe('CREATE');
      expect(srv.before).toHaveBeenCalledWith('CREATE', 'CatalogService.Books', expect.any(Function));

      // '@BeforeCreate' is registered directly, the lifecycle attach handler only inside the prepend.
      expect(order).toEqual(['before:CREATE', 'prepend:enter', 'before:*', 'prepend:exit']);
    });

    test('It should NOT THROW : bootstrapping an @UnboundActions class combining @Use with the new decorators', () => {
      // Regression: 'MiddlewareEntityRegistry.registerOnActions' iterates ALL handler records of an
      // '@UnboundActions' class and used to throw 'Unexpected event type: AFTER_COMMIT' at bootstrap.
      expect(() => bootstrap(MiddlewareLifecycleHandler)).not.toThrow();
    });
  });
});
