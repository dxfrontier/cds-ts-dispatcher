/**
 * In-process integration tests for the argument / result path of the dispatcher against the real CAP runtime
 * (`@sap/cds` 10), using the self-contained `RobustnessService` fixture
 * (`test/sample-project/bookshop/srv/controller/robustness-service/`).
 *
 * - `@AfterFunction` handlers receive the RAW function result - `null`, strings and numbers included - and a
 *   `null` result never breaks the argument extraction of the handler.
 * - The query parameter decorators (`@GetQuery`, `@IsPresent`, `@IsColumnSupplied`) resolve to
 *   `undefined` / `false` on an unbound action request (which carries no `req.query`), and `@Jwt` resolves to
 *   `undefined` when the request has no HTTP part.
 *
 * Each `@AfterFunction` handler logs `[RobustnessAfter] <function> received=<typeof>:<JSON>`; markers are
 * captured with `jest.spyOn(console, 'log')` directly after the awaited request (after-handlers run inside the
 * request's own dispatch).
 *
 * - A wildcard `@AfterAll`, registered on an `ALL_ENTITIES` host (`RobustnessAfterAllHandler`), also fires for
 *   these unbound functions and must receive the same raw result - it logs `[RobustnessAfterAll]
 *   received=<typeof>:<JSON>`.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

beforeAll(() => new Promise((resolve) => setTimeout(resolve, 1500)));

const robustness = '/odata/v4/robustness';

const MARKER = '[RobustnessAfter]';
const MARKER_ALL = '[RobustnessAfterAll]';

/** Runs `fn` under a console spy and returns the logged markers starting with `prefix` (default `[RobustnessAfter]`). */
const captureMarkers = async (
  fn: () => Promise<unknown>,
  prefix: string = MARKER,
): Promise<{ result: unknown; markers: string[] }> => {
  const spy = jest.spyOn(console, 'log');

  try {
    const result = await fn();
    const markers = spy.mock.calls.map((c) => String(c[0])).filter((line) => line.startsWith(prefix));

    return { result, markers };
  } finally {
    spy.mockRestore();
  }
};

describe('Argument robustness - @After* results of functions', () => {
  test('It should ANSWER 204 (OData: null result) for a function returning null and pass null to its @AfterFunction handler', async () => {
    const { result, markers } = await captureMarkers(() => client.GET(`${robustness}/returnNull()`));

    expect((result as { status: number }).status).toBe(204);
    expect(markers).toEqual([`${MARKER} returnNull received=object:null`]);
  });

  test('It should PASS the raw Integer result 42 to the @AfterFunction handler', async () => {
    const { result, markers } = await captureMarkers(() => client.GET(`${robustness}/returnInteger(value=42)`));

    expect((result as { status: number }).status).toBe(200);
    expect(markers).toEqual([`${MARKER} returnInteger received=number:42`]);
  });

  test('It should PASS the raw Integer result 1 to the @AfterFunction handler (not a boolean)', async () => {
    const { markers } = await captureMarkers(() => client.GET(`${robustness}/returnInteger(value=1)`));

    expect(markers).toEqual([`${MARKER} returnInteger received=number:1`]);
  });

  test('It should ALSO PASS the raw Integer result 1 to an ALL_ENTITIES @AfterAll wildcard handler (not a boolean)', async () => {
    const { markers } = await captureMarkers(() => client.GET(`${robustness}/returnInteger(value=1)`), MARKER_ALL);

    expect(markers).toEqual([`${MARKER_ALL} received=number:1`]);
  });

  test("It should PASS the raw String result 'hi' to the @AfterFunction handler", async () => {
    const { result, markers } = await captureMarkers(() => client.GET(`${robustness}/returnString(value='hi')`));

    expect((result as { status: number }).status).toBe(200);
    expect(markers).toEqual([`${MARKER} returnString received=string:"hi"`]);
  });

  test('It should PASS the raw Decimal result to the @AfterFunction handler', async () => {
    const { result, markers } = await captureMarkers(() => client.GET(`${robustness}/returnDecimal(value=3.14)`));

    expect((result as { status: number }).status).toBe(200);
    expect(markers).toEqual([`${MARKER} returnDecimal received=number:3.14`]);
  });

  test('It should PASS null, 42 and a string unchanged via srv.send', async () => {
    const srv = await cds.connect.to('RobustnessService');

    const { markers } = await captureMarkers(async () => {
      await srv.send('returnNull', {});
      await srv.send('returnInteger', { value: 42 });
      await srv.send('returnString', { value: 'hi' });
    });

    expect(markers).toEqual([
      `${MARKER} returnNull received=object:null`,
      `${MARKER} returnInteger received=number:42`,
      `${MARKER} returnString received=string:"hi"`,
    ]);
  });
});

describe('Argument robustness - query and HTTP parameter decorators without a query / HTTP request', () => {
  const EXPECTED = 'columns=undefined hasWhere=false nameSupplied=false jwt=undefined';

  test('It should RESOLVE @GetQuery to undefined, @IsPresent / @IsColumnSupplied to false for an unbound action over HTTP', async () => {
    const res = await client.POST(`${robustness}/readQueryOptions`, {});

    expect(res.status).toBe(200);
    expect(res.data.value).toBe(EXPECTED);
  });

  test('It should RESOLVE @GetQuery to undefined, @IsPresent / @IsColumnSupplied / @Jwt to false / undefined via srv.send', async () => {
    const srv = await cds.connect.to('RobustnessService');

    const result = await srv.send('readQueryOptions', {});

    expect(result).toBe(EXPECTED);
  });
});
