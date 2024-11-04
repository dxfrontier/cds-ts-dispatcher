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
  Request,
  RequestResponse,
  Res,
  Results,
  Service,
  SingleInstanceSwitch,
  TypedRequest,
  Validate,
  ValidationResults,
  ValidatorFlags,
} from '../../../../../../lib';
import BookService from '../../../service/BookService';

@EntityHandler(Publisher)
class PublishersHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;

  @BeforeCreate()
  @Validate<Publisher>({ action: 'isLowercase', exposeValidatorResult: true }, 'name')
  @Validate<Publisher>({ action: 'isNumeric', exposeValidatorResult: true }, 'ID')
  public async beforeCreate(
    @Req() req: TypedRequest<BookRecommendation>,
    @Res() res: RequestResponse,
    @ValidationResults() validator: ValidatorFlags<'endsWith' | 'isNumeric'>,
    @Locale() locale: string,
  ) {
    res.setHeader('endsWith', String(validator.endsWith));
    res.setHeader('isNumeric', String(validator.isNumeric));
    res.setHeader('locale', locale);
  }

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
