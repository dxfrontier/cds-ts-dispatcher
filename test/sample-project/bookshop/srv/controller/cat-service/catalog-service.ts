import { ShoppingCart } from '#cds-models/CatalogService';
import { CDSDispatcher } from '../../../../../../lib';
import AllEntities from '../shared-handlers/AllHandlers';
import AuthorsHandler from './handler/AuthorsHandler';
import BookEventsHandler from './handler/BookEventsHandler';
import BookFormatsHandler from './handler/BookFormatsHandler';
import BookHandler from './handler/BookHandler';
import BookOrdersHandler from './handler/BookOrdersHandler';
import BookRecommendationsHandler from './handler/BookRecommendationsHandler';
import BookSalesHandler from './handler/BookSalesHandler';
import BookSeriesHandler from './handler/BookSeriesHandler';
import BookStatsHandler from './handler/BookStatsHandler';
import PublishersHandler from './handler/PublishersHandler';
import ReviewHandler from './handler/ReviewHandler';
import ShoppingCartHandler from './handler/ShoppingCart';
import UnboundActionsHandler from './handler/UnboundActions';
import WishlistsHandler from './handler/WishlistsHandler';

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
  // Draft
  BookEventsHandler,

  // Unbound actions
  UnboundActionsHandler,

  // All entities
  AllEntities,
]).initialize();
