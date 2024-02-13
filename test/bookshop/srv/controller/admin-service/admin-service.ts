import { CDSDispatcher } from '../../../../../lib/util/helpers/CDSDispatcher';
import PromotionHandler from './handler/PromotionsHandler';
import UserActivityLogHandler from './handler/UserActivityLogHandler';

export = new CDSDispatcher([UserActivityLogHandler, PromotionHandler]).initialize();
