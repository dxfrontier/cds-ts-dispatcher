import { TypedRequest } from '@sap/cds';

import { MiddlewareImpl, NextMiddleware } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareMethodAfterRead2 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextMiddleware) {
    console.log('Middleware 2: @AfterRead');

    await next();
  }
}
