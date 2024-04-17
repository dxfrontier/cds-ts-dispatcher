/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Inject, Service, ServiceLogic, SRV } from '../../../../lib';

@ServiceLogic()
class BookOrdersService {
  @Inject(SRV) private readonly srv: Service;

  public showBeforeReadNotify() {
    console.log('****************** Before read event');
  }
}

export default BookOrdersService;
