import { CDSDispatcher } from '../../../../../lib/index';
import BookHandler from './handler/BookHandler';
import ReviewHandler from './handler/ReviewHandler';

module.exports = new CDSDispatcher([BookHandler, ReviewHandler]).initializeEntityHandlers();
