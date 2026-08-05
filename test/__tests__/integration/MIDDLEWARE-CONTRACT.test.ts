/**
 * In-process integration tests for the `@Use` middleware fixes (M8, M9) against the real CAP runtime.
 *
 * M8 - `middlewareUtil.registerToMethod`'s replacement descriptor discarded the wrapped handler's
 * return value, so a method-level `@Use` on an `@OnAction` handler resolved `undefined` for the caller
 * even though the handler itself returned a payload.
 *
 * M9 - `middlewareUtil.executeMiddlewareChain`'s `next` closure ran the REST of the chain TWICE
 * whenever `entityInstance` was defined (the class-level `@Use` path - `MiddlewareEntityRegistry`
 * always passes it), so every middleware after the first doubled its execution count per request.
 *
 * `UnboundActionsHandler.changeBookProperties` now carries BOTH a method-level
 * `@Use(MiddlewareMethodAction)` (M8) and inherits the class-level `@Use(MiddlewareEntity1,
 * MiddlewareEntity2)` (M9, action path - wrapped via `srv.before(actionName, ...)`);
 * `BookOrdersHandler` (also class-level `@Use(MiddlewareEntity1, MiddlewareEntity2)`) exercises the M9
 * entity/read path.
 *
 * Markers are captured with `jest.spyOn(console, 'log')` directly after the awaited call, exactly like
 * REGISTRATION-SEMANTICS.test.ts's `@Use middleware chain order` test - middleware chains run entirely
 * inside the `before` phase, awaited as part of the request's own dispatch, so nothing settles after the
 * outer `await` returns (unlike the post-commit hooks in LIFECYCLE-HOOKS.test.ts). That sibling test only
 * asserts ORDER (`findIndex`), so it stays green under both the old and the fixed code; the exact counts
 * asserted here are what actually pin the fix.
 *
 * `beforeAll` settle (boot side, not teardown side): this file is the first to dispatch
 * `changeBookProperties` in-process (previously only exercised over HTTP by the e2e/newman suite) AND to
 * combine that with a `BookOrders` read, all via direct `srv.send`/`srv.read` with no HTTP client. That
 * specific combination raced the persistent event queue's OWN background processing (`ScheduledTasksHandler`
 * keeps it active for `CatalogService` - see LIFECYCLE-HOOKS.test.ts's file header for the same class of
 * issue, previously hit and guarded for `@OnRequestDone` in `CDSDispatcher.ts`): observed either as
 * `no such table: cds_outbox_Messages` or "trying to import a file after the Jest environment has been torn
 * down", non-deterministically, depending on which of this file's requests ran and in what combination -
 * never as an assertion failure, always as a suite-level crash on top of the real ones. Giving the queue's
 * first background tick a clear, request-free window to settle right after boot (before ANY of this file's
 * own `srv.send`/`srv.read` calls start) removed it reliably across repeated runs; an `afterAll` settle
 * (the idiom used elsewhere for a post-commit drain) did not, since this race sits at the start of the
 * boot sequence, not at teardown.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
cds.test(bookshop);

beforeAll(() => new Promise((resolve) => setTimeout(resolve, 1500)));

const MIDDLEWARE_METHOD_ACTION = 'Middleware method: changeBookProperties';
const MIDDLEWARE_ENTITY_1 = 'Middleware entity 1 : EXECUTED';
const MIDDLEWARE_ENTITY_2 = 'Middleware entity 2 : EXECUTED';

/** Count exact-match markers among everything a console spy captured. */
const countOf = (calls: unknown[][], marker: string): number => calls.filter((c) => String(c[0]) === marker).length;

describe('Middleware contract (@Use) - M8 return value / M9 doubled tail', () => {
  test('M8: It should RETURN the formatted payload from an @OnAction handler wrapped by a method-level @Use, and run that middleware exactly once', async () => {
    const srv = await cds.connect.to('CatalogService');
    const spy = jest.spyOn(console, 'log');

    const result = await srv.send('changeBookProperties', { format: 'PDF', language: '  GR' });

    const calls = spy.mock.calls;
    spy.mockRestore();

    // The two stacked @FieldsFormatter decorators lowercase then left-trim 'language'.
    expect(result).toMatchObject({ format: 'PDF', language: 'gr' });
    expect(countOf(calls, MIDDLEWARE_METHOD_ACTION)).toBe(1);
  });

  test('M9 (entity path): It should EXECUTE both class-level @Use middlewares exactly once, for a single BookOrders read', async () => {
    const srv = await cds.connect.to('CatalogService');
    const spy = jest.spyOn(console, 'log');

    // BookOrdersHandler is decorated with `@Use(MiddlewareEntity1, MiddlewareEntity2)` (class-level).
    await srv.read('BookOrders');

    const calls = spy.mock.calls;
    spy.mockRestore();

    expect(countOf(calls, MIDDLEWARE_ENTITY_1)).toBe(1);
    expect(countOf(calls, MIDDLEWARE_ENTITY_2)).toBe(1);
  });

  test('M9 (action path): It should EXECUTE both class-level @Use middlewares exactly once, for a single unbound action dispatch', async () => {
    const srv = await cds.connect.to('CatalogService');
    const spy = jest.spyOn(console, 'log');

    // UnboundActionsHandler is decorated with `@Use(MiddlewareEntity1, MiddlewareEntity2)`
    // (class-level); MiddlewareEntityRegistry wraps unbound actions via `srv.before(actionName, ...)`.
    await srv.send('changeBookProperties', { format: 'PDF', language: 'GR' });

    const calls = spy.mock.calls;
    spy.mockRestore();

    expect(countOf(calls, MIDDLEWARE_ENTITY_1)).toBe(1);
    expect(countOf(calls, MIDDLEWARE_ENTITY_2)).toBe(1);
  });
});
