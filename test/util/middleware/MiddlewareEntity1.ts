import { TypedRequest } from '@sap/cds';

import { MiddlewareImpl, NextFunction } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareEntity1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextFunction) {
    console.log('Middleware entity 1 : EXECUTED');

    // req.reject(500, 'STOP');

    await next();
  }
}
