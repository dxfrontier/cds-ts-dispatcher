/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  AfterRead,
  BeforeCreate,
  BeforeUpdate,
  CDS_DISPATCHER,
  EntityHandler,
  FieldsFormatter,
  Inject,
  Next,
  NextEvent,
  OnCreate,
  OnUpdate,
  Req,
  Results,
  Service,
  TypedRequest,
} from '../../../../../../lib';
import { BookFormat } from '../../../../@cds-models/CatalogService';
import { customFormatter } from '../../../util/formatter';

@EntityHandler(BookFormat)
class BookFormatsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @BeforeCreate()
  @FieldsFormatter<BookFormat>({ action: 'blacklist', charsToRemove: 'le' }, 'format')
  public async beforeCreate(@Req() req: TypedRequest<BookFormat>): Promise<void> {
    // ...
  }

  @BeforeUpdate()
  @FieldsFormatter<BookFormat>({ action: 'truncate', options: { length: 7 } }, 'format')
  public async beforeUpdate(@Req() req: TypedRequest<BookFormat>): Promise<void> {
    // ...
  }

  @AfterRead()
  @FieldsFormatter<BookFormat>({ action: 'toUpper' }, 'format')
  @FieldsFormatter<BookFormat>(customFormatter, 'format')
  public async afterRead(@Results() results: BookFormat[], @Req() req: TypedRequest<BookFormat>) {
    // ...
  }

  @OnCreate()
  @FieldsFormatter<BookFormat>({ action: 'ltrim' }, 'language')
  public async create(@Req() req: TypedRequest<BookFormat>, @Next() next: NextEvent) {
    return next();
  }

  @OnUpdate()
  @FieldsFormatter<BookFormat>({ action: 'trim' }, 'format')
  public async update(@Req() req: TypedRequest<BookFormat>, @Next() next: NextEvent) {
    return next();
  }
}

export default BookFormatsHandler;
