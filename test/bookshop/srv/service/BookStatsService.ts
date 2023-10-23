import { Service } from '@sap/cds';
import { Inject, ServiceHelper, ServiceLogic } from '../../../../dist';
import { Book } from '../util/types/entities/CatalogService';
import { ActionRequest, TypedRequest } from '../../../../dist';
import { BookStat } from '../util/types/entities/CatalogService';
import BookStatsRepository from '../repository/BookStatsRepository';

@ServiceLogic()
class BookStatsService {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(BookStatsRepository) private bookStatsRepository: BookStatsRepository;

  public async updatedViews(req: TypedRequest<BookStat>) {
    return this.bookStatsRepository.updateSingleItemViews(req);
  }

  public async getUpdatedBook(req: ActionRequest<typeof BookStat.actions.GenerateReport>) {
    return SELECT.from(Book).where(req.data.ID);
  }

  public async handleReport(req: ActionRequest<typeof BookStat.actions.GenerateReport>) {
    return this.bookStatsRepository.generateReport(req);
  }
}

export default BookStatsService;
