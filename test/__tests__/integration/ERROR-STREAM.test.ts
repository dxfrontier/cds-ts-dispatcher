/**
 * In-process integration tests for `@OnError` and `@Stream` against the real CAP runtime
 * (fixture: `srv/controller/error-stream-service`).
 *
 * `@OnError` - an error thrown or rejected inside an `@OnError` handler (synchronously, or by its returned
 * promise) is logged by the dispatcher, never rethrown: the client receives the original error response and
 * the service keeps serving. Under jest, a floating rejection fails the running test with the thrown
 * message - so these tests go red on it without a process-level listener.
 *
 * `@Stream` - pipes to the HTTP response only for a root, non-batch HTTP request. A nested `srv.send` gets the
 * `Readable` back. `@Stream` is not supported inside `$batch` - the part is rejected with 400, buffered or
 * streamed; call `@Stream` functions directly instead. Like any other failing part: a multipart `$batch`
 * without `Prefer: odata.continue-on-error` stops processing there (parts queued after it never run), and a
 * JSON atomicity group / changeset containing it fails as a whole.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const base = '/odata/v4/error-stream';

/** Lets pending microtasks and the next macrotask run, so a floating promise rejection is reported. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 50));

/** Bounds a request by a short timeout instead of jest's default one. */
const completesWithin = async <T>(request: Promise<T>, ms = 3000): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`request did not complete within ${ms} ms`)), ms);
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

/** `largeStreamFn()` body: 4096 rows of 50 bytes (200 KiB). */
const LARGE_BODY_BYTES = 4096 * 50;
const FIRST_LARGE_ROW = `row-00000,${'x'.repeat(39)}\n`;
const LAST_LARGE_ROW = `row-04095,${'x'.repeat(39)}\n`;

const STREAM_IN_BATCH = '@Stream is not supported inside $batch';

const multipartBatch = (...urls: string[]): string =>
  urls
    .map(
      (url) =>
        `--batch_1\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nGET ${url} HTTP/1.1\r\n\r\n\r\n`,
    )
    .join('') + '--batch_1--\r\n';

describe('INTEGRATION - @OnError / @Stream', () => {
  describe('@OnError - errors thrown inside the error handler', () => {
    test.each([
      ['synchronously', 'onerror-throws-sync'],
      ['asynchronously', 'onerror-throws-async'],
    ])(
      'It should RETURN the original error response when the @OnError handler throws %s, and keep serving',
      async (_variant, mode) => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        await expect(client.GET(`${base}/failFn(mode='${mode}')`, { auth })).rejects.toMatchObject({
          status: 400,
          response: { data: { error: { message: mode } } },
        });

        await settle();
        const logged = errorSpy.mock.calls.some((call) => String(call[0]).includes('@OnError'));
        errorSpy.mockRestore();

        expect(logged).toBe(true);

        const followUp = await client.GET(`${base}/plainFn()`, { auth });
        expect(followUp.status).toBe(200);
        expect(followUp.data.value).toBe('plain-ok');
      },
    );
  });

  describe('@Stream - root requests only', () => {
    test('It should STREAM a root GET with the declared content type', async () => {
      const res = await client.GET(`${base}/streamFn()`, { auth });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^text\/plain/);
      expect(res.data).toBe('stream-line-1\nstream-line-2');
    });

    test('It should STREAM a large root GET completely', async () => {
      const res = await completesWithin(client.GET(`${base}/largeStreamFn()`, { auth }));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^text\/csv/);
      expect(res.data).toHaveLength(LARGE_BODY_BYTES);
      expect(res.data.startsWith(FIRST_LARGE_ROW)).toBe(true);
      expect(res.data.endsWith(LAST_LARGE_ROW)).toBe(true);
    });

    test.each([
      ['a small', 'streamFn'],
      ['a large', 'largeStreamFn'],
    ])(
      'It should COMPLETE a JSON $batch and REJECT its @Stream part with 400 (%s stream), other parts unaffected',
      async (_size, fn) => {
        const res = await completesWithin(
          client.POST(
            `${base}/$batch`,
            {
              requests: [
                { id: 'stream', method: 'GET', url: `/${fn}()` },
                { id: 'plain', method: 'GET', url: '/plainFn()' },
              ],
            },
            { auth, headers: { 'content-type': 'application/json' } },
          ),
        );

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/^application\/json/);
        expect(res.data.responses).toHaveLength(2);

        const byId = Object.fromEntries(res.data.responses.map((part: { id: string }) => [part.id, part]));
        expect(byId.plain).toMatchObject({ status: 200, body: { value: 'plain-ok' } });
        expect(byId.stream).toMatchObject({ status: 400, body: { error: { message: STREAM_IN_BATCH } } });
      },
    );

    test('It should COMPLETE a multipart $batch and REJECT its large @Stream part with 400', async () => {
      const res = await completesWithin(
        client.POST(`${base}/$batch`, multipartBatch('plainFn()', 'largeStreamFn()'), {
          auth,
          headers: { 'content-type': 'multipart/mixed;boundary=batch_1' },
        }),
      );

      expect(res.status).toBe(200);
      const boundary = /boundary=([^;\s]+)/.exec(res.headers['content-type'])![1];
      const parts = (res.data as string)
        .split(`--${boundary}`)
        .map((part) => part.trim())
        .filter((part) => part && part !== '--');

      expect(parts).toHaveLength(2);
      expect(parts[0]).toContain('HTTP/1.1 200 OK');
      expect(parts[0]).toContain('"value":"plain-ok"');
      expect(parts[1]).toContain('HTTP/1.1 400 Bad Request');
      expect(parts[1]).toContain(`"message":"${STREAM_IN_BATCH}"`);
    });

    test('It should STOP a multipart $batch after its @Stream part fails, never running the parts queued after it', async () => {
      // No `Prefer: odata.continue-on-error` (the default, as UI5 sends it): once the @Stream part is rejected,
      // `@sap/cds` stops processing the remaining parts of the batch instead of running them independently.
      const res = await completesWithin(
        client.POST(`${base}/$batch`, multipartBatch('largeStreamFn()', 'plainFn()'), {
          auth,
          headers: { 'content-type': 'multipart/mixed;boundary=batch_1' },
        }),
      );

      expect(res.status).toBe(200);
      const boundary = /boundary=([^;\s]+)/.exec(res.headers['content-type'])![1];
      const parts = (res.data as string)
        .split(`--${boundary}`)
        .map((part) => part.trim())
        .filter((part) => part && part !== '--');

      expect(parts).toHaveLength(1);
      expect(parts[0]).toContain('HTTP/1.1 400 Bad Request');
      expect(parts[0]).toContain(`"message":"${STREAM_IN_BATCH}"`);
    });

    test('It should RETURN the Readable to a nested srv.send caller instead of writing to the root response', async () => {
      const res = await client.GET(`${base}/nestedStreamFn()`, { auth });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^application\/json/);
      expect(res.data.value).toBe('readable:stream-line-1\nstream-line-2');
    });
  });
});
