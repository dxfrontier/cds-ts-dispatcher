import { Repository } from '../../../../lib';
import { TypedRequest } from '../../../../lib/util/types/types';
import { Book, BookStat } from '../util/types/entities/CatalogService';

@Repository()
class BookStatsRepository {
  private async getAll() {
    return SELECT.from(BookStat);
  }

  public async updateSingleItemViews(req: TypedRequest<BookStat>) {
    await UPDATE.entity(BookStat).where({ ID: 2 }).with({ views: 444233 });
    return this.getAll();
  }
}

export default BookStatsRepository;
