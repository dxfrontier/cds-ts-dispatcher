import { BookSale } from '#cds-models/CatalogService';

import {
  AfterRead,
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
  SRV,
} from '../../../../../../lib';
import BookSalesService from '../../../service/BookSalesService';

import type { GetQueryType } from '../../../../../../lib';

@EntityHandler(BookSale)
class BookSalesHandler {
  @Inject(SRV) private readonly srv: Service;
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

    @Jwt() token: string | undefined,
  ): Promise<void> {
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
    });
  }
}

export default BookSalesHandler;
