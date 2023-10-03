import CDSDispatcher from '../../lib/util/helpers/CDSDispatcher';
import { Book } from '../bookshop/srv/util/types/entities/CatalogService';
import { connectTest } from '../util/util';

const cds = connectTest(__dirname, 'bookshop');

describe('CDSDispatcher', () => {
  describe('new CDSDispatcher(["...", "...", ...])', () => {
    it('It should RETURN : dispatcher to be defined !', () => {
      const dispatcher = new CDSDispatcher([Book]).initializeEntityHandlers();
      expect(dispatcher).toBeDefined();
    });
  });
});
