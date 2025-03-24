import {
  AfterRead,
  BeforeCreate,
  BeforeUpdate,
  CDS_DISPATCHER,
  EntityHandler,
  FieldsFormatter,
  Inject,
  Next,
  OnCreate,
  OnUpdate,
  Req,
  Results,
  Service,
} from '@dxfrontier/cds-ts-dispatcher';

import { BookFormat } from '#cds-models/CatalogService';
import { customFormatter } from '../../../util/formatter';

import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(BookFormat)
class BookFormatsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @BeforeCreate()
  @FieldsFormatter<BookFormat>({ action: 'blacklist', charsToRemove: 'le' }, 'format')
  public async beforeCreate(@Req() req: Request<BookFormat>): Promise<void> {
    // ...
  }

  @BeforeUpdate()
  @FieldsFormatter<BookFormat>({ action: 'truncate', options: { length: 7 } }, 'format')
  public async beforeUpdate(@Req() req: Request<BookFormat>): Promise<void> {
    // ...
  }

  @AfterRead()
  @FieldsFormatter<BookFormat>({ action: 'toUpper' }, 'format')
  @FieldsFormatter<BookFormat>(customFormatter, 'format')
  public async afterRead(@Results() results: BookFormat[], @Req() req: Request<BookFormat>) {
    // ...
  }

  @OnCreate()
  @FieldsFormatter<BookFormat>({ action: 'ltrim' }, 'language')
  public async create(@Req() req: Request<BookFormat>, @Next() next: NextEvent) {
    return next();
  }

  @OnUpdate()
  @FieldsFormatter<BookFormat>({ action: 'trim' }, 'format')
  public async update(@Req() req: Request<BookFormat>, @Next() next: NextEvent) {
    return next();
  }
}

export default BookFormatsHandler;
