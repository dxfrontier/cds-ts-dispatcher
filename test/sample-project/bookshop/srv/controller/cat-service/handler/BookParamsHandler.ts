/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Book } from '#cds-models/CatalogService';

import { BeforeUpdate, Data, Diff, EntityHandler, Param, Tenant, UserInfo } from '../../../../../../../lib';

import type { User } from '@sap/cds';

@EntityHandler(Book)
class BookParamsHandler {
  @BeforeUpdate()
  private async beforeUpdate(
    @Data() data: Book,
    @Param<Book>('title') title: string,
    @UserInfo() user: User,
    @Tenant() tenant: string | undefined,
    @Diff() diff: Book,
  ) {
    // Observation only: proves @Data, @Param, @UserInfo, @Tenant and @Diff inject correctly without
    // mutating the request (existing e2e assertions must not shift).
    console.log('[BookParams] diff', JSON.stringify({ title: (diff as any)?.title, ID: (diff as any)?.ID }));
  }
}

export default BookParamsHandler;
