import {
  AfterDeleteDraft,
  AfterEditDraft,
  AfterNewDraft,
  AfterSaveDraft,
  EntityHandler,
  Inject,
  ServiceHelper,
} from '../../../../../../dist';
import { Service } from '@sap/cds';
import { TypedRequest } from '../../../../../../dist';
import { Promotion } from '../../../util/types/entities/AdminService';

@EntityHandler(Promotion)
class PromotionHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;

  @AfterNewDraft()
  public async afterNewDraftCreated(results: Promotion, req: TypedRequest<Promotion>) {
    req.notify(201, 'After new draft executed');
  }

  @AfterSaveDraft()
  public async afterSaveDraft(results: Promotion, req: TypedRequest<Promotion>) {
    req.notify(201, 'After save draft executed');
  }

  @AfterEditDraft()
  public async afterEditDraft(results: Promotion, req: TypedRequest<Promotion>) {
    req.notify(201, 'After edit draft executed');
  }

  @AfterDeleteDraft()
  public async afterDeleteDraft(deleted: boolean, req: TypedRequest<Promotion>) {
    debugger;
  }
}

export default PromotionHandler;
