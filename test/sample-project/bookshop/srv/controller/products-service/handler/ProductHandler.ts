import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  OnSubscribe,
  Req,
  Result,
  Results,
  Service,
} from '../../../../../../../lib';

import type { Request } from '../../../../../../../lib';
import cds from '@sap/cds';
import { Product, Products } from '#cds-models/ProductsService';

@EntityHandler(Products)
class ProductHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @AfterCreate()
  private async afterCreate(@Result() result: Products, @Req() req: Request): Promise<void> {
    const msg = await cds.connect.to('CatalogService');
    msg.emit('event_1', { foo: 11, bar: '22' });
  }

  @AfterRead()
  private async afterRead(@Results() results: Product[], @Req() req: Request): Promise<void> {
    const msg = await cds.connect.to('messaging');
    msg.emit('event_2', { foo: 11, bar: '22' });
  }

  @AfterDelete()
  private async afterDelete(@Result() deleted: boolean, @Req() req: Request): Promise<void> {
    this.srv.emit('event_3', { foo: 11, bar: '22' });
  }
}

export default ProductHandler;
