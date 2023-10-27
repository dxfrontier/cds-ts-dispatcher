import { Repository } from '../../../../dist';

import { BaseRepository } from '@dxfrontier/cds-ts-repository';
import { Book } from '../util/types/entities/CatalogService';

@Repository()
class BookRepository extends BaseRepository<Book> {
  constructor() {
    super(Book);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default BookRepository;
