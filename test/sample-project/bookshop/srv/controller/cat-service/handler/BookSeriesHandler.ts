/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BookSery } from '#cds-models/CatalogService';

import {
  AfterRead,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Req,
  Request,
  Results,
  Service,
  Use,
} from '../../../../../../../lib';
import { MiddlewareBookSeries1 } from '../../../middleware/MiddlewareBookSeries1';
import { MiddlewareBookSeries2 } from '../../../middleware/MiddlewareBookSeries2';

@EntityHandler(BookSery)
@Use(MiddlewareBookSeries1, MiddlewareBookSeries2)
class BookSeriesHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  // This handler exists to trigger the entity-level middleware
  @AfterRead()
  private async afterRead(@Results() results: BookSery[], @Req() req: Request): Promise<void> {
    // Middleware will be executed before this handler
  }
}

export default BookSeriesHandler;
