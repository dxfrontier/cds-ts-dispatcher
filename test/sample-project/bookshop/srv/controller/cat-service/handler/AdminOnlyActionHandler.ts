import { adminOnlyAction } from '#cds-models/CatalogService';

import {
  ActionRequest,
  ActionReturn,
  ExecutionAllowedForRole,
  OnAction,
  Req,
  UnboundActions,
} from '../../../../../../../lib';

/**
 * F6: Manager-only unbound action, used for the e2e "denial path" coverage of
 * `@ExecutionAllowedForRole('Manager')` - see the `@ExecutionAllowedForRole` folder in the
 * postman collection for the empirically-pinned status codes / response bodies.
 */
@UnboundActions()
class AdminOnlyActionHandler {
  @OnAction('adminOnlyAction')
  @ExecutionAllowedForRole('Manager')
  public async adminOnlyAction(
    @Req() req: ActionRequest<typeof adminOnlyAction>,
  ): ActionReturn<typeof adminOnlyAction> {
    return { message: 'Manager-only action executed successfully' };
  }
}

export default AdminOnlyActionHandler;
