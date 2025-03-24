import { EntityHandler } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Constructable } from '../../../lib/types/internalTypes';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

function customerBeforeCreateInstance(): Constructable {
  @EntityHandler(Book)
  class BookHandler {}
  return BookHandler;
}

describe('CLASS', () => {
  describe('@EntityHandler', () => {
    it('It should RETURN : the entity set in the MetadataDispatcher', () => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const newInstance = (Customer: Constructable) => new Customer();
      const entity = MetadataDispatcher.getEntity(newInstance(customerBeforeCreateInstance()));

      expect(entity).toBeDefined();
    });
  });
});
