/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AfterCreate, AfterDelete, AfterRead, AfterUpdate, EntityHandler } from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { type Constructable } from '@sap/cds/apis/internal/inference';
import { type CRUD_EVENTS, HandlerType, TypedRequest } from '../../lib/util/types/types';
import { Book } from '../bookshop/srv/util/types/entities/sap/capire/bookshop';

@EntityHandler(Book)
class BookHandler {
  @AfterCreate()
  public async afterCreateMethod(result: Book, req: TypedRequest<Book>) {}

  @AfterRead()
  public async afterReadMethod(results: Book[], req: TypedRequest<Book>) {}

  @AfterUpdate()
  public async afterUpdateMethod(result: Book, req: TypedRequest<Book>) {}

  @AfterDelete()
  public async afterDeleteMethod(deleted: boolean, req: TypedRequest<Book>) {}
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
