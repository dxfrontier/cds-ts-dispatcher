import { BeforeCreate, EntityHandler, FieldsFormatter, Req, Validate } from '../../../../../../../lib';

import type { Request } from '../../../../../../../lib';
import { BulkItem, BulkItems } from '#cds-models/BulkService';

@EntityHandler(BulkItems)
class BulkServiceHandler {
  // Validates 'email' and uppercases 'title', for every entry of a bulk (array) req.data and for a
  // single-object req.data alike.
  @BeforeCreate()
  @Validate<BulkItem>({ action: 'isEmail' }, 'email')
  @FieldsFormatter<BulkItem>({ action: 'toUpper' }, 'title')
  private async beforeCreate(@Req() req: Request): Promise<void> {}
}

export default BulkServiceHandler;
