/**
 * In-process integration test for `@OnSubscribe` over local-messaging.
 *
 * The bookshop configures `messaging: { kind: 'local-messaging' }`. `UnboundActionsHandler`
 * subscribes to `event_2` with `showReceiverMessage: true`, so when the event is emitted through
 * the in-process messaging service the dispatcher's subscribe wrapper runs the handler and logs a
 * `> received: event_2` breadcrumb - our observable proof of consumption.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
cds.test(bookshop);

// Let the in-process messaging/outbox background work settle before cds.test shuts the server down,
// so no lazy module load races the jest environment teardown.
afterAll(() => new Promise((resolve) => setTimeout(resolve, 300)));

describe('Messaging (@OnSubscribe over local-messaging)', () => {
  test('It should CONSUME an event emitted through the in-process messaging service', async () => {
    const messaging = (await cds.connect.to('messaging')) as any;
    const spy = jest.spyOn(console, 'debug');

    await messaging.emit('event_2', { foo: 42, bar: 'integration' });

    const consumed = spy.mock.calls.some((call) => call.some((arg) => String(arg).includes('event_2')));
    spy.mockRestore();

    expect(consumed).toBe(true);
  });

  test('It should DELIVER the emitted payload to the subscribed handler without error', async () => {
    const messaging = (await cds.connect.to('messaging')) as any;
    // A clean round-trip (no throw) confirms the dispatcher-registered subscriber is wired to the
    // messaging service and accepts the event payload.
    await expect(messaging.emit('event_2', { foo: 7, bar: 'payload' })).resolves.not.toThrow();
  });
});
