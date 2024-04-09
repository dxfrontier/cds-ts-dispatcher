import { TypedRequest } from '@sap/cds';

import { MiddlewareImpl, NextFunction } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareMethodAfterRead1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextFunction) {
    console.log('Middleware 1: @AfterRead');

    await next();
  }
}
