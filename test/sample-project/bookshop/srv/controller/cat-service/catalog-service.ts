import { ShoppingCart } from '#cds-models/CatalogService';
import { CDSDispatcher } from '../../../../../../lib';
import AllEntities from '../shared-handlers/AllHandlers';
import AdminOnlyActionHandler from './handler/AdminOnlyActionHandler';
import AuthorsHandler from './handler/AuthorsHandler';
import BookEventsHandler from './handler/BookEventsHandler';
import BookFormatsHandler from './handler/BookFormatsHandler';
import BookHandler from './handler/BookHandler';
import BookLifecycleHandler from './handler/BookLifecycleHandler';
import BookOrdersHandler from './handler/BookOrdersHandler';
import BookParamsHandler from './handler/BookParamsHandler';
import BookRecommendationsHandler from './handler/BookRecommendationsHandler';
import BookSalesHandler from './handler/BookSalesHandler';
import BookSeriesHandler from './handler/BookSeriesHandler';
import BookStatsHandler from './handler/BookStatsHandler';
import PublishersHandler from './handler/PublishersHandler';
import ReviewHandler from './handler/ReviewHandler';
import ScheduledTasksHandler from './handler/ScheduledTasksHandler';
import ShoppingCartHandler from './handler/ShoppingCart';
import ThrottledActionsHandler from './handler/ThrottledActionsHandler';
import UnboundActionsHandler from './handler/UnboundActions';
import WishlistsHandler from './handler/WishlistsHandler';
import ServerLifecycleHandler from '../shared-handlers/ServerLifecycleHandler';

export = new CDSDispatcher([
  // Entities
  BookHandler,
  ReviewHandler,
  BookStatsHandler,
  PublishersHandler,
  BookOrdersHandler,
  BookFormatsHandler,
  BookRecommendationsHandler,
  BookSalesHandler,
  WishlistsHandler,
  ShoppingCartHandler,
  BookSeriesHandler,
  AuthorsHandler,
  BookParamsHandler,
  // Draft
  BookEventsHandler,

  // Request lifecycle (per-root-request commit/succeeded/failed/done)
  BookLifecycleHandler,

  // Server lifecycle (cds.on served/listening/shutdown)
  ServerLifecycleHandler,

  // Unbound actions
  UnboundActionsHandler,
  AdminOnlyActionHandler,
  ThrottledActionsHandler,

  // Scheduled tasks (cds 10 event-queue)
  ScheduledTasksHandler,

  // All entities
  AllEntities,
]).initialize();
