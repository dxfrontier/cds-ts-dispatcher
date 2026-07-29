/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import cds from '@sap/cds';

import {
  BeforeCommit,
  CDSDispatcher,
  EntityHandler,
  OnListening,
  OnServed,
  OnShutdown,
  ServerLifecycle,
  Use,
  UnboundActions,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';
import { MiddlewareEntity1 } from '../../util/middleware/MiddlewareEntity1';

import type { BaseHandler, Constructable } from '../../../lib/types/internalTypes';

const instanceOf = (Handler: Constructable) => new Handler();

const lifecycleHandlersOf = (instance: Constructable): BaseHandler[] =>
  MetadataDispatcher.getMetadataHandlers(instance).filter((item) => item.type === 'SERVER_LIFECYCLE');

describe('SERVER LIFECYCLE', () => {
  describe('metadata', () => {
    test('It should MARK : @ServerLifecycle classes recognizably for the dispatcher', () => {
      @ServerLifecycle()
      class Lifecycle {}

      @UnboundActions()
      class Unbound {}

      expect(MetadataDispatcher.isServerLifecycle(instanceOf(Lifecycle))).toBe(true);
      expect(MetadataDispatcher.isServerLifecycle(instanceOf(Unbound))).toBe(false);
    });

    test('It should RECORD : one SERVER_LIFECYCLE handler per decorated method with the right event', () => {
      @ServerLifecycle()
      class Lifecycle {
        @OnServed()
        public async seed() {}

        @OnListening()
        public logUrl() {}

        @OnShutdown()
        public async cleanup() {}
      }

      const handlers = lifecycleHandlersOf(instanceOf(Lifecycle));
      expect(handlers.map((h) => h.event)).toEqual(['SERVED', 'LISTENING', 'SHUTDOWN']);
      expect(handlers.every((h) => h.eventKind === 'SERVER_LIFECYCLE')).toBe(true);
      expect(handlers.every((h) => h.isDraft === false)).toBe(true);
    });

    test('It should PRESERVE : declaration order in the metadata accumulator', () => {
      @ServerLifecycle()
      class Ordered {
        @OnShutdown()
        public async last() {}

        @OnServed()
        public async first() {}
      }

      expect(lifecycleHandlersOf(instanceOf(Ordered)).map((h) => h.event)).toEqual(['SHUTDOWN', 'SERVED']);
    });
  });

  describe('registration (public bootstrap path)', () => {
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

    afterEach(() => jest.restoreAllMocks());

    test('It should REGISTER : each lifecycle method exactly once via cds.on', () => {
      const onSpy = jest.spyOn(cds as any, 'on');

      @ServerLifecycle()
      class Lifecycle1 {
        @OnServed()
        public async seed() {}

        @OnShutdown()
        public async cleanup() {}
      }

      bootstrap(Lifecycle1);

      const events = onSpy.mock.calls.map((call) => call[0]);
      expect(events).toContain('served');
      expect(events).toContain('shutdown');
      expect(events.filter((e) => e === 'served')).toHaveLength(1);
    });

    test('It should DEDUPE : the same class across two dispatchers registers once per process', () => {
      const onSpy = jest.spyOn(cds as any, 'on');

      @ServerLifecycle()
      class Lifecycle2 {
        @OnListening()
        public logUrl() {}
      }

      bootstrap(Lifecycle2);
      bootstrap(Lifecycle2);

      expect(onSpy.mock.calls.filter((call) => call[0] === 'listening')).toHaveLength(1);
    });

    test('It should BIND : the callback to the resolved instance and pass CAP args through verbatim', () => {
      const onSpy = jest.spyOn(cds as any, 'on');
      const seen: unknown[] = [];

      @ServerLifecycle()
      class Lifecycle3 {
        public marker = 'instance-3';

        @OnServed()
        public async seed(services: unknown) {
          seen.push(this.marker, services);
        }
      }

      bootstrap(Lifecycle3);

      const servedCall = onSpy.mock.calls.find((call) => call[0] === 'served')!;
      const registeredCallback = servedCall[1] as (arg: unknown) => Promise<void>;
      const fakeServices = { CatalogService: {} };
      return (registeredCallback(fakeServices) as Promise<void>).then(() => {
        expect(seen).toEqual(['instance-3', fakeServices]);
      });
    });

    test('It should THROW : when lifecycle decorators sit in a non-@ServerLifecycle class', () => {
      @UnboundActions()
      class WrongHost {
        @OnServed()
        public async seed() {}
      }

      expect(() => bootstrap(WrongHost)).toThrow(/@ServerLifecycle/);
    });

    test('It should THROW : when a @ServerLifecycle class carries foreign handler decorators', () => {
      @ServerLifecycle()
      class ForeignHandlers {
        @OnServed()
        public async seed() {}

        // a request-lifecycle decorator does not belong here
        @BeforeCommit()
        public async invariant() {}
      }

      expect(() => bootstrap(ForeignHandlers)).toThrow(/non-lifecycle/);
    });

    test('It should COEXIST : with an entity handler using @Use middleware in the same dispatcher', () => {
      @ServerLifecycle()
      class Lifecycle4 {
        @OnServed()
        public async seed() {}
      }

      @Use(MiddlewareEntity1)
      @EntityHandler(Book)
      class BookWithMiddleware {}

      expect(() => bootstrap(Lifecycle4, BookWithMiddleware)).not.toThrow();
    });
  });
});
