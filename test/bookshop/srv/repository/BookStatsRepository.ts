import { Repository } from '../../../../lib';
import { BookStat } from '../util/types/entities/CatalogService';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';

@Repository()
class BookStatsRepository extends BaseRepository<BookStat> {
  constructor() {
    super(BookStat);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default BookStatsRepository;
