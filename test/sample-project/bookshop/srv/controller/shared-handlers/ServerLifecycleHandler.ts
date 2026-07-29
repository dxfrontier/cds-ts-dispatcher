import cds from '@sap/cds';

import { OnListening, OnServed, OnShutdown, ServerLifecycle } from '../../../../../../lib';

/**
 * Fixture proving the `@ServerLifecycle` family against the real CAP runtime - see `SERVER-LIFECYCLE.test.ts`
 * (integration) and the `Server lifecycle - @OnServed seed` postman folder for the assertions pinned on these
 * console markers and the seeded `Books(950001)` row.
 */
@ServerLifecycle()
class ServerLifecycleHandler {
  @OnServed()
  public async seed(services: unknown) {
    // 'served' runs before app.listen and outside any request - a fresh tx is the sanctioned DB access.
    await cds.tx(async () => {
      await INSERT.into('sap.capire.bookshop.Books').entries({
        ID: 950001,
        title: 'Seeded by @OnServed',
        author_ID: 101,
        currency_code: 'USD',
        stock: 1,
      });
    });

    console.log('[ServerLifecycle] served');
  }

  @OnListening()
  public logUrl(payload: { server: unknown; url: string }) {
    console.log(`[ServerLifecycle] listening ${payload.url}`);
  }

  @OnShutdown()
  public async cleanup(error: Error | null) {
    console.log('[ServerLifecycle] shutdown', error ? 'with error' : 'clean');
  }
}

export default ServerLifecycleHandler;
