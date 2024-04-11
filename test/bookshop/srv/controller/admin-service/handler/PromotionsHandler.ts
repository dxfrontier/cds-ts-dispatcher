import {
  AfterDeleteDraft,
  AfterEditDraft,
  AfterNewDraft,
  AfterSaveDraft,
  EntityHandler,
  Inject,
  Req,
  Result,
  SRV,
} from '../../../../../../lib';
import { Promotion } from '../../../../@cds-models/AdminService';

import type { TypedRequest, Service } from '../../../../../../lib';

@EntityHandler(Promotion)
class PromotionHandler {
  @Inject(SRV) private readonly srv: Service;

  @AfterNewDraft()
  public async afterNewDraft(@Result() result: Promotion, @Req() req: TypedRequest<Promotion>) {
    req.notify(201, 'After new draft executed');
  }

  @AfterSaveDraft()
  public async afterSaveDraft(@Result() result: Promotion, req: TypedRequest<Promotion>) {
    req.notify(201, 'After save draft executed');
  }

  @AfterEditDraft()
  public async afterEditDraft(@Result() result: Promotion, @Req() req: TypedRequest<Promotion>) {
    req.notify(201, 'After edit draft executed');
  }

  @AfterDeleteDraft()
  public async afterDeleteDraft(@Result() deleted: boolean, @Req() req: TypedRequest<Promotion>) {
    // ...
  }
}

export default PromotionHandler;
