/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  AfterRead,
  EntityHandler,
  Inject,
  Next,
  OnBoundAction,
  OnBoundFunction,
  OnCreate,
  OnDelete,
  OnRead,
  OnUpdate,
  Req,
  Results,
  SingleInstanceCapable,
  SingleInstanceSwitch,
  SRV,
} from '../../../../../../lib';
import { BookStat } from '../../../../@cds-models/CatalogService';
import AuthorService from '../../../service/AuthorService';
import BookStatsService from '../../../service/BookStatsService';

import type { TypedRequest, Service, Request, ActionRequest, ActionReturn } from '../../../../../../lib';

@EntityHandler(BookStat)
class BookStatsHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookStatsService) private readonly bookStatsService: BookStatsService;
  @Inject(AuthorService) private readonly authorService: AuthorService;

  @OnCreate()
  public async onCreateMethod(@Req() req: TypedRequest<BookStat>, @Next() next: Function) {
    req.notify(201, 'On Create executed');
    return next();
  }

  @OnRead()
  @SingleInstanceCapable()
  public async onReadMethod(
    @Req() req: TypedRequest<BookStat>,
    @Next() next: Function,
    @SingleInstanceSwitch() isSingleInstance: boolean,
  ) {
    if (isSingleInstance) {
      return await this.bookStatsService.updatedViews(req);
    }

    return next();
  }

  @OnUpdate()
  public async onUpdateMethod(@Req() req: TypedRequest<BookStat>, @Next() next: Function) {
    req.notify(201, 'On update executed');
    return next();
  }

  @OnDelete()
  public async onDeleteMethod(@Req() req: Request, @Next() next: Function) {
    req.notify('Item deleted');
  }

  // This action will be triggered on the 'BookStat' entity
  @OnBoundAction(BookStat.actions.GenerateReport)
  public async onBoundActionMethod(
    @Req() req: ActionRequest<typeof BookStat.actions.GenerateReport>,
    @Next() next: Function,
  ): ActionReturn<typeof BookStat.actions.GenerateReport> {
    return await this.bookStatsService.handleReport(req);
  }

  // This function will be triggered on the 'BookStat' entity
  @OnBoundFunction(BookStat.actions.NotifyAuthor)
  public async onBoundFunctionMethod(
    @Req() req: ActionRequest<typeof BookStat.actions.NotifyAuthor>,
    @Next() next: Function,
  ): ActionReturn<typeof BookStat.actions.NotifyAuthor> {
    return await this.authorService.notifyAuthor(req);
  }
}

export default BookStatsHandler;
