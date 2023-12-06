/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EntityHandler } from '../../lib/index';
import { BeforeCreate, BeforeDelete, BeforeRead, BeforeUpdate } from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { type Constructable } from '@sap/cds/apis/internal/inference';
import { type CRUD_EVENTS, HandlerType, TypedRequest } from '../../lib/util/types/types';
import { BookEvent, type BookEvents } from '../bookshop/srv/util/types/entities/CatalogService';

@EntityHandler(BookEvent)
class BookEventHandler {
  @BeforeCreate()
  public async beforeCreateMethod(req: TypedRequest<BookEvents>) {}

  @BeforeRead()
  public async beforeReadMethod(req: TypedRequest<BookEvents>) {}

  @BeforeUpdate()
  public async beforeUpdateMethod(req: TypedRequest<BookEvents>) {}

  @BeforeDelete()
  public async beforeDeleteMethod(req: TypedRequest<BookEvents>) {}
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const newBookEvent = (BookEvent: Constructable) => new BookEvent();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBookEvent(BookEventHandler));

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
