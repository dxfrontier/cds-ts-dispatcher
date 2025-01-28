import { Inject, Service, ServiceLogic, CDS_DISPATCHER } from '../../../../lib';

import type { ActionRequest, Request } from '../../../../lib';
import { Book, BookStat } from '../../@cds-models/CatalogService';

@ServiceLogic()
class BookStatsService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  public notifyDeleted(req: Request): void {
    req.notify('Item deleted');
  }

  public notifyUpdated(req: Request): void {
    req.notify(201, 'On update executed');
  }

  public notifyCreated(req: Request): void {
    req.notify(201, 'On Create executed');
  }

  public async updatedViews(req: Request<BookStat>) {
    await UPDATE(BookStat).where({ ID: 2 }).set({ views: 444233 });
  }

  public async getUpdatedBook(req: ActionRequest<typeof BookStat.actions.GenerateReport>) {
    return await SELECT(Book).where({ ID: req.data.ID });
  }

  public async handleReport(req: ActionRequest<typeof BookStat.actions.GenerateReport>) {
    const statsID = req.params[0] as string;
    const bookStats = await SELECT.one(BookStat).where({ ID: parseInt(statsID) });
    const book = await SELECT.one(Book).where({ ID: bookStats!.book_ID! });

    return {
      book: book!.title,
      rating: bookStats!.averageRating,
      stats: bookStats!.views,
    };
  }
}

export default BookStatsService;
