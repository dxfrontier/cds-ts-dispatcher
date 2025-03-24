import { Inject, ServiceLogic, CDS_DISPATCHER } from '@dxfrontier/cds-ts-dispatcher';

import BookRepository from '../repository/BookRepository';
import BookStatsRepository from '../repository/BookStatsRepository';

import type { ActionRequest, Request, Service } from '@dxfrontier/cds-ts-dispatcher';
import type { BookStat } from '#cds-models/CatalogService';

@ServiceLogic()
class BookStatsService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookStatsRepository) private readonly bookStatsRepository: BookStatsRepository;
  @Inject(BookRepository) private readonly bookRepository: BookRepository;

  public notifyDeleted(req: Request) {
    req.notify('Item deleted');
  }

  public notifyUpdated(req: Request) {
    req.notify(201, 'On update executed');
  }

  public notifyCreated(req: Request) {
    req.notify(201, 'On Create executed');
  }

  public async updatedViews(req: Request<BookStat>) {
    await this.bookStatsRepository.update({ ID: 2 }, { views: 444233 });
    return await this.bookStatsRepository.getAll();
  }

  public async getUpdatedBook(req: ActionRequest<typeof BookStat.actions.GenerateReport>) {
    return await this.bookRepository.findOne({ ID: req.data.ID });
  }

  public async handleReport(req: ActionRequest<typeof BookStat.actions.GenerateReport>) {
    const statsID = req.params[0] as string;

    const bookStats = await this.bookStatsRepository.findOne({ ID: parseInt(statsID) });
    const book = await this.bookRepository.findOne({ ID: bookStats!.book_ID! });

    return {
      book: book!.title,
      rating: bookStats!.averageRating,
      stats: bookStats!.views,
    };
  }
}

export default BookStatsService;
