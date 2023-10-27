import { Repository } from '../../../../dist';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';

import { type Author } from '../util/types/entities/CatalogService';

@Repository()
class AuthorRepository extends BaseRepository<Author> {
  // ... define custom CDS-QL actions if BaseRepository ones are not satisfying your needs !
}

export default AuthorRepository;
