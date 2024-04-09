import 'reflect-metadata';

import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterUpdate,
  BeforeRead,
  EntityHandler,
  GetColumnsType,
  GetDistinctType,
  GetEntityType,
  GetEventType,
  GetExcludingType,
  GetFeaturesType,
  GetGroupByType,
  GetHavingType,
  GetHeadersType,
  GetHttpType,
  GetIdType,
  GetLimitOffsetType,
  GetLimitRowsType,
  GetLimitType,
  GetLocaleType,
  GetMethodType,
  GetOneType,
  GetOrderByType,
  GetParamsType,
  GetQueryProperty,
  GetQueryType,
  GetRequestProperty,
  GetSubjectType,
  GetWhereType,
  Inject,
  IsColumnSupplied,
  IsPresent,
  IsRole,
  Req,
  Request,
  Result,
  Results,
  Service,
  SingleInstanceSwitch,
  SRV,
  TypedRequest,
  Use,
} from '../../../../../../lib';
import { Book } from '../../../../@cds-models/CatalogService';
import { MiddlewareMethodAfterRead1 } from '../../../middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../../../middleware/MiddlewareAfterRead2';
import { MiddlewareMethodBeforeRead } from '../../../middleware/MiddlewareBeforeRead';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';
import BookService from '../../../service/BookService';

@EntityHandler(Book)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;

  @AfterCreate()
  private async validateCurrencyCodes(
    @Result() result: Book,
    @Req() req: Request,
    @IsPresent('INSERT', 'columns') columns: boolean,
  ) {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead)
  private async beforeReadEvent(@Req() req: TypedRequest<Book>) {
    console.log('****************** Before read event');
  }

  // *******************************************************

  // TODO: add @OnReject()
  // TODO: add @Jwt() for retrieval of the token
  // TODO:
  // ? @IsPresent rename to : @IsQueryOptionFill, @IsFilled, @IsProvided, @IsSupplied

  // req.user.is('CERTAIN_ROLE')
  // @ScopedUserLogic(handleClass)

  // *******************************************************

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
  private async addDiscount(
    @Req() req: Request,
    @Results() results: Book[],

    @SingleInstanceSwitch() singleInstance: boolean,

    @IsColumnSupplied<Book>('price') hasPrice: boolean,

    // TODO: exclude REQUEST from IsPresent
    @IsPresent('SELECT', 'columns') hasColumns: boolean,

    @IsRole('role') role: string,

    @GetQueryProperty('SELECT', 'columns') columns: GetColumnsType,

    @GetQueryProperty('SELECT', 'distinct') distinct: GetDistinctType,
    @GetQueryProperty('SELECT', 'excluding') excluding: GetExcludingType,
    @GetQueryProperty('SELECT', 'groupBy') groupBy: GetGroupByType,
    @GetQueryProperty('SELECT', 'having') having: GetHavingType,

    @GetQueryProperty('SELECT', 'one') one: GetOneType,
    @GetQueryProperty('SELECT', 'orderBy') orderBy: GetOrderByType,
    @GetQueryProperty('SELECT', 'where') where: GetWhereType,

    @GetQueryProperty('SELECT', 'limit') limit: GetLimitType,
    @GetQueryProperty('SELECT', 'limit.rows') limitRows: GetLimitRowsType,
    @GetQueryProperty('SELECT', 'limit.offset') limitOffset: GetLimitOffsetType,

    // All good here
    @GetRequestProperty('entity') entity: GetEntityType,
    @GetRequestProperty('event') event: GetEventType,
    @GetRequestProperty('features') features: GetFeaturesType,
    @GetRequestProperty('headers') headers: GetHeadersType,
    @GetRequestProperty('http') http: GetHttpType,
    @GetRequestProperty('id') id: GetIdType,
    @GetRequestProperty('locale') locale: GetLocaleType,
    @GetRequestProperty('method') method: GetMethodType,
    @GetRequestProperty('params') params: GetParamsType,
    @GetRequestProperty('query') query: GetQueryType,
    @GetRequestProperty('subject') subject: GetSubjectType,
    @GetRequestProperty('target') target: GetMethodType,
    @GetRequestProperty('tenant') tenant: GetParamsType,
    @GetRequestProperty('timestamp') timestamp: GetQueryType,
    @GetRequestProperty('user') user: GetSubjectType,
  ) {
    await this.srv.emit('OrderedBook', { book: 'dada', quantity: 3, buyer: req.user.id });

    // const aaacolumns = req.query.SELECT?.columns.forEach((column) => {
    //   column
    // });

    // req.
    const bla = locale;

    // const bla = req.query.INSERT?.columns;

    req.query;
    if (singleInstance) {
      req.notify('Single instance');
      return;
    } else {
      req.notify('Entity set');
    }

    this.bookService.enrichTitle(results);
  }

  @AfterUpdate()
  private async addDefaultDescription(@Result() result: Book, @Req() req: TypedRequest<Book>) {
    void this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async deleteItem(@Result() deleted: boolean, @Req() req: Request) {
    req.notify(`Item deleted : ${deleted}`);
  }
}

export default BookHandler;
