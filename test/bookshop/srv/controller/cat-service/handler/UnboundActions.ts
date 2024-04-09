import {
  ActionRequest,
  ActionReturn,
  Error,
  FieldsFormatter,
  Inject,
  Next,
  OnAction,
  OnError,
  OnEvent,
  OnFunction,
  Req,
  Request,
  Service,
  SRV,
  TypedRequest,
  UnboundActions,
  Use,
  Validate,
} from '../../../../../../lib';
import { ExposeFields } from '../../../../../../lib/types/validator';
import {
  changeBookProperties,
  OrderedBook,
  submitOrder,
  submitOrderFunction,
} from '../../../../@cds-models/CatalogService';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';

@UnboundActions()
@Use(MiddlewareEntity1, MiddlewareEntity2)
class UnboundActionsHandler {
  @Inject(SRV) private readonly srv: Service;

  @OnAction(changeBookProperties)
  @FieldsFormatter<ExposeFields<typeof changeBookProperties>>({ action: 'toLower' }, 'language')
  @FieldsFormatter<ExposeFields<typeof changeBookProperties>>({ action: 'ltrim' }, 'language')
  @Validate<ExposeFields<typeof changeBookProperties>>({ action: 'isIn', values: ['PDF', 'E-Kindle'] }, 'format')
  public async onChangeBookFormatAction(
    @Req() req: ActionRequest<typeof changeBookProperties>,
    @Next() next: Function,
  ): ActionReturn<typeof changeBookProperties> {
    return {
      language: req.data.language,
      format: req.data.format,
    };
  }

  @OnAction(submitOrder)
  public async onActionMethod(
    @Req() req: ActionRequest<typeof submitOrder>,
    @Next() next: Function,
  ): ActionReturn<typeof submitOrder> {
    return {
      stock: req.data.quantity! + 1,
    };
  }

  @OnFunction(submitOrderFunction)
  public async onFunctionMethod(
    @Req() req: ActionRequest<typeof submitOrderFunction>,
    @Next() next: Function,
  ): ActionReturn<typeof submitOrderFunction> {
    return {
      stock: req.data.quantity! + 1,
    };
  }

  @OnEvent(OrderedBook)
  public async onEvent(@Req() req: TypedRequest<OrderedBook>) {
    //
  }

  @OnError()
  public onError(@Error() err: Error, @Req() req: Request): void {
    if (req.entity === 'CatalogService.Publishers') {
      err.message = 'OnError';
    }
  }
}

export default UnboundActionsHandler;
