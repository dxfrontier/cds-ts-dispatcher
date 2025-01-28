/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  BeforeAll,
  BeforeCreate,
  BeforeDelete,
  BeforeRead,
  BeforeUpdate,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Req,
  RequestResponse,
  Res,
  Service,
  SingleInstanceSwitch,
  Request,
} from '../../../../../../lib';
import { Review } from '../../../../@cds-models/CatalogService';
import ReviewService from '../../../service/ReviewService';

@EntityHandler(Review)
class ReviewHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(ReviewService) private readonly reviewService: ReviewService;

  @BeforeAll()
  private async afterAll(@Req() req: Request, @Res() res: RequestResponse): Promise<void> {
    res.setHeader('CustomHeader', 'BeforeAllTriggered');
  }

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
