import { MiddlewareImpl, NextMiddleware, Request } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareMethodAfterRead2 implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware) {
    console.log('Middleware 2: @AfterRead');

    await next();
  }
}
