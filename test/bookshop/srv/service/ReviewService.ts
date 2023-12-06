import { type TypedRequest, Inject, SRV, ServiceLogic, Service } from '../../../../lib';
import { type Review } from '../util/types/entities/CatalogService';

@ServiceLogic()
class ReviewService {
  @Inject(SRV) private readonly srv: Service;

  validateComment(req: TypedRequest<Review>): void {
    if (req.data.comment != null && req.data.comment?.length < 10) {
      req.reject(400, 'Message must be larger than 10');
    }
  }
}

export default ReviewService;
