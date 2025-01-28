import { MiddlewareImpl, NextMiddleware, Request } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareMethodAfterRead1 implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware) {
    console.log('Middleware 1: @AfterRead');

    await next();
  }
}
