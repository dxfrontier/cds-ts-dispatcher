import {
  CDS_DISPATCHER,
  Error,
  FieldsFormatter,
  Inject,
  Next,
  OnAction,
  OnError,
  OnEvent,
  OnFunction,
  Req,
  Service,
  UnboundActions,
  Use,
  Validate,
} from '@dxfrontier/cds-ts-dispatcher';

import { changeBookProperties, OrderedBook, submitOrder, submitOrderFunction } from '#cds-models/CatalogService';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';

import type { ExposeFields, ActionReturn, ActionRequest, NextEvent, Request } from '@dxfrontier/cds-ts-dispatcher';

@UnboundActions()
@Use(MiddlewareEntity1, MiddlewareEntity2)
class UnboundActionsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @OnAction(changeBookProperties)
  @FieldsFormatter<ExposeFields<typeof changeBookProperties>>({ action: 'toLower' }, 'language')
  @FieldsFormatter<ExposeFields<typeof changeBookProperties>>({ action: 'ltrim' }, 'language')
  @Validate<ExposeFields<typeof changeBookProperties>>({ action: 'isIn', values: ['PDF', 'E-Kindle'] }, 'format')
  public async changeBookProperties(
    @Req() req: ActionRequest<typeof changeBookProperties>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof changeBookProperties> {
    return {
      language: req.data.language,
      format: req.data.format,
    };
  }

  @OnAction(submitOrder)
  public async submitOrder(
    @Req() req: ActionRequest<typeof submitOrder>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof submitOrder> {
    return {
      stock: req.data.quantity! + 1,
    };
  }

  @OnFunction(submitOrderFunction)
  public async submitOrderFunction(
    @Req() req: ActionRequest<typeof submitOrderFunction>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof submitOrderFunction> {
    return {
      stock: req.data.quantity! + 1,
    };
  }

  @OnEvent(OrderedBook)
  public async orderedBook(req: Request<OrderedBook>) {
    if (req.event !== 'OrderedBook') {
      req.reject(400, 'Not OrderedBook: check @OnEvent decorator');
    }
  }

  // @OnError()
  // public error(@Error() err: Error, @Req() req: Request): void {
  //   if (req.entity === 'CatalogService.Publishers') {
  //     err.message = 'OnError';
  //   }
  // }
}

export default UnboundActionsHandler;
