import { AfterAll, CDS_DISPATCHER, EntityHandler, Req, Result } from '../../../../../../../lib';

import type { Request } from '../../../../../../../lib';

/** Logs the raw result a wildcard `@AfterAll` handler received: `[RobustnessAfterAll] received=<typeof>:<JSON>`. */
const logReceived = (value: unknown): void => {
  console.log(`[RobustnessAfterAll] received=${typeof value}:${JSON.stringify(value)}`);
};

/**
 * On an `ALL_ENTITIES` host, `@AfterAll` registers `srv.after('*', '*', callback)` - CAP drops the path
 * filter entirely for `'*'`, so this ALSO fires for the unbound functions/actions of `RobustnessService`
 * (`RobustnessActionsHandler`). It must receive their raw result unchanged, same as their own
 * `@AfterFunction` / `@AfterAction` handlers.
 */
@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)
class RobustnessAfterAllHandler {
  @AfterAll()
  public async afterAll(@Result() result: unknown, @Req() req: Request): Promise<void> {
    logReceived(result);
  }
}

export default RobustnessAfterAllHandler;
