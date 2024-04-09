import type { Request } from '../../types/types';

const singleInstanceSwitchUtil = {
  isSingleInstance(req: Request): boolean {
    const hasParameters = req.params && req.params.length > 0;
    const SINGLE_INSTANCE = true;
    const ENTITY_SET = false;

    if (hasParameters) {
      return SINGLE_INSTANCE;
    }

    return ENTITY_SET;
  },
};

export default singleInstanceSwitchUtil;
