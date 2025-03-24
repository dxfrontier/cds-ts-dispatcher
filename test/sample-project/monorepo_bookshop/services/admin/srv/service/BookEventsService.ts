import { BookEvent } from '#cds-models/CatalogService';

import { CDS_DISPATCHER, Inject, Request, Service, ServiceLogic } from '@dxfrontier/cds-ts-dispatcher';

@ServiceLogic()
class BookEventsService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  public showNewDraftMessage(req: Request) {
    req.notify('On new draft');
  }

  public showCancelDraftMessage(req: Request) {
    req.notify('On cancel draft');
  }

  public showEditDraftMessage(req: Request) {
    req.notify('On edit draft');
  }

  public showSaveDraftMessage(req: Request) {
    req.notify('On save draft');
  }

  public handleSingleInstance(req: Request, results: BookEvent[], isSingleInstance: boolean) {
    if (isSingleInstance) {
      req.notify('Single instance');
    }
  }
}

export default BookEventsService;
