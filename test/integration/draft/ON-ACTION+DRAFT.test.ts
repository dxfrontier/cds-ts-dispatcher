/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EntityHandler, Request } from '../../../lib/index';
import { OnBoundActionDraft, OnBoundFunctionDraft } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Book, submitOrder } from '../../bookshop/@cds-models/CatalogService';
import { Constructable } from '../../../lib/types/internalTypes';

@EntityHandler(Book)
class BookHandler {
  @OnBoundActionDraft(submitOrder)
  public async BeforeReadMethod(req: Request, next: Function) {}

  @OnBoundFunctionDraft(submitOrder)
  public async BeforeCreateAndDeleteMethod(req: Request, next: Function) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

describe('ON - Draft', () => {
  describe(`
  @OnBoundAction(testFn)
  `, () => {
    it('It should : mark @OnBoundAction(testFn) decorator as "draft"', () => {
      const found = decoratorProps.filter((item) => item.event === 'BOUND_ACTION')[0];

      expect(found.isDraft).toBe(true);
    });
  });

  describe(`
  @OnBoundFunction(testFn)
  `, () => {
    it('It should : mark @OnBoundFunction(testFn) decorator as "draft"', () => {
      const found = decoratorProps.filter((item) => item.event === 'BOUND_FUNC')[0];

      expect(found.isDraft).toBe(true);
    });
  });
});
