import { Inject, SRV, Service, ServiceLogic, type ActionRequest } from '../../../../lib';
import { type BookStat } from '../util/types/entities/CatalogService';

@ServiceLogic()
class AuthorService {
  @Inject(SRV) private readonly srv: Service;

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public async notifyAuthor(req: ActionRequest<typeof BookStat.actions.NotifyAuthor>) {
    // do something with data
    return true;
  }
}

export default AuthorService;
