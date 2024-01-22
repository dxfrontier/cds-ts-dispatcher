import { CDSDispatcher } from '../../../../../lib';
import BookEventsHandler from './handler/BookEventsHandler';
import BookHandler from './handler/BookHandler';
import BookStatsHandler from './handler/BookStatsHandler';
import { PublishersHandler } from './handler/PublishersHandler';
import ReviewHandler from './handler/ReviewHandler';
import UnboundActionsHandler from './handler/UnboundActions';

module.exports = new CDSDispatcher([
  // Entities
  BookHandler,
  ReviewHandler,
  BookStatsHandler,
  PublishersHandler,
  // Draft
  BookEventsHandler,
  // Unbound actions
  UnboundActionsHandler,
]).initialize();
