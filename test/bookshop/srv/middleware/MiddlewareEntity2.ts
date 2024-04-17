import type { Book } from '#cds-models/CatalogService';
import type { TypedRequest } from '@sap/cds';
import type { MiddlewareImpl, NextMiddleware } from '../../../../lib/types/types';

export class MiddlewareEntity2 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: NextMiddleware): Promise<void> {
    console.log('Middleware entity 2 : EXECUTED');

    req.notify('Middleware2');

    await next();
  }
}
