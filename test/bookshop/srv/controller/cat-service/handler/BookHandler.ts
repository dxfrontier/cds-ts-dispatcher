import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterUpdate,
  EntityHandler,
  Inject,
  ServiceHelper,
} from '../../../../../../lib';
import BookService from '../../../service/BookService';
import { Request, Service } from '@sap/cds';
import { Book } from '../../../util/types/entities/CatalogService';
import { TypedRequest } from '../../../../../../lib/util/types/types';

@EntityHandler(Book)
class BookHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(BookService) private bookService: BookService;

  @AfterCreate()
  private async validateCurrencyCodes(results: Book, req: Request) {
    this.bookService.validateData(results, req);
  }

  @AfterRead()
  private async addDiscount(results: Book[], _: Request) {
    this.bookService.enrichTitle(results);
  }

  @AfterUpdate()
  private async addDefaultDescription(result: Book, req: TypedRequest<Book>) {
    this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async deleteItem(deleted: boolean, req: Request) {
    req.notify(`Item deleted : ${deleted}`);
  }
}

export default BookHandler;
