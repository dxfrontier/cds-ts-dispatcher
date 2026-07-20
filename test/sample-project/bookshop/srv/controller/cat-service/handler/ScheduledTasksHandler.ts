import {
  CDS_DISPATCHER,
  Inject,
  OnScheduled,
  Req,
  Request,
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
}

export default ScheduledTasksHandler;
