import { CDSDispatcher } from '../../../../../lib/util/helpers/CDSDispatcher';
import PromotionHandler from './handler/PromotionsHandler';
import UserActivityLogHandler from './handler/UserActivityLogHandler';

module.exports = new CDSDispatcher([UserActivityLogHandler, PromotionHandler]).initialize();
