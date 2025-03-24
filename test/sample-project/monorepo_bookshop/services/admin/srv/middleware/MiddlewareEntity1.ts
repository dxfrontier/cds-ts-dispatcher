import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher';
import type { Book } from '#cds-models/CatalogService';

export class MiddlewareEntity1 implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware) {
    console.log('Middleware entity 1 : EXECUTED');

    await next();
  }
}
