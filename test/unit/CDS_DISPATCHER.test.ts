import { CDSDispatcher } from '../../lib/util/helpers/CDSDispatcher';
import { Book } from '../bookshop/srv/util/types/entities/CatalogService';

describe('CDSDispatcher', () => {
  describe('new CDSDispatcher([Book]).initialize()', () => {
    it('It should RETURN : dispatcher to be defined !', () => {
      const dispatcher = new CDSDispatcher([Book]).initialize();

      expect(dispatcher).toBeDefined();
    });
  });
});
