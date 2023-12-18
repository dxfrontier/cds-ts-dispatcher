import { Repository } from '../../../../lib';

import { BaseRepository } from '@dxfrontier/cds-ts-repository';
import { Book } from '../../@cds-models/CatalogService';

@Repository()
class BookRepository extends BaseRepository<Book> {
  constructor() {
    super(Book);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default BookRepository;
