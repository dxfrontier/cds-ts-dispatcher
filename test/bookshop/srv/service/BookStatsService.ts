import { Service } from '@sap/cds';
import { Inject, ServiceHelper, ServiceLogic } from '../../../../lib';
import { Review } from '../util/types/entities/CatalogService';
import { TypedRequest } from '../../../../lib/util/types/types';
import { BookStat } from '../util/types/entities/CatalogService';
import BookStatsRepository from '../repository/BookStatsRepository';

@ServiceLogic()
class BookStatsService {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(BookStatsRepository) private bookStatsRepository: BookStatsRepository;

  public async updatedViews(req: TypedRequest<BookStat>) {
    return this.bookStatsRepository.updateSingleItemViews(req);
  }
}

export default BookStatsService;
