/**
 * In-process integration tests for `@Validate` / `@FieldsFormatter` against a REST bulk INSERT
 * (`@sap/cds` 10, default `features.bulk_inserts_via_rest: true` - `libx/rest/middleware/create.js`
 * dispatches an array-bodied REST POST as ONE `INSERT` whose `req.data` is the whole array of entries,
 * instead of one `INSERT` per entry).
 *
 * Contract: `@Validate` and `@FieldsFormatter` check every entry of an array `req.data`.
 *   - `@Validate` validates the field on each entry; the first invalid entry rejects the whole request
 *     with 400, its message identifying the entry index, and no entry is persisted.
 *   - `@FieldsFormatter` formats the field on each entry, in place.
 *   - A non-object entry (e.g. `null`) counts as an entry missing the field.
 *
 * `BulkServiceHandler.beforeCreate` (fixture) stacks both on the same `@BeforeCreate`: `@Validate({
 * action: 'isEmail' }, 'email')` then `@FieldsFormatter({ action: 'toUpper' }, 'title')` - mirroring the
 * real bookshop `@Validate` call shape. `BulkService` is annotated `@protocol: ['odata', 'rest']` so the
 * same entity is reachable over both.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const rest = '/rest/bulk';

describe('Bulk (array) req.data - @Validate / @FieldsFormatter (@sap/cds 10 REST bulk INSERT)', () => {
  describe('REST bulk POST - one invalid entry', () => {
    test('It should REJECT : with 400 and PERSIST none of the entries, when one entry of the bulk payload fails @Validate', async () => {
      const caught = await client
        .POST(`${rest}/BulkItems`, [
          { ID: 700001, email: 'valid@example.com', title: 'first' },
          { ID: 700002, email: 'not-an-email', title: 'second' },
        ])
        .catch((error: any) => error);

      expect(caught).toBeDefined();
      expect(caught.status).toBe(400);
      expect(caught.message).toEqual(expect.stringContaining('bulk entry index: 1'));

      const stored = await cds.db.run(cds.ql.SELECT.from('BulkService.BulkItems').where({ ID: [700001, 700002] }));
      expect(stored).toHaveLength(0);
    });
  });

  describe('REST bulk POST - one null entry', () => {
    test('It should REJECT : with 400, when one entry of the bulk payload is null', async () => {
      const caught = await client
        .POST(`${rest}/BulkItems`, [{ ID: 700007, email: 'valid@example.com', title: 'first' }, null])
        .catch((error: any) => error);

      expect(caught).toBeDefined();
      expect(caught.status).toBe(400);
      expect(caught.message).toEqual(expect.stringContaining('bulk entry index: 1'));

      const stored = await cds.db.run(cds.ql.SELECT.from('BulkService.BulkItems').where({ ID: 700007 }));
      expect(stored).toHaveLength(0);
    });
  });

  describe('REST bulk POST - every entry valid', () => {
    test('It should CREATE : with 201 and APPLY the formatter to every row', async () => {
      const res = await client.POST(`${rest}/BulkItems`, [
        { ID: 700003, email: 'one@example.com', title: 'first title' },
        { ID: 700004, email: 'two@example.com', title: 'second title' },
      ]);

      expect(res.status).toBe(201);

      const stored = await cds.db.run(
        cds.ql.SELECT.from('BulkService.BulkItems')
          .where({ ID: [700003, 700004] })
          .orderBy('ID'),
      );
      expect(stored.map((row: { title: string }) => row.title)).toEqual(['FIRST TITLE', 'SECOND TITLE']);
      expect(stored.map((row: { email: string }) => row.email)).toEqual(['one@example.com', 'two@example.com']);
    });
  });

  describe('REST single POST - unchanged single-object behavior', () => {
    test('It should REJECT : a single-object payload with an invalid email, with the un-annotated message', async () => {
      const caught = await client
        .POST(`${rest}/BulkItems`, { ID: 700005, email: 'not-an-email', title: 'irrelevant' })
        .catch((error: any) => error);

      expect(caught).toBeDefined();
      expect(caught.status).toBe(400);
      expect(caught.message).not.toEqual(expect.stringContaining('bulk entry index'));

      const stored = await cds.db.run(cds.ql.SELECT.from('BulkService.BulkItems').where({ ID: 700005 }));
      expect(stored).toHaveLength(0);
    });

    test('It should CREATE : a single-object payload with 201 and APPLY the formatter', async () => {
      const res = await client.POST(`${rest}/BulkItems`, { ID: 700006, email: 'ok@example.com', title: 'plain' });

      expect(res.status).toBe(201);

      const stored = await cds.db.run(cds.ql.SELECT.from('BulkService.BulkItems').where({ ID: 700006 }));
      expect(stored[0].title).toBe('PLAIN');
    });
  });
});
