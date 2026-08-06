# Decorator Batch 2 Implementation Plan — @Throttle · @ServerLifecycle · WebSocket family

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three decorator families — `@Throttle({limit,window,by})` rate limiting, `@ServerLifecycle` + `@OnServed`/`@OnListening`/`@OnShutdown` server hooks, and `@OnWebSocketConnect`/`@OnWebSocketDisconnect`/`@OnWebSocketMessage` sugar — with unit, integration, and e2e coverage plus README/backlog updates.

**Architecture:** All three follow the repo's invariant: decorators only write metadata (via `MetadataDispatcher`) or wrap descriptors at decoration time; all runtime registration happens once in `CDSDispatcher.initialize()`. `@Throttle` is a descriptor-wrapper (like `@ExecutionAllowedForRole`); the lifecycle family adds a fifth host class registering through `cds.on(...)` instead of `srv.*`; the ws family reuses the existing `buildOnEvent` ON-machinery verbatim.

**Tech Stack:** TypeScript legacy decorators + reflect-metadata, inversify, `@sap/cds` 10.0.3 (peer), jest + ts-jest, `@cap-js/cds-test`, newman/Postman, `@cap-js-community/websocket` 1.11.x (bookshop fixture only), `ws` client (root devDep, tests only).

**Design spec:** `docs/superpowers/specs/2026-07-29-decorator-batch2-design.md` (approved 2026-07-29).

## Global Constraints

- Branch: `feature-batch2-decorators` (already created, stacked on `feature-tier1-decorators`). Conventional commits; husky pre-commit runs eslint/prettier/related unit tests on staged files.
- Legacy decorators only (`experimentalDecorators` + `emitDecoratorMetadata`); never TC39 decorators.
- Decorators do no work at decoration time beyond metadata writes, descriptor wrapping, and validation. Registration only in `CDSDispatcher.initialize()`.
- **Synchronous-prefix rule (hard):** CAP runs same-phase sibling handlers via `Promise.all`; only the synchronous prefix of a callback is ordered. Never insert an unconditional `await` ahead of the user's handler body. Follow the existing conditional-await idiom: `const applied = …; if (applied) await applied;`.
- **Callback-capture rule (hard):** handler factories store `callback: descriptor.value` into metadata at their own decoration time. A wrapper decorator is only part of the runtime path if it wraps **before** the handler factory runs — i.e. the wrapper must sit **below** the handler decorator (closer to the method). This is how `@ExecutionAllowedForRole`/`@CatchAndSetErrorCode` already work. `@Throttle` follows the same rule and its docs must say so.
- Unit tests import from `../../../lib` (source, never `dist`); entities from `../../sample-project/bookshop/@cds-models/...` by relative path. Test names: `test('It should VERB : <what>', ...)`.
- Integration tests boot with `const client = cds.test(path.resolve(__dirname, '../../sample-project/bookshop')) as any;` — `client.url` / `client.server` are only readable inside `beforeAll`/`test` bodies. cds-test throws on 4xx/5xx (assert failures with `rejects.toMatchObject` or try/catch).
- Fixture handler classes import the library via the deep relative path used by their siblings (e.g. `../../../../../../../lib` from `srv/controller/<svc>/handler/`).
- Coverage gate (`test:coverage` in CI): statements 85 / branches 70 / functions 85 / lines 85 over `lib/**` — every new lib file needs real tests.
- `CHANGELOG.md` is generated — never edit. No version bump. README must document every new public decorator.
- Gates that must pass at the end of every task: the task's named test command; at the end of the batch: `npm run check`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`.
- CAP 10.0.3 pinned facts (from installed source, do not re-derive): `served` → `await cds.emit('served', cds.services)`, listeners sequential + awaited, before `app.listen`; `listening` → synchronous `cds.emit('listening', {server, url})`, listener results discarded, no replay for late listeners; `shutdown` → never `emit`ted, dispatched as `await Promise.all(cds.listeners('shutdown').map(fn => fn(err)))` with `err = Error | null`, **no once-guard — may fire multiple times**; `req.reject(status, msg)` throws synchronously.

---

### Task 1: `@Throttle` — types, util, decorator, unit tests

**Files:**
- Modify: `lib/types/types.ts` (add `ThrottleOptions` near `ScheduleOptions`, ~line 104)
- Create: `lib/util/decorators/throttleUtil.ts`
- Modify: `lib/constants/internalConstants.ts` (marker symbol + message)
- Modify: `lib/decorators/method.ts` (new `Throttle` decorator + export; `buildOnError` guard)
- Test: `test/__tests__/unit/THROTTLE.test.ts`

**Interfaces:**
- Consumes: `util.findRequest(args)` (`lib/util/util.ts:110`), `util.buildMessage`, `util.throwErrorMessage`, `StatusCodes.TOO_MANY_REQUESTS` from `http-status-codes`, `parameterUtil` NOT needed (key comes off the found `req`).
- Produces: `export type ThrottleOptions = { limit: number; window: number; by?: 'user' | 'tenant' }` (public, `lib/types/types.ts`); `throttleUtil.consume(store, key, limit, window, now): { allowed: boolean; retryAfterMs: number }`; `throttleUtil.resolveKey(req, by): string`; decorator `Throttle(options: ThrottleOptions)`; marker `constants.DECORATOR.THROTTLE_KEY` (Symbol) defined on `(target, propertyName)` — Task 2+ fixtures and `buildOnError` read it.

- [ ] **Step 1: Write the failing unit test**

`test/__tests__/unit/THROTTLE.test.ts`:

