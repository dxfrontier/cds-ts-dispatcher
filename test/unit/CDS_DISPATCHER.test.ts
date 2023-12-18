import { CDSDispatcher } from '../../lib';
import { Book } from '../bookshop/@cds-models/CatalogService';

describe('CDSDispatcher', () => {
  describe('new CDSDispatcher([Book]).initialize()', () => {
    it('It should RETURN : dispatcher to be defined !', () => {
      const dispatcher = new CDSDispatcher([Book]).initialize();

      expect(dispatcher).toBeDefined();
    });
  });
});
