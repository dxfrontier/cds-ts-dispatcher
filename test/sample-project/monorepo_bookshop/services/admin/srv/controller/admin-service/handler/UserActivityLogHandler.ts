import {
  BeforeDeleteDraft,
  BeforeEditDraft,
  BeforeNewDraft,
  BeforeSaveDraft,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Req,
  Service,
} from '@dxfrontier/cds-ts-dispatcher';

import { UserActivityLog } from '#cds-models/AdminService';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(UserActivityLog)
class UserActivityLogHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @BeforeNewDraft()
  public async beforeNewDraft(@Req() req: Request<UserActivityLog>): Promise<void> {
    req.notify(201, 'Before new draft executed');
  }

  @BeforeSaveDraft()
  public async beforeSaveDraft(@Req() req: Request<UserActivityLog>): Promise<void> {
    req.notify(201, 'Before save draft executed');
  }

  @BeforeEditDraft()
  public async beforeEditDraft(@Req() req: Request<UserActivityLog>): Promise<void> {
    req.notify(201, 'Before edit draft executed');
  }

  @BeforeDeleteDraft()
  public async beforeDeleteDraft(@Req() req: Request<UserActivityLog>): Promise<void> {
    // ...
  }
}

export default UserActivityLogHandler;
