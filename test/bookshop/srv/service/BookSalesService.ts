import { Inject, Service, ServiceLogic, CDS_DISPATCHER } from '../../../../lib';

import type { GetQueryType, Request } from '../../../../lib';

@ServiceLogic()
class BookSalesService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  public showAfterReadNotifies(args: {
    req: Request;
    hasRoles: boolean;
    isRole: boolean;
    isSingleInstance: boolean;
    token: string | undefined;
    locale: string;
    columns: GetQueryType['columns']['forSelect'];
    orderBy: GetQueryType['orderBy'];
    hasQuantity: boolean;
    hasSaleDate: boolean;
    hasFrom: boolean;
    hasOrderBy: boolean;
  }): void {
    if (args.hasRoles) {
      args.req.notify('Manager');
    }
    if (args.isSingleInstance) {
      args.req.notify('Single instance');
      return;
    } else {
      args.req.notify('Entity set');
    }
    if (args.token) {
      args.req.notify(args.token);
    }
    if (args.locale) {
      args.req.notify('locale');
    }
    if (args.columns.length > 0) {
      args.req.notify('columns');
    }
    if (args.orderBy && args.orderBy?.length > 0) {
      args.req.notify('orderBy');
    }
    if (!args.hasRoles && !args.hasRoles) {
      args.req.notify('NO_USER_ROLE');
    }
    if (args.hasQuantity && args.hasSaleDate && args.hasFrom && args.hasOrderBy) {
      args.req.notify(`${args.hasQuantity && args.hasSaleDate && args.hasFrom && args.hasOrderBy}`);
    } else args.req.notify(`${args.hasQuantity && args.hasSaleDate}`);
  }
}

export default BookSalesService;
