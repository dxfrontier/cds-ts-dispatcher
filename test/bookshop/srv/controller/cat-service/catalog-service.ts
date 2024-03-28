import { CDSDispatcher } from '../../../../../lib';
import BookEventsHandler from './handler/BookEventsHandler';
import BookFormatsHandler from './handler/BookFormatsHandler';
import BookHandler from './handler/BookHandler';
import { BookOrdersHandler } from './handler/BookOrdersHandler';
import BookRecommendationsHandler from './handler/BookRecommendationsHandler';
import BookStatsHandler from './handler/BookStatsHandler';
import { PublishersHandler } from './handler/PublishersHandler';
import ReviewHandler from './handler/ReviewHandler';
import UnboundActionsHandler from './handler/UnboundActions';

export = new CDSDispatcher([
  // Entities
  BookHandler,
  ReviewHandler,
  BookStatsHandler,
  PublishersHandler,
  BookOrdersHandler,
  BookFormatsHandler,
  BookRecommendationsHandler,
  // Draft
  BookEventsHandler,
  // Unbound actions
  UnboundActionsHandler,
]).initialize();
