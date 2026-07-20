/**
 * In-process integration tests for the dispatcher's `@After*` decorator contract under `@sap/cds` 10.
 *
 * The bookshop `Books` after-handlers read the HTTP request/response (`@Jwt`, `@Res`, `@BeforeAll`,
 * `@AfterAll`), so those assertions are driven through cds.test's HTTP helpers - the handler markers
 * (`req.notify(...)`) surface in the OData `sap-messages` response header. Handlers that are
 * context-independent are exercised with direct service access.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

/** Extract the `req.notify(...)` markers a handler surfaced via the OData `sap-messages` header. */
const markers = (res: any): string[] => {
  const raw = res?.headers?.['sap-messages'];
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as Array<{ message: string }>).map((m) => m.message);
  } catch {
    return [];
  }
};

describe('CRUD contract (@sap/cds 10)', () => {
  describe('@AfterCreate', () => {
    test('It should RECEIVE the created entity data (not the raw `.affected` array)', async () => {
      // `BookHandler.afterCreate` -> `validateData(result, req)` rejects when `result.currency_code === ''`.
      // This only fires if the handler was handed the entity DATA; had it received the cds-10
      // `.affected` array, `result.currency_code` would be undefined and no rejection would occur.
      await expect(
        client.POST(`${catalog}/Books`, { ID: 880001, title: 'Contract', author_ID: 101, currency_code: '' }, { auth }),
      ).rejects.toMatchObject({ message: expect.stringContaining('Currency code is mandatory!') });
    });

    test('It should COMPLETE a create whose data satisfies the after-handler', async () => {
      const res = await client.POST(
        `${catalog}/Books`,
        { ID: 880002, title: 'Contract OK', author_ID: 101, currency_code: 'USD' },
        { auth },
      );
      expect(res.status).toBe(201);
      expect(res.data.ID).toBe(880002);
    });
  });

  describe('@AfterUpdate', () => {
    test('It should RECEIVE the request data and run (afterUpdate rewrites the title to "Dracula")', async () => {
      await client.POST(
        `${catalog}/Books`,
        { ID: 880003, title: 'Original', author_ID: 101, currency_code: 'USD' },
        { auth },
      );

      await client.PATCH(`${catalog}/Books(880003)`, { stock: 7 }, { auth });

      const read = await client.GET(`${catalog}/Books(880003)`, { auth });
      // `BookService.addDefaultTitleText` (called from afterUpdate) sets title = 'Dracula';
      // the after-read handler then appends its discount suffix.
      expect(read.data.title).toMatch(/^Dracula/);
    });
  });

  describe('@AfterDelete + @Affected', () => {
    test('It should RECEIVE boolean `deleted` and the @Affected row count of 1', async () => {
      await client.POST(
        `${catalog}/Books`,
        { ID: 880004, title: 'To Delete', author_ID: 101, currency_code: 'USD' },
        { auth },
      );

      const res = await client.DELETE(`${catalog}/Books(880004)`, { auth });
      expect(res.status).toBe(204);

      // `BookHandler.afterDelete` -> `notifyItemDeleted(req, deleted, affected)` emits
      // `Item deleted : <deleted> | affected : <@Affected>`.
      expect(markers(res)).toContain('Item deleted : true | affected : 1');
    });
  });

  describe('bulk create (entries array)', () => {
    test('It should DISPATCH a single create for an array of entries and persist all of them', async () => {
      const srv = await cds.connect.to('CatalogService');
      const table = 'CatalogService.BookRecommendations';

      const before = await cds.db.run(cds.ql.SELECT.from(table));
      await srv.create('BookRecommendations').entries([
        { ID: 860001, rating: 3, comment: 'first bulk entry', description: 'ends with N' },
        { ID: 860002, rating: 4, comment: 'second bulk entry', description: 'also ends with N' },
      ]);
      const after = await cds.db.run(cds.ql.SELECT.from(table));

      expect(after.length - before.length).toBe(2);
      const ids = after.map((r: { ID: number }) => r.ID);
      expect(ids).toEqual(expect.arrayContaining([860001, 860002]));
    });
  });
});
