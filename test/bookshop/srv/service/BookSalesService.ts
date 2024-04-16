/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Inject, Request, Service, ServiceLogic, SRV } from '../../../../lib';

@ServiceLogic()
class BookSalesService {
  @Inject(SRV) private readonly srv: Service;

  public executeCustomRoleLogic() {}
}

export default BookSalesService;
