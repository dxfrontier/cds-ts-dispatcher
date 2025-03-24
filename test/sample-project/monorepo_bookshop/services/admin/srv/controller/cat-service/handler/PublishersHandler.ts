import { Publisher } from '#cds-models/CatalogService';

import {
  AfterRead,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceSwitch,
} from '@dxfrontier/cds-ts-dispatcher';

import BookService from '../../../service/BookService';

@EntityHandler(Publisher)
class PublishersHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
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
