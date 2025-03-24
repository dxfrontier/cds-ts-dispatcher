/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BookRecommendation, Publisher } from '#cds-models/CatalogService';

import {
  AfterRead,
  BeforeCreate,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Locale,
  Req,
  RequestResponse,
  Res,
  Results,
  Service,
  SingleInstanceSwitch,
  Request,
  Validate,
  ValidationResults,
  ValidatorFlags,
} from '../../../../../../../lib';
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
