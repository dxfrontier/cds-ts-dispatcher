import { throttledPing } from '#cds-models/CatalogService';

import { ActionRequest, ActionReturn, OnAction, Req, Throttle, UnboundActions } from '../../../../../../../lib';

/**
 * F7: rate-limited unbound action, used for the integration/e2e coverage of
 * `@Throttle({ limit: 3, window: 10_000 })` - see the `THROTTLE.test.ts` integration suite and the
 * `Throttle - @Throttle 429` folder in the postman collection for the empirically-pinned status codes.
 */
@UnboundActions()
class ThrottledActionsHandler {
  @OnAction(throttledPing)
  @Throttle({ limit: 3, window: 10_000 })
  public async onThrottledPing(@Req() req: ActionRequest<typeof throttledPing>): ActionReturn<typeof throttledPing> {
    return 'pong';
  }
}

export default ThrottledActionsHandler;
