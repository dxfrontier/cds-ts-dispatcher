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
  private async beforeCreate(@Req() req: TypedRequest<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeRead()
  private async beforeRead(@Req() req: TypedRequest<Review>, @SingleInstanceSwitch() isSingleInstance: boolean) {
    req.notify(400, 'Before read executed');
  }

  @BeforeUpdate()
  private async beforeUpdate(@Req() req: TypedRequest<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeDelete()
  private async beforeDelete(@Req() req: Request) {
    req.notify(204, 'Item deleted');
  }
}

export default ReviewHandler;
