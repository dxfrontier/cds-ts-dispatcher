import {
  AfterRead,
  BeforeCreate,
  BeforeUpdate,
  EntityHandler,
  FieldsFormatter,
  Inject,
  OnCreate,
  OnUpdate,
  Service,
  SRV,
  TypedRequest,
} from '../../../../../../lib';
import { BookFormat } from '../../../../@cds-models/CatalogService';

@EntityHandler(BookFormat)
class BookFormatsHandler {
  @Inject(SRV) private readonly srv: Service;

  @BeforeCreate()
  @FieldsFormatter<BookFormat>({ action: 'blacklist', charsToRemove: 'le' }, 'format')
  public async beforeCreate(req: TypedRequest<BookFormat>) {
    // ...
  }

  @BeforeUpdate()
  @FieldsFormatter<BookFormat>({ action: 'truncate', options: { length: 7 } }, 'format')
  public async beforeUpdate(req: TypedRequest<BookFormat>) {
    // ...
  }

  @AfterRead()
  @FieldsFormatter<BookFormat>({ action: 'toUpper' }, 'format')
  @FieldsFormatter<BookFormat>(
    {
      action: 'customFormatter',
      callback(req, results) {
        if (results) {
          // make first item 'toLowerCase' and leave the rest 'toUpperCase'
          results[0].format = results[0].format?.toLowerCase();
        }
      },
    },
    'format',
  )
  public async afterRead(results: BookFormat[], req: TypedRequest<BookFormat>) {
    // ...
  }

  @OnCreate()
  @FieldsFormatter<BookFormat>({ action: 'ltrim' }, 'language')
  public async onCreate(req: TypedRequest<BookFormat>, next: Function) {
    return next();
  }

  @OnUpdate()
  @FieldsFormatter<BookFormat>({ action: 'trim' }, 'format')
  public async onUpdate(req: TypedRequest<BookFormat>, next: Function) {
    return next();
  }
}

export default BookFormatsHandler;