```ts
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { EntityHandler, OnAction, OnError, Throttle } from '../../../lib';
import constants from '../../../lib/constants/internalConstants';
import throttleUtil from '../../../lib/util/decorators/throttleUtil';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { Request } from '../../../lib/types/types';

const buildReq = (extra: Record<string, unknown> = {}) =>
  ({ user: { id: 'alice' }, tenant: 't1', reject: jest.fn(), data: {}, headers: {}, ...extra }) as unknown as Request;

describe('THROTTLE', () => {
  describe('throttleUtil.consume', () => {
    test('It should ALLOW : the first `limit` hits inside one window', () => {
      const store = new Map<string, { count: number; start: number }>();
      expect(throttleUtil.consume(store, 'alice', 2, 1000, 0).allowed).toBe(true);
      expect(throttleUtil.consume(store, 'alice', 2, 1000, 10).allowed).toBe(true);
    });

    test('It should REJECT : hit limit+1 inside the window and report retryAfterMs', () => {
      const store = new Map<string, { count: number; start: number }>();
      throttleUtil.consume(store, 'alice', 2, 1000, 0);
      throttleUtil.consume(store, 'alice', 2, 1000, 10);
      const third = throttleUtil.consume(store, 'alice', 2, 1000, 20);
      expect(third.allowed).toBe(false);
      expect(third.retryAfterMs).toBe(980);
    });

    test('It should RESET : a hit at/after window expiry opens a fresh window', () => {
      const store = new Map<string, { count: number; start: number }>();
      throttleUtil.consume(store, 'alice', 1, 1000, 0);
      expect(throttleUtil.consume(store, 'alice', 1, 1000, 1000).allowed).toBe(true);
    });

    test('It should SWEEP : expired foreign keys are removed lazily on hit', () => {
      const store = new Map<string, { count: number; start: number }>();
      throttleUtil.consume(store, 'alice', 1, 1000, 0);
      throttleUtil.consume(store, 'bob', 1, 1000, 2000);
      expect(store.has('alice')).toBe(false);
    });

    test('It should ISOLATE : different keys count independently', () => {
      const store = new Map<string, { count: number; start: number }>();
      expect(throttleUtil.consume(store, 'alice', 1, 1000, 0).allowed).toBe(true);
      expect(throttleUtil.consume(store, 'bob', 1, 1000, 0).allowed).toBe(true);
      expect(throttleUtil.consume(store, 'alice', 1, 1000, 10).allowed).toBe(false);
    });
  });

  describe('throttleUtil.resolveKey', () => {
    test('It should KEY : by user id per default and fall back to anonymous', () => {
      expect(throttleUtil.resolveKey(buildReq(), undefined)).toBe('alice');
      expect(throttleUtil.resolveKey(buildReq({ user: undefined }), 'user')).toBe('anonymous');
    });

    test('It should KEY : by tenant with a no-tenant fallback', () => {
      expect(throttleUtil.resolveKey(buildReq(), 'tenant')).toBe('t1');
      expect(throttleUtil.resolveKey(buildReq({ tenant: undefined }), 'tenant')).toBe('no-tenant');
    });
  });

  describe('decorator wiring', () => {
    test('It should MARK : the method with the THROTTLE_KEY metadata marker', () => {
      @EntityHandler(Book)
      class Marked {
        @OnAction('CatalogService.throttledPing')
        @Throttle({ limit: 3, window: 10_000 })
        public async ping(req: Request) {
          return req;
        }
      }
      expect(Reflect.getOwnMetadata(constants.DECORATOR.THROTTLE_KEY, Marked.prototype, 'ping')).toEqual({
        limit: 3,
        window: 10_000,
      });
    });

    test('It should THROW : at decoration time for limit < 1 or window < 1', () => {
      expect(() => {
        class Bad {
          @Throttle({ limit: 0, window: 1000 })
          public async m(req: Request) {
            return req;
          }
        }
        return Bad;
      }).toThrow(/limit/i);
      expect(() => {
        class Bad2 {
          @Throttle({ limit: 1, window: 0 })
          public async m(req: Request) {
            return req;
          }
        }
        return Bad2;
      }).toThrow(/window/i);
    });

    test('It should THROW : at decoration time when @OnError is stacked on a throttled method', () => {
      expect(() => {
        @EntityHandler(Book)
        class Bad {
          @OnError()
          @Throttle({ limit: 1, window: 1000 })
          public onError(err: Error, req: Request) {
            return [err, req];
          }
        }
        return Bad;
      }).toThrow(/@Throttle.*@OnError|@OnError.*@Throttle/);
    });

    test('It should REJECT : with 429 through req.reject once the limit is exhausted', async () => {
      class Wrapped {
        @Throttle({ limit: 1, window: 60_000 })
        public async ping(req: Request) {
          return 'pong';
        }
      }
      const instance = new Wrapped();
      const first = buildReq();
      // req must be an actual cds.Request for util.findRequest — emulate with prototype trick:
      const cds = require('@sap/cds');
      Object.setPrototypeOf(first, cds.Request.prototype);
      await expect(instance.ping(first)).resolves.toBe('pong');

      const second = buildReq();
      Object.setPrototypeOf(second, cds.Request.prototype);
      (second as any).reject = jest.fn(() => {
        throw new Error('429');
      });
      await expect(instance.ping(second)).rejects.toThrow('429');
      expect((second as any).reject).toHaveBeenCalledWith(429, expect.stringContaining('1'));
    });

    test('It should THROW : a descriptive error when no cds.Request is among the arguments', async () => {
      class NoReq {
        @Throttle({ limit: 1, window: 1000 })
        public async m(payload: { x: number }) {
          return payload.x;
        }
      }
      await expect(new NoReq().m({ x: 1 })).rejects.toThrow(/@Throttle.*Request/);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest test/__tests__/unit/THROTTLE.test.ts` (entities must have been generated once; if not: `npm run build:entities:test --prefix ./test/sample-project/bookshop` first)
Expected: FAIL — `Throttle` is not exported, `throttleUtil` module not found.

- [ ] **Step 3: Implement types, constants, util**

`lib/types/types.ts` — insert directly after the `ScheduleOptions` type (~line 104):

```ts
/**
 * Options for the `@Throttle` decorator.
 */
export type ThrottleOptions = {
  /** Maximum number of invocations allowed per window. Must be >= 1. */
  limit: number;
  /** Fixed window length in milliseconds. Must be >= 1. */
  window: number;
  /**
   * Counter key source: `'user'` keys by `req.user.id` (fallback `'anonymous'`),
   * `'tenant'` keys by `req.tenant` (fallback `'no-tenant'`).
   * @default 'user'
   */
  by?: 'user' | 'tenant';
};
```

`lib/constants/internalConstants.ts` — add inside `DECORATOR` (sibling of `MIDDLEWARE_KEY`) and inside `MESSAGES`:

```ts
    THROTTLE_KEY: Symbol('THROTTLE'),
```

```ts
    THROTTLE_LIMIT_EXCEEDED:
      'Rate limit exceeded: max ${limit} requests per ${window} ms for this ${by}. Retry in ${retryAfter} ms.',
    THROTTLE_NO_REQUEST:
      "@Throttle() could not find a 'Request' among the handler arguments of '${className}.${methodName}'. Place @Throttle() directly below the handler decorator and keep a @Req() parameter.",
    THROTTLE_ON_ERROR: '@Throttle() cannot be used on @OnError handlers (error handlers are invoked synchronously).',
```

`lib/util/decorators/throttleUtil.ts` (new file, follows the `const xUtil = {...}; export default xUtil;` house pattern):

```ts
import type { Request, ThrottleOptions } from '../../types/types';

export type ThrottleWindow = { count: number; start: number };
export type ThrottleStore = Map<string, ThrottleWindow>;

/**
 * Utility backing the `@Throttle` decorator: fixed-window, per-process counters.
 */
const throttleUtil = {
  /**
   * Resolves the counter key for a request.
   */
  resolveKey(req: Request, by: ThrottleOptions['by']): string {
    if (by === 'tenant') {
      return req.tenant ?? 'no-tenant';
    }

    return (req.user as { id?: string } | undefined)?.id ?? 'anonymous';
  },

  /**
   * Consumes one hit for `key`. Fixed window: the first hit opens the window; a hit at/after
   * `start + window` resets it. Expired entries of other keys are swept lazily on every call.
   */
  consume(store: ThrottleStore, key: string, limit: number, window: number, now: number) {
    for (const [existingKey, entry] of store) {
      if (now >= entry.start + window) {
        store.delete(existingKey);
      }
    }

    const current = store.get(key);

    if (!current) {
      store.set(key, { count: 1, start: now });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (current.count < limit) {
      current.count += 1;
      return { allowed: true, retryAfterMs: 0 };
    }

    return { allowed: false, retryAfterMs: current.start + window - now };
  },
};

export default throttleUtil;
```

- [ ] **Step 4: Implement the decorator in `lib/decorators/method.ts`**

Place next to `ExecutionAllowedForRole` (~line 193). Imports to add at the top of `method.ts`: `StatusCodes` from `http-status-codes` (check — it may already be imported; import locally if not), `throttleUtil` and `import type { ThrottleStore } from '../util/decorators/throttleUtil';`, `import type { ThrottleOptions } from '../types/types';`.

