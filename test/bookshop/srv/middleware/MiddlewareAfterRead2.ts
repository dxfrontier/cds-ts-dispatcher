import { TypedRequest } from '@sap/cds';
import { MiddlewareImpl, Next } from '../../../../lib/util/types/types';
import { Book } from '#cds-models/CatalogService';

export class MiddlewareMethodAfterRead2 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: Next) {
    console.log('Middleware 2: @AfterRead');

    req.notify('MiddlewareAfterRead2');

    next();
  }
}
