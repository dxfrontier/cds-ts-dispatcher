import { TypedRequest } from '@sap/cds';
import type { MiddlewareImpl, Next } from '../../../../lib/util/types/types';
import { Book } from '#cds-models/CatalogService';

export class MiddlewareEntity1 implements MiddlewareImpl {
  public async use(req: TypedRequest<Book>, next: Next) {
    console.log('Middleware entity 1 : EXECUTED');

    next();
  }
}
