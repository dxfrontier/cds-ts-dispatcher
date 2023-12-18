import {
  Inject,
  OnAction,
  OnFunction,
  SRV,
  UnboundActions,
  type ActionRequest,
  type ActionReturn,
  type Service,
} from '../../../../../../lib';
import { submitOrder, submitOrderFunction } from '../../../../@cds-models/CatalogService';

@UnboundActions()
class UnboundActionsHandler {
  @Inject(SRV) private readonly srv: Service;

  @OnAction(submitOrder)
  public async onActionMethod(
    req: ActionRequest<typeof submitOrder>,
    next: Function,
  ): ActionReturn<typeof submitOrder> {
    return {
      stock: req.data.quantity! + 1,
    };
  }

  @OnFunction(submitOrderFunction)
  public async onFunctionMethod(
    req: ActionRequest<typeof submitOrderFunction>,
    next: Function,
  ): ActionReturn<typeof submitOrderFunction> {
    return {
      stock: req.data.quantity! + 1,
    };
  }
}

export default UnboundActionsHandler;
