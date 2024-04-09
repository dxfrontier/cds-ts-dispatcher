import {
  AfterRead,
  BeforeCreate,
  BeforeUpdate,
  EntityHandler,
  FieldsFormatter,
  Inject,
  Next,
  OnCreate,
  OnUpdate,
  Req,
  Results,
  Service,
  SRV,
  TypedRequest,
} from '../../../../../../lib';
import { BookFormat } from '../../../../@cds-models/CatalogService';
import { customFormatter } from '../../../util/formatter';

@EntityHandler(BookFormat)
class BookFormatsHandler {
  @Inject(SRV) private readonly srv: Service;

  @BeforeCreate()
  @FieldsFormatter<BookFormat>({ action: 'blacklist', charsToRemove: 'le' }, 'format')
  public async beforeCreate(@Req() req: TypedRequest<BookFormat>) {
    // ...
    debugger;
  }

  @BeforeUpdate()
  @FieldsFormatter<BookFormat>({ action: 'truncate', options: { length: 7 } }, 'format')
  public async beforeUpdate(@Req() req: TypedRequest<BookFormat>) {
    // ...
    debugger;
  }

  @AfterRead()
  @FieldsFormatter<BookFormat>({ action: 'toUpper' }, 'format')
  @FieldsFormatter<BookFormat>(customFormatter, 'format')
  public async afterRead(@Results() results: BookFormat[], @Req() req: TypedRequest<BookFormat>) {
    // ...

    debugger;
  }

  @OnCreate()
  @FieldsFormatter<BookFormat>({ action: 'ltrim' }, 'language')
  public async onCreate(@Req() req: TypedRequest<BookFormat>, @Next() next: Function) {
    debugger;
    return next();
  }

  @OnUpdate()
  @FieldsFormatter<BookFormat>({ action: 'trim' }, 'format')
  public async onUpdate(@Req() req: TypedRequest<BookFormat>, @Next() next: Function) {
    debugger;
    return next();
  }
}

export default BookFormatsHandler;
