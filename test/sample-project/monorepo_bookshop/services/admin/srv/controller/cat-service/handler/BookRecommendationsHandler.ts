import {
  BeforeCreate,
  BeforeUpdate,
  CDS_DISPATCHER,
  EntityHandler,
  Inject,
  Next,
  OnCreate,
  OnUpdate,
  Req,
  Service,
  Validate,
} from '@dxfrontier/cds-ts-dispatcher';

import { BookRecommendation } from '#cds-models/CatalogService';

import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(BookRecommendation)
class BookRecommendationsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @BeforeCreate()
  @Validate<BookRecommendation>({ action: 'isLowercase' }, 'comment')
  @Validate<BookRecommendation>({ action: 'endsWith', target: 'N' }, 'description')
  public async beforeCreate(@Req() req: Request<BookRecommendation>) {
    // ...
  }

  @BeforeUpdate()
  @Validate<BookRecommendation>({ action: 'startsWith', target: 'COMMENT:' }, 'comment')
  @Validate<BookRecommendation>({ action: 'isAlphanumeric' }, 'description')
  public async beforeUpdate(@Req() req: Request<BookRecommendation>) {
    // ...
  }

  @OnCreate()
  @Validate<BookRecommendation>({ action: 'isAlphanumeric' }, 'book_ID')
  public async create(@Req() req: Request<BookRecommendation>, @Next() next: NextEvent): Promise<Function> {
    return next();
  }

  @OnUpdate()
  @Validate<BookRecommendation>({ action: 'isLength', options: { min: 5 } }, 'comment')
  public async update(@Req() req: Request<BookRecommendation>, @Next() next: NextEvent): Promise<Function> {
    return next();
  }
}

export default BookRecommendationsHandler;
