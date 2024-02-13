import { TypedRequest } from '@sap/cds';
import { MiddlewareImpl, Next } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareMethodAfterRead1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: Next) {
    console.log('Middleware 1: @AfterRead');

    next();
  }
}
