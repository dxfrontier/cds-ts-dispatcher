import type { Book } from '#cds-models/CatalogService';
import type { MiddlewareImpl, NextMiddleware, Request } from '../../../../../lib/types/types';

export class MiddlewareMethodBeforeRead implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware): Promise<void> {
    console.log('Middleware 1: @BeforeRead');
    await next();
  }
}
