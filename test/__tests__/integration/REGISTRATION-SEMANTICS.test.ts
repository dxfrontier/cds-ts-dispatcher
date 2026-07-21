/**
 * In-process integration tests for the dispatcher's runtime registration semantics:
 * `@Prepend` ordering, `@Use` middleware chain order, `ALL_ENTITIES ('*')` fan-out and `@OnError`.
 *
 * Ordering is observed through markers the fixture handlers/middlewares emit (a response header set
 * by a prepended handler, and `console.log` breadcrumbs captured with a jest spy). Direct service
 * access is used where the handlers are HTTP-context independent; HTTP helpers where they are not.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

describe('Registration semantics', () => {
  describe('@Prepend ordering', () => {
    test('It should RUN the prepended handler before the normal after-read-single-instance handler', async () => {
      const list = await client.GET(`${catalog}/Books?$top=1`, { auth });
      const id = list.data.value[0].ID;

      // `BookHandler.prepend` (prepended to AfterReadSingleInstance) sets `req.locale = 'DE_de'`;
      // the normal `afterReadSingleInstance` then echoes `req.locale` into the Accept-Language header.
      // Seeing 'DE_de' proves the prepended handler ran FIRST.
      const single = await client.GET(`${catalog}/Books(${id})`, { auth });
      expect(single.headers['accept-language']).toBe('DE_de');
    });
  });

  describe('@Use middleware chain order', () => {
    test('It should EXECUTE @Use middlewares in declaration order around the handler', async () => {
      const srv = await cds.connect.to('CatalogService');
      const spy = jest.spyOn(console, 'log');

      // BookOrders is decorated with `@Use(MiddlewareEntity1, MiddlewareEntity2)`.
      await srv.read('BookOrders');

      const sequence = spy.mock.calls
        .map((c) => String(c[0]))
        .filter((line) => line.includes('Middleware entity') && line.includes('EXECUTED'));
      spy.mockRestore();

      const first1 = sequence.findIndex((l) => l.includes('Middleware entity 1'));
      const first2 = sequence.findIndex((l) => l.includes('Middleware entity 2'));
      expect(first1).toBeGreaterThanOrEqual(0);
      expect(first2).toBeGreaterThan(first1);
    });
  });

  describe("ALL_ENTITIES ('*')", () => {
    test('It should FIRE the `*` handler for reads of multiple different entities', async () => {
      const srv = await cds.connect.to('CatalogService');
      const spy = jest.spyOn(console, 'log');

      await srv.read('Authors');
      await srv.read('BookRecommendations');

      const fires = spy.mock.calls.filter((c) => String(c[0]).includes('Triggering READ for all entities')).length;
      spy.mockRestore();

      expect(fires).toBe(2);
    });
  });

  describe('@OnError', () => {
    test('It should RECEIVE the thrown error and rewrite it for the intentional Publishers path', async () => {
      // `PublishersHandler.afterRead` rejects; the `@OnError` handler rewrites the message to 'OnError'
      // specifically when `req.entity === 'CatalogService.Publishers'`.
      await expect(client.GET(`${catalog}/Publishers`, { auth })).rejects.toMatchObject({
        message: expect.stringContaining('OnError'),
      });
    });

    test('It should LEAVE errors of other entities untouched (conditional on req.entity)', async () => {
      // A create error on Books must NOT be rewritten to 'OnError' - proving the @OnError handler
      // inspects the request and acts conditionally, i.e. it truly received the error + request.
      await expect(
        client.POST(`${catalog}/Books`, { ID: 840001, title: 'X', author_ID: 101, currency_code: '' }, { auth }),
      ).rejects.toMatchObject({ message: expect.stringContaining('Currency code is mandatory!') });
    });
  });
});
