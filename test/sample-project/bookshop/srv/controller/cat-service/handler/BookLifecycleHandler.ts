import { Book } from '#cds-models/CatalogService';
import cds from '@sap/cds';

import {
  AfterCommit,
  AfterRollback,
  BeforeCommit,
  EntityHandler,
  OnRequestDone,
  Req,
  Request,
} from '../../../../../../../lib';

@EntityHandler(Book)
class BookLifecycleHandler {
  // Runs INSIDE the request transaction, once per root request ($batch: once per changeset).
  // Throwing here vetoes the commit: the transaction is rolled back and the error is returned to the client.
  @BeforeCommit()
  public async beforeCommit(@Req() req: Request<Book>): Promise<void> {
    console.log(`[BookLifecycle] BeforeCommit ${req.event}`);

    // 'req' is the FIRST sub-request of the root which reached this handler, so 'req.data' belongs to that
    // one operation only - reading it here is a DEMO shortcut for a deterministic veto trigger. Real
    // '@BeforeCommit' checks belong on the final database state, per-operation checks on '@Before*'.
    if (req.data?.title === 'VETO_COMMIT') {
      throw new Error('BeforeCommit veto: title VETO_COMMIT');
    }
  }

  // Runs OUTSIDE any transaction - the commit is already durable, so database work needs its own transaction.
  @AfterCommit()
  public async afterCommit(@Req() req: Request<Book>): Promise<void> {
    console.log('[BookLifecycle] AfterCommit');

    await cds.tx(async () => {
      await SELECT.one.from(Book);
    });
  }

  @AfterRollback()
  public async afterRollback(@Req() req: Request<Book>): Promise<void> {
    console.log('[BookLifecycle] AfterRollback');
  }

  @OnRequestDone()
  public async requestDone(@Req() req: Request<Book>): Promise<void> {
    console.log('[BookLifecycle] RequestDone');
  }
}

export default BookLifecycleHandler;