```ts
/**
 * Rate-limits the decorated handler with a fixed window, counted per user (default) or per tenant.
 *
 * Counters are per app instance and per decorated method (in-memory). Over the limit the request is
 * rejected with HTTP 429. Place `@Throttle()` BELOW the handler decorator (closer to the method),
 * like every wrapping decorator — otherwise it is not part of the registered callback.
 *
 * @example
 * "@OnAction(GenerateReport)"
 * "@Throttle({ limit: 10, window: 60_000 })"
 * public async generate(@Req() req: Request) { ... }
 */
function Throttle(options: ThrottleOptions) {
  if (!Number.isFinite(options.limit) || options.limit < 1) {
    util.throwErrorMessage(`@Throttle() 'limit' must be a number >= 1, got '${options.limit}'`);
  }

  if (!Number.isFinite(options.window) || options.window < 1) {
    util.throwErrorMessage(`@Throttle() 'window' must be a number (ms) >= 1, got '${options.window}'`);
  }

  const store: ThrottleStore = new Map();

  return function <Target extends object>(
    target: Target,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestType>,
  ) {
    Reflect.defineMetadata(
      constants.DECORATOR.THROTTLE_KEY,
      { limit: options.limit, window: options.window },
      target,
      propertyName,
    );

    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const req = util.findRequest(args);

      if (!req) {
        util.throwErrorMessage(
          util.buildMessage(constants.MESSAGES.THROTTLE_NO_REQUEST, {
            className: (target as any).constructor?.name ?? 'Unknown',
            methodName: String(propertyName),
          }),
        );
      }

      const key = throttleUtil.resolveKey(req, options.by);
      const outcome = throttleUtil.consume(store, key, options.limit, options.window, Date.now());

      if (!outcome.allowed) {
        req.reject(
          StatusCodes.TOO_MANY_REQUESTS,
          util.buildMessage(constants.MESSAGES.THROTTLE_LIMIT_EXCEEDED, {
            limit: options.limit,
            window: options.window,
            by: options.by ?? 'user',
            retryAfter: outcome.retryAfterMs,
          }),
        );
      }

      return await originalMethod.apply(this, args);
    };
  };
}
```

Notes for the implementer:
- `util.findRequest` returns `args.find((arg) => arg instanceof cds.Request)` — may be `undefined`; the guard above throws before any `req` member access. `util.throwErrorMessage` throws, so TypeScript may need a non-null assertion on `req` after the guard (`const request = req!;`).
- The throttle check is fully synchronous before `originalMethod` — the synchronous-prefix rule holds.
- `req.reject` throws synchronously (pinned), so execution never reaches the original method when over limit.

`buildOnError` (~line 710-725) — extend the existing `@Diff` decoration-time guard with the same pattern for the throttle marker. Directly below the DIFF check inside the returned decorator function:

```ts
      const throttled = Reflect.getOwnMetadata(constants.DECORATOR.THROTTLE_KEY, target, propertyName);

      if (throttled) {
        util.throwErrorMessage(
          `${constants.MESSAGES.THROTTLE_ON_ERROR} [class: ${(target as any).constructor?.name ?? 'Unknown'}, method: ${String(propertyName)}]`,
        );
      }
```

Export: add `Throttle` to the export block at the end of `method.ts` (new comment banner group `// Rate limiting`, after the Tier-1 groups ~line 1840).

- [ ] **Step 5: Run the unit test to verify it passes**

Run: `npx jest test/__tests__/unit/THROTTLE.test.ts`
Expected: PASS (all tests). If the `Object.setPrototypeOf(..., cds.Request.prototype)` trick fails because `cds.Request` is lazy, use `new cds.Request({ event: 'throttledPing', data: {} })` and assign `user`/`tenant`/`reject` onto it instead — adjust the test, not the implementation.

- [ ] **Step 6: Run lint + full unit lane**

Run: `npm run check && npm run test:unit`
Expected: PASS, no eslint/prettier findings, no regressions.

- [ ] **Step 7: Commit**

```bash
git add lib/types/types.ts lib/constants/internalConstants.ts lib/util/decorators/throttleUtil.ts lib/decorators/method.ts test/__tests__/unit/THROTTLE.test.ts
git commit -m "feat(throttle): add @Throttle fixed-window rate limiting decorator"
```

---

### Task 2: `@Throttle` — bookshop fixture action + integration tests

**Files:**
- Modify: `test/sample-project/bookshop/srv/controller/cat-service/catalog-service.cds` (add unbound action)
- Create: `test/sample-project/bookshop/srv/controller/cat-service/handler/ThrottledActionsHandler.ts`
- Modify: `test/sample-project/bookshop/srv/controller/cat-service/catalog-service.ts` (register handler)
- Test: `test/__tests__/integration/THROTTLE.test.ts`

