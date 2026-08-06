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
