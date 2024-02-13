/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AfterCreate, AfterDelete, AfterRead, AfterUpdate, EntityHandler, Use } from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { type Constructable } from '@sap/cds/apis/internal/inference';
import { type CRUD_EVENTS, HandlerType, TypedRequest } from '../../lib/util/types/types';
import { Book } from '../bookshop/@cds-models/CatalogService';
import { MiddlewareEntity1 } from '../util/middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../util/middleware/MiddlewareEntity2';
import { MiddlewareMethodAfterRead1 } from '../util/middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../util/middleware/MiddlewareAfterRead2';

@EntityHandler(Book)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookHandler {
  @AfterCreate()
  public async afterCreateMethod(result: Book, req: TypedRequest<Book>) {}

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
  public async afterReadMethod(results: Book[], req: TypedRequest<Book>) {}

  @AfterUpdate()
  public async afterUpdateMethod(result: Book, req: TypedRequest<Book>) {}

  @AfterDelete()
  public async afterDeleteMethod(deleted: boolean, req: TypedRequest<Book>) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

// Pretty difficult to unit test the middleware !!!!

describe('MIDDLEWARE', () => {
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
