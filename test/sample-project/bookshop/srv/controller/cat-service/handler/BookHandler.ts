import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterReadSingleInstance,
  AfterUpdate,
  AfterAll,
  BeforeRead,
  CDS_DISPATCHER,
  EntityHandler,
  GetRequest,
  Inject,
  IsColumnSupplied,
  IsPresent,
  IsRole,
  Prepend,
  Req,
  Request,
  RequestResponse,
  Res,
  Result,
  Results,
  Service,
  SingleInstanceSwitch,
  Use,
  AfterReadEachInstance,
  Jwt,
  Env,
} from '../../../../../../../lib';
import { Book } from '../../../../@cds-models/CatalogService';
import { MiddlewareMethodAfterRead1 } from '../../../middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../../../middleware/MiddlewareAfterRead2';
import { MiddlewareMethodBeforeRead } from '../../../middleware/MiddlewareBeforeRead';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';
import BookService from '../../../service/BookService';
import { CDS_ENV } from '#dispatcher';
import { SharedService } from './SharedService';

@EntityHandler(Book)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(CDS_DISPATCHER.OUTBOXED_SRV) private readonly outboxedSrv: Service;
  @Inject(BookService) private readonly bookService: BookService;
  @Inject(SharedService) private readonly sharedService: SharedService;

  @Prepend({ eventDecorator: 'AfterReadSingleInstance' })
  public async prepend(@Req() req: Request): Promise<void> {
    req.locale = 'DE_de';
  }

  @AfterReadEachInstance()
  private async afterReadEachInstance(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Result() result: Book,
  ): Promise<void> {
    //
  }

  @AfterAll()
  private async afterAll(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Result() result: Book | Book[] | boolean,
  ): Promise<void> {
    if (Array.isArray(result)) {
      // when after `read` event was triggered
      console.log('READ');
    } else if (typeof result === 'boolean') {
      // when after `delete` event was triggered
      console.log('DELETE');
    } else {
      // when after `create`, `update` as triggered
      console.log('CREATE and UPDATE');
    }

    res.setHeader('CustomHeader', 'AfterAllTriggered');
  }

  @AfterCreate()
  private async afterCreate(@Result() result: Book, @Req() req: Request): Promise<void> {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead)
  private async beforeRead(@Req() req: Request<Book>): Promise<void> {
    this.bookService.showConsoleLog();
  }

  @AfterReadSingleInstance()
  private async afterReadSingleInstance(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Result() result: Book,
    @GetRequest('locale') locale: Request['locale'],
  ): Promise<void> {
    res.setHeader('Accept-Language', locale);
  }

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
  private async afterRead(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Results() results: Book[],
    @SingleInstanceSwitch() singleInstance: boolean,
    @IsColumnSupplied<Book>('price') hasPrice: boolean,
    @IsPresent('SELECT', 'columns') hasColumns: boolean,
    @IsRole('Developer', 'AnotherRole') role: boolean,
    @GetRequest('locale') locale: Request['locale'],
    @Jwt() jwt: string | undefined,
    @Env<CDS_ENV>('requires.auth.kind') env: CDS_ENV['requires']['auth']['kind'],
  ): Promise<void> {
    this.sharedService.setMessage('message');

    await this.bookService.manageAfterReadMethods({ req, res, results, singleInstance, jwt, env });
  }

  @AfterUpdate()
  private async afterUpdate(@Result() result: Book, @Req() req: Request<Book>): Promise<void> {
    await this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async afterDelete(@Result() deleted: boolean, @Req() req: Request): Promise<void> {
    this.bookService.notifyItemDeleted(req, deleted);
  }
}

export default BookHandler;
