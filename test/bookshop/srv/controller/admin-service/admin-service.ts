import { CDSDispatcher } from '../../../../../dist/index';
import BookStatsHandler from '../cat-service/handler/BookStatsHandler';

module.exports = new CDSDispatcher([BookStatsHandler]).initialize();
