using {sap.capire.bookshop as my} from '../../../db/schema';

service CatalogService {

  entity Books   as projection on my.Books;
  entity Authors as projection on my.Authors;
  entity Users   as projection on my.Users;
  entity Reviews as projection on my.Reviews;

  action submitOrder(book : Books:ID, quantity : Integer) returns {
    stock : Integer
  };


}
