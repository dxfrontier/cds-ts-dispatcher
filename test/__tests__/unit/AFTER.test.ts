/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';
import cds from '@sap/cds';

import type { BaseHandler, Constructable } from '../../../lib/types/internalTypes';

import {
  Affected,
  AfterAction,
  AfterAll,
  AfterBoundAction,
  AfterBoundFunction,
  AfterCreate,
  AfterDelete,
  AfterFunction,
  AfterRead,
  AfterReadDraft,
  AfterUpdate,
  CDS_DISPATCHER,
  CDSDispatcher,
  EntityHandler,
  OnScheduledSuccess,
  Req,
  Result,
  Results,
  UnboundActions,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { CRUD_EVENTS, Request } from '../../../lib/types/types';

@EntityHandler(Book)
class BookHandler {
  @AfterCreate()
  public async afterCreateMethod(result: Book, req: Request<Book>) {}

  @AfterRead()
  public async afterReadMethod(results: Book[], req: Request<Book>) {}

  @AfterUpdate()
  public async afterUpdateMethod(result: Book, req: Request<Book>) {}

  @AfterDelete()
  public async afterDeleteMethod(deleted: boolean, req: Request<Book>) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

describe('BEFORE - Active entity', () => {
  function testEvent(event: CRUD_EVENTS, eventName: string) {
    describe(`@${eventName}`, () => {
      test(`It should RETURN : all defined properties for this @${eventName} decorator`, () => {
        const foundEvent = decoratorProps.filter((item) => item.event === event)[0];

        expect(foundEvent.callback).toBeDefined();
        expect(foundEvent.event).toBe(event);
        expect(foundEvent.isDraft).toBe(false);
      });
    });
  }

  testEvent('CREATE', 'AfterCreate');
  testEvent('READ', 'AfterRead');
  testEvent('UPDATE', 'AfterUpdate');
  testEvent('DELETE', 'AfterDelete');
});

// ============================================================================================================
// CDSDispatcher.executeAfterCallback - result handed to the @After* handler
// ============================================================================================================

@EntityHandler(Book)
class ResultCaptureHandler {
  public captured: unknown = 'NOT_SET';
  public capturedAffected: unknown = 'NOT_SET';

  @AfterRead()
  public async afterRead(@Results() results: unknown, @Req() req: Request) {
    this.captured = results;
  }

  @AfterDelete()
  public async afterDelete(@Result() deleted: unknown, @Affected() affected: unknown, @Req() req: Request) {
    this.captured = deleted;
    this.capturedAffected = affected;
  }

  @AfterCreate()
  public async afterCreate(@Result() result: unknown, @Req() req: Request) {
    this.captured = result;
  }

  @AfterReadDraft()
  public async afterReadDraft(@Results() results: unknown, @Req() req: Request) {
    this.captured = results;
  }

  @AfterBoundFunction('boundFunction')
  public async afterBoundFunction(@Result() result: unknown, @Req() req: Request) {
    this.captured = result;
  }

  @AfterBoundAction('boundAction')
  public async afterBoundAction(@Result() result: unknown, @Req() req: Request) {
    this.captured = result;
  }
}

// `@AfterAll` registers a WILDCARD `srv.after('*', <entity>, ...)`, which CAP also invokes for bound
// actions/functions on the host entity - the handler's OWN event is `'*'`, not `BOUND_ACTION`/`BOUND_FUNC`.
@EntityHandler(Book)
class WildcardResultCaptureHandler {
  public captured: unknown = 'NOT_SET';
  public capturedAffected: unknown = 'NOT_SET';

  @AfterAll()
  public async afterAll(@Result() result: unknown, @Affected() affected: unknown, @Req() req: Request) {
    this.captured = result;
    this.capturedAffected = affected;
  }
}

// On an `ALL_ENTITIES` host, CAP drops the path filter for `'*'` entirely, so the same wildcard `@AfterAll`
// also reaches UNBOUND actions/functions.
@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)
class AllEntitiesResultCaptureHandler {
  public captured: unknown = 'NOT_SET';

  @AfterAll()
  public async afterAll(@Result() result: unknown, @Req() req: Request) {
    this.captured = result;
  }
}

@UnboundActions()
class UnboundResultCaptureHandler {
  public captured: unknown = 'NOT_SET';
  public capturedAffected: unknown = 'NOT_SET';

  @AfterFunction('unboundFunction')
  public async afterFunction(@Result() result: unknown, @Affected() affected: unknown, @Req() req: Request) {
    this.captured = result;
    this.capturedAffected = affected;
  }

  @AfterAction('unboundAction')
  public async afterAction(@Result() result: unknown, @Req() req: Request) {
    this.captured = result;
  }

  @OnScheduledSuccess('my.Task')
  public async onScheduledSuccess(@Result() result: unknown, @Req() req: Request) {
    this.captured = result;
  }
}

type CaptureInstance = { captured: unknown; capturedAffected: unknown };

const findHandler = (instance: object, predicate: (handler: BaseHandler) => boolean): BaseHandler =>
  MetadataDispatcher.getMetadataHandlers(instance as Constructable).find(predicate)!;

/** Invokes `CDSDispatcher.executeAfterCallback` exactly as the registered `srv.after` callbacks do. */
const runAfter = async (
  instance: object,
  predicate: (handler: BaseHandler) => boolean,
  req: Request,
  results: unknown,
): Promise<void> => {
  const dispatcher: any = new CDSDispatcher([ResultCaptureHandler]);

  await dispatcher.executeAfterCallback([findHandler(instance, predicate), instance], req, results);
};

const buildRequest = (event: string, data: object = {}): Request =>
  new cds.Request({ event, data }) as unknown as Request;

const byEvent =
  (event: string, isDraft = false) =>
  (handler: BaseHandler): boolean =>
    handler.event === event && handler.isDraft === isDraft;

describe('AFTER - result handed to the handler', () => {
  describe('action / function results pass through untouched', () => {
    test.each([
      ['FUNC', 42],
      ['FUNC', 1],
      ['FUNC', 'hi'],
      ['FUNC', null],
      ['ACTION', 42],
      ['ACTION', 1],
      ['ACTION', 'hi'],
      ['ACTION', null],
    ])('It should PASS : the raw %s result %p to the unbound @After* handler', async (event, value) => {
      const instance = new UnboundResultCaptureHandler();

      await runAfter(instance, byEvent(event), buildRequest('unboundFunction'), value);

      expect(instance.captured).toBe(value);
    });

    test.each([
      ['BOUND_FUNC', 42],
      ['BOUND_FUNC', 1],
      ['BOUND_FUNC', 'hi'],
      ['BOUND_FUNC', null],
      ['BOUND_ACTION', 42],
      ['BOUND_ACTION', 1],
      ['BOUND_ACTION', 'hi'],
      ['BOUND_ACTION', null],
    ])('It should PASS : the raw %s result %p to the bound @After* handler', async (event, value) => {
      const instance = new ResultCaptureHandler();

      await runAfter(instance, byEvent(event), buildRequest('boundFunction'), value);

      expect(instance.captured).toBe(value);
    });

    test('It should NOT STASH : a numeric function result as the @Affected row count', async () => {
      const instance: CaptureInstance = new UnboundResultCaptureHandler();

      await runAfter(instance, byEvent('FUNC'), buildRequest('unboundFunction'), 1);

      expect(instance.captured).toBe(1);
      expect(instance.capturedAffected).toBeUndefined();
    });
  });

  describe('a wildcard @AfterAll / @AfterAllDraft passes action or function results through unchanged', () => {
    test.each([
      [42, 42],
      [1, 1],
    ])(
      'It should PASS : the raw bound-function result %p through an entity-scoped @AfterAll (not CRUD-normalized)',
      async (value, expected) => {
        const instance = new WildcardResultCaptureHandler();
        const req = new cds.Request({
          event: 'boundFunction',
          target: { actions: { boundFunction: {} } },
        }) as unknown as Request;

        await runAfter(instance, byEvent('*'), req, value);

        expect(instance.captured).toBe(expected);
        expect(instance.capturedAffected).toBeUndefined();
      },
    );

    test('It should PASS : the raw unbound-function result 1 through an ALL_ENTITIES @AfterAll (not CRUD-normalized)', async () => {
      const instance = new AllEntitiesResultCaptureHandler();
      const dispatcher: any = new CDSDispatcher([AllEntitiesResultCaptureHandler]);
      dispatcher.srv = { actions: { unboundFunction: {} } };

      const handler = findHandler(instance, byEvent('*'));
      const req = new cds.Request({ event: 'unboundFunction' }) as unknown as Request;

      await dispatcher.executeAfterCallback([handler, instance], req, 1);

      expect(instance.captured).toBe(1);
    });

    test.each([[1], [Object.assign([], { affected: 1 })]])(
      'It should NORMALIZE : a wildcard @AfterAll CRUD (DELETE) result %p to true and stash @Affected 1 (not treated as an operation)',
      async (results) => {
        const instance = new WildcardResultCaptureHandler();
        const dispatcher: any = new CDSDispatcher([WildcardResultCaptureHandler]);
        dispatcher.srv = { actions: { unboundFunction: {} } };

        const handler = findHandler(instance, byEvent('*'));
        const req = new cds.Request({
          event: 'DELETE',
          data: { ID: 1 },
          target: { actions: { boundFunction: {} } },
        }) as unknown as Request;

        await dispatcher.executeAfterCallback([handler, instance], req, results);

        expect(instance.captured).toBe(true);
        expect(instance.capturedAffected).toBe(1);
      },
    );
  });

  describe('null results', () => {
    test('It should PASS : null to a plain @AfterRead handler', async () => {
      const instance = new ResultCaptureHandler();

      await runAfter(instance, byEvent('READ'), buildRequest('READ'), null);

      expect(instance.captured).toBeNull();
    });

    test('It should PASS : null to a draft @AfterReadDraft handler', async () => {
      const instance = new ResultCaptureHandler();

      await runAfter(instance, byEvent('READ', true), buildRequest('READ'), null);

      expect(instance.captured).toBeNull();
    });

    test('It should PASS : null to an @OnScheduledSuccess handler', async () => {
      const instance = new UnboundResultCaptureHandler();
      const dispatcher: any = new CDSDispatcher([UnboundResultCaptureHandler]);
      const handler = findHandler(instance, byEvent('SCHEDULED_SUCCESS'));

      await dispatcher.executeScheduledOutcomeCallback([handler, instance], buildRequest('my.Task'), null);

      expect(instance.captured).toBeNull();
    });
  });

  describe('CRUD normalization (regression)', () => {
    test('It should PASS : true and the @Affected count 1, for a DELETE result array with `affected` 1', async () => {
      const instance = new ResultCaptureHandler();
      const results = Object.assign([], { affected: 1 });

      await runAfter(instance, byEvent('DELETE'), buildRequest('DELETE', { ID: 1 }), results);

      expect(instance.captured).toBe(true);
      expect(instance.capturedAffected).toBe(1);
    });

    test('It should PASS : req.data, for a CREATE result array with `affected`', async () => {
      const instance = new ResultCaptureHandler();
      const data = { ID: 7, title: 'Dracula' };
      const results = Object.assign([], { affected: 1 });

      await runAfter(instance, byEvent('CREATE'), buildRequest('CREATE', data), results);

      expect(instance.captured).toEqual({ ID: 7, title: 'Dracula' });
    });

    test('It should PASS : true, for a numeric DELETE result 1', async () => {
      const instance = new ResultCaptureHandler();

      await runAfter(instance, byEvent('DELETE'), buildRequest('DELETE', { ID: 1 }), 1);

      expect(instance.captured).toBe(true);
    });
  });
});
