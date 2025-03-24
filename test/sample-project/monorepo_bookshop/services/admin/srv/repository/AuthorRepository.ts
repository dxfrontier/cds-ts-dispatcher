import { Author } from '#cds-models/CatalogService';
import { Repository } from '@dxfrontier/cds-ts-dispatcher';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';

@Repository()
class AuthorRepository extends BaseRepository<Author> {
  constructor() {
    super(Author);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default AuthorRepository;
