import type { BookSeries } from '#cds-models/CatalogService';

import type { MiddlewareImpl, NextMiddleware, Request } from '../../../../../lib/types/types';

export class MiddlewareBookSeries1 implements MiddlewareImpl {
  public async use(req: Request<BookSeries>, next: NextMiddleware): Promise<void> {
    console.log('Middleware 1: BookSeries executed');

    await next();
  }
}
