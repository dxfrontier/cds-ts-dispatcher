import { Repository } from '../../../../lib';

import { BaseRepository } from '@dxfrontier/cds-ts-repository';
import { Author } from '../../@cds-models/CatalogService';

@Repository()
class AuthorRepository extends BaseRepository<Author> {
  constructor() {
    super(Author);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default AuthorRepository;
