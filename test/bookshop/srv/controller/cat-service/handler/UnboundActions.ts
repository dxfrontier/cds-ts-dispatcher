import { Inject, OnAction, OnFunction, ServiceHelper, UnboundActions } from '../../../../../../lib';
import { Service } from '@sap/cds';
import { ActionRequest, ActionReturn } from '../../../../../../lib/util/types/types';
import { submitOrder, submitOrderFunction } from '../../../util/types/entities/CatalogService';

@UnboundActions()
class UnboundActionsHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;

  @OnAction(submitOrder)
  public async onActionMethod(
    req: ActionRequest<typeof submitOrder>,
    next: Function,
  ): ActionReturn<typeof submitOrder> {
    return {
      stock: req.data.quantity + 1,
    };
  }

  @OnFunction(submitOrderFunction)
  public async onFunctionMethod(
    req: ActionRequest<typeof submitOrderFunction>,
    next: Function,
  ): ActionReturn<typeof submitOrderFunction> {
    return {
      stock: req.data.quantity + 1,
    };
  }
}

export default UnboundActionsHandler;
