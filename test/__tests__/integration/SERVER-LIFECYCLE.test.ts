import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');

// The spy must exist BEFORE cds.test boots the server, or the served/listening markers are missed.
const logSpy = jest.spyOn(console, 'log');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

const markersOf = (spy: jest.SpyInstance): string[] => spy.mock.calls.map((c) => c.map(String).join(' '));

describe('INTEGRATION - @ServerLifecycle', () => {
  test('It should FIRE : @OnServed before listening and seed data visible over OData', async () => {
    const markers = markersOf(logSpy);
    expect(markers.some((m) => m.includes('[ServerLifecycle] served'))).toBe(true);

    const seeded = await client.GET(`${catalog}/Books(950001)`, { auth });
    expect(seeded.status).toBe(200);
    // BookService.enrichTitle (@AfterRead, service-wide) unconditionally appends this suffix to every
    // Books title read through CatalogService - the seeded row goes through the same OData read path.
    expect(seeded.data.title).toBe('Seeded by @OnServed -- 10 % discount!');
  });

  test('It should FIRE : @OnListening with the real ephemeral url', async () => {
    const markers = markersOf(logSpy);
    const listening = markers.find((m) => m.includes('[ServerLifecycle] listening'));
    expect(listening).toBeDefined();
    expect(listening).toContain(String(client.server.address().port));
  });

  test('It should FIRE : @OnShutdown when cds.shutdown() runs (last test in file)', async () => {
    await cds.shutdown();
    const markers = markersOf(logSpy);
    expect(markers.some((m) => m.includes('[ServerLifecycle] shutdown'))).toBe(true);
  });
});
