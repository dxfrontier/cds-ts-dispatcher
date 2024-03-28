import { TypedRequest } from '@sap/cds';
import { MiddlewareImpl, Next } from '../../../../lib/types/types';
import { Book } from '#cds-models/CatalogService';

export class MiddlewareMethodBeforeRead implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: Next) {
    console.log('Middleware 1: @BeforeRead');
    await next();
  }
}
