/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AfterCreate, AfterDelete, AfterRead, AfterUpdate, EntityHandler, Use } from '../../lib';
import { MetadataDispatcher } from '../../lib/core/MetadataDispatcher';
import { HandlerType } from '../../lib/types/enum';
import { Book } from '../bookshop/@cds-models/CatalogService';
import { MiddlewareMethodAfterRead1 } from '../util/middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../util/middleware/MiddlewareAfterRead2';
import { MiddlewareEntity1 } from '../util/middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../util/middleware/MiddlewareEntity2';

import type { CRUD_EVENTS, Request } from '../../lib/types/types';
import type { Constructable } from '../../lib/types/internalTypes';

@EntityHandler(Book)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookHandler {
  @AfterCreate()
  public async afterCreateMethod(result: Book, req: Request<Book>) {}

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
  public async afterReadMethod(results: Book[], req: Request<Book>) {}

  @AfterUpdate()
  public async afterUpdateMethod(result: Book, req: Request<Book>) {}

  @AfterDelete()
  public async afterDeleteMethod(deleted: boolean, req: Request<Book>) {}
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
      });
    });
  }

  testEvent('CREATE', 'AfterCreate');
  testEvent('READ', 'AfterRead');
  testEvent('UPDATE', 'AfterUpdate');
  testEvent('DELETE', 'AfterDelete');
});
