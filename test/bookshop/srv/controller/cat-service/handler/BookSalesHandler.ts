import { BookSale } from '#cds-models/CatalogService';

import {
  AfterRead,
  EntityHandler,
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

    // @GetRequest('locale') locale: Request['locale'],
    // @Jwt() token: string | undefined,
  ) {
    debugger;
    if (roles === undefined && role === undefined) {
      req.notify(`${roles && role}`);
    }

    if (hasQuantity && hasSaleDate && hasFrom && hasOrderBy) {
      req.notify(`${hasQuantity && hasSaleDate && hasFrom && hasOrderBy}`);
    } else req.notify(`${hasQuantity && hasSaleDate}`);
  }
}

export default BookSalesHandler;
