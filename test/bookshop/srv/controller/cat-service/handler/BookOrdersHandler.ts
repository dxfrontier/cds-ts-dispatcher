import { BookOrder } from '#cds-models/CatalogService';

import {
  AfterCreate,
  AfterRead,
  BeforeRead,
  EntityHandler,
  Inject,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceSwitch,
  SRV,
  Use,
} from '../../../../../../lib';
import { MiddlewareMethodAfterRead1 } from '../../../middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../../../middleware/MiddlewareAfterRead2';
import { MiddlewareMethodBeforeRead } from '../../../middleware/MiddlewareBeforeRead';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';
import BookService from '../../../service/BookService';

@EntityHandler(BookOrder)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookOrdersHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;

  @AfterCreate()
  private async afterCreate(@Results() result: BookOrder, @Req() req: Request) {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead) // THIS IS OK
  private async beforeRead(req: Request) {
    console.log('****************** Before read event');
  }

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2) // THIS IS OK
  private async afterRead(
    @Results() results: BookOrder[],
    @Req() req: Request,
    @SingleInstanceSwitch() isSingleInstance: boolean,
  ) {}
}

export default BookOrdersHandler;
