import {
  AfterAll,
  CDS_DISPATCHER,
  EntityHandler,
  Exclude,
  FieldsFormatter,
  Include,
  Mask,
  Req,
  Result,
} from '../../../../../../../lib';

import type { Request } from '../../../../../../../lib';
import type { RobustnessItem } from '#cds-models/RobustnessService';

/** Logs the result a transformer-stacked `@AfterAll` handler received: `[RobustnessTransformers] received=<typeof>:<JSON>`. */
const logReceived = (value: unknown): void => {
  console.log(`[RobustnessTransformers] received=${typeof value}:${JSON.stringify(value)}`);
};

/**
 * Wildcard `@AfterAll` on an `ALL_ENTITIES` host with `@Mask` / `@Exclude` / `@Include` / `@FieldsFormatter`
 * stacked: it also fires for the unbound functions/actions of `RobustnessService`, whose raw (non-object)
 * results must pass through the transformers untouched.
 */
@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)
class RobustnessTransformersHandler {
  @AfterAll()
  @Mask<RobustnessItem>(['name'])
  @Exclude<RobustnessItem>('name')
  @Include<RobustnessItem>('ID', 'name')
  @FieldsFormatter<RobustnessItem>({ action: 'toUpper' }, 'name')
  public async afterAll(@Result() result: unknown, @Req() req: Request): Promise<void> {
    logReceived(result);
  }
}

export default RobustnessTransformersHandler;
