import { Service } from '@sap/cds';
import { Inject, SRV, ServiceLogic } from '../../../../dist';
import { Book } from '../util/types/entities/CatalogService';
import { ActionRequest, TypedRequest } from '../../../../dist';
import { BookStat } from '../util/types/entities/CatalogService';
import BookStatsRepository from '../repository/BookStatsRepository';

@ServiceLogic()
class AuthorService {
  @Inject(SRV) private readonly srv: Service;

  public async notifyAuthor(req: ActionRequest<typeof BookStat.actions.NotifyAuthor>) {
    const authorID = req.data.ID;
    // do something with data
    return true;
  }
}

export default AuthorService;
