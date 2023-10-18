import { Repository } from '../../../../lib';
import { ActionRequest, TypedRequest } from '../../../../lib/util/types/types';
import { Author, Book, BookStat } from '../util/types/entities/CatalogService';

@Repository()
class BookStatsRepository {
  private async getAll() {
    return SELECT.from(BookStat);
  }

  public async updateSingleItemViews(req: TypedRequest<BookStat>) {
    await UPDATE.entity(BookStat).where({ ID: 2 }).with({ views: 444233 });
    return this.getAll();
  }

  public async generateReport(req: ActionRequest<typeof BookStat.actions.GenerateReport>) {
    const statsID = req.params.at(0);
    // const bookID = req.data.ID;

    // const author = SELECT.from(Author).byKey(authorID);
    const bookStats: BookStat = await SELECT.from(BookStat).byKey(statsID);
    const book: Book = await SELECT.from(Book).byKey(bookStats.book_ID);

    return {
      book: book.title,
      rating: bookStats.averageRating,
      stats: bookStats.views,
    };
  }
}

export default BookStatsRepository;
