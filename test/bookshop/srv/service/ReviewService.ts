import { type TypedRequest, Inject, SRV, ServiceLogic, Service } from '../../../../lib';
import { Review } from '../util/types/entities/CatalogService';

@ServiceLogic()
class ReviewService {
  @Inject(SRV) private readonly srv: Service;

  validateComment(req: TypedRequest<Review>) {
    if (req.data.comment && req.data.comment?.length < 10) {
      req.reject(400, 'Message must be larger than 10');
    }
  }
}

export default ReviewService;
