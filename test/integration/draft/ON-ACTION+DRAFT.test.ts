import { Request } from '@sap/cds';
import { OnBoundAction, OnBoundFunction } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/util/helpers/MetadataDispatcher';
import { Constructable } from '@sap/cds/apis/internal/inference';
import { submitOrder } from '../../bookshop/srv/util/types/entities/CatalogService';
import { OnBoundActionDraft, OnBoundFunctionDraft } from '../../../lib';

class Customer {
  @OnBoundActionDraft(submitOrder)
  public async BeforeReadMethod(req: Request, next: Function) {}

  @OnBoundFunctionDraft(submitOrder)
  public async BeforeCreateAndDeleteMethod(req: Request, next: Function) {}
}

const newCustomer = (customer: Constructable) => new customer();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newCustomer(Customer));

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
