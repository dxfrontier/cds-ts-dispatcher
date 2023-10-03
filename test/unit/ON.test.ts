import { Request } from '@sap/cds';
import {
  EntityHandler,
  OnAction,
  OnBoundAction,
  OnBoundFunction,
  OnCreate,
  OnDelete,
  OnFunction,
  OnRead,
  OnUpdate,
} from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';
import { CRUD_EVENTS, HandlerType } from '../../lib/util/types/types';
import { Book } from '../bookshop/srv/util/entities/CatalogService';

const testFn = (actionMethod: number) => {};

@EntityHandler(Book)
class Customer {
  @OnCreate()
  public async onCreateMethod(req: Request, next: Function) {}

  @OnRead()
  public async onReadMethod(req: Request, next: Function) {}

  @OnUpdate()
  public async onUpdateMethod(req: Request, next: Function) {}

  @OnDelete()
  public async onDeleteMethod(req: Request, next: Function) {}

  @OnAction(testFn)
  public async onActionMethod(req: Request, next: Function) {}

  @OnFunction(testFn)
  public async onFunctionMethod(req: Request, next: Function) {}

  @OnBoundAction(testFn)
  public async onBoundActionMethod(req: Request, next: Function) {}

  @OnBoundFunction(testFn)
  public async onBoundFunctionMethod(req: Request, next: Function) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));

describe('ON', () => {
  function testEvent(event: CRUD_EVENTS, eventName: string) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.handlerType).toBe(HandlerType.On);
        expect(foundEvent.isDraft).toBe(false);

        if (
          foundEvent.event === 'ACTION' ||
          foundEvent.event === 'FUNC' ||
          foundEvent.event === 'BOUND_ACTION' ||
          foundEvent.event == 'BOUND_FUNC'
        ) {
          if (foundEvent.actionName) {
            expect(foundEvent.actionName).toBe(testFn);
          }
        }
      });
    });
  }

  // CRUD
  testEvent('CREATE', 'OnCreate');
  testEvent('READ', 'OnRead');
  testEvent('UPDATE', 'OnUpdate');
  testEvent('DELETE', 'OnDelete');

  // ACTION & FUNCTION
  testEvent('ACTION', 'OnAction');
  testEvent('FUNC', 'OnFunction');

  // BOUND ACTION & FUNCTION
  testEvent('BOUND_ACTION', 'OnBoundAction');
  testEvent('BOUND_FUNC', 'OnBoundFunction');
});
