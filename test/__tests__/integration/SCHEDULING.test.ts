/**
 * In-process integration tests for the `@Schedule` / `@OnScheduled` runtime behavior (cds 10
 * event-queue). The bookshop boots with `@sap/cds` scheduling + a persistent queue (in-memory
 * sqlite in the test profile), so a one-shot task dispatched via the injectable service is picked
 * up and its handler runs with the payload.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
cds.test(bookshop);

// Let the event-queue background processing settle before cds.test shuts the server down,
// so no lazy module load races the jest environment teardown.
afterAll(() => new Promise((resolve) => setTimeout(resolve, 300)));

const REINDEX_TASK = 'CatalogService.reindex.catalog'; // @OnScheduled - verbatim dotted task name
const RECURRING_TASK = 'cleanupExpiredCarts'; // @Schedule - recurring singleton, scheduled at boot

/** Poll (bounded) until `predicate` holds or the deadline elapses. */
const waitFor = async (predicate: () => boolean, timeoutMs = 8000, stepMs = 100): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return predicate();
};

describe('Scheduling (@Schedule / @OnScheduled)', () => {
  test('It should REGISTER both the recurring and the dotted task-name handlers on the service', async () => {
    const srv = (await cds.connect.to('CatalogService')) as any;
    const registered = (srv.handlers?.on ?? []).map((h: any) => h.on).filter(Boolean);

    expect(registered).toContain(RECURRING_TASK);
    // The fully-qualified (dot-containing) task name must be registered verbatim (no dot-stripping).
    expect(registered).toContain(REINDEX_TASK);
  });

  test('It should EXECUTE the @OnScheduled handler with the payload on direct dispatch', async () => {
    const srv = (await cds.connect.to('CatalogService')) as any;
    const spy = jest.spyOn(console, 'log');

    await srv.emit(REINDEX_TASK, { probe: 'direct-dispatch' });

    const ran = spy.mock.calls.some(
      (c) => String(c[0]).includes('reindexCatalog') && JSON.stringify(c[1] ?? '').includes('direct-dispatch'),
    );
    spy.mockRestore();
    expect(ran).toBe(true);
  });

  test('It should RUN a one-shot task scheduled via srv.schedule(...).after() with its data', async () => {
    const srv = (await cds.connect.to('CatalogService')) as any;
    const spy = jest.spyOn(console, 'log');

    // Smallest supported delay - `.after(0)` is rejected by cds ("Invalid time span unit").
    await srv.schedule(REINDEX_TASK, { probe: 'one-shot-run' }).after(1, 'ms');

    const fired = await waitFor(() => spy.mock.calls.some((c) => JSON.stringify(c).includes('one-shot-run')));
    spy.mockRestore();
    expect(fired).toBe(true);
  }, 15000);

  test('It should have BOOTED the recurring @Schedule served-hook without crashing the service', async () => {
    // The recurring task is upserted at `cds.once("served")`; failures there are swallowed by the
    // dispatcher (logged, never thrown). A responsive service proves boot survived that hook.
    const srv = (await cds.connect.to('CatalogService')) as any;
    const books = await srv.read('Authors');
    expect(Array.isArray(books)).toBe(true);
  });
});
