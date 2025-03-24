import { CDS_DISPATCHER, Inject, Service, ServiceLogic } from '@dxfrontier/cds-ts-dispatcher';

@ServiceLogic()
class BookOrdersService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  public showBeforeReadNotify() {
    console.log('****************** Before read event');
  }
}

export default BookOrdersService;
