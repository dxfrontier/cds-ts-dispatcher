import { Inject, Service, ServiceLogic, SRV } from '../../../../lib';

import type { TypedRequest, Request } from '../../../../lib';

import type { Review } from '../../@cds-models/CatalogService';

@ServiceLogic()
class ReviewService {
  @Inject(SRV) private readonly srv: Service;

  public validateComment(req: TypedRequest<Review>): void {
    if (req.data.comment != null && req.data.comment?.length > 10) {
      req.reject(400, 'Message must be larger than 10');
    }
  }

  public notifyDelete(req: Request): void {
    req.notify(204, 'Item deleted');
  }

  public notifyRead(req: Request): void {
    req.notify(400, 'Before read executed');
  }
}

export default ReviewService;
