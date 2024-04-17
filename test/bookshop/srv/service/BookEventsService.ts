import { Inject, Service, ServiceLogic, SRV } from '../../../../lib';

import type { Request } from '../../../../lib';
import type { BookEvent } from '#cds-models/CatalogService';

@ServiceLogic()
class BookEventsService {
  @Inject(SRV) private readonly srv: Service;

  public showNewDraftMessage(req: Request): void {
    req.notify('On new draft');
  }

  public showCancelDraftMessage(req: Request): void {
    req.notify('On cancel draft');
  }

  public showEditDraftMessage(req: Request): void {
    req.notify('On edit draft');
  }

  public showSaveDraftMessage(req: Request): void {
    req.notify('On save draft');
  }

  public handleSingleInstance(req: Request, results: BookEvent[], isSingleInstance: boolean): void {
    if (isSingleInstance) {
      req.notify('Single instance');
    }
  }
}

export default BookEventsService;
