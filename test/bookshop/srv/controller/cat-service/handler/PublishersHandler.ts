/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Publisher } from '#cds-models/CatalogService';

import {
  AfterRead,
  EntityHandler,
  Inject,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceCapable,
  SingleInstanceSwitch,
  SRV,
} from '../../../../../../lib';
import BookService from '../../../service/BookService';

@EntityHandler(Publisher)
class PublishersHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;

  @AfterRead()
  private async afterRead(
    @Results() results: Publisher[],
    @Req() req: Request,
    @SingleInstanceSwitch() isSingleInstance: boolean,
  ) {
    req.reject(400, 'OnError');
  }
}

export default PublishersHandler;
