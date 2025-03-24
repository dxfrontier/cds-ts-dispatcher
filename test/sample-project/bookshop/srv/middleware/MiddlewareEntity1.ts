import type { Book } from '#cds-models/CatalogService';
import type { MiddlewareImpl, NextMiddleware, Request } from '../../../../../lib/types/types';
export class MiddlewareEntity1 implements MiddlewareImpl {
  public async use(req: Request<Book>, next: NextMiddleware): Promise<void> {
    console.log('Middleware entity 1 : EXECUTED');

    await next();
  }
}
