import { TypedRequest } from '@sap/cds';
import { MiddlewareImpl, Next } from '../../../../lib/util/types/types';
import { Book } from '#cds-models/CatalogService';

export class MiddlewareEntity2 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: Next) {
    console.log('Middleware entity 2 : EXECUTED');

    req.notify('Middleware2');

    await next();
  }
}
