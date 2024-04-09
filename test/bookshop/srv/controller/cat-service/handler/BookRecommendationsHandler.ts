import {
  BeforeCreate,
  BeforeUpdate,
  EntityHandler,
  Inject,
  Next,
  OnCreate,
  OnUpdate,
  Req,
  Service,
  SRV,
  TypedRequest,
  Validate,
} from '../../../../../../lib';
import { BookRecommendation } from '../../../../@cds-models/CatalogService';

@EntityHandler(BookRecommendation)
class BookRecommendationsHandler {
  @Inject(SRV) private readonly srv: Service;

  @BeforeCreate()
  @Validate<BookRecommendation>({ action: 'isLowercase' }, 'comment')
  @Validate<BookRecommendation>({ action: 'endsWith', target: 'N' }, 'description')
  public async beforeCreate(@Req() req: TypedRequest<BookRecommendation>) {
    // ...
  }

  @BeforeUpdate()
  @Validate<BookRecommendation>({ action: 'startsWith', target: 'COMMENT:' }, 'comment')
  @Validate<BookRecommendation>({ action: 'isAlphanumeric' }, 'description')
  public async beforeUpdate(@Req() req: TypedRequest<BookRecommendation>) {
    // ...
  }

  @OnCreate()
  @Validate<BookRecommendation>({ action: 'isAlphanumeric' }, 'book_ID')
  public async onCreate(@Req() req: TypedRequest<BookRecommendation>, @Next() next: Function) {
    return next();
  }

  @OnUpdate()
  @Validate<BookRecommendation>({ action: 'isLength', options: { min: 5 } }, 'comment')
  public async onUpdate(@Req() req: TypedRequest<BookRecommendation>, @Next() next: Function) {
    return next();
  }
}

export default BookRecommendationsHandler;
