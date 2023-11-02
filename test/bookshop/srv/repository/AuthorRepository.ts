import { Repository } from '../../../../lib';
import { Author } from '../util/types/entities/CatalogService';

import { BaseRepository } from '@dxfrontier/cds-ts-repository';

@Repository()
class AuthorRepository extends BaseRepository<Author> {
  constructor() {
    super(Author);
  }
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default AuthorRepository;
