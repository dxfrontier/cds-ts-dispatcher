import { Request } from '../../lib/index';
import {
  OnCancelDraft,
  OnEditDraft,
  OnNewDraft,
  OnSaveDraft,
  BeforeSaveDraft,
  BeforeNewDraft,
  BeforeCancelDraft,
  BeforeEditDraft,
  AfterNewDraft,
  AfterSaveDraft,
  AfterEditDraft,
  AfterCancelDraft,
} from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';
import { CRUD_EVENTS, DRAFT_EVENTS, Handler, HandlerType } from '../../lib/util/types/types';

class Customer {
  @OnNewDraft()
  public async onNewDraftMethod(req: Request, next: Function) {}

  @OnCancelDraft()
  public async onCancelDraft(req: Request, next: Function) {}

  @OnEditDraft()
  public async onEditDraft(req: Request, next: Function) {}

  @OnSaveDraft()
  public async onSaveDraft(req: Request, next: Function) {}

  @BeforeNewDraft()
  public async beforeNewDraftMethod(req: Request) {}

  @BeforeCancelDraft()
  public async beforeCancelDraft(req: Request) {}

  @BeforeEditDraft()
  public async beforeEditDraft(req: Request) {}

  @BeforeSaveDraft()
  public async beforeSaveDraft(req: Request) {}

  @AfterNewDraft()
  public async afterNewDraftMethod(results: any, req: Request) {}

  @AfterCancelDraft()
  public async afterCancelDraft(results: any, req: Request) {}

  @AfterEditDraft()
  public async afterEditDraft(results: any, req: Request) {}

  @AfterSaveDraft()
  public async afterSaveDraft(results: any, req: Request) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));

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
        expect(foundEvent.isSingleInstance).toBeUndefined();
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
