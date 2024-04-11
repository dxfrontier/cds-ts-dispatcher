import { Book } from '#cds-models/CatalogService';

import { TypedRequest } from '@sap/cds';

import { MiddlewareImpl, NextMiddleware } from '../../../../lib/types/types';

export class MiddlewareEntity2 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextMiddleware) {
    console.log('Middleware entity 2 : EXECUTED');

    req.notify('Middleware2');

    await next();
  }
}
