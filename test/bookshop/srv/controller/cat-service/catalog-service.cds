using {sap.capire.bookshop as my} from '../../../db/schema';

service CatalogService {

  entity Books      as projection on my.Books;
  entity Authors    as projection on my.Authors
  entity Reviews    as projection on my.Reviews;

  @odata.draft.enabled: true
  entity BookEvents as projection on my.BookEvents;

  entity BookStats  as projection on my.BookStats actions { // Bound action / function
    action   GenerateReport(ID : Books:ID) returns {
      book : Books:title;
      stats : BookStats:views;
      rating : BookStats:averageRating
    };
    function NotifyAuthor(ID : Authors:ID) returns Boolean;
  };

  // Unbound action
  action   submitOrder(book : Books:ID, quantity : Integer)         returns {
    stock : Integer
  };

  // Unbound function
  function submitOrderFunction(book : Books:ID, quantity : Integer) returns {
    stock : Integer
  };

}
