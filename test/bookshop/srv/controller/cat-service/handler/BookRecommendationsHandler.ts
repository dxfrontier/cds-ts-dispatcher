import {
  AfterRead,
  BeforeCreate,
  BeforeRead,
  BeforeUpdate,
  EntityHandler,
  FieldsFormatter,
  Inject,
  OnCreate,
  OnUpdate,
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
  public async beforeCreate(req: TypedRequest<BookRecommendation>) {
    // ...
  }

  @BeforeUpdate()
  @Validate<BookRecommendation>({ action: 'startsWith', target: 'COMMENT:' }, 'comment')
  @Validate<BookRecommendation>({ action: 'isAlphanumeric' }, 'description')
  public async beforeUpdate(req: TypedRequest<BookRecommendation>) {
    // ...
  }

  @OnCreate()
  @Validate<BookRecommendation>({ action: 'isAlphanumeric' }, 'book_ID')
  public async onCreate(req: TypedRequest<BookRecommendation>, next: Function) {
    return next();
  }

  @OnUpdate()
  @Validate<BookRecommendation>({ action: 'isLength', options: { min: 5 } }, 'comment')
  public async onUpdate(req: TypedRequest<BookRecommendation>, next: Function) {
    return next();
  }
}

export default BookRecommendationsHandler;
