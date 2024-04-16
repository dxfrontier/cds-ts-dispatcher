import { BookSale } from '#cds-models/CatalogService';

import {
  AfterRead,
  EntityHandler,
  ExecutionAllowedForRole,
  FieldsFormatter,
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
  RoleSpecificLogic,
  Service,
  SingleInstanceSwitch,
  SRV,
} from '../../../../../../lib';
import BookSalesService from '../../../service/BookSalesService';
import { ScoopedUserLogic } from '../../../user/ScoopedUserLogic';

@EntityHandler(BookSale)
class BookSalesHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(BookSalesService) private readonly bookSalesService: BookSalesService;

  @AfterRead()
  @ExecutionAllowedForRole('Manager', 'User', 'CEO')
  @RoleSpecificLogic('Manager', ScoopedUserLogic)
  private async afterRead(
    @IsColumnSupplied<BookSale>('quantity') hasQuantity: boolean,
    @IsColumnSupplied<BookSale>('saleDate') hasSaleDate: boolean,

    @Req() req: Request,
    @Results() results: BookSale[],

    @IsPresent('SELECT', 'from') hasFrom: boolean,
    @IsPresent('SELECT', 'orderBy') hasOrderBy: boolean,

    @IsRole('Manager', 'User') roles: boolean,
    @IsRole('CEO') role: boolean,

    @GetQuery('SELECT', 'columns') columns: GetQueryType['columns']['forDelete'],
    @GetQuery('SELECT', 'orderBy') orderBy: GetQueryType['orderBy'],

    @GetRequest('locale') locale: Request['locale'],

    @SingleInstanceSwitch() isSingleInstance: boolean,

    @Jwt() token: string | undefined,
  ) {
    if (roles) {
      req.notify('Manager');
    }

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
