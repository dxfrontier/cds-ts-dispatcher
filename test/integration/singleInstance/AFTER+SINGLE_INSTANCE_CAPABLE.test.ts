/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Request } from '../../../lib/types/types';
import { AfterCreate, AfterDelete, AfterRead, AfterUpdate, EntityHandler, SingleInstanceCapable } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { type Constructable } from '@sap/cds/apis/internal/inference';
import { Book } from '../../bookshop/@cds-models/CatalogService';

@EntityHandler(Book)
class Customer {
  @AfterRead()
  @SingleInstanceCapable()
  public async afterReadMethod(results: Book[], req: Request, isSingleInstance: boolean) {}

  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  @SingleInstanceCapable()
  public async afterCreateAndDeleteMethod(results: Book[] | Book, req: Request, isSingleInstance: boolean) {}
}

class CustomerWithDraftInBetween {
  @AfterRead()
  @SingleInstanceCapable()
  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  public async afterReadMethod(results: Book[] | Book, req: Request, isSingleInstance: boolean) {}
}

const newCustomer = (Customer: Constructable) => new Customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));
const decoratorPropsInBetweenDraft = MetadataDispatcher.getMetadataHandlers(newCustomer(CustomerWithDraftInBetween));

describe('AFTER - Single instance capable', () => {
  describe(`
  @AfterRead()
  @SingleInstanceCapable()`, () => {
    it('It should : mark @AfterRead() decorator as "single instance"', () => {
      const foundEvent = decoratorProps.filter((item) => item.event === 'READ')[0];

      expect(foundEvent.isSingleInstance).toBe(true);
    });
  });

  describe(`
  @AfterCreate() 
  @AfterUpdate()
  @AfterDelete()
  @SingleInstanceCapable()`, () => {
    it('It should : mark @AfterCreate(), @AfterUpdate(), @AfterDelete() decorators as "single instance"', () => {
      const foundCreate = decoratorProps.filter((item) => item.event === 'CREATE')[0];
      const foundDelete = decoratorProps.filter((item) => item.event === 'DELETE')[0];
      const foundUpdate = decoratorProps.filter((item) => item.event === 'UPDATE')[0];

      expect([foundCreate.isSingleInstance, foundDelete.isSingleInstance, foundUpdate.isSingleInstance]).toStrictEqual([
        true,
        true,
        true,
      ]);
    });
  });

  describe(`
  @AfterRead()
  @SingleInstanceCapable()
  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  `, () => {
    it('It should : mark @AfterRead() as "single instance" and as NO "single instance" decorators @AfterCreate(), @AfterUpdate(), @AfterDelete()', async () => {
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
    });
  });
});
