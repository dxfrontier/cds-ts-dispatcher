/**
 * In-process integration tests for the dispatcher's request-lifecycle hooks (`@BeforeCommit`,
 * `@AfterCommit`, `@AfterRollback`, `@OnRequestDone`) against the real CAP runtime (`@sap/cds` 10).
 *
 * `BookLifecycleHandler` (`@EntityHandler(Book)`) emits one `console.log` marker per hook
 * (`[BookLifecycle] BeforeCommit <event>`, `[BookLifecycle] AfterCommit`, `[BookLifecycle]
 * AfterRollback`, `[BookLifecycle] RequestDone`) and vetoes the commit when `req.data.title ===
 * 'VETO_COMMIT'`. Markers are captured with `jest.spyOn(console, 'log')`, snapshotted into a plain
 * array BEFORE `spy.mockRestore()` runs (`mockRestore` also clears `.mock.calls`, so reading it after
 * restoring would always see zero calls), and counted BETWEEN spy resets - never against a global
 * count, since other requests in this file/suite also trigger them.
 *
 * `NOT COVERED HERE` - proving a `REQUEST_LIFECYCLE` hook hosted service-wide (i.e. on `@UnboundActions`,
 * not on an `@EntityHandler`) end-to-end: `CatalogService` also hosts `ScheduledTasksHandler`'s
 * `@Schedule`/`@OnScheduled` tasks (see SCHEDULING.test.ts), which keeps `@sap/cds`'s persistent event
 * queue active for that service. Adding ANY `REQUEST_LIFECYCLE` decorator to the service's existing
 * `@UnboundActions` class (`UnboundActionsHandler`) makes `CDSDispatcher`'s generic `srv.before('*',
 * attach)` registration (lib/core/CDSDispatcher.ts, `registerRequestLifecycleHandlers`) also fire for
 * the queue's own internal background-processing dispatch. That dispatch has `.before`/`.on` functions
 * (so the existing hand-rolled-dispatch guard does not skip it) but an incomplete `.context`, and
 * calling `request.on(...)` on it throws `TypeError: this.context._set is not a function` deep inside
 * `@sap/cds/lib/req/context.js`, logged by the queue as "Programming error detected". Deterministically
 * (verified over multiple runs), this corrupts the shared in-memory sqlite instance for the rest of the
 * test file - every later request fails with "no such table: ...". Verified in isolation via
 * `git stash`: reverting the one added method/import restores a clean, all-green run; keeping it fails
 * 5 of 7 integration suites (24 of 32 tests), including SCHEDULING.test.ts and CRUD-CONTRACT.test.ts,
 * which do not otherwise touch this file. Since `lib/` is frozen and the existing suite must stay
 * green, this pin is intentionally omitted here rather than worked around; reported verbatim to the
 * task orchestrator instead of being papered over.
 *
 * `OBSERVED QUIRK` - the "twice" $batch counterpart below uses TWO SEPARATE `$batch` requests rather
 * than two atomicity groups inside ONE `$batch` call (both shapes are valid per the pin). Two
 * atomicity groups in a single call was tried first and is reproducible-but-broken independently of
 * this task's decorators: `BookHandler.afterAll` (a pre-existing, unrelated fixture handler that
 * unconditionally does `res.setHeader(...)`) throws `ERR_HTTP_HEADERS_SENT` on the SECOND atomicity
 * group's subrequest only (`@sap/cds/libx/odata/middleware/batch.js` processes atomicity groups
 * sequentially via an internal queue), rolling that group back with a 500. Neither `BookHandler.ts`
 * nor the batch middleware are owned by/in scope for this task, so two separate requests are used
 * instead - both are valid readings of "the same two updates as TWO separate atomicity groups (or two
 * batch requests)".
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

// Let the event-queue background processing settle before cds.test shuts the server down, so no
// lazy module load races the jest environment teardown (same rationale as SCHEDULING.test.ts).
afterAll(() => new Promise((resolve) => setTimeout(resolve, 300)));

/** Poll (bounded) until `predicate` holds or the deadline elapses. */
const waitFor = async (predicate: () => boolean, timeoutMs = 8000, stepMs = 100): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return predicate();
};

