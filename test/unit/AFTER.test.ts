import { Request } from '@sap/cds';
import { AfterCreate, AfterDelete, AfterRead, AfterUpdate } from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';
import { CRUD_EVENTS, HandlerType } from '../../lib/util/types/types';

class Customer {
  @AfterCreate()
  public async afterCreateMethod(results: any[], req: Request) {}

  @AfterRead()
  public async afterReadMethod(results: any[], req: Request) {}

  @AfterUpdate()
  public async afterUpdateMethod(results: any, req: Request) {}

  @AfterDelete()
  public async afterDeleteMethod(results: boolean, req: Request) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));

describe('BEFORE - Active entity', () => {
  function testEvent(event: CRUD_EVENTS, eventName: string) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.handlerType).toBe(HandlerType.After);
        expect(foundEvent.isDraft).toBe(false);
        expect(foundEvent.isSingleInstance).toBeUndefined();
      });
    });
  }

  testEvent('CREATE', 'AfterCreate');
  testEvent('READ', 'AfterRead');
  testEvent('UPDATE', 'AfterUpdate');
  testEvent('DELETE', 'AfterDelete');
});
