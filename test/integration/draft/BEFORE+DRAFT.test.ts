import { Request } from '@sap/cds';
import { BeforeCreate, BeforeDelete, BeforeRead, BeforeUpdate, Draft } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';

class Customer {
  @BeforeRead()
  @Draft()
  public async BeforeReadMethod(req: Request) {}

  @BeforeCreate()
  @BeforeUpdate()
  @BeforeDelete()
  @Draft()
  public async BeforeCreateAndDeleteMethod(req: Request) {}
}

class CustomerWithDraftInBetween {
  @BeforeRead()
  @Draft()
  @BeforeCreate()
  @BeforeUpdate()
  @BeforeDelete()
  public async BeforeReadMethod(req: Request) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));
const decoratorPropsInBetweenDraft = MetadataDispatcher.getMetadataHandlers(newCustomer(CustomerWithDraftInBetween));

describe('Before - Draft', () => {
  describe(`
  @BeforeRead()
  @Draft()`, () => {
    it('It should : mark @BeforeRead() decorator as "draft"', () => {
      const foundEvent = decoratorProps.filter((item) => item.event === 'READ')[0];

      expect(foundEvent.isDraft).toBe(true);
    });
  });

  describe(`
  @BeforeCreate() 
  @BeforeUpdate()
  @BeforeDelete()
  @Draft()`, () => {
    it('It should : mark @BeforeCreate(), @BeforeUpdate, @BeforeDelete() decorators as "draft"', () => {
      const foundCreate = decoratorProps.filter((item) => item.event === 'CREATE')[0];
      const foundDelete = decoratorProps.filter((item) => item.event === 'DELETE')[0];
      const foundUpdate = decoratorProps.filter((item) => item.event === 'UPDATE')[0];

      expect([foundCreate.isDraft, foundDelete.isDraft, foundUpdate.isDraft]).toStrictEqual([true, true, true]);
    });
  });

  describe(`
  @BeforeRead()
  @Draft()
  @BeforeCreate()
  @BeforeUpdate()
  @BeforeDelete()
  `, () => {
    it('It should : mark @BeforeRead() as "draft" and as NO "draft" decorators @BeforeCreate(), @BeforeUpdate(), @BeforeDelete()', () => {
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
