import { BookEvent } from '#cds-models/CatalogService';

import { Inject, Request, Service, ServiceLogic, SRV } from '../../../../lib';

@ServiceLogic()
class BookEventsService {
  @Inject(SRV) private readonly srv: Service;

  public async showNewDraftMessage(req: Request) {
    req.notify('On new draft');
  }

  public async showCancelDraftMessage(req: Request) {
    req.notify('On cancel draft');
  }

  public async showEditDraftMessage(req: Request) {
    req.notify('On edit draft');
  }

  public async showSaveDraftMessage(req: Request) {
    req.notify('On save draft');
  }

  public async handleSingleInstance(req: Request, results: BookEvent[], isSingleInstance: boolean) {
    if (isSingleInstance) {
      req.notify('Single instance');
    }
  }
}

export default BookEventsService;
