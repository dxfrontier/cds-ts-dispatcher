import { Book } from '#cds-models/CatalogService';

import { TypedRequest } from '@sap/cds';

import type { MiddlewareImpl, NextMiddleware } from '../../../../lib/types/types';
export class MiddlewareEntity1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextMiddleware) {
    console.log('Middleware entity 1 : EXECUTED');

    await next();
  }
}
