import {
  BeforeCreate,
  BeforeDelete,
  BeforeRead,
  BeforeUpdate,
  EntityHandler,
  Inject,
  ServiceHelper,
} from '../../../../../../lib';
import { Request, Service } from '@sap/cds';
import { Review } from '../../../util/types/entities/CatalogService';
import { TypedRequest } from '../../../../../../lib/util/types/types';
import ReviewService from '../../../service/ReviewService';

@EntityHandler(Review)
class ReviewHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(ReviewService) private reviewService: ReviewService;

  @BeforeCreate()
  private async validateCurrencyCodes(req: TypedRequest<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeRead()
  private async addDiscount(req: TypedRequest<Review>) {
    req.notify(400, 'Before read executed');
  }

  @BeforeUpdate()
  private async addDefaultDescription(req: TypedRequest<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeDelete()
  private async deleteItem(req: Request) {
    req.notify(204, 'Item deleted');
  }
}

export default ReviewHandler;
