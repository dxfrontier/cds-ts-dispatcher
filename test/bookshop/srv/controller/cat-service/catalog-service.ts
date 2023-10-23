import { CDSDispatcher } from '../../../../../dist';
import BookEventsHandler from './handler/BookEventsHandler';
import BookHandler from './handler/BookHandler';
import BookStatsHandler from './handler/BookStatsHandler';
import ReviewHandler from './handler/ReviewHandler';
import UnboundActionsHandler from './handler/UnboundActions';

module.exports = new CDSDispatcher([
  // Entities
  BookHandler,
  ReviewHandler,
  BookStatsHandler,
  // Draft
  BookEventsHandler,
  // Unbound actions
  UnboundActionsHandler,
]).initialize();
