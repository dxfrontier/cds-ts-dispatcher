import type { MetadataFields } from '../../types/internalTypes';

import type { Request } from '../../types/types';

const isRoleUtil = {
  isRoleSupplied(req: Request, metadata: MetadataFields): boolean {
    return req.user.is(metadata.type === 'USER' ? metadata.property : '');
  },
};

export default isRoleUtil;
