import { CDSDispatcher } from '../../../../../dist/index';
import UserActivityLogHandler from './handler/UserActivityLogHandler';

module.exports = new CDSDispatcher([UserActivityLogHandler]).initialize();
