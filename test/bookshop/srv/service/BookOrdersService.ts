import { Inject, Service, ServiceLogic, CDS_DISPATCHER } from '../../../../lib';

@ServiceLogic()
class BookOrdersService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  public showBeforeReadNotify() {
    console.log('****************** Before read event');
  }
}

export default BookOrdersService;
