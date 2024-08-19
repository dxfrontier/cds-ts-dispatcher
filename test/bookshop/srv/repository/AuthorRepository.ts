import { Repository } from '../../../../lib';

@Repository()
class AuthorRepository {
  constructor() {}
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default AuthorRepository;
