import 'reflect-metadata';

import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterUpdate,
  BeforeRead,
  EntityHandler,
  GetQuery,
  GetQueryType,
  GetRequest,
  Inject,
  IsColumnSupplied,
  IsPresent,
  IsRole,
  Jwt,
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
  private async afterCreate(
    @Result() result: Book,
    @Req() req: Request,
    @IsPresent('INSERT', 'columns') hasColumns: boolean,
    // @GetQuery('INSERT', 'as') as: GetQueryType['as'],
    // @GetQuery('INSERT', 'columns') columns: GetQueryType['columns']['FOR_INSERT'],
    // @GetQuery('INSERT', 'entries') entries: GetQueryType['entries'],
    // @GetQuery('INSERT', 'into') into: GetQueryType['into'],
    // @GetQuery('INSERT', 'rows') rows: GetQueryType['rows'],
    // @GetQuery('INSERT', 'values') values: GetQueryType['values'],

    ///

    @GetQuery('UPDATE', 'data') data: GetQueryType['data'],
    // @GetQuery('UPDATE', 'entity') entity: GetQueryType['entity'],
    // @GetQuery('UPDATE', 'where') where: GetQueryType['where'],

    // @GetQuery('UPSERT', 'columns') columns: GetQueryType['columns'],
    // @GetQuery('UPSERT', 'entries') entries: GetQueryType['entries'],
    // @GetQuery('UPSERT', 'into') into: GetQueryType['into'],
    // @GetQuery('UPSERT', 'rows') rows: GetQueryType['rows'],
    // @GetQuery('UPSERT', 'values') values: GetQueryType['values'],

    @GetQuery('DELETE', 'from') from: GetQueryType['from'],
    @GetQuery('DELETE', 'where') columns: GetQueryType['where'],
  ) {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead)
  private async beforeRead(@Req() req: TypedRequest<Book>) {
    console.log('****************** Before read event');
  }

  // *******************************************************

  // TODO: add @OnReject()
  // ? @IsPresent rename to : @IsQueryOptionFill, @IsFilled, @IsProvided, @IsSupplied

  // @ScopedUserLogic(handleClass)

  // *******************************************************

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
  private async afterRead(
    @Req() req: Request,
    @Results() results: Book[],

    @SingleInstanceSwitch() singleInstance: boolean,

    @IsColumnSupplied<Book>('price') hasPrice: boolean,

    @IsPresent('SELECT', 'columns') hasColumns: boolean,

    @IsRole('role', 'anotherRole') role: boolean,

    @GetQuery('SELECT', 'columns') columns: GetQueryType['columns']['FOR_SELECT'],
    @GetQuery('SELECT', 'distinct') distinct: GetQueryType['distinct'],
    @GetQuery('SELECT', 'excluding') excluding: GetQueryType['excluding'],
    @GetQuery('SELECT', 'excluding') from: GetQueryType['from']['FOR_SELECT'],
    @GetQuery('SELECT', 'groupBy') groupBy: GetQueryType['groupBy'],
    @GetQuery('SELECT', 'having') having: GetQueryType['having'],
    @GetQuery('SELECT', 'limit') limit: GetQueryType['limit'],
    @GetQuery('SELECT', 'limit.rows') limitRows: GetQueryType['limit']['rows'],
    @GetQuery('SELECT', 'limit.offset') limitOffset: GetQueryType['limit']['offset'],
    @GetQuery('SELECT', 'mixin') mixin: GetQueryType['mixin'],
    @GetQuery('SELECT', 'one') one: GetQueryType['one'],
    @GetQuery('SELECT', 'orderBy') orderBy: GetQueryType['orderBy'],
    @GetQuery('SELECT', 'where') where: GetQueryType['where'],

    // All good here
    @GetRequest('entity') entity: Request['entity'],
    @GetRequest('event') event: Request['event'],
    @GetRequest('features') features: Request['features'],
    @GetRequest('headers') headers: Request['headers'],
    @GetRequest('http') http: Request['http'],
    @GetRequest('id') id: Request['id'],
    @GetRequest('locale') locale: Request['locale'],
    @GetRequest('method') method: Request['method'],
    @GetRequest('params') params: Request['params'],
    @GetRequest('query') query: Request['query'],
    @GetRequest('subject') subject: Request['subject'],
    @GetRequest('target') target: Request['target'],
    @GetRequest('tenant') tenant: Request['tenant'],
    @GetRequest('timestamp') timestamp: Request['timestamp'],
    @GetRequest('user') user: Request['user'],

    @Jwt() token: string | undefined,
  ) {
    await this.srv.emit('OrderedBook', { book: 'dada', quantity: 3, buyer: req.user.id });

    if (singleInstance) {
      req.notify('Single instance');
      return;
    } else {
      req.notify('Entity set');
    }

    // req.query.SELECT?.limit?.offset['val'];

    this.bookService.enrichTitle(results);
  }

  @AfterUpdate()
  private async afterUpdate(@Result() result: Book, @Req() req: TypedRequest<Book>) {
    void this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async afterDelete(@Result() deleted: boolean, @Req() req: Request) {
    req.notify(`Item deleted : ${deleted}`);
  }
}

export default BookHandler;
