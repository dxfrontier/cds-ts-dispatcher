import type { MetadataFields } from '../../types/internalTypes';

import type { Request } from '../../types/types';

const isColumnSuppliedUtil = {
  isColumSupplied(req: Request, metadata: MetadataFields): boolean {
    let value: string = '';

    if (metadata.type === 'CHECK_COLUMN_VALUE') {
      value = metadata.property as string;
    }

    if (req.query.INSERT) {
      return req.query.INSERT.columns.includes(value);
    }

    if (req.query.SELECT?.columns && req.query.SELECT.columns.length > 0) {
      return req.query.SELECT.columns.some((column) => column.ref && column.ref?.length > 0 && column.ref[0] === value);
    }

    if (req.query.UPSERT) {
      return req.query.UPSERT.columns.includes(value);
    }

    return false;
  },
};

export default isColumnSuppliedUtil;
