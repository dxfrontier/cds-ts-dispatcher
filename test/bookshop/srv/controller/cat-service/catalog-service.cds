using {sap.capire.bookshop as Base} from '../../../db/schema';

service CatalogService {

  entity Books               as projection on Base.Books;
  entity Authors             as projection on Base.Authors
  entity Reviews             as projection on Base.Reviews;
  entity Publishers          as projection on Base.Publishers;
  entity BookOrders          as projection on Base.BookOrders;
  entity BookRecommendations as projection on Base.BookRecommendations;
  entity BookFormats         as projection on Base.BookFormats;
  entity BookSales           as projection on Base.BookSales;

  @odata.draft.enabled: true
  entity BookEvents          as projection on Base.BookEvents;

  entity BookStats           as projection on Base.BookStats
    actions { // Bound action / function
      action   GenerateReport(ID : Books:ID) returns {
        book : Books:title;
        stats : BookStats:views;
        rating : BookStats:averageRating
      };
      function NotifyAuthor(ID : Authors:ID) returns Boolean;
    };

  // Unbound action
  action   changeBookProperties(format : BookFormats:format, language : BookFormats:language) returns {
    language : String;
    format : BookFormats:format
  };

  // Unbound action
  action   submitOrder(book : Books:ID, quantity : Integer)                                   returns {
    stock : Integer
  };

  // Unbound function
  function submitOrderFunction(book : Books:ID, quantity : Integer)                           returns {
    stock : Integer
  };

  event OrderedBook : {
    book     : Books:ID;
    quantity : Integer;
    buyer    : String
  };
}
