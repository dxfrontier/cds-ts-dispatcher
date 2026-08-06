/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import {
  AfterDiscardDraft,
  AfterPatchDraft,
  AfterRead,
  AfterReadDraft,
  AfterUpdate,
  BeforeDiscardDraft,
  BeforePatchDraft,
  BeforeUpdate,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Next,
  NextEvent,
  OnCancelDraft,
  OnDiscardDraft,
  OnEditDraft,
  OnNewDraft,
  OnPatchDraft,
  OnSaveDraft,
  OnUpdate,
  PrependDraft,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceSwitch,
} from '../../../../../../../lib';
import { BookEvent } from '../../../../@cds-models/CatalogService';
import BookEventsService from '../../../service/BookEventsService';

@EntityHandler(BookEvent)
class BookEventsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookEventsService) private readonly bookEventsService: BookEventsService;

  // ============================================================================================================
  // cds 10 bypass_draft matrix: PATCHing the ACTIVE entity directly (IsActiveEntity=true) must fire these
  // ACTIVE-entity handlers (distinct 'active' notify markers) and NOT the '@...PatchDraft' handlers below.
  // ============================================================================================================

  @BeforeUpdate()
  public async beforeUpdate(@Req() req: Request) {
    req.notify('Before update active');
  }

  @OnUpdate()
  public async update(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('On update active');
    return next();
  }

  @AfterUpdate()
  public async afterUpdate(@Results() results: BookEvent, @Req() req: Request) {
    req.notify('After update active');
  }

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

  // ============================================================================================================
  // M6 regression probe: @PrependDraft({ eventDecorator: 'BeforeEditDraft' }) must register on the ACTIVE
  // entity (isDraft: false), mirroring @BeforeEditDraft itself - see PREPEND-DRAFT-EDIT.test.ts.
  // ============================================================================================================

  @PrependDraft({ eventDecorator: 'BeforeEditDraft' })
  private async prependBeforeEditDraft(@Req() req: Request): Promise<void> {
    console.log('[PrependBeforeEditDraft] fired');
  }

  // ============================================================================================================
  // F1: PATCH draft (CAP's canonical field-level draft-edit event, alias of UPDATE on '.drafts' since cds 10)
  // ============================================================================================================

  @BeforePatchDraft()
  public async beforePatch(@Req() req: Request) {
    req.notify('Before patch draft');
  }

  @OnPatchDraft()
  public async patch(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('On patch draft');
    return next();
  }

  @AfterPatchDraft()
  public async afterPatch(@Results() results: BookEvent, @Req() req: Request) {
    req.notify('After patch draft');
  }

  // ============================================================================================================
  // F1: DISCARD draft (CAP's canonical alias of CANCEL since cds 10)
  // ============================================================================================================

  @BeforeDiscardDraft()
  public async beforeDiscard(@Req() req: Request) {
    req.notify('Before discard draft');
  }

  @OnDiscardDraft()
  public async discard(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('On discard draft');
    return next();
  }

  @AfterDiscardDraft()
  public async afterDiscard(@Req() req: Request) {
    req.notify('After discard draft');
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
