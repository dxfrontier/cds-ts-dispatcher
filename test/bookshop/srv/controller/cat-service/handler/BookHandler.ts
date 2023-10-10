import {
  AfterCreate,
  AfterDelete,
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
import { TypedActionRequest, TypedRequest } from '../../../../../../lib/util/types/types';

@EntityHandler(Book)
class BookHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(BookService) private bookService: BookService;

  @AfterCreate()
  private async validateCurrencyCodes(results: Book, req: Request) {
    this.bookService.validateData(results, req);
  }

  @AfterRead()
  private async addDiscount(results: Book[], req: Request) {
    this.bookService.enrichTitle(results);
  }

  @AfterUpdate()
  private async addDefaultDescription(result: Book, req: TypedRequest<Book>) {
    this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async deleteItem(deleted: boolean, req: Request) {
    console.log('deleted' + deleted);
  }

  @OnAction(submitOrder)
  private async testAction(req: TypedActionRequest<typeof submitOrder>, next: Function) {
    return this.bookService.verifyStock(req);
  }
}

export default BookHandler;
