import {
  CDS_DISPATCHER,
  Inject,
  OnScheduled,
  OnScheduledFailure,
  OnScheduledSuccess,
  Req,
  Request,
  Result,
  Schedule,
  Service,
  UnboundActions,
} from '../../../../../../../lib';

@UnboundActions()
class ScheduledTasksHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  // F4: recurring singleton task, handled AND scheduled at bootstrap (every 2 minutes).
  @Schedule({ name: 'cleanupExpiredCarts', every: '2m' })
  public async cleanupExpiredCarts(@Req() req: Request): Promise<void> {
    console.log('[ScheduledTasksHandler] cleanupExpiredCarts task fired', req.data);
  }

  // F4: handler-only for a fully-qualified (dot-containing) task name, registered verbatim (no dot-stripping).
  @OnScheduled('CatalogService.reindex.catalog')
  public async reindexCatalog(@Req() req: Request): Promise<void> {
    console.log('[ScheduledTasksHandler] reindexCatalog task fired', req.data);
  }

  // Outcome of the task above: 'CatalogService.reindex.catalog/#succeeded' carries the raw task result.
  @OnScheduledSuccess('CatalogService.reindex.catalog')
  public async reindexCatalogSucceeded(@Result() result: unknown, @Req() req: Request): Promise<void> {
    console.log('[ScheduledOutcome] succeeded', result);
  }

  // Outcome of the recurring task above: fires only once its retries (event-queue 'maxAttempts') are exhausted.
  // The failure arrives as a SERIALIZED plain object (JSON round-trip through the queue), not as an Error
  // instance - hence @Result() and the optional property access, @Error() would stay undefined here.
  @OnScheduledFailure('cleanupExpiredCarts')
  public async cleanupExpiredCartsFailed(@Result() failure: { message?: string }, @Req() req: Request): Promise<void> {
    console.log('[ScheduledOutcome] failed', failure?.message);
  }
}

export default ScheduledTasksHandler;
