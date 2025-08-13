import { CDS_DISPATCHER, Inject, Service, ServiceLogic } from '../../../../../../../lib';

@ServiceLogic('Transient')
export class SharedService {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  private message: string;

  public setMessage(message: string) {
    this.message = message;
  }

  public getMessage() {
    return this.message;
  }
}
