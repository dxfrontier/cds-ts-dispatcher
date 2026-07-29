import path from 'node:path';
import cds from '@sap/cds';
import WebSocket from 'ws';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const logSpy = jest.spyOn(console, 'log');
const client = cds.test(bookshop) as any;

const basicAuth = 'Basic ' + Buffer.from('manager:manager').toString('base64');

const markersOf = (): string[] => logSpy.mock.calls.map((c) => c.map(String).join(' '));

const waitFor = async (predicate: () => boolean, timeoutMs = 8000, stepMs = 100): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return predicate();
};

const connect = (): Promise<WebSocket> =>
  new Promise((resolve, reject) => {
    const wsUrl = `${String(client.url).replace(/^http/, 'ws')}/ws/chat`;
    const socket = new WebSocket(wsUrl, { headers: { authorization: basicAuth } });
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });

describe('INTEGRATION - websocket decorators', () => {
  test('It should FIRE : @OnWebSocketConnect on connect', async () => {
    const socket = await connect();
    expect(await waitFor(() => markersOf().some((m) => m.includes('[Chat] connect')))).toBe(true);
    socket.close();
  });

  test('It should FIRE : @OnWebSocketMessage with the payload of sendMessage', async () => {
    const socket = await connect();
    socket.send(JSON.stringify({ event: 'sendMessage', data: { text: 'hello-ws' } }));
    expect(await waitFor(() => markersOf().some((m) => m.includes('[Chat] message hello-ws')))).toBe(true);
    socket.close();
  });

  test('It should FIRE : @OnWebSocketDisconnect on close', async () => {
    const socket = await connect();
    socket.close();
    expect(await waitFor(() => markersOf().some((m) => m.includes('[Chat] disconnect')))).toBe(true);
  });
});
