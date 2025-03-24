import type { Book } from '#cds-models/CatalogService';
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher';

export class MiddlewareMethodBeforeRead implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware) {
    console.log('Middleware 1: @BeforeRead');
    await next();
  }
}
