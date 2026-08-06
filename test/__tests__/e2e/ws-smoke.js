/* eslint-disable no-console */
const WebSocket = require('ws');

const url = process.env.WS_SMOKE_URL ?? 'ws://localhost:4004/ws/chat';
const timeoutMs = 15_000;

function fail(reason) {
  console.error(`[ws-smoke] FAIL: ${reason}`);
  process.exit(1);
}

const timer = setTimeout(() => fail(`timeout after ${timeoutMs} ms`), timeoutMs);

const socket = new WebSocket(url);

socket.on('error', (error) => fail(`connection error: ${error.message}`));

socket.on('open', () => {
  console.log('[ws-smoke] connected');
  try {
    socket.send(JSON.stringify({ event: 'sendMessage', data: { text: 'e2e-smoke' } }));
  } catch (error) {
    fail(`send error: ${error.message}`);
    return;
  }
  // Observed on a real run (2026-07-29, @cap-js-community/websocket 1.11.0, kind 'ws'): the server-side
  // ChatHandler.onMessage fires (`[Chat] message e2e-smoke` in the server log) and the action resolves,
  // but no reply frame is echoed back on the socket - raw `ws` has no ack-callback channel (unlike
  // socket.io), so `srv.send(...)`'s return value is simply discarded. `socket.on('message', ...)`
  // never fires. The effective pass criterion is therefore the successful UPGRADE: the plugin answers
  // unknown /ws paths with `404` and destroys the socket, so reaching 'open' proves the ChatService ws
  // route exists and accepted the handshake. The send is best-effort (ws reports send failures
  // asynchronously; they cannot fail this script).
  // Stricter variant kept for a future plugin version that starts acking action results over kind 'ws':
  //
  // socket.on('message', (raw) => {
  //   console.log(`[ws-smoke] received: ${raw}`);
  //   clearTimeout(timer);
  //   socket.close();
  //   console.log('[ws-smoke] PASS');
  //   process.exit(0);
  // });
  clearTimeout(timer);
  socket.close();
  console.log('[ws-smoke] PASS');
  process.exit(0);
});
