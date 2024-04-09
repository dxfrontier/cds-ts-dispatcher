import type { Constructable } from '@sap/cds/apis/internal/inference';

import {
  AfterCancelDraft,
  AfterEditDraft,
  AfterNewDraft,
  AfterSaveDraft,
  BeforeCancelDraft,
  BeforeEditDraft,
  BeforeNewDraft,
  BeforeSaveDraft,
  OnCancelDraft,
  OnEditDraft,
  OnNewDraft,
  OnSaveDraft,
} from '../../lib';
import { MetadataDispatcher } from '../../lib/core/MetadataDispatcher';
import { EntityHandler } from '../../lib/index';
import { HandlerType } from '../../lib/types/enum';
import { BookEvent } from '../bookshop/@cds-models/CatalogService';

import type { Handler } from '../../lib/types/internalTypes';
import type { CRUD_EVENTS, DRAFT_EVENTS, TypedRequest, Request } from '../../lib/types/types';

@EntityHandler(BookEvent)
class BookEventsHandler {
  @OnNewDraft()
  public async onNewDraftMethod(req: Request, next: Function) {}

  @OnCancelDraft()
  public async onCancelDraft(req: TypedRequest<Request>, next: Function) {}

  @OnEditDraft()
  public async onEditDraft(req: Request, next: Function) {}

  @OnSaveDraft()
  public async onSaveDraft(req: TypedRequest<Request>, next: Function) {}

  @BeforeNewDraft()
  public async beforeNewDraftMethod(req: Request) {}

  @BeforeCancelDraft()
  public async beforeCancelDraft(req: TypedRequest<Request>) {}

  @BeforeEditDraft()
  public async beforeEditDraft(req: Request) {}

  @BeforeSaveDraft()
  public async beforeSaveDraft(req: TypedRequest<Request>) {}

  @AfterNewDraft()
  public async afterNewDraftMethod(results: BookEvent, req: Request) {}

  @AfterCancelDraft()
  public async afterCancelDraft(results: BookEvent, req: TypedRequest<Request>) {}

  @AfterEditDraft()
  public async afterEditDraft(results: BookEvent, req: Request) {}

  @AfterSaveDraft()
  public async afterSaveDraft(results: BookEvent, req: TypedRequest<Request>) {}
}

const newBookEvents = (BookEvents: Constructable) => new BookEvents();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBookEvents(BookEventsHandler));

describe('DRAFT', () => {
  function testEvent(event: CRUD_EVENTS | DRAFT_EVENTS, eventName: string, handlerType: HandlerType, isDraft: boolean) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter(
          (item: Handler) => item.event === event && item.handlerType === handlerType,
        )[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.isDraft).toBe(isDraft);
        expect(foundEvent.handlerType).toBe(handlerType);
      });
    });
  }

  testEvent('NEW', 'OnNewDraft', HandlerType.On, true);
  testEvent('CANCEL', 'OnCancelDraft', HandlerType.On, true);
  testEvent('EDIT', 'OnEditDraft', HandlerType.On, false);
  testEvent('SAVE', 'OnSaveDraft', HandlerType.On, false);

  testEvent('NEW', 'BeforeNewDraft', HandlerType.Before, true);
  testEvent('CANCEL', 'BeforeCancelDraft', HandlerType.Before, true);
  testEvent('EDIT', 'BeforeEditDraft', HandlerType.Before, false);
  testEvent('SAVE', 'BeforeSaveDraft', HandlerType.Before, false);

  testEvent('NEW', 'AfterNewDraft', HandlerType.After, true);
  testEvent('CANCEL', 'AfterCancelDraft', HandlerType.After, true);
  testEvent('EDIT', 'AfterEditDraft', HandlerType.After, false);
  testEvent('SAVE', 'AfterSaveDraft', HandlerType.After, false);
});
