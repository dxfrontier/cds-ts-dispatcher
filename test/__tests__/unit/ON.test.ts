import type { Constructable } from '../../../lib/types/internalTypes';

import {
  EntityHandler,
  OnAction,
  OnBoundAction,
  OnBoundFunction,
  OnCreate,
  OnDelete,
  OnEvent,
  OnFunction,
  OnRead,
  OnUpdate,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { OnError } from '../../../lib/index';
import { Book, OrderedBook, submitOrder } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { CRUD_EVENTS, EVENTS, Request } from '../../../lib/types/types';

@EntityHandler(Book)
class BookHandler {
  @OnCreate()
  public async onCreateMethod(req: Request<Request>, next: Function) {}

  @OnRead()
  public async onReadMethod(req: Request, next: Function) {}

  @OnUpdate()
  public async onUpdateMethod(req: Request<Request>, next: Function) {}

  @OnDelete()
  public async onDeleteMethod(req: Request, next: Function) {}

  @OnAction(submitOrder)
  public async onActionMethod(req: Request<Request>, next: Function) {}

  @OnFunction(submitOrder)
  public async onFunctionMethod(req: Request, next: Function) {}

  @OnEvent(OrderedBook)
  public async onEvent(req: Request<OrderedBook>) {}

  @OnError()
  public async onError(error: Error, req: Request) {}

  @OnBoundAction(submitOrder)
  public async onBoundActionMethod(req: Request<Request>, next: Function) {}

  @OnBoundFunction(submitOrder)
  public async onBoundFunctionMethod(req: Request<Request>, next: Function) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

describe('ON', () => {
  function testEvent(event: EVENTS, eventName: string): void {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.isDraft).toBe(false);

        if (foundEvent.event === 'EVENT' && foundEvent.type === 'EVENT') {
          expect(foundEvent.eventName).toStrictEqual(OrderedBook);
        }

        if (
          foundEvent.event === 'ACTION' ||
          foundEvent.event === 'FUNC' ||
          foundEvent.event === 'BOUND_ACTION' ||
          foundEvent.event === 'BOUND_FUNC'
        ) {
          if (foundEvent.type === 'ACTION_FUNCTION') {
            expect(foundEvent.actionName).toStrictEqual(submitOrder);
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
  testEvent('EVENT', 'OnEvent');
  testEvent('ERROR', 'OnError');

  // BOUND ACTION & FUNCTION
  testEvent('BOUND_ACTION', 'OnBoundAction');
  testEvent('BOUND_FUNC', 'OnBoundFunction');
});
