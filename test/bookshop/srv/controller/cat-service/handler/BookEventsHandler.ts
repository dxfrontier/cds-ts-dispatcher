import {
  AfterRead,
  AfterReadDraft,
  EntityHandler,
  Inject,
  OnCancelDraft,
  OnEditDraft,
  OnNewDraft,
  OnSaveDraft,
  ServiceHelper,
  SingleInstanceCapable,
} from '../../../../../../dist';
import { Request, Service } from '@sap/cds';
import { BookEvent } from '../../../util/types/entities/CatalogService';

@EntityHandler(BookEvent)
class BookEventsHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;

  // @BeforeNewDraft()
  // public async beforeNewDraftCreated(req: TypedRequest<BookEvent>) {
  //   debugger;
  // }

  // @BeforeSaveDraft()
  // public async beforeSaveDraft(req: TypedRequest<BookEvent>) {
  //   debugger;
  // }

  // @BeforeEditDraft()
  // public async beforeEditDraft(req: TypedRequest<BookEvent>) {
  //   debugger;
  // }

  // @BeforeDeleteDraft()
  // public async beforeDeleteDraft(req: TypedRequest<BookEvent>) {
  //   debugger;
  // }

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

  @AfterRead()
  @AfterReadDraft()
  @SingleInstanceCapable()
  public async afterReadDraftMethod(results: BookEvent[], req: Request, isSingleInstance: boolean) {
    // handle single instance
    if (results.length === 0) {
      return;
    }

    if (isSingleInstance) {
      req.notify('Single instance');
      return;
    }

    // handle entity set
  }
}

export default BookEventsHandler;
