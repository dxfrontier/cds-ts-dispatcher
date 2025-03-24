import { Inject, Service, ServiceLogic, CDS_DISPATCHER } from '@dxfrontier/cds-ts-dispatcher';

import type { GetQueryType, Request } from '@dxfrontier/cds-ts-dispatcher';

@ServiceLogic()
class BookSalesService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  public showAfterReadNotifies(args: {
    req: Request;
    hasRoles: boolean;
    isRole: boolean;
    isSingleInstance: boolean;
    // token: string | undefined;
    locale: string;
    columns: GetQueryType['columns']['forSelect'] | undefined;
    orderBy: GetQueryType['orderBy'];
    hasQuantity: boolean;
    hasSaleDate: boolean;
    hasFrom: boolean;
    hasOrderBy: boolean;
  }) {
    if (args.hasRoles) {
      args.req.notify('Manager');
    }
    if (args.isSingleInstance) {
      args.req.notify('Single instance');
      return;
    } else {
      args.req.notify('Entity set');
    }
    // if (args.token != null) {
    //   args.req.notify(args.token);
    // }
    if (args.locale !== '') {
      args.req.notify('locale');
    }

    if (args.columns && args.columns.length > 0) {
      args.req.notify('columns');
    }
    if (args.orderBy != null && args.orderBy?.length > 0) {
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
