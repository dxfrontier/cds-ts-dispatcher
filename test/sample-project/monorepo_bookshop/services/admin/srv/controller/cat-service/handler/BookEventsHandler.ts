import {
  AfterRead,
  AfterReadDraft,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Next,
  OnCancelDraft,
  OnEditDraft,
  OnNewDraft,
  OnSaveDraft,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceSwitch,
} from '@dxfrontier/cds-ts-dispatcher';

import { BookEvent } from '#cds-models/CatalogService';
import BookEventsService from '../../../service/BookEventsService';

import type { NextEvent } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(BookEvent)
class BookEventsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookEventsService) private readonly bookEventsService: BookEventsService;

  @OnNewDraft()
  public async newDraft(@Req() req: Request, @Next() next: NextEvent) {
    this.bookEventsService.showNewDraftMessage(req);
    return next();
  }

  @OnCancelDraft()
  public async cancel(@Req() req: Request, @Next() next: NextEvent) {
    this.bookEventsService.showCancelDraftMessage(req);
    return next();
  }

  @OnEditDraft()
  public async edit(@Req() req: Request, @Next() next: NextEvent) {
    this.bookEventsService.showEditDraftMessage(req);
    return next();
  }

  @OnSaveDraft()
  public async save(@Req() req: Request, @Next() next: NextEvent) {
    this.bookEventsService.showSaveDraftMessage(req);
    return next();
  }

  @AfterRead()
  @AfterReadDraft()
  public async afterReadDraft(
    @Results() results: BookEvent[],
    @Req() req: Request,
    @SingleInstanceSwitch() isSingleInstance: boolean,
  ): Promise<void> {
    this.bookEventsService.handleSingleInstance(req, results, isSingleInstance);
  }
}

export default BookEventsHandler;
