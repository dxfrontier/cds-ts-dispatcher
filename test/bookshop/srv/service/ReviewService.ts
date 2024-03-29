import { Inject, Service, ServiceLogic, SRV, TypedRequest } from '../../../../lib';

import type { Review } from '../../@cds-models/CatalogService';

@ServiceLogic()
class ReviewService {
  @Inject(SRV) private readonly srv: Service;

  validateComment(req: TypedRequest<Review>): void {
    if (req.data.comment != null && req.data.comment?.length > 10) {
      req.reject(400, 'Message must be larger than 10');
    }
  }
}

export default ReviewService;
