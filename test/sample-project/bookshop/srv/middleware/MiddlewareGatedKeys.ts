import type { MiddlewareImpl, NextMiddleware, Request } from '../../../../../lib/types/types';

/** Keys from this value upwards are reserved: every non-READ request on them is rejected. */
export const RESERVED_KEYS_FROM = 900;

/**
 * Gate middleware for the `GatedDraftService` fixture: rejects every non-READ request on a reserved
 * key with 403 and records one entry (`<event> <target>`) per execution, so tests can pin how often the
 * chain runs per request.
 */
export class MiddlewareGatedKeys implements MiddlewareImpl {
  public static readonly executions: string[] = [];

  private static keyOf(req: Request): number | undefined {
    const data = req.data as { ID?: number } | undefined;
    if (data?.ID !== undefined) {
      return Number(data.ID);
    }

    const lastParam = (req.params as unknown[] | undefined)?.at(-1);
    if (typeof lastParam === 'object' && lastParam !== null) {
      return Number((lastParam as { ID?: number }).ID);
    }

    return lastParam === undefined ? undefined : Number(lastParam);
  }

  public async use(req: Request, next: NextMiddleware): Promise<void> {
    MiddlewareGatedKeys.executions.push(`${req.event} ${req.target?.name}`);

    const key = MiddlewareGatedKeys.keyOf(req);
    if (req.event !== 'READ' && key !== undefined && key >= RESERVED_KEYS_FROM) {
      req.reject(403, `Key ${key} is reserved`);
    }

    await next();
  }
}
