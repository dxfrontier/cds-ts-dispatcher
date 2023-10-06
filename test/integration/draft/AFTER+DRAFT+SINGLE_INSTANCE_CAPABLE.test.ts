import { Request } from '@sap/cds';
import { AfterCreate, AfterDelete, AfterRead, AfterUpdate, Draft, SingleInstanceCapable } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';

class Customer {
  @AfterRead()
  @SingleInstanceCapable()
  @Draft()
  public async afterReadMethod(results: any[], req: Request, isSingleInstance: boolean) {}

  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  @SingleInstanceCapable()
  @Draft()
  public async afterCreateAndDeleteMethod(results: any[], req: Request, isSingleInstance: boolean) {}
}

class CustomerWithDraftInBetween {
  @AfterRead()
  @SingleInstanceCapable()
  @AfterCreate()
  @AfterUpdate()
  @Draft()
  @AfterDelete()
  public async afterReadMethod(results: any[], req: Request, isSingleInstance: boolean) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));
const decoratorPropsInBetweenDraft = MetadataDispatcher.getMetadataHandlers(newCustomer(CustomerWithDraftInBetween));

describe('AFTER - Single instance capable', () => {
  describe(`
  @AfterRead()
  @SingleInstanceCapable()
  @Draft()`, () => {
    it('It should : mark @AfterRead() decorator as "single instance" and as a "draft"', () => {
      const foundEvent = decoratorProps.filter((item) => item.event === 'READ')[0];

      expect(foundEvent.isSingleInstance).toBe(true);
      expect(foundEvent.isDraft).toBe(true);
    });
  });

  describe(`
  @AfterCreate() 
  @AfterUpdate()
  @AfterDelete()
  @SingleInstanceCapable()
  @Draft()`, () => {
    it('It should : mark @AfterCreate(), @AfterUpdate(), @AfterDelete() decorators as "single instance" and as a "draft"', () => {
      const foundCreate = decoratorProps.filter((item) => item.event === 'CREATE')[0];
      const foundDelete = decoratorProps.filter((item) => item.event === 'DELETE')[0];
      const foundUpdate = decoratorProps.filter((item) => item.event === 'UPDATE')[0];

      expect([foundCreate.isSingleInstance, foundDelete.isSingleInstance, foundUpdate.isSingleInstance]).toStrictEqual([
        true,
        true,
        true,
      ]);

      expect([foundCreate.isDraft, foundDelete.isDraft, foundUpdate.isDraft]).toStrictEqual([true, true, true]);
    });
  });

  describe(`
  @AfterRead()
  @SingleInstanceCapable()
  @AfterCreate()
  @AfterUpdate()
  @Draft()
  @AfterDelete()
  `, () => {
    it(`
    1. It should : mark @AfterRead() as "single instance" and NO "single instance" decorators @AfterCreate(), @AfterUpdate(), @AfterDelete()
    2. It should : mark as a "draft" decorators  @AfterCreate(), @AfterRead(), @AfterUpdate() and as NO "draft" the decorator @AfterDelete()
    `, async () => {
      const foundCreate = decoratorPropsInBetweenDraft.filter((item) => item.event === 'CREATE')[0];
      const foundRead = decoratorPropsInBetweenDraft.filter((item) => item.event === 'READ')[0];
      const foundDelete = decoratorPropsInBetweenDraft.filter((item) => item.event === 'DELETE')[0];
      const foundUpdate = decoratorPropsInBetweenDraft.filter((item) => item.event === 'UPDATE')[0];

      expect([
        foundRead.isSingleInstance,
        foundCreate.isSingleInstance,
        foundUpdate.isSingleInstance,
        foundDelete.isSingleInstance,
      ]).toStrictEqual([true, undefined, undefined, undefined]);

      expect([foundRead.isDraft, foundCreate.isDraft, foundUpdate.isDraft, foundDelete.isDraft]).toStrictEqual([
        true,
        true,
        true,
        false,
      ]);
    });
  });
});
