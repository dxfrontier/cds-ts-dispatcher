import type { Constructable } from '@sap/cds/apis/internal/inference';

import { BeforeCreate, BeforeDelete, BeforeRead, BeforeUpdate } from '../../lib';
import { MetadataDispatcher } from '../../lib/core/MetadataDispatcher';
import { EntityHandler } from '../../lib/index';
import { HandlerType } from '../../lib/types/enum';
import { BookEvent } from '../bookshop/@cds-models/CatalogService';

import type { CRUD_EVENTS, TypedRequest } from '../../lib/types/types';

@EntityHandler(BookEvent)
class BookEventHandler {
  @BeforeCreate()
  public async beforeCreateMethod(req: TypedRequest<BookEvent>) {}

  @BeforeRead()
  public async beforeReadMethod(req: TypedRequest<BookEvent>) {}

  @BeforeUpdate()
  public async beforeUpdateMethod(req: TypedRequest<BookEvent>) {}

  @BeforeDelete()
  public async beforeDeleteMethod(req: TypedRequest<BookEvent>) {}
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
