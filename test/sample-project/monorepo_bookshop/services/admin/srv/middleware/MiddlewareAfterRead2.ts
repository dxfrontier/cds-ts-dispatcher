import type { Book } from '#cds-models/CatalogService';
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher';

export class MiddlewareMethodAfterRead2 implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware) {
    console.log('Middleware 2: @AfterRead');

    req.notify('MiddlewareAfterRead2');

    await next();
  }
}
