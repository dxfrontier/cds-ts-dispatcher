import type { BookFormat } from '#cds-models/sap/capire/bookshop';
import type { Formatters } from '@dxfrontier/cds-ts-dispatcher';

export const customFormatter: Formatters<BookFormat> = {
  action: 'customFormatter',
  callback(req, results) {
    if (results != null && results.length > 0) {
      // make first item 'toLowerCase' and leave the rest 'toUpperCase'
      results[0].format = results[0].format?.toLowerCase();
    }
  },
};
