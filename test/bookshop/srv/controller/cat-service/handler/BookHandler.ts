import {
  AfterCreate,
  AfterRead,
  AfterUpdate,
  EntityHandler,
  Inject,
  OnAction,
  ServiceHelper,
} from '../../../../../../lib';
import BookService from '../../../service/BookService';
import { Request, Service } from '@sap/cds';
import { Book, submitOrder } from '../../../util/types/entities/CatalogService';
import { TypedActionRequest } from '../../../../../../lib/util/types/types';

@EntityHandler(Book)
class BookHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(BookService) private bookService: BookService;

  @AfterCreate()
  private async validateCurrencyCodes(results: Book[], req: Request) {
    this.bookService.validateData(results, req);
  }

  @AfterUpdate()
  private async addDefaultDescription(results: Book[], req: Request) {
    this.bookService.addDefaultDescriptionText(results);
  }

  @AfterRead()
  private async addDiscount(results: Book[], req: Request) {
    this.bookService.enrichTitle(results);
  }

  @OnAction(submitOrder)
  private async testAction(req: TypedActionRequest<typeof submitOrder>, next: Function) {
    return this.bookService.verifyStock(req);
  }
}

export default BookHandler;
