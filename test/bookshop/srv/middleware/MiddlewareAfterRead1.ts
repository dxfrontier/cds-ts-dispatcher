import { TypedRequest } from '@sap/cds';
import { MiddlewareImpl, Next } from '../../../../lib/util/types/types';
import { Book } from '#cds-models/CatalogService';

export class MiddlewareMethodAfterRead1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: Next) {
    console.log('Middleware 1: @AfterRead');

    await next();
  }
}
