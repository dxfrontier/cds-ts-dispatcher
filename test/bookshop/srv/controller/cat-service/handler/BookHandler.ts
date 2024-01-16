/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterUpdate,
  EntityHandler,
  Inject,
  Request,
  SRV,
  Service,
  SingleInstanceCapable,
  type TypedRequest,
} from '../../../../../../lib';
import { Book } from '../../../../@cds-models/CatalogService';
import BookService from '../../../service/BookService';

@EntityHandler(Book)
class BookHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;

  @AfterCreate()
  private async validateCurrencyCodes(result: Book, req: Request) {
    this.bookService.validateData(result, req);
  }

  @AfterRead()
  @SingleInstanceCapable()
  private async addDiscount(results: Book[], req: Request, isSingleInstance: boolean) {
    await this.srv.emit('OrderedBook', { book: 'dada', quantity: 3, buyer: req.user.id });

    if (isSingleInstance) {
      req.notify('Single instance');
    } else {
      req.notify('Entity set');
    }

    this.bookService.enrichTitle(results);
  }

  @AfterUpdate()
  private async addDefaultDescription(result: Book, req: TypedRequest<Book>) {
    void this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async deleteItem(deleted: boolean, req: Request) {
    req.notify(`Item deleted : ${deleted}`);
  }
}

export default BookHandler;
