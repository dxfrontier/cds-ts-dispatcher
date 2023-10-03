import { Request } from '@sap/cds';
import { Draft, OnCancelDraft, OnEditDraft, OnNewDraft, OnSaveDraft } from '../../lib';
import { MetadataDispatcher } from '../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';
import { CRUD_EVENTS, DRAFT_EVENTS, HandlerType } from '../../lib/util/types/types';
import Constants from '../../lib/util/constants/Constants';

class Customer {
  @Draft()
  public async draftMethod(req: Request) {}

  @OnNewDraft()
  public async onNewDraftMethod(req: Request, next: Function) {}

  @OnCancelDraft()
  public async onCancelDraft(req: Request, next: Function) {}

  @OnEditDraft()
  public async onEditDraft(req: Request, next: Function) {}

  @OnSaveDraft()
  public async onSaveDraft(req: Request, next: Function) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));

describe('DRAFT', () => {
  function testEvent(event: CRUD_EVENTS | DRAFT_EVENTS, eventName: string) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);

        if (event === 'NEW' || event === 'CANCEL') {
          expect(foundEvent.isDraft).toBe(true);
          expect(foundEvent.handlerType).toBe(HandlerType.OnDraft);
        } else if (event === 'EDIT' || event === 'SAVE') {
          expect(foundEvent.isDraft).toBe(false);
          expect(foundEvent.handlerType).toBe(HandlerType.On);
        }

        expect(foundEvent.isSingleInstance).toBeUndefined();
      });
    });
  }

  testEvent('NEW', 'OnNewDraft');
  testEvent('CANCEL', 'OnCancelDraft');
  testEvent('EDIT', 'OnEditDraft');
  testEvent('SAVE', 'OnSaveDraft');

  // Separate testing as this does not have a event type
  describe('@Draft', () => {
    test('It should RETURN : "true" which means all methods above this will be marked as draft', () => {
      const isDraft: boolean = Reflect.getMetadata(
        Constants.DECORATOR.DRAFT_FLAG_KEY,
        newCustomer(Customer),
        'draftMethod',
      );

      expect(isDraft).toBe(true);
    });
  });
});
