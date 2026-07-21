import type { Constructable } from '../../../lib/types/internalTypes';

import {
  AfterCancelDraft,
  AfterDiscardDraft,
  AfterEditDraft,
  AfterNewDraft,
  AfterPatchDraft,
  AfterSaveDraft,
  BeforeCancelDraft,
  BeforeDiscardDraft,
  BeforeEditDraft,
  BeforeNewDraft,
  BeforePatchDraft,
  BeforeSaveDraft,
  OnCancelDraft,
  OnDiscardDraft,
  OnEditDraft,
  OnNewDraft,
  OnPatchDraft,
  OnSaveDraft,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { EntityHandler } from '../../../lib/index';
import { BaseHandler } from '../../../lib/types/internalTypes';
import { BookEvent } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { CRUD_EVENTS, DRAFT_EVENTS, Request } from '../../../lib/types/types';
@EntityHandler(BookEvent)
class BookEventsHandler {
  @OnNewDraft()
  public async onNewDraftMethod(req: Request, next: Function) {}

  @OnCancelDraft()
  public async onCancelDraft(req: Request<Request>, next: Function) {}

  @OnEditDraft()
  public async onEditDraft(req: Request, next: Function) {}

  @OnSaveDraft()
  public async onSaveDraft(req: Request<Request>, next: Function) {}

  @BeforeNewDraft()
  public async beforeNewDraftMethod(req: Request) {}

  @BeforeCancelDraft()
  public async beforeCancelDraft(req: Request<Request>) {}

  @BeforeEditDraft()
  public async beforeEditDraft(req: Request) {}

  @BeforeSaveDraft()
  public async beforeSaveDraft(req: Request<Request>) {}

  @AfterNewDraft()
  public async afterNewDraftMethod(results: BookEvent, req: Request) {}

  @AfterCancelDraft()
  public async afterCancelDraft(results: BookEvent, req: Request<Request>) {}

  @AfterEditDraft()
  public async afterEditDraft(results: BookEvent, req: Request) {}

  @AfterSaveDraft()
  public async afterSaveDraft(results: BookEvent, req: Request<Request>) {}

  // F1: PATCH draft (alias of UPDATE on '.drafts' since cds 10)
  @OnPatchDraft()
  public async onPatchDraft(req: Request, next: Function) {}

  @BeforePatchDraft()
  public async beforePatchDraft(req: Request) {}

  @AfterPatchDraft()
  public async afterPatchDraft(results: BookEvent, req: Request) {}

  // F1: DISCARD draft (alias of CANCEL since cds 10)
  @OnDiscardDraft()
  public async onDiscardDraft(req: Request, next: Function) {}

  @BeforeDiscardDraft()
  public async beforeDiscardDraft(req: Request) {}

  @AfterDiscardDraft()
  public async afterDiscardDraft(results: BookEvent, req: Request) {}
}

const newBookEvents = (BookEvents: Constructable) => new BookEvents();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBookEvents(BookEventsHandler));

describe('DRAFT', () => {
  function testEvent(event: CRUD_EVENTS | DRAFT_EVENTS, eventName: string, handlerType: HandlerType, isDraft: boolean) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter(
          (item: BaseHandler) => item.event === event && item.eventKind === handlerType,
        )[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.isDraft).toBe(isDraft);
      });
    });
  }

  testEvent('NEW', 'OnNewDraft', 'ON', true);
  testEvent('CANCEL', 'OnCancelDraft', 'ON', true);
  testEvent('EDIT', 'OnEditDraft', 'ON', false);
  testEvent('SAVE', 'OnSaveDraft', 'ON', false);

  testEvent('NEW', 'BeforeNewDraft', 'BEFORE', true);
  testEvent('CANCEL', 'BeforeCancelDraft', 'BEFORE', true);
  testEvent('EDIT', 'BeforeEditDraft', 'BEFORE', false);
  testEvent('SAVE', 'BeforeSaveDraft', 'BEFORE', false);

  testEvent('NEW', 'AfterNewDraft', 'AFTER', true);
  testEvent('CANCEL', 'AfterCancelDraft', 'AFTER', true);
  testEvent('EDIT', 'AfterEditDraft', 'AFTER', false);
  testEvent('SAVE', 'AfterSaveDraft', 'AFTER', false);

  // F1: PATCH draft trio (isDraft: true, triggered on 'MyEntity.drafts')
  testEvent('PATCH', 'BeforePatchDraft', 'BEFORE', true);
  testEvent('PATCH', 'OnPatchDraft', 'ON', true);
  testEvent('PATCH', 'AfterPatchDraft', 'AFTER', true);

  // F1: DISCARD draft trio (isDraft: true, triggered on 'MyEntity.drafts')
  testEvent('DISCARD', 'BeforeDiscardDraft', 'BEFORE', true);
  testEvent('DISCARD', 'OnDiscardDraft', 'ON', true);
  testEvent('DISCARD', 'AfterDiscardDraft', 'AFTER', true);
});
