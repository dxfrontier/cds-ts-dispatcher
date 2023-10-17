import { Service } from '@sap/cds';
import { Inject, ServiceHelper, ServiceLogic } from '../../../../lib';
import { Review, submitOrder } from '../util/types/entities/CatalogService';
import { TypedActionRequest, TypedRequest } from '../../../../lib/util/types/types';

@ServiceLogic()
class UserService {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;

  public async submitOrder(req: TypedActionRequest<typeof submitOrder>) {}
}

export default UserService;
