import util from '../util';

import type { MetadataFields } from '../../types/internalTypes';

const requestPropertyUtil = {
  handleRequestOptions(metadataParameters: MetadataFields[], args: any[]) {
    for (const parameter of metadataParameters) {
      const req = util.findRequest(args);

      if (parameter.type === 'REQUEST') {
        const key = parameter.property;
        args[parameter.parameterIndex] = req[key];
      }
    }
  },
};

export default requestPropertyUtil;
