import { type Constructable } from '@sap/cds/apis/internal/inference';
import { EntityHandler, SingleInstanceCapable } from '../../lib';
import { Request } from '../../lib/index';
import Constants from '../../lib/util/constants/Constants';
import { Book } from '../bookshop/@cds-models/CatalogService';

function createCustomerInstance(): Constructable {
  @EntityHandler(Book)
  class BookHandler {
    @SingleInstanceCapable()
    public async doSomething(results: Book[], req: Request, isSingleInstance: boolean): Promise<void> {}
  }

  return BookHandler;
}

describe('SINGLE-INSTANCE', () => {
  describe('@SingleInstanceCapable', () => {
    test(`It should RETURN : 'true' which means that all methods after this will be marked as Single Instance`, async () => {
      const newCustomer = (Book: Constructable): Book => {
        return new Book();
      };

      const isSingleInstance: boolean = Reflect.getMetadata(
        Constants.DECORATOR.SINGLE_INSTANCE_FLAG_KEY,
        newCustomer(createCustomerInstance()),
        'doSomething',
      );

      expect(isSingleInstance).toBe(true);
    });
  });
});
