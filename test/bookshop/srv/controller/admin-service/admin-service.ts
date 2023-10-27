import { CDSDispatcher } from '../../../../../dist/index';
import PromotionHandler from './handler/PromotionsHandler';
import UserActivityLogHandler from './handler/UserActivityLogHandler';

module.exports = new CDSDispatcher([UserActivityLogHandler, PromotionHandler]).initialize();
