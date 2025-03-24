import { Promotion } from '#cds-models/AdminService';

import {
  AfterDeleteDraft,
  AfterEditDraft,
  AfterNewDraft,
  AfterSaveDraft,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Req,
  Result,
  Service,
} from '@dxfrontier/cds-ts-dispatcher';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(Promotion)
class PromotionHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

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
