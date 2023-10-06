import { AfterRead, EntityHandler, Inject, OnAction, ServiceHelper } from '../../../../../../lib';
import ListOfBookService from '../../../service/ListOfBookService';
import { Request, Service, type } from '@sap/cds';
import { Book, ListOfBook, sendMail, submitOrder } from '../../../util/types/entities/CatalogService';
import { TypedActionRequest, TypedRequest } from '../../../../../../lib/util/types/types';

type bla = ReturnType<typeof submitOrder> | Error;
@EntityHandler(Book)
class ListOfBookHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(ListOfBookService) private listOfBookService: ListOfBookService;

  @AfterRead()
  public async verifyStock(results: ListOfBook[], req: Request) {
    this.listOfBookService.enrichTitle(results);
  }

  @OnAction(submitOrder)
  private async testAction(req: TypedActionRequest<typeof submitOrder>, next: Function): Promise<bla> {
    return this.listOfBookService.verifyStock(req);
  }
}

export default ListOfBookHandler;
