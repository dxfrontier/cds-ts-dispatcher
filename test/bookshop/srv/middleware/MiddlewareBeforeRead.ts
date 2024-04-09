import { Book } from '#cds-models/CatalogService';

import { TypedRequest } from '@sap/cds';

import { MiddlewareImpl, NextFunction } from '../../../../lib/types/types';

export class MiddlewareMethodBeforeRead implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextFunction) {
    console.log('Middleware 1: @BeforeRead');
    await next();
  }
}
