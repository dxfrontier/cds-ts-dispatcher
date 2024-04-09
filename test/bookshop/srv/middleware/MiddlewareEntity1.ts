import { Book } from '#cds-models/CatalogService';

import { TypedRequest } from '@sap/cds';

import type { MiddlewareImpl, NextFunction } from '../../../../lib/types/types';
export class MiddlewareEntity1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextFunction) {
    console.log('Middleware entity 1 : EXECUTED');

    await next();
  }
}
