import { Request, Service } from '@sap/cds';
import { Inject, ServiceHelper, ServiceLogic } from '../../../../lib';
import { Books, Book, submitOrder } from '../util/types/entities/CatalogService';
import { TypedActionRequest, TypedRequest } from '../../../../lib/util/types/types';

@ServiceLogic()
class BookService {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;

  public enrichTitle(results: Book[]) {
    results.map((book) => (book.title += ` -- 10 % discount!`));
  }

  public validateData(result: Book, req: Request) {
    if (result.currency_code == '') {
      return req.reject(400, 'Currency code is mandatory!');
    }
  }

  public async addDefaultTitleText(result: Book, req: TypedRequest<Book>) {
    await UPDATE.entity(Book).where({ ID: req.data.ID }).set({ title: 'Dracula' });
  }

  public async verifyStock(req: TypedActionRequest<typeof submitOrder>) {
    const { book, quantity } = req.data;

    if (quantity < 1) return req.reject(400, `quantity has to be 1 or more`);

    let b = await SELECT`stock`.from(Book, book);
    if (!b) return req.error(404, `Book #${book} doesn't exist`);

    let { stock } = b;

    if (quantity > stock) return req.reject(409, `${quantity} exceeds stock for book #${book}`);

    await UPDATE(Book, book).with({ stock: (stock -= quantity) });
    await this.srv.emit('OrderedBook', { book, quantity, buyer: req.user.id });

    return { stock };
  }
}

export default BookService;