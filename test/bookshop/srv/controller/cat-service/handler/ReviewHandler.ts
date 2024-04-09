import {
  BeforeCreate,
  BeforeDelete,
  BeforeRead,
  BeforeUpdate,
  EntityHandler,
  Inject,
  Req,
  Request,
  Service,
  SingleInstanceCapable,
  SingleInstanceSwitch,
  SRV,
  TypedRequest,
} from '../../../../../../lib';
import { Review } from '../../../../@cds-models/CatalogService';
import ReviewService from '../../../service/ReviewService';

@EntityHandler(Review)
class ReviewHandler {
  @Inject(SRV) private readonly srv: Service;
  @Inject(ReviewService) private readonly reviewService: ReviewService;

  @BeforeCreate()
  private async validateCurrencyCodes(@Req() req: TypedRequest<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeRead()
  @SingleInstanceCapable()
  private async addDiscount(@Req() req: TypedRequest<Review>, @SingleInstanceSwitch() isSingleInstance: boolean) {
    req.notify(400, 'Before read executed');
  }

  @BeforeUpdate()
  private async addDefaultDescription(@Req() req: TypedRequest<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeDelete()
  private async deleteItem(@Req() req: Request) {
    req.notify(204, 'Item deleted');
  }
}

export default ReviewHandler;
