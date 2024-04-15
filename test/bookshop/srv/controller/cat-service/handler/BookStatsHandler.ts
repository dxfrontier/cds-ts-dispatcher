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

import type { TypedRequest, Service, Request, ActionRequest, ActionReturn, NextEvent } from '../../../../../../lib';

@EntityHandler(BookStat)
class BookStatsHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookStatsService) private readonly bookStatsService: BookStatsService;
  @Inject(AuthorService) private readonly authorService: AuthorService;

  @OnCreate()
  public async create(@Req() req: TypedRequest<BookStat>, @Next() next: NextEvent) {
    req.notify(201, 'On Create executed');
    return next();
  }

  @OnRead()
  public async read(
    @Req() req: TypedRequest<BookStat>,
    @Next() next: NextEvent,
    @SingleInstanceSwitch() isSingleInstance: boolean,
  ) {
    if (isSingleInstance) {
      return await this.bookStatsService.updatedViews(req);
    }

    return next();
  }

  @OnUpdate()
  public async update(@Req() req: TypedRequest<BookStat>, @Next() next: NextEvent) {
    req.notify(201, 'On update executed');
    return next();
  }

  @OnDelete()
  public async delete(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('Item deleted');
  }

  // This action will be triggered on the 'BookStat' entity
  @OnBoundAction(BookStat.actions.GenerateReport)
  public async generateReport(
    @Req() req: ActionRequest<typeof BookStat.actions.GenerateReport>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof BookStat.actions.GenerateReport> {
    return await this.bookStatsService.handleReport(req);
  }

  // This function will be triggered on the 'BookStat' entity
  @OnBoundFunction(BookStat.actions.NotifyAuthor)
  public async notifyAuthor(
    @Req() req: ActionRequest<typeof BookStat.actions.NotifyAuthor>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof BookStat.actions.NotifyAuthor> {
    return await this.authorService.notifyAuthor(req);
  }
}

export default BookStatsHandler;
