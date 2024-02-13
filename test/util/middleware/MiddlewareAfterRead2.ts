import { TypedRequest } from '@sap/cds';
import { MiddlewareImpl, Next } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareMethodAfterRead2 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: Next) {
    console.log('Middleware 2: @AfterRead');

    next();
    // req.reject(500, 'STOP');
  }
}
