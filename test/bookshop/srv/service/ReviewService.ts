import { Service } from '@sap/cds';
import { Inject, SRV, ServiceLogic } from '../../../../lib';
import { Review } from '../util/types/entities/CatalogService';
import { TypedRequest } from '../../../../lib';

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
