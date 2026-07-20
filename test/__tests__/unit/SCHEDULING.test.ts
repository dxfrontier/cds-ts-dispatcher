/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { OnScheduled, Schedule, UnboundActions } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';

import type { Constructable, ScheduledHandler } from '../../../lib/types/internalTypes';
import type { BaseHandler } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

@UnboundActions()
class ScheduledTasksHandler {
  @Schedule({ name: 'cleanupExpiredCarts', every: '2m' })
  public async cleanup(req: Request) {}

  @Schedule({ name: 'my.dotted.task.name', every: '0 0 * * *', data: { foo: 'bar' } })
  public async cron(req: Request) {}

  @OnScheduled('CatalogService.reindex.catalog')
  public async reindex(req: Request) {}
}

const instanceOf = (Handler: Constructable) => new Handler();
const handlers = MetadataDispatcher.getMetadataHandlers(instanceOf(ScheduledTasksHandler));

const findByTask = (taskName: string): ScheduledHandler & BaseHandler =>
  handlers.find(
    (item): item is ScheduledHandler & BaseHandler => item.type === 'SCHEDULED' && item.taskName === taskName,
  )!;

describe('SCHEDULING (F4)', () => {
  describe('@Schedule', () => {
    test('It should RECORD : a SCHEDULED handler carrying the schedule options', () => {
      const handler = findByTask('cleanupExpiredCarts');

      expect(handler).toBeDefined();
      expect(handler.type).toBe('SCHEDULED');
      expect(handler.event).toBe('SCHEDULED_EVENT');
      expect(handler.eventKind).toBe('ON');
      expect(handler.isDraft).toBe(false);
      expect(handler.callback).toBeDefined();
      expect(handler.scheduleOptions).toEqual({ name: 'cleanupExpiredCarts', every: '2m' });
    });

    test('It should PRESERVE : dot-containing task names verbatim, incl. cron + data', () => {
      const handler = findByTask('my.dotted.task.name');

      expect(handler).toBeDefined();
      expect(handler.taskName).toBe('my.dotted.task.name');
      expect(handler.scheduleOptions?.every).toBe('0 0 * * *');
      expect(handler.scheduleOptions?.data).toEqual({ foo: 'bar' });
    });
  });

  describe('@OnScheduled', () => {
    test('It should RECORD : a SCHEDULED handler WITHOUT schedule options and a verbatim dotted task name', () => {
      const handler = findByTask('CatalogService.reindex.catalog');

      expect(handler).toBeDefined();
      expect(handler.type).toBe('SCHEDULED');
      expect(handler.event).toBe('SCHEDULED_EVENT');
      expect(handler.taskName).toBe('CatalogService.reindex.catalog');
      expect(handler.scheduleOptions).toBeUndefined();
    });
  });
});
