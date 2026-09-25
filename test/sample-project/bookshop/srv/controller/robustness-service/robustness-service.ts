import { CDSDispatcher } from '../../../../../../lib';

import RobustnessActionsHandler from './handler/RobustnessActionsHandler';
import RobustnessAfterAllHandler from './handler/RobustnessAfterAllHandler';

export = new CDSDispatcher([
  // Unbound actions / functions
  RobustnessActionsHandler,
  // Wildcard @AfterAll on an ALL_ENTITIES host - must not corrupt unbound action/function results
  RobustnessAfterAllHandler,
]).initialize();
