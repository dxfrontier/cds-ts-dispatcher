import { Repository } from '../../../../lib';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';
import { BookStat } from '../../@cds-models/CatalogService';

@Repository()
class BookStatsRepository extends BaseRepository<BookStat> {
  constructor() {
    super(BookStat);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default BookStatsRepository;
