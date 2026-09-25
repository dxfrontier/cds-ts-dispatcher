import { CDSDispatcher } from '../../../../../../lib';

import BulkServiceHandler from './handler/BulkServiceHandler';

export = new CDSDispatcher([
  // Entities
  BulkServiceHandler,
]).initialize();