**Interfaces:**
- Consumes: `Throttle` decorator + `ThrottleOptions` from Task 1 (via the fixture's deep relative lib import), `@UnboundActions`, `@OnAction`, `@Req` — all existing.
- Produces: unbound action `throttledPing` on `CatalogService` returning `String`, throttled `{ limit: 3, window: 10_000 }` keyed by user — Task 3 (e2e) calls exactly this action.

- [ ] **Step 1: Add the CDS action**

In `catalog-service.cds`, next to the other unbound actions (e.g. after `submitQuantity`):

```cds
  action throttledPing() returns String;
```

- [ ] **Step 2: Regenerate entities so cds-typer knows the action**

Run: `npm run build:entities:test --prefix ./test/sample-project/bookshop`
Expected: exits 0; `@cds-models/CatalogService/index.ts` now contains `throttledPing`.

- [ ] **Step 3: Write the failing integration test**

`test/__tests__/integration/THROTTLE.test.ts`:

```ts
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const userAuth = { username: 'user', password: 'user' };
const catalog = '/odata/v4/catalog';

describe('INTEGRATION - @Throttle', () => {
  test('It should ALLOW : the first 3 calls for one user, then REJECT the 4th with 429', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await client.POST(`${catalog}/throttledPing`, {}, { auth });
      expect(res.status).toBe(200);
    }

    await expect(client.POST(`${catalog}/throttledPing`, {}, { auth })).rejects.toMatchObject({
      status: 429,
    });
  });

  test('It should ISOLATE : a different user still passes after the first user is throttled', async () => {
    const res = await client.POST(`${catalog}/throttledPing`, {}, { auth: userAuth });
    expect(res.status).toBe(200);
  });

  test('It should REPORT : the rejection message carries limit and window', async () => {
    try {
      // manager is exhausted from the first test (same 10s window very likely still open);
      // if the window rolled over, exhaust it again deterministically:
      for (let i = 0; i < 4; i++) {
        await client.POST(`${catalog}/throttledPing`, {}, { auth });
      }
      throw new Error('expected 429');
    } catch (error: any) {
      expect(error.status).toBe(429);
      expect(String(error.message)).toContain('3');
      expect(String(error.message)).toContain('10000');
    }
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npm run test:integration -- --testPathPattern THROTTLE`
Expected: FAIL — 404 on `/throttledPing` (no handler registered yet).

- [ ] **Step 5: Implement the fixture handler**

`test/sample-project/bookshop/srv/controller/cat-service/handler/ThrottledActionsHandler.ts`:

```ts
import { OnAction, Req, Throttle, UnboundActions } from '../../../../../../../lib';

import type { ActionRequest } from '../../../../../../../lib/types/types';
import type { throttledPing } from '../../../../@cds-models/CatalogService';

@UnboundActions()
export class ThrottledActionsHandler {
  @OnAction(throttledPing)
  @Throttle({ limit: 3, window: 10_000 })
  public async onThrottledPing(@Req() req: ActionRequest<typeof throttledPing>) {
    return 'pong';
  }
}
```

(Match the import style of the sibling `UnboundActionsHandler.ts` exactly — if it imports actions differently, e.g. `import { Func } from '#cds-models/CatalogService'` vs relative, copy the sibling. If `ActionRequest` is not the sibling's request type, copy whatever the sibling uses.)

In `catalog-service.ts`, add to the `CDSDispatcher([...])` array under the `// Unbound actions` comment group:

```ts
  ThrottledActionsHandler,
```

with the corresponding import next to the other handler imports.

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npm run test:integration -- --testPathPattern THROTTLE`
Expected: PASS (3 tests).

- [ ] **Step 7: Run the full integration lane**

Run: `npm run test:integration`
Expected: PASS — no regressions (existing suites unaffected).

- [ ] **Step 8: Commit**

```bash
git add test/sample-project/bookshop/srv/controller/cat-service/catalog-service.cds test/sample-project/bookshop/srv/controller/cat-service/catalog-service.ts test/sample-project/bookshop/srv/controller/cat-service/handler/ThrottledActionsHandler.ts test/__tests__/integration/THROTTLE.test.ts
git commit -m "test(throttle): fixture throttledPing action and integration coverage"
```

---

### Task 3: `@Throttle` — e2e postman coverage

**Files:**
- Modify: `test/__tests__/e2e/CDS-TS-Dispatcher.postman_collection.json`

**Interfaces:**
- Consumes: `throttledPing` action from Task 2 (`POST {{baseUrl}}/{{catalogService}}/throttledPing`, no auth → anonymous key; limit 3 / window 10s).
- Produces: top-level collection folder `Throttle - @Throttle 429` with 4 requests.

- [ ] **Step 1: Add the folder to the collection**

Append to the collection's top-level `item` array (after `Request lifecycle - @BeforeCommit veto`) a folder in the exact structural style of the veto folder (copy its JSON skeleton). Folder `name`: `Throttle - @Throttle 429`, `description`: `Fixed window 10s, limit 3, anonymous user. Re-running within 10s of a previous run can shift which request sees the 429 — the folder is written to be idempotent per fresh server boot.` Four requests, each `POST {{baseUrl}}/{{catalogService}}/throttledPing` with `content-type: application/json` header, empty JSON body `{}`, no auth:

1. `Throttled ping 1 of 3` — test script:
```js
pm.test('First call passes', function () { pm.expect(pm.response.code).to.equal(200); });
```
2. `Throttled ping 2 of 3` — same script (`Second call passes`).
3. `Throttled ping 3 of 3` — same script (`Third call passes`).
4. `Throttled ping 4 gets 429` — test script:
```js
pm.test('Fourth call is throttled with 429', function () { pm.expect(pm.response.code).to.equal(429); });
pm.test('Message names the limit', function () {
    var message = pm.response.json().error.message;
    pm.expect(message).to.include('max 3 requests');
});
```

- [ ] **Step 2: Validate the collection JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('./test/__tests__/e2e/CDS-TS-Dispatcher.postman_collection.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 3: Run the e2e suite**

Run: `npm run test:e2e`
Expected: PASS including the new folder (4 assertions green). This boots the real bookshop on :4004 — takes a few minutes.

- [ ] **Step 4: Commit**

```bash
git add test/__tests__/e2e/CDS-TS-Dispatcher.postman_collection.json
git commit -m "test(e2e): cover the @Throttle 429 flow in the postman collection"
```

---

### Task 4: `@ServerLifecycle` — types, constants, class + method decorators, metadata unit tests

**Files:**
- Modify: `lib/types/internalTypes.ts` (EventKind member, events type, handler record, BaseHandler union)
- Modify: `lib/constants/internalConstants.ts` (class metadata key + messages)
- Modify: `lib/decorators/class.ts` (`ServerLifecycle`)
- Modify: `lib/core/MetadataDispatcher.ts` (`isServerLifecycle`)
- Modify: `lib/decorators/method.ts` (`buildServerLifecycle` + three decorators + exports)
- Test: `test/__tests__/unit/SERVER-LIFECYCLE.test.ts` (metadata part; bootstrap part arrives in Task 5)

**Interfaces:**
- Consumes: `MetadataDispatcher.addMethodMetadata`, `injectable()` — existing.
- Produces (Task 5/6 rely on these exact names):
  - `internalTypes.ts`: `EventKind` gains `'SERVER_LIFECYCLE'`; `export type SERVER_LIFECYCLE_EVENTS = 'SERVED' | 'LISTENING' | 'SHUTDOWN';`; `export type ServerLifecycleHandler = { type: 'SERVER_LIFECYCLE'; event: SERVER_LIFECYCLE_EVENTS };` added to the `BaseHandler` union.
  - `internalConstants.ts`: `DECORATOR.SERVER_LIFECYCLE_NAME: 'SERVER_LIFECYCLE'` + messages `SERVER_LIFECYCLE_FOREIGN_HANDLERS`, `SERVER_LIFECYCLE_WRONG_HOST` (texts below).
  - `class.ts`: `function ServerLifecycle()` exported.
  - `MetadataDispatcher`: `static isServerLifecycle(entity: Constructable): boolean` (reads `entity.constructor`, mirroring `getEntity`).
  - `method.ts`: `OnServed()`, `OnListening()`, `OnShutdown()` exported.

- [ ] **Step 1: Write the failing metadata unit tests**

`test/__tests__/unit/SERVER-LIFECYCLE.test.ts` (first half):

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest test/__tests__/unit/SERVER-LIFECYCLE.test.ts`
Expected: FAIL — `ServerLifecycle`/`OnServed` etc. not exported.

- [ ] **Step 3: Implement types + constants**

`lib/types/internalTypes.ts`:
- Line ~59: `export type EventKind = 'BEFORE' | 'AFTER' | 'AFTER_SINGLE' | 'ON' | 'PREPEND' | 'REQUEST_LIFECYCLE' | 'SERVER_LIFECYCLE';`
- Next to `REQUEST_LIFECYCLE_EVENTS` (~line 203):

```ts
export type SERVER_LIFECYCLE_EVENTS = 'SERVED' | 'LISTENING' | 'SHUTDOWN';

export type ServerLifecycleHandler = {
  type: 'SERVER_LIFECYCLE';
  event: SERVER_LIFECYCLE_EVENTS;
};
```

- Add `| ServerLifecycleHandler` to the `BaseHandler` union tail.

`lib/constants/internalConstants.ts` — in `DECORATOR`:

```ts
    SERVER_LIFECYCLE_NAME: 'SERVER_LIFECYCLE',
```

in `MESSAGES`:

```ts
    SERVER_LIFECYCLE_FOREIGN_HANDLERS:
      "@ServerLifecycle class '${className}' contains non-lifecycle handler decorators. Only @OnServed / @OnListening / @OnShutdown are allowed here.",
    SERVER_LIFECYCLE_WRONG_HOST:
      "@OnServed / @OnListening / @OnShutdown found in '${className}', which is not decorated with @ServerLifecycle. Move them into a @ServerLifecycle class.",
```

- [ ] **Step 4: Implement the class decorator + MetadataDispatcher reader**

`lib/decorators/class.ts` — add (JSDoc in the style of the siblings; mention: hosts only the three lifecycle method decorators, registered via `cds.on`, once per process per class) and extend the export line:

```ts
function ServerLifecycle<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    Reflect.defineMetadata(constants.DECORATOR.SERVER_LIFECYCLE_NAME, true, target);

    injectable()(target);
  };
}
```

`export { EntityHandler, Repository, ServerLifecycle, ServiceLogic, UnboundActions };`

`lib/core/MetadataDispatcher.ts` — next to `getEntity` (~line 49):

```ts
  /**
   * Checks whether the given resolved instance belongs to a `@ServerLifecycle` class.
   */
  public static isServerLifecycle(entity: Constructable): boolean {
    return Reflect.getMetadata(constants.DECORATOR.SERVER_LIFECYCLE_NAME, entity.constructor) === true;
  }
```

- [ ] **Step 5: Implement the method decorators in `method.ts`**

Next to `buildRequestLifecycle` (~line 559). Add `SERVER_LIFECYCLE_EVENTS` to the existing `internalTypes` type-import in `method.ts` (where `REQUEST_LIFECYCLE_EVENTS` already comes from). Note: NO `ArgumentMethodProcessor` wrapping — CAP's native args pass through verbatim:

```ts
function buildServerLifecycle(options: { event: SERVER_LIFECYCLE_EVENTS }) {
  return function <Target extends object>() {
    return function (
      target: Target,
      propertyName: string | symbol,
      descriptor: TypedPropertyDescriptor<RequestType>,
    ): void {
      const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.METHOD_ACCUMULATOR_NAME);

      metadataDispatcher.addMethodMetadata({
        type: 'SERVER_LIFECYCLE',
        eventKind: 'SERVER_LIFECYCLE',
        event: options.event,
        callback: descriptor.value!,
        isDraft: false,
      });
    };
  };
}
```

Then the three public decorators, each with a JSDoc documenting the exact CAP-pinned semantics (copy these facts into the JSDoc):
- `const OnServed = buildServerLifecycle({ event: 'SERVED' });` — receives `cds.services`; listeners run sequentially and are awaited before the HTTP server starts listening; a thrown error fails startup; async allowed.
- `const OnListening = buildServerLifecycle({ event: 'LISTENING' });` — receives `{ server, url }`; dispatched synchronously, return values (including promises) are discarded — treat as fire-and-forget.
- `const OnShutdown = buildServerLifecycle({ event: 'SHUTDOWN' });` — receives `err: Error | null`; all shutdown listeners run in parallel and are awaited before the server closes; CAP has NO once-guard, the callback may run more than once per process.

Add `OnServed, OnListening, OnShutdown` to the export block (new banner group `// Server lifecycle`).

- [ ] **Step 6: Run the unit test to verify the metadata half passes**

Run: `npx jest test/__tests__/unit/SERVER-LIFECYCLE.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/types/internalTypes.ts lib/constants/internalConstants.ts lib/decorators/class.ts lib/core/MetadataDispatcher.ts lib/decorators/method.ts test/__tests__/unit/SERVER-LIFECYCLE.test.ts
git commit -m "feat(server-lifecycle): add @ServerLifecycle host with @OnServed/@OnListening/@OnShutdown metadata"
```

---

### Task 5: `@ServerLifecycle` — CDSDispatcher registration, guards, bootstrap unit tests

**Files:**
- Modify: `lib/core/CDSDispatcher.ts`
- Modify: `lib/util/middleware/MiddlewareEntityRegistry.ts:15` (guard array)
- Test: `test/__tests__/unit/SERVER-LIFECYCLE.test.ts` (append `registration` describe-block)

**Interfaces:**
- Consumes: Task 4's `ServerLifecycleHandler` record, `MetadataDispatcher.isServerLifecycle`, messages `SERVER_LIFECYCLE_FOREIGN_HANDLERS` / `SERVER_LIFECYCLE_WRONG_HOST`.
- Produces: `CDSDispatcher` registers `cds.on('served'|'listening'|'shutdown', …)` once per class per process (module-level `WeakSet`); `NON_ACTION_HANDLER_TYPES` includes `'SERVER_LIFECYCLE'`. Task 6's fixture relies on registration working through the public `initialize()` path.

- [ ] **Step 1: Append the failing bootstrap tests**

Append to `test/__tests__/unit/SERVER-LIFECYCLE.test.ts` (inside `describe('SERVER LIFECYCLE')`). Model on `REQUEST-LIFECYCLE.test.ts`'s `bootstrap` helper — public path, mocked `srv`:

```ts
import cds from '@sap/cds';
import { CDSDispatcher, EntityHandler, Use } from '../../../lib';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';
import { MiddlewareEntity1 } from '../../util/middleware/MiddlewareEntity1';
```

```ts
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
        @(require('../../../lib').BeforeCommit())
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
```

Note for the implementer: the decorator-in-expression form `@(require(...).BeforeCommit())` is only there to avoid an import collision if `BeforeCommit` is already imported — prefer a plain top-of-file import `BeforeCommit` and `@BeforeCommit()` usage; adjust to whatever lints clean.

- [ ] **Step 2: Run to verify the new block fails**

Run: `npx jest test/__tests__/unit/SERVER-LIFECYCLE.test.ts`
Expected: FAIL — `cds.on` never called (dispatcher ignores the new kind), wrong-host/foreign checks missing.

- [ ] **Step 3: Implement registration in `CDSDispatcher.ts`**

At module scope (below the imports, near the `RequestLifecycleContext` local type ~line 29):

```ts
/** `cds.on` is process-global: a @ServerLifecycle class registers once, no matter how many dispatchers list it. */
const registeredServerLifecycleClasses = new WeakSet<Constructable>();

const SERVER_LIFECYCLE_EVENT_NAMES = {
  SERVED: 'served',
  LISTENING: 'listening',
  SHUTDOWN: 'shutdown',
} as const;
```

New private method (next to `registerRequestLifecycleHandlers`, ~line 466):

```ts
  private registerServerLifecycleHandlers(handlers: BaseHandler[], entityInstance: Constructable): void {
    const targetClass = entityInstance.constructor as unknown as Constructable;

    if (registeredServerLifecycleClasses.has(targetClass)) {
      return;
    }

    registeredServerLifecycleClasses.add(targetClass);

    handlers.forEach((handler) => {
      if (handler.type !== 'SERVER_LIFECYCLE') {
        return;
      }

      const eventName = SERVER_LIFECYCLE_EVENT_NAMES[handler.event];

      cds.on(eventName, (...args: unknown[]) => handler.callback.call(entityInstance, ...args));
    });
  }
```

Host-mismatch guards + routing. In `getHandlersBy` (~line 775), before the existing `buildHandlers`/`buildMiddlewares` return value is assembled, branch on the class flag:

```ts
  private getHandlersBy(entityInstance: Constructable) {
    const handlers = MetadataDispatcher.getMetadataHandlers(entityInstance);
    const isServerLifecycleClass = MetadataDispatcher.isServerLifecycle(entityInstance);
    const serverLifecycle = (handlers ?? []).filter((handler) => handler.type === 'SERVER_LIFECYCLE');

    if (!isServerLifecycleClass && serverLifecycle.length > 0) {
      util.throwErrorMessage(
        util.buildMessage(constants.MESSAGES.SERVER_LIFECYCLE_WRONG_HOST, {
          className: entityInstance.constructor?.name ?? 'Unknown',
        }),
      );
    }

    if (isServerLifecycleClass) {
      if ((handlers ?? []).some((handler) => handler.type !== 'SERVER_LIFECYCLE')) {
        util.throwErrorMessage(
          util.buildMessage(constants.MESSAGES.SERVER_LIFECYCLE_FOREIGN_HANDLERS, {
            className: entityInstance.constructor?.name ?? 'Unknown',
          }),
        );
      }

      if (serverLifecycle.length === 0) {
        return undefined;
      }

      return {
        buildHandlers: (): void => {
          this.registerServerLifecycleHandlers(serverLifecycle, entityInstance);
        },
        buildMiddlewares: (): void => {
          // @ServerLifecycle classes host no request handlers - nothing to middleware-wrap.
        },
      };
    }

    // ...existing body unchanged from here (REQUEST_LIFECYCLE split etc.)
```

`import cds from '@sap/cds';` already exists in the file (used by `cds.outboxed`/`cds.connect`/`cds.once`) — verify, do not duplicate.

- [ ] **Step 4: Extend the middleware guard**

`lib/util/middleware/MiddlewareEntityRegistry.ts:15`:

```ts
const NON_ACTION_HANDLER_TYPES = ['REQUEST_LIFECYCLE', 'SCHEDULED_OUTCOME', 'SCHEDULED', 'SERVER_LIFECYCLE'];
```

- [ ] **Step 5: Run the unit suite to verify it passes**

Run: `npx jest test/__tests__/unit/SERVER-LIFECYCLE.test.ts`
Expected: PASS — all metadata + registration tests. If the dedupe test interferes with the "register exactly once" test (module-level WeakSet persists across tests in the file), each test MUST use its own locally-declared class, as written above.

- [ ] **Step 6: Full unit lane + lint**

Run: `npm run check && npm run test:unit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/core/CDSDispatcher.ts lib/util/middleware/MiddlewareEntityRegistry.ts test/__tests__/unit/SERVER-LIFECYCLE.test.ts
git commit -m "feat(server-lifecycle): register cds.on hooks with per-process class dedup and host guards"
```

---

### Task 6: `@ServerLifecycle` — bookshop fixture, integration + e2e

**Files:**
- Create: `test/sample-project/bookshop/srv/controller/shared-handlers/ServerLifecycleHandler.ts`
- Modify: `test/sample-project/bookshop/srv/controller/cat-service/catalog-service.ts` (add to array)
- Test: `test/__tests__/integration/SERVER-LIFECYCLE.test.ts`
- Modify: `test/__tests__/e2e/CDS-TS-Dispatcher.postman_collection.json` (seed-visibility request)

**Interfaces:**
- Consumes: Tasks 4-5 decorators; seeded row `Books ID 950001, title 'Seeded by @OnServed'` (author_ID 101, currency_code 'USD' — the fixture's standard fk pattern).
- Produces: console markers `[ServerLifecycle] served`, `[ServerLifecycle] listening <url>`, `[ServerLifecycle] shutdown` for tests; the seeded book visible at `GET /odata/v4/catalog/Books(950001)`.

- [ ] **Step 1: Write the failing integration test**

`test/__tests__/integration/SERVER-LIFECYCLE.test.ts`:

```ts
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');

// The spy must exist BEFORE cds.test boots the server, or the served/listening markers are missed.
const logSpy = jest.spyOn(console, 'log');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';

const markersOf = (spy: jest.SpyInstance): string[] => spy.mock.calls.map((c) => c.map(String).join(' '));

describe('INTEGRATION - @ServerLifecycle', () => {
  test('It should FIRE : @OnServed before listening and seed data visible over OData', async () => {
    const markers = markersOf(logSpy);
    expect(markers.some((m) => m.includes('[ServerLifecycle] served'))).toBe(true);

    const seeded = await client.GET(`${catalog}/Books(950001)`, { auth });
    expect(seeded.status).toBe(200);
    expect(seeded.data.title).toBe('Seeded by @OnServed');
  });

  test('It should FIRE : @OnListening with the real ephemeral url', async () => {
    const markers = markersOf(logSpy);
    const listening = markers.find((m) => m.includes('[ServerLifecycle] listening'));
    expect(listening).toBeDefined();
    expect(listening).toContain(String(client.server.address().port));
  });

  test('It should FIRE : @OnShutdown when cds.shutdown() runs (last test in file)', async () => {
    await cds.shutdown();
    const markers = markersOf(logSpy);
    expect(markers.some((m) => m.includes('[ServerLifecycle] shutdown'))).toBe(true);
  });
});
```

(Ordering note baked into the file: the shutdown test MUST be last — `cds.shutdown()` closes the server; cds-test's own `after` hook calls it again, which is safe — no once-guard, `server.close` twice is a no-op.)

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:integration -- --testPathPattern SERVER-LIFECYCLE`
Expected: FAIL — no markers, `Books(950001)` 404.

- [ ] **Step 3: Implement the fixture handler**

`test/sample-project/bookshop/srv/controller/shared-handlers/ServerLifecycleHandler.ts`:

```ts
import cds from '@sap/cds';

import { OnListening, OnServed, OnShutdown, ServerLifecycle } from '../../../../../../lib';

@ServerLifecycle()
export class ServerLifecycleHandler {
  @OnServed()
  public async seed(services: unknown) {
    // 'served' runs before app.listen and outside any request - a fresh tx is the sanctioned DB access.
    await cds.tx(async () => {
      await cds.run(
        cds.ql.INSERT.into('sap.capire.bookshop.Books').entries({
          ID: 950001,
          title: 'Seeded by @OnServed',
          author_ID: 101,
          currency_code: 'USD',
          stock: 1,
        }),
      );
    });
    console.log('[ServerLifecycle] served');
  }

  @OnListening()
  public logUrl(payload: { server: unknown; url: string }) {
    console.log(`[ServerLifecycle] listening ${payload.url}`);
  }

  @OnShutdown()
  public async cleanup(error: Error | null) {
    console.log('[ServerLifecycle] shutdown', error ? 'with error' : 'clean');
  }
}
```

Adjust the entity FQN (`sap.capire.bookshop.Books`) and the entry's required fields to match the fixture's `db/` model — copy the exact insert shape from an existing seeder/`.csv`/handler if the namespace differs (verify with `grep -r "namespace" test/sample-project/bookshop/db/`). Then register in `catalog-service.ts` array under a new comment group:

```ts
  // Server lifecycle (cds.on served/listening/shutdown)
  ServerLifecycleHandler,
```

- [ ] **Step 4: Run the integration test to verify it passes**

Run: `npm run test:integration -- --testPathPattern SERVER-LIFECYCLE`
Expected: PASS (3 tests). Flake watch: if the `listening` marker misses the spy because `cds.test`'s boot begins before the module body finishes evaluating, move the `jest.spyOn` above the `cds.test` call (as written) — that ordering is REQUIRED.

- [ ] **Step 5: Add the e2e seed-visibility request**

In the postman collection, append a top-level folder `Server lifecycle - @OnServed seed`, one request `GET {{baseUrl}}/{{catalogService}}/{{booksEntity}}(950001)`, no auth, test script:

```js
pm.test('Seeded book is visible', function () { pm.expect(pm.response.code).to.equal(200); });
pm.test('Seeded title matches', function () { pm.expect(pm.response.json().title).to.equal('Seeded by @OnServed'); });
```

Validate JSON again: `node -e "JSON.parse(require('fs').readFileSync('./test/__tests__/e2e/CDS-TS-Dispatcher.postman_collection.json','utf8')); console.log('valid')"`

- [ ] **Step 6: Run full integration + e2e lanes**

Run: `npm run test:integration && npm run test:e2e`
Expected: PASS. (`test:e2e` boots via `cds watch` — the `@OnServed` insert must not collide with `db/data` CSVs; if ID 950001 collides, pick 950002+.)

- [ ] **Step 7: Commit**

```bash
git add test/sample-project/bookshop/srv/controller/shared-handlers/ServerLifecycleHandler.ts test/sample-project/bookshop/srv/controller/cat-service/catalog-service.ts test/__tests__/integration/SERVER-LIFECYCLE.test.ts test/__tests__/e2e/CDS-TS-Dispatcher.postman_collection.json
git commit -m "test(server-lifecycle): fixture handler, integration markers and e2e seed visibility"
```

---

### Task 7: WebSocket family — decorators + unit tests

**Files:**
- Modify: `lib/decorators/method.ts` (three decorators + exports)
- Test: `test/__tests__/unit/WEBSOCKET.test.ts`

**Interfaces:**
- Consumes: existing `buildOnEvent` factory (`method.ts:672`) — records `{ type: 'EVENT', event: 'EVENT', eventKind: 'ON', eventName, isDraft: false }`; the dispatcher registers those via `srv.on(subtractLastDotString(eventName), …)` — `wsConnect`/`wsDisconnect` contain no dots, so they register verbatim.
- Produces: `OnWebSocketMessage(name: string)`, `OnWebSocketConnect()`, `OnWebSocketDisconnect()` exported from `lib`.

- [ ] **Step 1: Write the failing unit test**

`test/__tests__/unit/WEBSOCKET.test.ts`:

```ts
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { OnWebSocketConnect, OnWebSocketDisconnect, OnWebSocketMessage, UnboundActions } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';

import type { BaseHandler, Constructable } from '../../../lib/types/internalTypes';

const eventHandlersOf = (instance: Constructable): BaseHandler[] =>
  MetadataDispatcher.getMetadataHandlers(instance).filter((item) => item.type === 'EVENT');

describe('WEBSOCKET', () => {
  test('It should RECORD : wsConnect / wsDisconnect / named-operation EVENT handlers', () => {
    @UnboundActions()
    class ChatHandler {
      @OnWebSocketConnect()
      public async onConnect() {}

      @OnWebSocketDisconnect()
      public async onDisconnect() {}

      @OnWebSocketMessage('sendMessage')
      public async onMessage() {}
    }

    const handlers = eventHandlersOf(new ChatHandler() as unknown as Constructable);
    const names = handlers.map((h) => (h as { eventName: string }).eventName);

    expect(names).toEqual(['wsConnect', 'wsDisconnect', 'sendMessage']);
    expect(handlers.every((h) => h.eventKind === 'ON')).toBe(true);
    expect(handlers.every((h) => h.isDraft === false)).toBe(true);
  });

  test('It should MATCH : the exact metadata an equivalent @OnEvent produces (pure sugar)', () => {
    const { OnEvent } = require('../../../lib');

    @UnboundActions()
    class Sugar {
      @OnWebSocketConnect()
      public async onConnect() {}
    }

    @UnboundActions()
    class Plain {
      @OnEvent('wsConnect')
      public async onConnect() {}
    }

    const [sugar] = eventHandlersOf(new Sugar() as unknown as Constructable);
    const [plain] = eventHandlersOf(new Plain() as unknown as Constructable);

    expect({ ...sugar, callback: undefined }).toEqual({ ...plain, callback: undefined });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest test/__tests__/unit/WEBSOCKET.test.ts`
Expected: FAIL — decorators not exported.

- [ ] **Step 3: Implement in `method.ts`**

Next to `OnEvent` (~line 1185). All three are direct `buildOnEvent` applications — no new machinery:

```ts
/**
 * Handles an incoming websocket operation/event by name (`@cap-js-community/websocket` services).
 * Sugar for `@OnEvent(name)`; requires the websocket plugin in the consumer app and a
 * `@protocol: 'websocket'` (or `@ws`) service whose impl hosts this `@UnboundActions` class.
 */
const OnWebSocketMessage = (name: string) => buildOnEvent({ event: 'EVENT', eventKind: 'ON', isDraft: false })(name);

/** Fires when a websocket client connects. Sugar for `@OnEvent('wsConnect')`; the CDS service must model `action wsConnect();`. */
const OnWebSocketConnect = () => buildOnEvent({ event: 'EVENT', eventKind: 'ON', isDraft: false })('wsConnect');

/** Fires when a websocket client disconnects. Sugar for `@OnEvent('wsDisconnect')`; model `action wsDisconnect(reason: String);` to receive the reason. */
const OnWebSocketDisconnect = () => buildOnEvent({ event: 'EVENT', eventKind: 'ON', isDraft: false })('wsDisconnect');
```

(If `buildOnEvent`'s generic signature makes the direct-call form awkward, mirror how `OnEvent` itself is declared at line 1185 and reuse that: `const OnWebSocketConnect = () => OnEvent('wsConnect');` — whichever typechecks cleanly with zero behavior difference.)

Export the three in a `// WebSocket (plugin: @cap-js-community/websocket)` banner group.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest test/__tests__/unit/WEBSOCKET.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/decorators/method.ts test/__tests__/unit/WEBSOCKET.test.ts
git commit -m "feat(websocket): add OnWebSocketConnect/Disconnect/Message sugar decorators"
```

---

### Task 8: WebSocket family — bookshop ChatService fixture + integration tests

**Files:**
- Modify: `test/sample-project/bookshop/package.json` (add `@cap-js-community/websocket` dependency)
- Create: `test/sample-project/bookshop/srv/controller/chat-service/chat-service.cds`
- Create: `test/sample-project/bookshop/srv/controller/chat-service/chat-service.ts`
- Create: `test/sample-project/bookshop/srv/controller/chat-service/handler/ChatHandler.ts`
- Modify: `test/sample-project/bookshop/srv/index.cds` (add `using`)
- Modify: root `package.json` (add `ws` + `@types/ws` devDependencies)
- Test: `test/__tests__/integration/WEBSOCKET.test.ts`

**Interfaces:**
- Consumes: Task 7 decorators.
- Produces: `ChatService` at ws path `/ws/chat` with `action sendMessage(text: String) returns String`, modeled `wsConnect`/`wsDisconnect` actions, console markers `[Chat] connect`, `[Chat] message <text>`, `[Chat] disconnect`; Task 9's smoke script uses the same service/path/markers.

- [ ] **Step 1: Install the plugin and the test client**

```bash
npm install --save-exact=false --workspace bookshop @cap-js-community/websocket@^1.11.1
npm install -D ws @types/ws
```

Verify `test/sample-project/bookshop/package.json` gained `"@cap-js-community/websocket": "^1.11.1"` under `dependencies` (cds-plugin discovery reads dependencies) and root got the two devDeps. If the `--workspace` flag misbehaves with the repo's npm version, edit the bookshop `package.json` manually and run plain `npm install` from the root.

- [ ] **Step 2: Declare the CDS service**

`test/sample-project/bookshop/srv/controller/chat-service/chat-service.cds`:

```cds
@protocol: 'websocket'
@path    : 'chat'
service ChatService {
  action wsConnect();
  action wsDisconnect(reason : String);
  action sendMessage(text : String) returns String;
  event received {
    text : String;
  }
}
```

Add to `test/sample-project/bookshop/srv/index.cds` under the `// Controller` block:

```cds
using from './controller/chat-service/chat-service';
```

- [ ] **Step 3: Write the failing integration test**

`test/__tests__/integration/WEBSOCKET.test.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it fails for the right reason**

Run: `npm run test:integration -- --testPathPattern WEBSOCKET`
Expected: FAIL — connection refused/404 on the ws upgrade OR connect succeeds but no markers (handler missing). **Spike checkpoint (spec risk #2):** if the ws upgrade itself is refused under cds-test, STOP and investigate whether the plugin attached (it hooks the server the same serve path cds-test uses; check for plugin log lines in the boot output). If the plugin genuinely cannot attach under cds-test, fall back per spec: keep this file but boot via `start-server-and-test`-style spawn in the test (document the pivot in the task commit message). Do not silently skip.

- [ ] **Step 5: Implement bootstrap + handler**

`test/sample-project/bookshop/srv/controller/chat-service/chat-service.ts`:

```ts
import { CDSDispatcher } from '../../../../../../lib';

import { ChatHandler } from './handler/ChatHandler';

export = new CDSDispatcher([ChatHandler]).initialize();
```

`test/sample-project/bookshop/srv/controller/chat-service/handler/ChatHandler.ts`:

```ts
import { OnWebSocketConnect, OnWebSocketDisconnect, OnWebSocketMessage, Req, UnboundActions } from '../../../../../../../lib';

import type { Request } from '../../../../../../../lib/types/types';

@UnboundActions()
export class ChatHandler {
  @OnWebSocketConnect()
  public async onConnect(@Req() req: Request) {
    console.log('[Chat] connect');
  }

  @OnWebSocketMessage('sendMessage')
  public async onMessage(@Req() req: Request<{ text: string }>) {
    console.log(`[Chat] message ${req.data.text}`);
    return req.data.text;
  }

  @OnWebSocketDisconnect()
  public async onDisconnect(@Req() req: Request<{ reason?: string }>) {
    console.log('[Chat] disconnect');
  }
}
```

(If `Request<T>` is not generic in this codebase's types, use plain `Request` and `(req.data as { text: string }).text` — copy the typing style of `UnboundActionsHandler.ts`.)

- [ ] **Step 6: Regenerate entities, run the test to verify it passes**

Run: `npm run build:entities:test --prefix ./test/sample-project/bookshop && npm run test:integration -- --testPathPattern WEBSOCKET`
Expected: PASS (3 tests).

- [ ] **Step 7: Full integration lane**

Run: `npm run test:integration`
Expected: PASS — especially `MONOREPO.test.ts` and `REGISTRATION-SEMANTICS.test.ts` unaffected by the new service.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json test/sample-project/bookshop/package.json test/sample-project/bookshop/srv/index.cds test/sample-project/bookshop/srv/controller/chat-service test/__tests__/integration/WEBSOCKET.test.ts
git commit -m "test(websocket): ChatService fixture over @cap-js-community/websocket with integration coverage"
```

---

### Task 9: WebSocket family — e2e smoke script

**Files:**
- Create: `test/__tests__/e2e/ws-smoke.js`
- Modify: root `package.json` (scripts: `test:ws:smoke`, `test:e2e:suite`; rewire `test:e2e`)

**Interfaces:**
- Consumes: ChatService at `ws://localhost:4004/ws/chat` from Task 8 (server booted by start-server-and-test); `ws` root devDep.
- Produces: `npm run test:e2e` = newman collection + ws smoke, both against one server boot.

- [ ] **Step 1: Write the smoke script**

`test/__tests__/e2e/ws-smoke.js` (plain node, CommonJS — it runs from the repo root where `ws` is a devDep):

```js
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
  socket.send(JSON.stringify({ event: 'sendMessage', data: { text: 'e2e-smoke' } }));
  // The handler returns the text; kind 'ws' answers on the socket. Any well-formed frame back = pass.
  socket.on('message', (raw) => {
    console.log(`[ws-smoke] received: ${raw}`);
    clearTimeout(timer);
    socket.close();
    console.log('[ws-smoke] PASS');
    process.exit(0);
  });
});
```

(If the server does not echo a response frame for action results under kind `ws`, relax the pass criterion: consider the smoke green once `open` succeeded and the send did not error — adjust by observing one real run, and leave the stricter variant commented with the observed behavior noted.)

- [ ] **Step 2: Wire the scripts**

Root `package.json`:

```json
    "test:ws:smoke": "node ./test/__tests__/e2e/ws-smoke.js",
    "test:e2e:suite": "run-s test:newman test:ws:smoke",
    "test:e2e": "start-server-and-test start:bookshop http://localhost:4004 test:e2e:suite",
```

(`test:newman` stays unchanged; `run-s` = npm-run-all, already a devDep — verify with `grep npm-run-all package.json`, and if absent use `"test:e2e:suite": "npm run test:newman && npm run test:ws:smoke"`.)

- [ ] **Step 3: Run the full e2e lane**

Run: `npm run test:e2e`
Expected: newman green (incl. Tasks 3/6 folders) then `[ws-smoke] PASS`.

- [ ] **Step 4: Commit**

```bash
git add test/__tests__/e2e/ws-smoke.js package.json
git commit -m "test(e2e): websocket smoke script chained after the newman collection"
```

---

### Task 10: README + backlog bookkeeping

**Files:**
- Modify: `README.md` (three new sections + overview/placement tables)
- Modify: `docs/DECORATOR-CANDIDATES.md` (#11, #17, #18 status flips + as-built notes; placement map)

**Interfaces:**
- Consumes: final shipped API of Tasks 1-9 (names, options, semantics — copy from the code/JSDoc, not from memory).
- Produces: user-facing docs; backlog telling the next batch what was learned.

- [ ] **Step 1: README sections**

Follow the structure of the Tier-1 sections (`@BeforeCommit` etc. — locate them and mirror heading depth, table style, and example formatting). Content requirements per family (each with a runnable example copied from the fixture handlers):

1. `@Throttle` — options table (`limit`, `window` ms, `by` default `'user'`); MUST state: fixed window; counters are per app instance AND per decorated method (multi-instance deployments = per-pod limits); stacking rule (below the handler decorator, keep a `@Req()` parameter); 429 + message shape; `@OnError` combination is a decoration-time error; service-global alternative `cds.middlewares.add(rateLimit(), { after: 'auth' })` pointer; `$batch` sub-requests count individually.
2. `@ServerLifecycle` + the three method decorators — host-class table gains the fifth host; per-event semantics exactly as pinned (served: sequential+awaited, pre-listen, throwing fails startup; listening: sync fire-and-forget, `{server,url}`; shutdown: parallel+awaited, `err|null`, MAY FIRE MORE THAN ONCE); args passed verbatim (no `@Req`-style parameter decorators); once-per-process-per-class registration; ordering (declaration order in class, `CDSDispatcher` array order across classes).
3. WebSocket family — prerequisite plugin `@cap-js-community/websocket` in the consumer app + `@protocol: 'websocket'`/`@ws` service; the modeled-actions requirement for `wsConnect`/`wsDisconnect(reason)`; hosting in `@UnboundActions` (no dedicated host class — one sentence why); wire-format example (`{"event":"sendMessage","data":{...}}` at `ws://host:port/ws/<path>`); `@OnWebSocketMessage` takes a plain string.

Update the README overview table / decorator index wherever the Tier-1 decorators were added (search for `BeforeCommit` in README to find every list that must grow).

- [ ] **Step 2: Backlog flips**

In `docs/DECORATOR-CANDIDATES.md`:
- Overview table rows #11, #17, #18 → `implemented (feature-batch2-decorators)`.
- Row #13 stays `candidate` — add `(skipped from batch-2 by decision 2026-07-29)` note in the Status cell.
- Each of #11/#17/#18 gets an `**Implemented (2026-07-29 — feature-batch2-decorators)**` block in Tier-1 as-built style covering at minimum: the callback-capture stacking rule (#11), the no-emit shutdown dispatch + no-once-guard discovery and the WeakSet dedup (#18), the modeled-actions requirement + `@UnboundActions`-only decision (#17), and any pivots made during implementation (read the actual commits/diff before writing).
- Placement map section: add `@ServerLifecycle` as a host row; update the "New host class decorators" subsection (its `@WebSocketHandler` entry gets the final "not shipped" resolution).

- [ ] **Step 3: Lint the docs**

Run: `npm run check`
Expected: PASS (prettier covers md).

- [ ] **Step 4: Commit**

```bash
git add README.md docs/DECORATOR-CANDIDATES.md
git commit -m "docs(readme): document @Throttle, @ServerLifecycle family and websocket decorators"
```

---

### Task 11: Full gates + build + typecheck

**Files:** none new — verification only (fixes go into the files they belong to).

- [ ] **Step 1: Full local gate sequence**

```bash
npm run check && npm run build && npm run typecheck:native && npm run test:unit && npm run test:integration && npm run test:e2e
```

Expected: every stage green. `npm run build` also proves tsup still bundles the enlarged `method.ts`/`index` surface.

- [ ] **Step 2: Coverage ratchet**

Run: `npm run test:coverage`
Expected: PASS with thresholds (85/70/85/85). If branches dip below 70, the usual gap is the throttle guard paths — cover the missing branch in `THROTTLE.test.ts` rather than lowering the ratchet.

- [ ] **Step 3: Commit any stragglers and push**

```bash
git status --short   # must be clean except intentional changes
git push -u origin feature-batch2-decorators
```

(Push only — PR creation is a separate user decision.)
