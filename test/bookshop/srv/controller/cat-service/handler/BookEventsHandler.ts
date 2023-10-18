import {
  EntityHandler,
  Inject,
  OnCancelDraft,
  OnEditDraft,
  OnNewDraft,
  OnSaveDraft,
  ServiceHelper,
} from '../../../../../../lib';
import { Request, Service } from '@sap/cds';
import { BookEvent } from '../../../util/types/entities/CatalogService';

@EntityHandler(BookEvent)
class BookEventsHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;

  @OnNewDraft()
  public async onNewDraftMethod(req: Request, next: Function) {
    req.notify('On new draft');
    return next();
  }

  @OnCancelDraft()
  public async onCancelDraftMethod(req: Request, next: Function) {
    req.notify('On cancel draft');
    return next();
  }

  @OnEditDraft()
  public async onEditDraftMethod(req: Request, next: Function) {
    req.notify('On edit draft');
    return next();
  }

  @OnSaveDraft()
  public async onSaveDraftMethod(req: Request, next: Function) {
    req.notify('On save draft');
    return next();
  }
}

export default BookEventsHandler;
