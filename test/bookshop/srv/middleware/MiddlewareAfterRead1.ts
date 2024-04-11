import { Book } from '#cds-models/CatalogService';

import { TypedRequest } from '@sap/cds';

import { MiddlewareImpl, NextMiddleware } from '../../../../lib/types/types';

export class MiddlewareMethodAfterRead1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextMiddleware) {
    console.log('Middleware 1: @AfterRead');

    await next();
  }
}
