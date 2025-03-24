import {
  BeforeCreate,
  BeforeDelete,
  BeforeRead,
  BeforeUpdate,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Req,
  Service,
  SingleInstanceSwitch,
} from '@dxfrontier/cds-ts-dispatcher';

import { Review } from '#cds-models/CatalogService';
import ReviewService from '../../../service/ReviewService';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(Review)
class ReviewHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(ReviewService) private readonly reviewService: ReviewService;

  @BeforeCreate()
  private async beforeCreate(@Req() req: Request<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeRead()
  private async beforeRead(@Req() req: Request<Review>, @SingleInstanceSwitch() isSingleInstance: boolean) {
    this.reviewService.notifyRead(req);
  }

  @BeforeUpdate()
  private async beforeUpdate(@Req() req: Request<Review>) {
    this.reviewService.validateComment(req);
  }

  @BeforeDelete()
  private async beforeDelete(@Req() req: Request) {
    this.reviewService.notifyDelete(req);
  }
}

export default ReviewHandler;
