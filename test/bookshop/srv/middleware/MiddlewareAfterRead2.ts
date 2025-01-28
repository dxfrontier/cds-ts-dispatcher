import type { Book } from '#cds-models/CatalogService';
import type { MiddlewareImpl, NextMiddleware, Request } from '../../../../lib/types/types';

export class MiddlewareMethodAfterRead2 implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware): Promise<void> {
    console.log('Middleware 2: @AfterRead');

    req.notify('MiddlewareAfterRead2');

    await next();
  }
}
