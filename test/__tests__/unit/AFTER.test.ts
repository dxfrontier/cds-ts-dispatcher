import type { Constructable } from '../../../lib/types/internalTypes';

import { AfterCreate, AfterDelete, AfterRead, AfterUpdate, EntityHandler } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { CRUD_EVENTS, Request } from '../../../lib/types/types';

@EntityHandler(Book)
class BookHandler {
  @AfterCreate()
  public async afterCreateMethod(result: Book, req: Request<Book>) {}

  @AfterRead()
  public async afterReadMethod(results: Book[], req: Request<Book>) {}

  @AfterUpdate()
  public async afterUpdateMethod(result: Book, req: Request<Book>) {}

  @AfterDelete()
  public async afterDeleteMethod(deleted: boolean, req: Request<Book>) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

describe('BEFORE - Active entity', () => {
  function testEvent(event: CRUD_EVENTS, eventName: string) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.isDraft).toBe(false);
      });
    });
  }

  testEvent('CREATE', 'AfterCreate');
  testEvent('READ', 'AfterRead');
  testEvent('UPDATE', 'AfterUpdate');
  testEvent('DELETE', 'AfterDelete');
});
