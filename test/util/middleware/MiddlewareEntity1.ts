import { MiddlewareImpl, NextMiddleware, Request } from '../../../lib';
import { Book } from '../../bookshop/@cds-models/CatalogService';

export class MiddlewareEntity1 implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware) {
    console.log('Middleware entity 1 : EXECUTED');

    // req.reject(500, 'STOP');

    await next();
  }
}
