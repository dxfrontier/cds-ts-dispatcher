import { Repository } from '../../../../dist';
import { TypedRequest } from '../../../../dist';
import { Book } from '../util/types/entities/CatalogService';

@Repository()
class BookRepository {
  public async addDefaultTitleText(result: Book, req: TypedRequest<Book>) {
    return UPDATE.entity(Book).where({ ID: req.data.ID }).set({ title: 'Dracula' });
  }
}

export default BookRepository;
