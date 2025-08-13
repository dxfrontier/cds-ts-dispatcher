import { BookSale } from '#cds-models/CatalogService';

import {
  AfterRead,
  CDS_DISPATCHER,
  EntityHandler,
  ExecutionAllowedForRole,
  GetQuery,
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
} from '../../../../../../../lib';
import BookSalesService from '../../../service/BookSalesService';

import type { GetQueryType } from '../../../../../../../lib';
import { SharedService } from './SharedService';

@EntityHandler(BookSale)
class BookSalesHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookSalesService) private readonly bookSalesService: BookSalesService;

  @Inject(SharedService) private readonly sharedService: SharedService;

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

    @Jwt() token: string | undefined,
  ): Promise<void> {
    const message = this.sharedService.getMessage();

    this.bookSalesService.showAfterReadNotifies({
      req,
      hasRoles,
      isRole,
      isSingleInstance,
      token,
      locale,
      columns,
      orderBy,
      hasQuantity,
      hasSaleDate,
      hasFrom,
      hasOrderBy,
      message,
    });
  }
}

export default BookSalesHandler;
