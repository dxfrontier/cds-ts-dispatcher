import { CDSDispatcher } from '../../../../../lib/index';
import BookStatsHandler from '../cat-service/handler/BookStatsHandler';

module.exports = new CDSDispatcher([BookStatsHandler]).initializeEntityHandlers();
