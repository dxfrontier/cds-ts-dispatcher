import { Inject, Service, ServiceLogic, CDS_DISPATCHER } from '../../../../../lib';
import BookRepository from '../repository/BookRepository';

import type { ActionRequest } from '../../../../../lib';
import type { BookStat } from '../../@cds-models/CatalogService';

@ServiceLogic()
class AuthorService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookRepository) private readonly bookRepository: BookRepository;

  public async notifyAuthor(req: ActionRequest<typeof BookStat.actions.NotifyAuthor>) {
    // do something with data
    return true;
  }
}

export default AuthorService;
