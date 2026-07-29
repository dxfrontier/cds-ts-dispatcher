/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { CDSDispatcher, OnScheduledFailure, OnScheduledSuccess, Req, Result, UnboundActions } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';

import type { BaseHandler, Constructable, ScheduledOutcomeHandler } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

const TASK = 'my.namespace.Task';

/**
 * The failure CAP hands to a `'<task>/#failed'` handler: `_errorToObj(error)` survives a `JSON` round-trip
 * through the queued callback task, so it arrives as a plain object and NOT as an `Error` instance.
 */
const SERIALIZED_FAILURE = {
  name: 'Error',
  message: 'task blew up',
  stack: 'Error: task blew up\n    at Object.<anonymous>',
  code: 'ERR_TASK',
};

@UnboundActions()
class ScheduledTasksOutcomeHandler {
  public capturedResult: unknown = 'NOT_SET';
  public capturedFailure: unknown = 'NOT_SET';

  @OnScheduledSuccess(TASK)
  public async onSuccess(@Result() result: unknown, @Req() req: Request) {
    this.capturedResult = result;
  }

  @OnScheduledFailure(TASK)
  public async onFailure(@Result() failure: { message?: string }, @Req() req: Request) {
    this.capturedFailure = failure;
  }
}

const instanceOf = (Handler: Constructable) => new Handler();

const findByEvent = (instance: Constructable, event: 'SCHEDULED_SUCCESS' | 'SCHEDULED_FAILURE'): BaseHandler =>
  MetadataDispatcher.getMetadataHandlers(instance).find(
    (item): item is ScheduledOutcomeHandler & BaseHandler => item.type === 'SCHEDULED_OUTCOME' && item.event === event,
  )!;

// A request-like object recognized by `parameterUtil.extractArguments` (via the `isMsgEvent` keys).
const buildReq = () => ({ inbound: {}, event: TASK, data: {}, headers: {} });

/** Minimal service seam capturing every `srv.after(...)` registration. */
const registerOutcomeOf = (handler: BaseHandler, instance: Constructable) => {
  const after = jest.fn();
  const dispatcher: any = new CDSDispatcher([ScheduledTasksOutcomeHandler]);

  dispatcher.srv = { after };
  dispatcher['registerAfterHandler']([handler, instance]);

  return { after, callback: after.mock.calls[0][1] as (data: unknown, req: unknown) => Promise<unknown> };
};

describe('SCHEDULED OUTCOME', () => {
  describe('metadata', () => {
    test('It should RECORD : a SCHEDULED_OUTCOME handler for the @OnScheduledSuccess decorator', () => {
      const handler = findByEvent(instanceOf(ScheduledTasksOutcomeHandler), 'SCHEDULED_SUCCESS');

      expect(handler).toBeDefined();
      expect(handler.type).toBe('SCHEDULED_OUTCOME');
      expect(handler.event).toBe('SCHEDULED_SUCCESS');
      expect(handler.eventKind).toBe('AFTER');
      expect(handler.isDraft).toBe(false);
      expect(handler.callback).toBeDefined();
    });

    test('It should RECORD : a SCHEDULED_OUTCOME handler for the @OnScheduledFailure decorator', () => {
      const handler = findByEvent(instanceOf(ScheduledTasksOutcomeHandler), 'SCHEDULED_FAILURE');

      expect(handler).toBeDefined();
      expect(handler.type).toBe('SCHEDULED_OUTCOME');
      expect(handler.event).toBe('SCHEDULED_FAILURE');
      expect(handler.eventKind).toBe('AFTER');
      expect(handler.isDraft).toBe(false);
      expect(handler.callback).toBeDefined();
    });

    test('It should PRESERVE : the dot-containing task name verbatim', () => {
      const instance = instanceOf(ScheduledTasksOutcomeHandler);

      expect((findByEvent(instance, 'SCHEDULED_SUCCESS') as ScheduledOutcomeHandler).taskName).toBe(TASK);
      expect((findByEvent(instance, 'SCHEDULED_FAILURE') as ScheduledOutcomeHandler).taskName).toBe(TASK);
    });
  });

  describe('registration', () => {
    test('It should REGISTER : the composed `<task>/#succeeded` event name', () => {
      const instance = instanceOf(ScheduledTasksOutcomeHandler);
      const { after } = registerOutcomeOf(findByEvent(instance, 'SCHEDULED_SUCCESS'), instance);

      expect(after).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledWith('my.namespace.Task/#succeeded', expect.any(Function));
    });

    test('It should REGISTER : the composed `<task>/#failed` event name', () => {
      const instance = instanceOf(ScheduledTasksOutcomeHandler);
      const { after } = registerOutcomeOf(findByEvent(instance, 'SCHEDULED_FAILURE'), instance);

      expect(after).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledWith('my.namespace.Task/#failed', expect.any(Function));
    });

    test('It should PASS : the RAW task result to the handler (no `affected` normalization)', async () => {
      const instance = instanceOf(ScheduledTasksOutcomeHandler);
      const { callback } = registerOutcomeOf(findByEvent(instance, 'SCHEDULED_SUCCESS'), instance);

      await callback(42, buildReq());
      expect(instance.capturedResult).toBe(42);

      // The `@After*` normalization would turn a numeric `1` into `true` - scheduled outcomes bypass it.
      await callback(1, buildReq());
      expect(instance.capturedResult).toBe(1);
    });

    test('It should PASS : the SERIALIZED task failure (a plain object, not an Error) via the results slot', async () => {
      const instance = instanceOf(ScheduledTasksOutcomeHandler);
      const { callback } = registerOutcomeOf(findByEvent(instance, 'SCHEDULED_FAILURE'), instance);

      await callback(SERIALIZED_FAILURE, buildReq());

      // Routed to '@Result()' (the results slot) - '@Error()' would stay undefined for a plain object.
      expect(instance.capturedFailure).toBe(SERIALIZED_FAILURE);
      expect(instance.capturedFailure).not.toBeInstanceOf(Error);
      expect((instance.capturedFailure as { message: string }).message).toBe('task blew up');
    });
  });
});
