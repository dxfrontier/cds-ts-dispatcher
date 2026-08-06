using {sap.capire.bookshop as Base} from '../../../db/schema';

service CatalogService {

  entity Books               as projection on Base.Books;
  entity Authors             as projection on Base.Authors;
  entity Reviews             as projection on Base.Reviews;
  entity Publishers          as projection on Base.Publishers;
  entity BookOrders          as projection on Base.BookOrders;
  entity BookRecommendations as projection on Base.BookRecommendations;
  entity BookFormats         as projection on Base.BookFormats;
  entity BookSales           as projection on Base.BookSales;
  entity Wishlists           as projection on Base.Wishlists;
  entity ShoppingCart        as projection on Base.ShoppingCart;
  entity BookSeries          as projection on Base.BookSeries;

  @odata.draft.enabled: true
  entity BookEvents          as projection on Base.BookEvents;

  entity BookStats           as projection on Base.BookStats
    actions { // Bound action / function
      action   GenerateReport(ID: Books:ID) returns {
        book   : Books:title;
        stats  : BookStats:views;
        rating : BookStats:averageRating
      };
      function NotifyAuthor(ID: Authors:ID) returns Boolean;
    };

  // Unbound action
  action   changeBookProperties(format: BookFormats:format, language: BookFormats:language) returns {
    language : String;
    format   : BookFormats:format
  };

  // Unbound action
  action   submitOrder(book: Books:ID, quantity: Integer)                                   returns {
    stock : Integer
  };

  action   submitStock(book: Books:ID, quantity: Integer)                                   returns {
    stock : Integer
  };

  action   submitQuantity(quantity: Integer)                                                returns {
    stock : Integer
  };

  // Unbound action - F7: rate-limited by the lib's @Throttle({ limit: 3, window: 10_000 }).
  action throttledPing() returns String;

  // Unbound function
  function submitOrderFunction(book: Books:ID, quantity: Integer)                           returns {
    stock : Integer
  };

  // Unbound function - F5 @Stream : streams book rows as NDJSON to the HTTP response
  function streamBooks()                                                                    returns LargeBinary;

  // Unbound action - F6: Manager-only, guarded by the lib's @ExecutionAllowedForRole('Manager').
  // `@requires: authenticated-user` rejects anonymous/invalid credentials at the framework level
  // (401) before the handler (and therefore @ExecutionAllowedForRole) is ever reached.
  @(requires: 'authenticated-user')
  action   adminOnlyAction()                                                                returns {
    message : String
  };

  event OrderedBook : {
    book     : Books:ID;
    quantity : Integer;
    buyer    : String
  };

  event event_2 : {
    foo : Integer;
    bar : String;
  }
}