/**
 * Waits for `marker` to appear in `spy`, then RESTORES the spy and returns a plain-string snapshot of
 * everything it captured - `spy.mockRestore()` also clears `.mock.calls`, so counting must happen
 * against this snapshot, never against the (by-then-empty) live spy.
 */
const settle = async (spy: jest.SpyInstance, marker: string, minCount = 1): Promise<string[]> => {
  await waitFor(() => spy.mock.calls.filter((c) => String(c[0]) === marker).length >= minCount);
  const calls = spy.mock.calls.map((c) => String(c[0]));
  spy.mockRestore();
  return calls;
};

/** Count exact-match markers in a captured snapshot (see `settle`). */
const countOf = (calls: string[], marker: string): number => calls.filter((c) => c === marker).length;

const BEFORE_COMMIT_UPDATE = '[BookLifecycle] BeforeCommit UPDATE';
const BEFORE_COMMIT_READ = '[BookLifecycle] BeforeCommit READ';
const AFTER_COMMIT = '[BookLifecycle] AfterCommit';
const AFTER_ROLLBACK = '[BookLifecycle] AfterRollback';
const REQUEST_DONE = '[BookLifecycle] RequestDone';

describe('Request lifecycle hooks (@BeforeCommit / @AfterCommit / @AfterRollback / @OnRequestDone)', () => {
  test('It should FIRE BeforeCommit(UPDATE), AfterCommit and RequestDone exactly once for a plain UPDATE, with AfterRollback absent', async () => {
    const created = await client.POST(
      `${catalog}/Books`,
      { ID: 910001, title: 'Lifecycle Happy Path', author_ID: 101, currency_code: 'USD' },
      { auth },
    );
    expect(created.status).toBe(201);

    const spy = jest.spyOn(console, 'log');
    const updated = await client.PATCH(`${catalog}/Books(910001)`, { title: 'Lifecycle Happy Path Updated' }, { auth });
    expect(updated.status).toBe(200);

    const calls = await settle(spy, REQUEST_DONE);

    expect(countOf(calls, BEFORE_COMMIT_UPDATE)).toBe(1);
    expect(countOf(calls, AFTER_COMMIT)).toBe(1);
    expect(countOf(calls, REQUEST_DONE)).toBe(1);
    expect(countOf(calls, AFTER_ROLLBACK)).toBe(0);
  });

  test('It should FIRE the same three markers once for a plain READ (BeforeCommit event READ)', async () => {
    const spy = jest.spyOn(console, 'log');
    const list = await client.GET(`${catalog}/Books?$top=1`, { auth });
    expect(list.status).toBe(200);

    const calls = await settle(spy, REQUEST_DONE);

    expect(countOf(calls, BEFORE_COMMIT_READ)).toBe(1);
    expect(countOf(calls, AFTER_COMMIT)).toBe(1);
    expect(countOf(calls, REQUEST_DONE)).toBe(1);
  });

  test('It should VETO the commit on title VETO_COMMIT: BeforeCommit + AfterRollback + RequestDone fire, AfterCommit does not, and the title is NOT persisted', async () => {
    const created = await client.POST(
      `${catalog}/Books`,
      { ID: 910002, title: 'Lifecycle Veto Target', author_ID: 101, currency_code: 'USD' },
      { auth },
    );
    expect(created.status).toBe(201);

    const spy = jest.spyOn(console, 'log');
    let caught: any;
    try {
      await client.PATCH(`${catalog}/Books(910002)`, { title: 'VETO_COMMIT' }, { auth });
    } catch (error) {
      caught = error;
    }

    const calls = await settle(spy, REQUEST_DONE);

    expect(caught).toBeDefined();
    expect(caught.status).toBeGreaterThanOrEqual(400);

    expect(countOf(calls, BEFORE_COMMIT_UPDATE)).toBe(1);
    expect(countOf(calls, AFTER_ROLLBACK)).toBe(1);
    expect(countOf(calls, REQUEST_DONE)).toBe(1);
    expect(countOf(calls, AFTER_COMMIT)).toBe(0);

    const after = await client.GET(`${catalog}/Books(910002)`, { auth });
    expect(after.data.title).not.toBe('VETO_COMMIT');
  });

  describe('once per changeset ($batch)', () => {
    test('It should FIRE the three markers ONCE for two updates inside the SAME atomicity group', async () => {
      await client.POST(
        `${catalog}/Books`,
        { ID: 910003, title: 'Lifecycle Batch Group A', author_ID: 101, currency_code: 'USD' },
        { auth },
      );
      await client.POST(
        `${catalog}/Books`,
        { ID: 910004, title: 'Lifecycle Batch Group B', author_ID: 101, currency_code: 'USD' },
        { auth },
      );

      const spy = jest.spyOn(console, 'log');
      const batch = await client.POST(
        `${catalog}/$batch`,
        {
          requests: [
            {
              id: '1',
              method: 'PATCH',
              url: 'Books(910003)',
              headers: { 'content-type': 'application/json' },
              body: { title: 'Lifecycle Batch Group A Updated' },
              atomicityGroup: 'same-changeset',
            },
            {
              id: '2',
              method: 'PATCH',
              url: 'Books(910004)',
              headers: { 'content-type': 'application/json' },
              body: { title: 'Lifecycle Batch Group B Updated' },
              atomicityGroup: 'same-changeset',
            },
          ],
        },
        { auth },
      );
      expect(batch.status).toBe(200);
      const subStatuses = batch.data.responses.map((r: any) => r.status);
      expect(subStatuses.every((s: number) => s >= 200 && s < 300)).toBe(true);

      const calls = await settle(spy, REQUEST_DONE);

      expect(countOf(calls, BEFORE_COMMIT_UPDATE)).toBe(1);
      expect(countOf(calls, AFTER_COMMIT)).toBe(1);
      expect(countOf(calls, REQUEST_DONE)).toBe(1);
    });

    // Two SEPARATE $batch requests (rather than two atomicity groups inside one $batch call) -
    // the brief allows either shape for the "twice" counterpart; see this suite's file-head comment
    // for why two atomicity groups in a SINGLE $batch call is not used here.
    test('It should FIRE the three markers TWICE for the same two updates split across TWO SEPARATE $batch requests', async () => {
      await client.POST(
        `${catalog}/Books`,
        { ID: 910005, title: 'Lifecycle Batch Group C', author_ID: 101, currency_code: 'USD' },
        { auth },
      );
      await client.POST(
        `${catalog}/Books`,
        { ID: 910006, title: 'Lifecycle Batch Group D', author_ID: 101, currency_code: 'USD' },
        { auth },
      );

      const spy = jest.spyOn(console, 'log');
      const batchOne = await client.POST(
        `${catalog}/$batch`,
        {
          requests: [
            {
              id: '1',
              method: 'PATCH',
              url: 'Books(910005)',
              headers: { 'content-type': 'application/json' },
              body: { title: 'Lifecycle Batch Group C Updated' },
            },
          ],
        },
        { auth },
      );
      const batchTwo = await client.POST(
        `${catalog}/$batch`,
        {
          requests: [
            {
              id: '1',
              method: 'PATCH',
              url: 'Books(910006)',
              headers: { 'content-type': 'application/json' },
              body: { title: 'Lifecycle Batch Group D Updated' },
            },
          ],
        },
        { auth },
      );
      expect(batchOne.status).toBe(200);
      expect(batchTwo.status).toBe(200);
      const subStatuses = [...batchOne.data.responses, ...batchTwo.data.responses].map((r: any) => r.status);
      expect(subStatuses.every((s: number) => s >= 200 && s < 300)).toBe(true);

      const calls = await settle(spy, REQUEST_DONE, 2);

      expect(countOf(calls, BEFORE_COMMIT_UPDATE)).toBe(2);
      expect(countOf(calls, AFTER_COMMIT)).toBe(2);
      expect(countOf(calls, REQUEST_DONE)).toBe(2);
    });
  });
});
