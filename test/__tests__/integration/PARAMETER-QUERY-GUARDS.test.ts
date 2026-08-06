/**
 * In-process integration tests proving the `@IsColumnSupplied` / `@IsPresent` query-guard fixes (C3 /
 * C4) against the real CAP runtime (`@sap/cds` 10).
 *
 * `BookOrdersHandler.beforeCreate` (`@EntityHandler(BookOrder)`) logs one `console.log` marker per
 * CREATE dispatch: `[BookOrdersBeforeCreate] totalAmount=<bool> createdAt=<bool>
 * explicitColumns=<bool>`. A protocol (OData) POST builds `INSERT.into(...).entries(data)` and never
 * carries `.columns` - only a programmatic `INSERT.columns(...).rows(...)` dispatched through the
 * service does, which is the ONLY way to discriminate C4 (`@IsPresent('INSERT', 'columns')` used to
 * always read `req.query.SELECT`, so it always answered `false`).
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

const MARKER = '[BookOrdersBeforeCreate]';

describe('Parameter query guards (@IsColumnSupplied / @IsPresent columns) - C3 / C4', () => {
  test('It should CREATE via OData POST (201) and report totalAmount=true createdAt=false explicitColumns=false (entries-form, no explicit columns)', async () => {
    const spy = jest.spyOn(console, 'log');

    const res = await client.POST(
      `${catalog}/BookOrders`,
      {
        ID: 950001,
        orderNumber: 'ORD-GUARD-0001',
        orderDate: '2024-06-01',
        totalAmount: 199.99,
        status: 'Pending',
        customer_ID: 1,
      },
      { auth },
    );

    const calls = spy.mock.calls.map((c) => String(c[0]));
    spy.mockRestore();

    expect(res.status).toBe(201);
    expect(calls).toContain(`${MARKER} totalAmount=true createdAt=false explicitColumns=false`);
  });

  test('It should CREATE via a programmatic INSERT carrying an explicit `columns` list and report explicitColumns=true with columns WINNING over entries', async () => {
    const srv = await cds.connect.to('CatalogService');
    const spy = jest.spyOn(console, 'log');

    // cds 10 application services reject positional `.columns().rows()` payloads at generic input
    // validation (`validate.js` treats each row array as a record: `Property "0" does not exist`),
    // so the explicit-columns discriminator is attached to an entries-form insert instead - the
    // decorator reads the same CQN field (`INSERT.columns`) either way. `totalAmount` is present in
    // the entry but deliberately ABSENT from the columns list: the explicit list must win.
    const insert = cds.ql.INSERT.into('BookOrders').entries({
      ID: 950002,
      orderNumber: 'ORD-GUARD-0002',
      orderDate: '2024-06-02',
      totalAmount: 299.99,
      status: 'Pending',
      customer_ID: 1,
    });
    (insert as any).INSERT.columns = ['ID', 'orderNumber', 'orderDate', 'status', 'customer_ID'];

    await srv.run(insert);

    const calls = spy.mock.calls.map((c) => String(c[0]));
    spy.mockRestore();

    expect(calls).toContain(`${MARKER} totalAmount=false createdAt=false explicitColumns=true`);
  });
});
