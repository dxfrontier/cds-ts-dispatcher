import { BookSale } from '#cds-models/CatalogService';

import {
  AfterRead,
  CDS_DISPATCHER,
  EntityHandler,
  ExecutionAllowedForRole,
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
  Results,
  Service,
  SingleInstanceSwitch,
} from '@dxfrontier/cds-ts-dispatcher';

import BookSalesService from '../../../service/BookSalesService';

@EntityHandler(BookSale)
class BookSalesHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookSalesService) private readonly bookSalesService: BookSalesService;

  @AfterRead()
  @ExecutionAllowedForRole('Manager', 'User', 'CEO')
  private async afterRead(
    @IsColumnSupplied<BookSale>('quantity') hasQuantity: boolean,
    @IsColumnSupplied<BookSale>('saleDate') hasSaleDate: boolean,

    @Req() req: Request,
    @Results() results: BookSale[],

    @IsPresent('SELECT', 'from') hasFrom: boolean,
    @IsPresent('SELECT', 'orderBy') hasOrderBy: boolean,

    @IsRole('Manager', 'User') hasRoles: boolean,
    @IsRole('CEO') isRole: boolean,

    @GetQuery('SELECT', 'columns') columns: GetQueryType['columns']['forSelect'],
    @GetQuery('SELECT', 'orderBy') orderBy: GetQueryType['orderBy'],

    @GetRequest('locale') locale: Request['locale'],

    @SingleInstanceSwitch() isSingleInstance: boolean,
  ): Promise<void> {
    this.bookSalesService.showAfterReadNotifies({
      req,
      hasRoles,
      isRole,
      isSingleInstance,
      // token,
      locale,
      columns,
      orderBy,
      hasQuantity,
      hasSaleDate,
      hasFrom,
      hasOrderBy,
    });
  }
}

export default BookSalesHandler;
