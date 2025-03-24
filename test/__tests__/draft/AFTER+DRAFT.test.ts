/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EntityHandler, Request } from '../../../lib/index';
import {
  AfterCreate,
  AfterDelete,
  AfterUpdate,
  AfterCreateDraft,
  AfterDeleteDraft,
  AfterReadDraft,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';
import { Constructable } from '../../../lib/types/internalTypes';

@EntityHandler(Book)
class BookHandler {
  @AfterReadDraft()
  public async afterReadMethod(results: Book[], req: Request) {}

  @AfterUpdate()
  @AfterCreateDraft()
  @AfterDeleteDraft()
  public async afterCreateAndDeleteMethod(results: Book[] | Book, req: Request) {}
}

class CustomerWithDraftInBetween {
  @AfterReadDraft()
  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  public async afterReadMethod(results: Book[] | Book, req: Request) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));
const decoratorPropsInBetweenDraft = MetadataDispatcher.getMetadataHandlers(newBook(CustomerWithDraftInBetween));

describe('AFTER - Draft', () => {
  describe(`
  @AfterReadDraft()
  `, () => {
    it('It should : mark @AfterReadDraft() decorator as "draft" ', () => {
      const foundEvent = decoratorProps.filter((item) => item.event === 'READ')[0];

      expect(foundEvent.isDraft).toBe(true);
    });
  });

  describe(`
  @AfterUpdate()
  @AfterCreateDraft() 
  @AfterDeleteDraft()`, () => {
    it('It should : mark @AfterCreateDraft(), @AfterReadDraft(), @AfterDeleteDraft() decorators as "draft" and no draft the decorator @AfterUpdate()', () => {
      const foundUpdate = decoratorProps.filter((item) => item.event === 'UPDATE')[0];
      const foundCreate = decoratorProps.filter((item) => item.event === 'CREATE')[0];
      const foundDelete = decoratorProps.filter((item) => item.event === 'DELETE')[0];

      expect([foundUpdate.isDraft, foundCreate.isDraft, foundDelete.isDraft]).toStrictEqual([false, true, true]);
    });
  });

  describe(`
  @AfterReadDraft()
  @AfterCreate()
  @AfterUpdate()
  @AfterDelete()
  `, () => {
    it('It should : mark @AfterReadDraft() as "draft" and as NO "draft" decorators @AfterCreate(), @AfterUpdate(), @AfterDelete()', () => {
      const foundRead = decoratorPropsInBetweenDraft.filter((item) => item.event === 'READ')[0];
      const foundCreate = decoratorPropsInBetweenDraft.filter((item) => item.event === 'CREATE')[0];
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
