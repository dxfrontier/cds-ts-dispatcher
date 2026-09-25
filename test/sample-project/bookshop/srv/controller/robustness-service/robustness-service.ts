import { CDSDispatcher } from '../../../../../../lib';

import RobustnessActionsHandler from './handler/RobustnessActionsHandler';
import RobustnessAfterAllHandler from './handler/RobustnessAfterAllHandler';
import RobustnessTransformersHandler from './handler/RobustnessTransformersHandler';

export = new CDSDispatcher([
  // Unbound actions / functions
  RobustnessActionsHandler,
  // Wildcard @AfterAll on an ALL_ENTITIES host - receives unbound action/function results unchanged
  RobustnessAfterAllHandler,
  // Wildcard @AfterAll + @Mask / @Exclude / @FieldsFormatter - raw action/function results pass through untouched
  RobustnessTransformersHandler,
]).initialize();
