import { BookSale } from '#cds-models/CatalogService';

import {
  AfterRead,
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
  Results,
  Service,
  SingleInstanceSwitch,
  SRV,
} from '../../../../../../lib';

@EntityHandler(BookSale)
class BookSalesHandler {
  @Inject(SRV) private readonly srv: Service;

  @AfterRead()
  private async afterRead(
    @Req() req: Request,
    @Results() results: BookSale[],

    @IsColumnSupplied<BookSale>('quantity') hasQuantity: boolean,
    @IsColumnSupplied<BookSale>('saleDate') hasSaleDate: boolean,

    @IsPresent('SELECT', 'from') hasFrom: boolean,
    @IsPresent('SELECT', 'orderBy') hasOrderBy: boolean,

    @IsRole('role', 'anotherRole') roles: boolean,
    @IsRole('thirdRole') role: boolean,

    @GetQuery('SELECT', 'columns') columns: GetQueryType['columns']['forDelete'],
    @GetQuery('SELECT', 'orderBy') orderBy: GetQueryType['orderBy'],

    @GetRequest('locale') locale: Request['locale'],

    @SingleInstanceSwitch() isSingleInstance: boolean,

    @Jwt() token: string | undefined,
  ) {
    if (isSingleInstance) {
      req.notify('Single instance');
      return;
    } else {
      req.notify('Entity set');
    }

    if (token) {
      req.notify(token);
    }

    if (locale) {
      req.notify('locale');
    }

    if (columns.length > 0) {
      req.notify('columns');
    }

    if (orderBy && orderBy?.length > 0) {
      req.notify('orderBy');
    }

    if (roles === false && role === false) {
      req.notify('NO_USER_ROLE');
    }

    if (hasQuantity && hasSaleDate && hasFrom && hasOrderBy) {
      req.notify(`${hasQuantity && hasSaleDate && hasFrom && hasOrderBy}`);
    } else req.notify(`${hasQuantity && hasSaleDate}`);
  }
}

export default BookSalesHandler;
