import { Request } from '../../lib/index';
import { BeforeCreate, BeforeDelete, BeforeRead, BeforeUpdate } from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';
import { CRUD_EVENTS, HandlerType } from '../../lib/util/types/types';

class Customer {
  @BeforeCreate()
  public async beforeCreateMethod(req: Request) {}

  @BeforeRead()
  public async beforeReadMethod(req: Request) {}

  @BeforeUpdate()
  public async beforeUpdateMethod(req: Request) {}

  @BeforeDelete()
  public async beforeDeleteMethod(req: Request) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));

describe('BEFORE', () => {
  function testEvent(event: CRUD_EVENTS, eventName: string) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.handlerType).toBe(HandlerType.Before);
        expect(foundEvent.isDraft).toBe(false);
      });
    });
  }

  testEvent('CREATE', 'BeforeCreate');
  testEvent('READ', 'BeforeRead');
  testEvent('UPDATE', 'BeforeUpdate');
  testEvent('DELETE', 'BeforeDelete');
});
