import { Constructable } from '@sap/cds/apis/internal/inference';
import { SingleInstanceCapable } from '../../lib';
import { Request } from '../../lib/index';
import Constants from '../../lib/util/constants/Constants';

function createCustomerInstance(): Constructable {
  class Customer {
    @SingleInstanceCapable()
    public async doSomething(results: any[], req: Request, isSingleInstance: boolean) {}
  }

  return Customer;
}

describe('SINGLE-INSTANCE', () => {
  describe('@SingleInstanceCapable', () => {
    test(`It should RETURN : 'true' which means that all methods after this will be marked as Single Instance`, async () => {
      const newCustomer = (customer: Constructable) => {
        return new customer();
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
