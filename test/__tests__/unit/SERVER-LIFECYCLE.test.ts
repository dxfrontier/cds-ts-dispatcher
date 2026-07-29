/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { OnListening, OnServed, OnShutdown, ServerLifecycle, UnboundActions } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';

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
});
