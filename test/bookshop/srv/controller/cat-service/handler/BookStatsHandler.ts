import {
  EntityHandler,
  Inject,
  OnAction,
  OnCreate,
  OnDelete,
  OnRead,
  OnUpdate,
  ServiceHelper,
} from '../../../../../../lib';
import { Request, Service } from '@sap/cds';
import { TypedActionRequest, TypedRequest } from '../../../../../../lib/util/types/types';
import BookStatsService from '../../../service/BookStatsService';
import { BookStat, submitOrder } from '../../../util/types/entities/CatalogService';

@EntityHandler(BookStat)
class BookStatsHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(BookStatsService) private bookStatsService: BookStatsService;

  @OnCreate()
  public async onCreateMethod(req: TypedRequest<BookStat>, next: Function) {
    req.notify(201, 'On Create executed');
    return next();
  }

  @OnRead()
  public async onReadMethod(req: TypedRequest<BookStat>, next: Function) {
    if (req.params.length === 0) {
      // check if it's single instance or not // but you can use also the @SingleInstanceCapable() decorator
      return this.bookStatsService.updatedViews(req);
    }

    return next();
  }

  @OnUpdate()
  public async onUpdateMethod(req: TypedRequest<BookStat>, next: Function) {
    req.notify(201, 'On update executed');
    return next();
  }

  @OnDelete()
  public async onDeleteMethod(req: Request, next: Function) {
    req.notify('Item deleted');
  }

  @OnAction(submitOrder)
  public async onActionMethod(req: TypedActionRequest<typeof submitOrder>, next: Function) {}
}

export default BookStatsHandler;
