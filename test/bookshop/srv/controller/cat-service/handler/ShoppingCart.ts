/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  AfterRead,
  CDS_DISPATCHER,
  EntityHandler,
  CatchAndSetErrorCode,
  Inject,
  Req,
  Results,
  Service,
} from '../../../../../../lib';
import { ShoppingCart } from '../../../../@cds-models/CatalogService';
import axios from 'axios';

@EntityHandler(ShoppingCart)
class ShoppingCartHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @AfterRead()
  @CatchAndSetErrorCode('BAD_REQUEST-400')
  private async afterRead(@Req() req: Request, @Results() results: ShoppingCart[]): Promise<void> {
    await axios.get('https://jsonplaceholder.typicode');
  }
}

export default ShoppingCartHandler;
