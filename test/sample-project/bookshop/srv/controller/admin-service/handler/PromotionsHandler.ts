import {
  AfterDeleteDraft,
  AfterEditDraft,
  AfterNewDraft,
  AfterReadDraftSingleInstance,
  AfterSaveDraft,
  EntityHandler,
  Inject,
  PrependDraft,
  Req,
  RequestResponse,
  Res,
  Result,
  Service,
  CDS_DISPATCHER,
  Request,
} from '../../../../../../../lib';
import { Promotion } from '../../../../@cds-models/AdminService';

@EntityHandler(Promotion)
class PromotionHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @PrependDraft({ eventDecorator: 'AfterReadDraftSingleInstance' })
  public async prepend(@Req() req: Request, @Res() res: RequestResponse, @Result() result: Promotion): Promise<void> {
    res.setHeader('Accept-Language', 'DE_de');
  }

  @AfterReadDraftSingleInstance()
  public async afterReadSingleDraft(
    @Req() req: Request<Promotion>,
    @Res() res: RequestResponse,
    @Result() result: Promotion,
  ): Promise<void> {
    res.setHeader('Content-Language', 'DE_de');
  }

  @AfterNewDraft()
  public async afterNewDraft(@Result() result: Promotion, @Req() req: Request<Promotion>): Promise<void> {
    req.notify(201, 'After new draft executed');
  }

  @AfterSaveDraft()
  public async afterSaveDraft(@Result() result: Promotion, @Req() req: Request<Promotion>): Promise<void> {
    req.notify(201, 'After save draft executed');
  }

  @AfterEditDraft()
  public async afterEditDraft(@Result() result: Promotion, @Req() req: Request<Promotion>): Promise<void> {
    req.notify(201, 'After edit draft executed');
  }

  @AfterDeleteDraft()
  public async afterDeleteDraft(@Result() deleted: boolean, @Req() req: Request<Promotion>): Promise<void> {
    // ...
  }
}

export default PromotionHandler;
