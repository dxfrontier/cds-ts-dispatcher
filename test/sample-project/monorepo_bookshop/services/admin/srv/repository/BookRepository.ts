import { Book } from '#cds-models/CatalogService';
import { Repository } from '@dxfrontier/cds-ts-dispatcher';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';

@Repository()
class BookRepository extends BaseRepository<Book> {
  constructor() {
    super(Book);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default BookRepository;
