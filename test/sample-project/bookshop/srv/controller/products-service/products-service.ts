import { CDSDispatcher } from '../../../../../../lib';

import ProductHandler from './handler/ProductHandler';

export = new CDSDispatcher([
  // Entities
  ProductHandler,
]).initialize();
