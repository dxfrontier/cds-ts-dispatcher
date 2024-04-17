/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import {
  ActionRequest,
  ActionReturn,
  EntityHandler,
  Inject,
  Next,
  NextEvent,
  OnBoundAction,
  OnBoundFunction,
  OnCreate,
  OnDelete,
  OnRead,
  OnUpdate,
  Req,
  Request,
  Service,
  SingleInstanceSwitch,
  SRV,
  TypedRequest,
} from '../../../../../../lib';
import { BookStat } from '../../../../@cds-models/CatalogService';
import AuthorService from '../../../service/AuthorService';
import BookStatsService from '../../../service/BookStatsService';

@EntityHandler(BookStat)
class BookStatsHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookStatsService) private readonly bookStatsService: BookStatsService;
  @Inject(AuthorService) private readonly authorService: AuthorService;

  @OnCreate()
  public async create(@Req() req: TypedRequest<BookStat>, @Next() next: NextEvent) {
    this.bookStatsService.notifyCreated(req);
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
    this.bookStatsService.notifyUpdated(req);
    return next();
  }

  @OnDelete()
  public async delete(@Req() req: Request, @Next() next: NextEvent) {
    this.bookStatsService.notifyDeleted(req);
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
