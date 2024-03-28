/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Request } from '../../../lib/types/types';
import {
  BeforeCreate,
  BeforeDelete,
  BeforeUpdate,
  BeforeCreateDraft,
  BeforeDeleteDraft,
  BeforeReadDraft,
  BeforeUpdateDraft,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { type Constructable } from '@sap/cds/apis/internal/inference';

class Customer {
  @BeforeReadDraft()
  public async BeforeReadMethod(req: Request) {}

  @BeforeCreateDraft()
  @BeforeUpdateDraft()
  @BeforeDeleteDraft()
  public async BeforeCreateAndDeleteMethod(req: Request) {}
}

class CustomerWithDraftInBetween {
  @BeforeReadDraft()
  @BeforeCreate()
  @BeforeUpdate()
  @BeforeDelete()
  public async BeforeReadMethod(req: Request) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(Customer));
const decoratorPropsInBetweenDraft = MetadataDispatcher.getMetadataHandlers(newBook(CustomerWithDraftInBetween));

describe('Before - Draft', () => {
  describe(`
  @BeforeReadDraft()
  `, () => {
    it('It should : mark @BeforeRead() decorator as "draft"', () => {
      const foundEvent = decoratorProps.filter((item) => item.event === 'READ')[0];

      expect(foundEvent.isDraft).toBe(true);
    });
  });

  describe(`
  @BeforeCreateDraft()
  @BeforeUpdateDraft()
  @BeforeDeleteDraft()
  `, () => {
    it('It should : mark @BeforeCreate(), @BeforeUpdate, @BeforeDelete() decorators as "draft"', () => {
      const foundCreate = decoratorProps.filter((item) => item.event === 'CREATE')[0];
      const foundDelete = decoratorProps.filter((item) => item.event === 'DELETE')[0];
      const foundUpdate = decoratorProps.filter((item) => item.event === 'UPDATE')[0];

      expect([foundCreate.isDraft, foundDelete.isDraft, foundUpdate.isDraft]).toStrictEqual([true, true, true]);
    });
  });

  describe(`
  @BeforeReadDraft()
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
