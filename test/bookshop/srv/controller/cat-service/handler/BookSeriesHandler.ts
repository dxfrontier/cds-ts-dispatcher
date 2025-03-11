/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BookSeries } from '#cds-models/CatalogService';
import { MiddlewareBookSeries1 } from '../../../middleware/MiddlewareBookSeries1';
import { MiddlewareBookSeries2 } from '../../../middleware/MiddlewareBookSeries2';

import { AfterRead, CDS_DISPATCHER, EntityHandler, Inject, Service, Use } from '../../../../../../lib';

@EntityHandler(BookSeries)
@Use(MiddlewareBookSeries1, MiddlewareBookSeries2)
class BookSeriesHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @AfterRead()
  private async afterRead(): Promise<void> {}
}

export default BookSeriesHandler;
