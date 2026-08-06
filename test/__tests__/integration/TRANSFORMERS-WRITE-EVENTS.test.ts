/**
 * In-process integration tests for C5: `@Exclude` / `@Include` / `@Mask` on write-AFTER events
 * (`@AfterCreate` / `@AfterUpdate`) against the real CAP runtime (`@sap/cds` 10) - `formatterUtil.
 * findResults` (consumed by `transformersUtil.findResults`, i.e. `@Exclude`/`@Include`/`@Mask`, and by
 * `@FieldsFormatter`) used to only match an argument identity-equal to `req.results`; on write-AFTER
 * events `CDSDispatcher.executeAfterCallback` swaps the callback argument to `req.data`, so nothing ever
 * matched and the transformers silently no-op'ed. The fix falls back to `req.results` itself.
 *
 * `BookSalesHandler` (`@EntityHandler(BookSale)`) pairs each transformer probe with a plain "observer"
 * handler registered on the SAME event, deferred by one macrotask before it reads `req.results` - see the
 * block comment on those probes in BookSalesHandler.ts for why: CAP's `.after` handlers for one event run
 * in PARALLEL (`Promise.all`, `@sap/cds/lib/srv/srv-dispatch.js`), not sequentially by registration order,
 * so an undeferred observer would race the transformer's own (deeper-wrapped, hence later) continuation.
 *
 * VERIFIED SHAPE (this cds 10.0.3 + `@cap-js/db-service` runtime, `db: sql` i.e. sqlite, DEFAULT cds
 * feature flags - pinned via a throwaway exploration run before writing the assertions below, then
 * cross-checked against the installed sources):
 *   - CREATE: `req.results` is an array holding ONLY the entity's key column(s), e.g. `[{"ID":960001}]` -
 *     `InsertResults#materialize()` (`@cap-js/db-service/lib/InsertResults.js`) discards every other
 *     submitted/generated field.
 *   - UPDATE: `req.results` is an empty array (`[]`, plus a non-enumerated `.affected` count) - produced
 *     by the generic handler's `new_behavior` (`@sap/cds/libx/_runtime/common/generic/crud.js`, gated by
 *     `features.legacy_srv_results: false`, the cds-10 default). Flipping `legacy_srv_results` yields a
 *     bare NUMBER instead - which is exactly why `findResults`' fallback only returns object-shaped
 *     results.
 *
 * WHAT THESE TESTS PROVE - AND DON'T: they prove the transformers now ENGAGE on write-AFTER events
 * (operating on `req.results`) instead of silently no-op'ing. They deliberately do NOT claim the generic
 * OData/REST write RESPONSE BODY is shaped by them: for generic writes the adapter rebuilds the body
 * AFTER the after-phase (read-after-write for OData - `libx/odata/middleware/create.js` / `update.js` -
 * or `req.data` for REST), so shaping reaches the HTTP body only where a custom `@On*` handler returned
 * full rows; the body assertion on the 201 below pins that mechanism.
 * Consequence: neither 'quantity' (the CREATE probe's `@Exclude` target, kept to mirror the docs' own
 * `@Exclude('password')`-on-`@AfterCreate` leak example) nor 'saleDate' (the UPDATE probe's `@Mask`
 * target) can EVER be observed in `req.results` here - fix or no fix - so a content diff on THOSE two
 * fields cannot discriminate red from green. The CREATE probe's `@Exclude` additionally targets 'ID' (the
 * one field the generic CREATE handler DOES surface) purely to make the fix's engagement observable
 * end-to-end; this reproduces a genuine RED (unfixed: 'ID' survives) -> GREEN (fixed: 'ID' is stripped)
 * transition, empirically confirmed while authoring this file. The UPDATE probe has no such counterpart
 * (nothing survives there to target) and is asserted as a stable no-crash/no-op regression guard only -
 * the `findResults` fallback contract itself (including this exact empty-array shape) is exhaustively
 * RED-then-GREEN proven at the unit level instead (FORMATTER-UTIL.test.ts).
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

describe('Response transformers on write-AFTER events (@Exclude / @Mask) - C5', () => {
  describe('@AfterCreate + @Exclude', () => {
    test("It should CREATE (201), strip 'ID' from req.results (the only field the generic CREATE handler surfaces - proves the transformer now engages instead of no-op'ing), and leave req.data untouched (still carrying 'quantity')", async () => {
      const spy = jest.spyOn(console, 'log');

      const res = await client.POST(
        `${catalog}/BookSales`,
        { ID: 960001, saleDate: '2024-07-01', saleAmount: 42.5, quantity: 9, book_ID: 201, customer_ID: 1 },
        { auth },
      );

      const calls = spy.mock.calls.map((c) => String(c[0]));
      spy.mockRestore();

      expect(res.status).toBe(201);
      // RED (pre-fix): '[BookSalesAfterCreateObserver] results=[{"ID":960001}] dataHasQuantity=true' - the
      // transformer no-op'ed, so the generic handler's key survives untouched.
      expect(calls).toContain('[BookSalesAfterCreateObserver] results=[{}] dataHasQuantity=true');
      // The 201 BODY still carries the stripped key: the OData adapter rebuilds generic create responses
      // via read-after-write AFTER the after-phase, so shaping `req.results` here never reaches the HTTP
      // body (that is what attaching the transformer to @AfterRead is for - see the file header).
      expect(res.data.ID).toBe(960001);
    });
  });

  describe('@AfterUpdate + @Mask', () => {
    test('It should PATCH (200) and leave req.results in its verified, permanently-empty shape (the generic UPDATE handler never surfaces row data, so @Mask has nothing to mask - not a red/green discriminator, see file header)', async () => {
      await client.POST(
        `${catalog}/BookSales`,
        { ID: 960002, saleDate: '2024-07-01', saleAmount: 10, quantity: 1, book_ID: 201, customer_ID: 1 },
        { auth },
      );

      const spy = jest.spyOn(console, 'log');

      const res = await client.PATCH(
        `${catalog}/BookSales(960002)`,
        { saleAmount: 50, saleDate: '2024-07-02' },
        { auth },
      );

      const calls = spy.mock.calls.map((c) => String(c[0]));
      spy.mockRestore();

      expect(res.status).toBe(200);
      expect(calls).toContain('[BookSalesAfterUpdateObserver] results=[]');
    });
  });

  describe('regression: existing @AfterRead flow', () => {
    test('It should GET (200) - the role-gated @AfterRead parameter probes must keep working', async () => {
      const res = await client.GET(`${catalog}/BookSales`, { auth });

      expect(res.status).toBe(200);
    });
  });
});
