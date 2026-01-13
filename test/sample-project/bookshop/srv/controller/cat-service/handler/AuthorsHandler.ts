/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Author } from '#cds-models/CatalogService';

import {
  AfterRead,
  CDS_DISPATCHER,
  EntityHandler,
  Include,
  Inject,
  Req,
  Request,
  Results,
  Service,
} from '../../../../../../../lib';

@EntityHandler(Author)
class AuthorsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  // Test: @Include decorator - only returns 'ID', 'name' fields (excludes all other fields)
  @AfterRead()
  @Include<Author>('ID', 'name')
  private async afterRead(@Results() results: Author[], @Req() req: Request): Promise<void> {}
}

export default AuthorsHandler;
