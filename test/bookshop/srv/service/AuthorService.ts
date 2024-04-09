import { Inject, Service, ServiceLogic, SRV } from '../../../../lib';
import BookRepository from '../repository/BookRepository';

import type { ActionRequest } from '../../../../lib';
import type { BookStat } from '../../@cds-models/CatalogService';

@ServiceLogic()
class AuthorService {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookRepository) private readonly bookRepository: BookRepository;
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public async notifyAuthor(req: ActionRequest<typeof BookStat.actions.NotifyAuthor>) {
    // do something with data
    return true;
  }
}

export default AuthorService;
