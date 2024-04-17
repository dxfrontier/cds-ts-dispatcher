/* eslint-disable @typescript-eslint/explicit-function-return-type */
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
    this.reviewService.notifyRead(req);
  }

  @BeforeUpdate()
  private async beforeUpdate(@Req() req: TypedRequest<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeDelete()
  private async beforeDelete(@Req() req: Request) {
    this.reviewService.notifyDelete(req);
  }
}

export default ReviewHandler;
