import {
  AfterDeleteDraft,
  AfterEditDraft,
  AfterNewDraft,
  AfterReadDraftSingleInstance,
  AfterSaveDraft,
  EntityHandler,
  Inject,
  Req,
  RequestResponse,
  Res,
  Result,
  Service,
  SRV,
  TypedRequest,
} from '../../../../../../lib';
import { Promotion } from '../../../../@cds-models/AdminService';

@EntityHandler(Promotion)
class PromotionHandler {
  @Inject(SRV) private readonly srv: Service;

  @AfterReadDraftSingleInstance()
  public async afterReadSingleDraft(
    @Req() req: TypedRequest<Promotion>,
    @Res() res: RequestResponse,
    @Result() result: Promotion,
  ): Promise<void> {
    res.setHeader('Content-Language', 'DE_de');
  }

  @AfterNewDraft()
  public async afterNewDraft(@Result() result: Promotion, @Req() req: TypedRequest<Promotion>): Promise<void> {
    req.notify(201, 'After new draft executed');
  }

  @AfterSaveDraft()
  public async afterSaveDraft(@Result() result: Promotion, @Req() req: TypedRequest<Promotion>): Promise<void> {
    req.notify(201, 'After save draft executed');
  }

  @AfterEditDraft()
  public async afterEditDraft(@Result() result: Promotion, @Req() req: TypedRequest<Promotion>): Promise<void> {
    req.notify(201, 'After edit draft executed');
  }

  @AfterDeleteDraft()
  public async afterDeleteDraft(@Result() deleted: boolean, @Req() req: TypedRequest<Promotion>): Promise<void> {
    // ...
  }
}

export default PromotionHandler;
