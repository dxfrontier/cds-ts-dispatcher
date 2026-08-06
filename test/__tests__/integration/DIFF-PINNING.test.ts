/**
 * In-process integration tests pinning `req.diff()` (`@Diff`) runtime behavior on `@sap/cds` 10.0.3.
 *
 * `req.diff` is a runtime-only, UNDOCUMENTED-in-capire capability (see
 * `@sap/cds/libx/_runtime/common/utils/differ.js` / `compareJson.js` - the only place its shape is
 * actually described, in a source comment, not in the public docs). These tests exist to detect
 * behavioral drift on `cds` upgrades, not to assert "correct" behavior.
 *
 * `BookParamsHandler`'s `@BeforeUpdate` logs a compact marker,
 * `console.log('[BookParams] diff', JSON.stringify({ title: diff?.title, ID: diff?.ID }))`, captured
 * with `jest.spyOn(console, 'log')` and snapshotted into a plain array BEFORE `spy.mockRestore()` runs
 * (`mockRestore` also clears `.mock.calls`).
 *
 * `PINNED (surprising vs. the naive expectation)`: for a changed field, `compareJson`'s documented
 * output shape is `{ _op: 'update', _old: { <field>: <OLD value> }, <field>: <NEW value>, ...keys }` -
 * i.e. the top-level property holds the NEW (incoming) value, the OLD (pre-update) value is nested
 * under `_old`. Since this suite's marker only reads the top-level `diff.title` (per the compact-marker
 * contract - no `_old` access), `diff.title` observably holds the book's NEW title, NOT its pre-update
 * one; verified empirically below (test 1) - do not assume "diff" means "the old value" from the name
 * alone.
 *
 * `Draft-awareness`: `Books` (the entity `BookParamsHandler` is bound to) is NOT `@odata.draft.enabled`
 * in this fixture - only `BookEvents` is (see DRAFT-CHOREOGRAPHY.test.ts). There is therefore no
 * cheaply-reachable draft SAVE/activation path that would run `@BeforeUpdate` on `Book`'s active
 * entity; pinning "diff on activation" would require adding draft support to `Books` (new plumbing),
 * which is out of scope here, so it is intentionally not attempted.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

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
 * Waits for a `[BookParams] diff ...` marker to appear in `spy`, then RESTORES the spy and returns the
 * LAST one parsed - `spy.mockRestore()` also clears `.mock.calls`, so reading must happen before that.
 */
const settleDiff = async (spy: jest.SpyInstance): Promise<{ title?: string; ID?: number }> => {
  const marker = (call: unknown[]): boolean => String(call[0]) === '[BookParams] diff';
  await waitFor(() => spy.mock.calls.some(marker));
  const [, payload] = spy.mock.calls.filter(marker).at(-1)!;
  spy.mockRestore();
  return JSON.parse(payload as string);
};

describe('req.diff() / @Diff (pinned observed behavior, cds 10.0.3)', () => {
  test('It should SHOW the NEW (incoming) title in diff.title on a changed field, not the pre-update one', async () => {
    const created = await client.POST(
      `${catalog}/Books`,
      { ID: 920001, title: 'Diff Original Title', author_ID: 101, currency_code: 'USD' },
      { auth },
    );
    expect(created.status).toBe(201);

    const spy = jest.spyOn(console, 'log');
    const updated = await client.PATCH(`${catalog}/Books(920001)`, { title: 'Diff Updated Title' }, { auth });
    expect(updated.status).toBe(200);

    const diff = await settleDiff(spy);

    // PIN: top-level diff.title is the NEW value being written - the old DB value would only be
    // reachable via diff._old.title, which this compact marker deliberately does not surface.
    expect(diff.title).toBe('Diff Updated Title');
    expect(diff.title).not.toBe('Diff Original Title');
    expect(diff.ID).toBe(920001);
  });

  test('It should PIN whatever shape req.diff() returns for a no-op PATCH (same title re-sent)', async () => {
    const created = await client.POST(
      `${catalog}/Books`,
      { ID: 920002, title: 'Diff Unchanged Title', author_ID: 101, currency_code: 'USD' },
      { auth },
    );
    expect(created.status).toBe(201);

    const spy = jest.spyOn(console, 'log');
    const updated = await client.PATCH(`${catalog}/Books(920002)`, { title: 'Diff Unchanged Title' }, { auth });
    expect(updated.status).toBe(200);

    const diff = await settleDiff(spy);

    // PIN: an unchanged value is dropped from the diff entirely (compareJson only records CHANGED
    // props) - diff.title is undefined, NOT echoed back. The key (ID) is always present regardless.
    expect(diff.title).toBeUndefined();
    expect(diff.ID).toBe(920002);
  });
});
