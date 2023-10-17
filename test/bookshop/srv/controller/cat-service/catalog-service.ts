import { CDSDispatcher } from '../../../../../lib/index';
import BookHandler from './handler/BookHandler';
import BookStatsHandler from './handler/BookStatsHandler';
import ReviewHandler from './handler/ReviewHandler';

module.exports = new CDSDispatcher([BookHandler, ReviewHandler, BookStatsHandler]).initializeEntityHandlers();
