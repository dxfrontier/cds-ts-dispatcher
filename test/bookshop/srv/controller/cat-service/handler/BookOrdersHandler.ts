import { BookOrder } from '#cds-models/CatalogService';
import {
  AfterCreate,
  AfterRead,
  EntityHandler,
  Inject,
  Request,
  SRV,
  Service,
  SingleInstanceCapable,
  Use,
  BeforeRead,
} from '../../../../../../lib';
import { MiddlewareMethodAfterRead1 } from '../../../middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../../../middleware/MiddlewareAfterRead2';
import { MiddlewareMethodBeforeRead } from '../../../middleware/MiddlewareBeforeRead';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';
import BookService from '../../../service/BookService';

@EntityHandler(BookOrder)
@Use(MiddlewareEntity1, MiddlewareEntity2)
export class BookOrdersHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;

  @AfterCreate()
  private async validateCurrencyCodes(result: BookOrder, req: Request) {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead) // THIS IS OK
  private async bla(req: Request) {
    console.log('****************** Before read event');
  }

  @AfterRead()
  @SingleInstanceCapable()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2) // THIS IS OK
  private async addDiscount(results: BookOrder[], req: Request, isSingleInstance: boolean) {}
}
