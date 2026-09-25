/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterUpdate,
  CDSDispatcher,
  EntityHandler,
  OnAction,
  Req,
  UnboundActions,
  Use,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';
import { MiddlewareMethodAfterRead1 } from '../../util/middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../../util/middleware/MiddlewareAfterRead2';
import { MiddlewareEntity1 } from '../../util/middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../util/middleware/MiddlewareEntity2';

import type { CRUD_EVENTS, Request } from '../../../lib/types/types';
import type { Constructable } from '../../../lib/types/internalTypes';

@EntityHandler(Book)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookHandler {
  @AfterCreate()
  public async afterCreateMethod(result: Book, req: Request<Book>) {}

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
  public async afterReadMethod(results: Book[], req: Request<Book>) {}

  @AfterUpdate()
  public async afterUpdateMethod(result: Book, req: Request<Book>) {}

  @AfterDelete()
  public async afterDeleteMethod(deleted: boolean, req: Request<Book>) {}
}

const newBook = (Book: Constructable) => new Book();
const decoratorProps = MetadataDispatcher.getMetadataHandlers(newBook(BookHandler));

// Pretty difficult to unit test the middleware !!!!

describe('MIDDLEWARE', () => {
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

describe('MIDDLEWARE - class-level @Use registration', () => {
  /** Stand-ins for CDS-Typer entity classes: only `name` and, when draft-enabled, `drafts.name` are read. */
  class DraftDocuments {}
  Object.defineProperty(DraftDocuments, 'name', { value: 'TestService.Documents' });
  Object.defineProperty(DraftDocuments, 'drafts', { value: { name: 'TestService.Documents.drafts' } });

  class PlainNotes {}
  Object.defineProperty(PlainNotes, 'name', { value: 'TestService.Notes' });

  const bootstrap = (...Handlers: Constructable[]) => {
    const dispatcher = new CDSDispatcher(Handlers as never);
    const impl = dispatcher.initialize() as unknown as (srv: unknown) => void;
    const srv = {
      prepend: jest.fn((callback: () => void) => callback()),
      before: jest.fn(),
      after: jest.fn(),
      on: jest.fn(),
      handlers: { before: [] as unknown[] },
    };
    impl(srv);
    return srv;
  };

  /** The `[event, entity]` pairs of every `srv.before(event, entity, handler)` registration. */
  const beforeTargets = (srv: { before: jest.Mock }) =>
    srv.before.mock.calls.filter((call) => call.length === 3).map((call) => [call[0], call[1]]);

  test('It should REGISTER : the chain on the active entity AND its drafts, for a draft-enabled entity', () => {
    @EntityHandler(DraftDocuments as never)
    @Use(MiddlewareEntity1)
    class DraftHandler {
      @AfterRead()
      public async afterRead(results: unknown[], req: Request) {}
    }

    const srv = bootstrap(DraftHandler);

    expect(beforeTargets(srv)).toEqual([
      ['*', 'TestService.Documents'],
      ['*', 'TestService.Documents.drafts'],
    ]);
  });

  test('It should REGISTER : the chain once on the entity, for a non-draft entity', () => {
    @EntityHandler(PlainNotes as never)
    @Use(MiddlewareEntity1)
    class PlainHandler {
      @AfterRead()
      public async afterRead(results: unknown[], req: Request) {}
    }

    const srv = bootstrap(PlainHandler);

    expect(beforeTargets(srv)).toEqual([['*', 'TestService.Notes']]);
  });

  test('It should REGISTER : the chain for a class with class-level @Use and no handler methods', () => {
    @EntityHandler(DraftDocuments as never)
    @Use(MiddlewareEntity1)
    class MiddlewareOnlyHandler {}

    const srv = bootstrap(MiddlewareOnlyHandler);

    expect(beforeTargets(srv)).toEqual([
      ['*', 'TestService.Documents'],
      ['*', 'TestService.Documents.drafts'],
    ]);
  });

  test('It should REGISTER : nothing for a class without handler methods and without @Use', () => {
    @EntityHandler(PlainNotes as never)
    class EmptyHandler {}

    const srv = bootstrap(EmptyHandler);

    expect(srv.before).not.toHaveBeenCalled();
  });

  test('It should WRAP : unbound actions by action name only, never an entity', () => {
    @UnboundActions()
    @Use(MiddlewareEntity1)
    class ActionsHandler {
      @OnAction('TestService.ping')
      public async ping(@Req() req: Request) {
        return req;
      }
    }

    const srv = bootstrap(ActionsHandler);
    const middlewareRegistrations = srv.before.mock.calls.filter((call) => call.length === 2).map((call) => call[0]);

    expect(beforeTargets(srv)).toEqual([]);
    expect(middlewareRegistrations).toEqual(['TestService.ping']);
  });
});
