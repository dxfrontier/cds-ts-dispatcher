import {
  BeforeDeleteDraft,
  BeforeEditDraft,
  BeforeNewDraft,
  BeforeSaveDraft,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  PrependDraft,
  Req,
  RequestResponse,
  Res,
  Result,
  Service,
  TypedRequest,
} from '../../../../../../lib';
import { UserActivityLog } from '../../../../@cds-models/AdminService';

@EntityHandler(UserActivityLog)
class UserActivityLogHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @PrependDraft({ eventDecorator: 'BeforeNewDraft' })
  public async prepend(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Result() result: UserActivityLog,
  ): Promise<void> {
    res.setHeader('Accept-Language', 'DE_de');
  }

  @BeforeNewDraft()
  public async beforeNewDraft(@Req() req: TypedRequest<UserActivityLog>): Promise<void> {
    req.notify(201, 'Before new draft executed');
  }

  @BeforeSaveDraft()
  public async beforeSaveDraft(@Req() req: TypedRequest<UserActivityLog>): Promise<void> {
    req.notify(201, 'Before save draft executed');
  }

  @BeforeEditDraft()
  public async beforeEditDraft(@Req() req: TypedRequest<UserActivityLog>): Promise<void> {
    req.notify(201, 'Before edit draft executed');
  }

  @BeforeDeleteDraft()
  public async beforeDeleteDraft(@Req() req: TypedRequest<UserActivityLog>): Promise<void> {
    // ...
  }
}

export default UserActivityLogHandler;
