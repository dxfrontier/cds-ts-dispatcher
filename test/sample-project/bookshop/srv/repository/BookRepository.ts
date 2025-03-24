import { Repository } from '../../../../../lib';

@Repository()
class BookRepository {
  constructor() {}
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default BookRepository;
