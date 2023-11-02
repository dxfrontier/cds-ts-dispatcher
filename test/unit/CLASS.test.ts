import { Constructable } from '@sap/cds/apis/internal/inference';
import { EntityHandler } from '../../lib';
import { Book } from '../bookshop/srv/util/types/entities/sap/capire/bookshop';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';

function customerBeforeCreateInstance(): Constructable {
  @EntityHandler(Book)
  class BookHandler {}
  return BookHandler;
}

describe('CLASS', () => {
  describe('@EntityHandler', () => {
    it('It should RETURN : the entity set in the MetadataDispatcher', () => {
      const newInstance = (customer: Constructable) => new customer();
      const entity = MetadataDispatcher.getEntity(newInstance(customerBeforeCreateInstance()));

      expect(entity).toBeDefined();
    });
  });
});
