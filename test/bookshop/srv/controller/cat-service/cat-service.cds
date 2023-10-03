using {sap.capire.bookshop as my} from '../../../db/schema';

type HelloRequest {
  greeterName : String;
  toName      : String;
}

type HelloResponse {
  greetingMessage : String;
}

service CatalogService {

  /**
   * For displaying lists of Books
   */
  @readonly
  entity ListOfBooks as projection on Books excluding {
    descr
  };

  /**
   * For display in details pages
   */
  @readonly
  entity Books       as projection on my.Books {
    *,
    author.name as author
  } excluding {
    createdBy,
    modifiedBy
  };

  action   submitOrder(book : Books:ID, quantity : Integer)         returns {
    stock : Integer
  };

  function submitFunctionOrder(book : Books:ID, quantity : Integer) returns {
    stock : Integer
  };

  event OrderedBook : {
    book     : Books:ID;
    quantity : Integer;
    buyer    : String
  };

  action   sendMail(request : HelloRequest)                         returns HelloResponse;
}
