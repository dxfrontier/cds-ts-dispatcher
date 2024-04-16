/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ActionRequest, Inject, Request, Service, ServiceLogic, SRV, TypedRequest } from '../../../../lib';
import BookRepository from '../repository/BookRepository';

import type { Book, submitOrder } from '../../@cds-models/CatalogService';
@ServiceLogic()
class BookService {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookRepository) private readonly bookRepository: BookRepository;

  public notifyItemDeleted(req: Request, deleted: boolean) {
    req.notify(`Item deleted : ${deleted}`);
  }

  public async emitOrderedBookData(req: Request) {
    await this.srv.emit('OrderedBook', { book: 'dada', quantity: 3, buyer: req.user.id });
  }

  public showConsoleLog() {
    console.log('****************** Before read event');
  }

  public notifySingleInstance(req: Request, singleInstance: boolean) {
    if (singleInstance) {
      req.notify('Single instance');
      return;
    } else {
      req.notify('Entity set');
    }
  }

  public enrichTitle(results: Book[]) {
    results.map((book) => (book.title += ` -- 10 % discount!`));
  }

  public validateData(result: Book, req: Request) {
    if (result.currency_code === '') {
      return req.reject(400, 'Currency code is mandatory!');
    }
  }

  public async addDefaultTitleText(result: Book, req: TypedRequest<Book>) {
    await this.bookRepository.update({ ID: req.data.ID }, { title: 'Dracula' });
  }

  public async verifyStock(req: ActionRequest<typeof submitOrder>) {
    const { book, quantity } = req.data;
    const bookFound = await this.bookRepository.findOne({ ID: book! });

    if (quantity != null) {
      if (quantity < 1) {
        return req.reject(400, `quantity has to be 1 or more`);
      }

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!bookFound) {
        return req.error(404, `Book #${book} doesn't exist`);
      }

      if (bookFound.stock !== null && quantity > bookFound.stock!) {
        return req.reject(409, `${quantity} exceeds stock for book #${book}`);
      }

      await this.bookRepository.update(bookFound, {
        stock: (bookFound.stock! -= quantity),
      });
    }
    await this.srv.emit('OrderedBook', { book, quantity, buyer: req.user.id });

    return { stock: bookFound!.stock };
  }
}

export default BookService;
