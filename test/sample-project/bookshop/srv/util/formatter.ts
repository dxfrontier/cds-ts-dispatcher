import { type BookFormat } from '#cds-models/CatalogService';

import { type Formatters } from '../../../../../lib';

export const customFormatter: Formatters<BookFormat> = {
  action: 'customFormatter',
  callback(req, results) {
    if (results && results.length > 0) {
      // make first item 'toLowerCase' and leave the rest 'toUpperCase'
      results[0].format = results[0].format?.toLowerCase();
    }
  },
};
