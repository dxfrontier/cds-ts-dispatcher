using {sap.capire.bookshop as my} from '../../../db/schema';

service CatalogService {

  entity Books     as projection on my.Books;
  entity Authors   as projection on my.Authors;
  entity Reviews   as projection on my.Reviews;
  entity BookStats as projection on my.BookStats;

  action submitOrder(book : Books:ID, quantity : Integer) returns {
    stock : Integer
  };


}
