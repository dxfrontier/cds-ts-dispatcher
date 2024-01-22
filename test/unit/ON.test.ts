/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { OnError, Request } from '../../lib/index';
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
  OnEvent,
} from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { type Constructable } from '@sap/cds/apis/internal/inference';
import { type CRUD_EVENTS, HandlerType, TypedRequest } from '../../lib/util/types/types';
import { Book, OrderedBook, submitOrder } from '../bookshop/@cds-models/CatalogService';

@EntityHandler(Book)
class BookHandler {
  @OnCreate()
  public async onCreateMethod(req: TypedRequest<Request>, next: Function) {}

  @OnRead()
  public async onReadMethod(req: Request, next: Function) {}

  @OnUpdate()
  public async onUpdateMethod(req: TypedRequest<Request>, next: Function) {}

  @OnDelete()
  public async onDeleteMethod(req: Request, next: Function) {}

  @OnAction(submitOrder)
  public async onActionMethod(req: TypedRequest<Request>, next: Function) {}

  @OnFunction(submitOrder)
  public async onFunctionMethod(req: Request, next: Function) {}

  @OnEvent(OrderedBook)
  public async onEvent(req: TypedRequest<OrderedBook>) {}

  @OnError()
  public async onError(error: Error, req: Request) {}

  @OnBoundAction(submitOrder)
  public async onBoundActionMethod(req: TypedRequest<Request>, next: Function) {}

  @OnBoundFunction(submitOrder)
  public async onBoundFunctionMethod(req: TypedRequest<Request>, next: Function) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

describe('ON', () => {
  function testEvent(event: CRUD_EVENTS, eventName: string): void {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.handlerType).toBe(HandlerType.On);
        expect(foundEvent.isDraft).toBe(false);

        if (foundEvent.event === 'EVENT') {
          expect(foundEvent.eventName).toStrictEqual(OrderedBook);
        }

        if (
          foundEvent.event === 'ACTION' ||
          foundEvent.event === 'FUNC' ||
          foundEvent.event === 'BOUND_ACTION' ||
          foundEvent.event === 'BOUND_FUNC'
        ) {
          expect(foundEvent.actionName).toStrictEqual(submitOrder);
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
  testEvent('EVENT', 'OnEvent');
  testEvent('ERROR', 'OnError');

  // BOUND ACTION & FUNCTION
  testEvent('BOUND_ACTION', 'OnBoundAction');
  testEvent('BOUND_FUNC', 'OnBoundFunction');
});
