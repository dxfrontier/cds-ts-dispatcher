import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterReadSingleInstance,
  AfterUpdate,
  BeforeRead,
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

  @Prepend({ eventDecorator: 'AfterReadSingleInstance' })
  public async prepend(@Req() req: Request): Promise<void> {
    req.locale = 'DE_de';
  }

  @AfterCreate()
  private async afterCreate(@Result() result: Book, @Req() req: Request): Promise<void> {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead)
  private async beforeRead(@Req() req: TypedRequest<Book>): Promise<void> {
    this.bookService.showConsoleLog();
  }

  @AfterReadSingleInstance()
  private async afterReadSingleInstance(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Result() result: Book,
    @GetRequest('locale') locale: Request['locale'],
  ): Promise<void> {
    // + res is any ?!?!?!? ? ha ? wtf SAP

    // req.http?.res.setHeader('Accept-Language', locale);

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
  ): Promise<void> {
    await this.bookService.manageAfterReadMethods({ req, results, singleInstance });
  }

  @AfterUpdate()
  private async afterUpdate(@Result() result: Book, @Req() req: TypedRequest<Book>): Promise<void> {
    await this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async afterDelete(@Result() deleted: boolean, @Req() req: Request): Promise<void> {
    this.bookService.notifyItemDeleted(req, deleted);
  }
}

export default BookHandler;
