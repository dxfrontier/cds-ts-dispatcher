/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  BeforeDeleteDraft,
  BeforeEditDraft,
  BeforeNewDraft,
  BeforeSaveDraft,
  EntityHandler,
  Inject,
  SRV,
  TypedRequest,
  type Service,
} from '../../../../../../lib';
import { UserActivityLog } from '../../../../@cds-models/AdminService';

@EntityHandler(UserActivityLog)
class UserActivityLogHandler {
  @Inject(SRV) private readonly srv: Service;

  @BeforeNewDraft()
  public async beforeNewDraftCreated(req: TypedRequest<UserActivityLog>) {
    req.notify(201, 'Before new draft executed');
  }

  @BeforeSaveDraft()
  public async beforeSaveDraft(req: TypedRequest<UserActivityLog>) {
    req.notify(201, 'Before save draft executed');
  }

  @BeforeEditDraft()
  public async beforeEditDraft(req: TypedRequest<UserActivityLog>) {
    req.notify(201, 'Before edit draft executed');
  }

  @BeforeDeleteDraft()
  public async beforeDeleteDraft(req: TypedRequest<UserActivityLog>) {
    // debugger;
  }
}

export default UserActivityLogHandler;
