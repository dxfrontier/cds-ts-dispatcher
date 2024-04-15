import { CDSDispatcher } from '../../../../../lib';
import PromotionHandler from './handler/PromotionsHandler';
import UserActivityLogHandler from './handler/UserActivityLogHandler';

export = new CDSDispatcher([UserActivityLogHandler, PromotionHandler]).initialize();
