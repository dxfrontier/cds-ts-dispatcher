import { Service } from '@sap/cds';
import { Inject, ServiceHelper, ServiceLogic } from '../../../../dist';
import { Review } from '../util/types/entities/CatalogService';
import { TypedRequest } from '../../../../dist';

@ServiceLogic()
class ReviewService {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;

  validateComment(req: TypedRequest<Review>) {
    if (req.data.comment && req.data.comment?.length < 10) {
      req.reject(400, 'Message must be larger than 10');
    }
  }
}

export default ReviewService;
