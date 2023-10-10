import { Request } from '@sap/cds';
import { AfterCreate, AfterDelete, AfterRead, AfterUpdate, Draft } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';

class Customer {
  @AfterRead()
  @Draft()
  public async afterReadMethod(results: any[], req: Request) {}

  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  @Draft()
  public async afterCreateAndDeleteMethod(results: any[] | any, req: Request) {}
}

class CustomerWithDraftInBetween {
  @AfterRead()
  @Draft()
  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  public async afterReadMethod(results: any[] | any, req: Request) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));
const decoratorPropsInBetweenDraft = MetadataDispatcher.getMetadataHandlers(newCustomer(CustomerWithDraftInBetween));

describe('AFTER - Draft', () => {
  describe(`
  @AfterRead()
  @Draft()`, () => {
    it('It should : mark @AfterRead() decorator as "draft"', () => {
      const foundEvent = decoratorProps.filter((item) => item.event === 'READ')[0];

      expect(foundEvent.isDraft).toBe(true);
    });
  });

  describe(`
  @AfterCreate() 
  @AfterUpdate()
  @AfterDelete()
  @Draft()`, () => {
    it('It should : mark @AfterCreate(), @AfterUpdate(), @AfterDelete() decorators as "draft"', () => {
      const foundCreate = decoratorProps.filter((item) => item.event === 'CREATE')[0];
      const foundDelete = decoratorProps.filter((item) => item.event === 'DELETE')[0];
      const foundUpdate = decoratorProps.filter((item) => item.event === 'UPDATE')[0];

      expect([foundCreate.isDraft, foundDelete.isDraft, foundUpdate.isDraft]).toStrictEqual([true, true, true]);
    });
  });

  describe(`
  @AfterRead()
  @Draft()
  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  `, () => {
    it('It should : mark @AfterRead() as "draft" and as NO "draft" decorators @AfterCreate(), @AfterUpdate(), @AfterDelete()', () => {
      const foundCreate = decoratorPropsInBetweenDraft.filter((item) => item.event === 'CREATE')[0];
      const foundRead = decoratorPropsInBetweenDraft.filter((item) => item.event === 'READ')[0];
      const foundDelete = decoratorPropsInBetweenDraft.filter((item) => item.event === 'DELETE')[0];
      const foundUpdate = decoratorPropsInBetweenDraft.filter((item) => item.event === 'UPDATE')[0];

      expect([foundRead.isDraft, foundCreate.isDraft, foundUpdate.isDraft, foundDelete.isDraft]).toStrictEqual([
        true,
        false,
        false,
        false,
      ]);
    });
  });
});
