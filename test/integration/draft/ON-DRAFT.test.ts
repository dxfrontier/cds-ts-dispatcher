import { Request } from '@sap/cds';
import { OnCancelDraft, OnEditDraft, OnNewDraft, OnSaveDraft } from '../../../dist';
import { MetadataDispatcher } from '../../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';

class Customer {
  @OnNewDraft()
  public async method1(req: Request, next: Function) {}

  @OnCancelDraft()
  public async method2(req: Request, next: Function) {}

  @OnEditDraft()
  public async method3(req: Request, next: Function) {}

  @OnSaveDraft()
  public async method4(req: Request, next: Function) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));

describe('ON - Draft', () => {
  describe('@OnNewDraft()', () => {
    it('It should : have isDraft : true', () => {
      const found = decoratorProps.filter((item) => item.event === 'NEW')[0];

      expect(found.isDraft).toBe(true);
    });
  });

  describe('@OnCancelDraft()', () => {
    it('It should : isDraft : true', () => {
      const found = decoratorProps.filter((item) => item.event === 'CANCEL')[0];

      expect(found.isDraft).toBe(true);
    });
  });

  describe('@OnEditDraft()', () => {
    it('It should : isDraft : false as this it will be triggered on active entity', () => {
      const found = decoratorProps.filter((item) => item.event === 'EDIT')[0];

      expect(found.isDraft).toBe(false);
    });
  });

  describe('@OnSaveDraft()', () => {
    it('It should : isDraft : false as this it will be triggered on active entity', () => {
      const found = decoratorProps.filter((item) => item.event === 'SAVE')[0];

      expect(found.isDraft).toBe(false);
    });
  });
});
