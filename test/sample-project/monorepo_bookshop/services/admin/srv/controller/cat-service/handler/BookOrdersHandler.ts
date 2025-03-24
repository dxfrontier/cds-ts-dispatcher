import { BookOrder } from '#cds-models/CatalogService';

import {
  AfterCreate,
  AfterRead,
  BeforeRead,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceSwitch,
  Use,
} from '@dxfrontier/cds-ts-dispatcher';

import { MiddlewareMethodAfterRead1 } from '../../../middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../../../middleware/MiddlewareAfterRead2';
import { MiddlewareMethodBeforeRead } from '../../../middleware/MiddlewareBeforeRead';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';
import BookOrdersService from '../../../service/BookOrdersService';
import BookService from '../../../service/BookService';

@EntityHandler(BookOrder)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookOrdersHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;
  @Inject(BookOrdersService) private readonly bookOrdersService: BookOrdersService;

  @AfterCreate()
  private async afterCreate(@Results() result: BookOrder, @Req() req: Request): Promise<void> {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead) // THIS IS OK
  private async beforeRead(req: Request): Promise<void> {
    this.bookOrdersService.showBeforeReadNotify();
  }

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2) // THIS IS OK
  private async afterRead(
    @Results() results: BookOrder[],
    @Req() req: Request,
    @SingleInstanceSwitch() isSingleInstance: boolean,
  ): Promise<void> {
    // Method implementation
  }
}

export default BookOrdersHandler;
