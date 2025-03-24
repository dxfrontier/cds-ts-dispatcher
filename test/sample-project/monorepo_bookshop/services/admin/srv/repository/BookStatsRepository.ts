import { BookStat } from '#cds-models/CatalogService';
import { Repository } from '@dxfrontier/cds-ts-dispatcher';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';

@Repository()
class BookStatsRepository extends BaseRepository<BookStat> {
  constructor() {
    super(BookStat);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default BookStatsRepository;
