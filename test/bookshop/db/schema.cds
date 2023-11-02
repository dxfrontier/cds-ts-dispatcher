using {
  Currency,
  managed,
  sap,
  cuid
} from '@sap/cds/common';

using {Roles} from './cds-types/types';

namespace sap.capire.bookshop;

// **************************************************************************************************
// Catalog - Service
// **************************************************************************************************

entity Books : managed {
  key ID       : Integer;
      title    : localized String(111)  @mandatory;
      descr    : localized String(1111);
      stock    : Integer;
      price    : Decimal;
      currency : Currency;
      image    : LargeBinary            @Core.MediaType: 'image/png';
      // Associations
      author   : Association to Authors @mandatory;
      genre    : Association to Genres;

      reviews  : Association to many Reviews
                   on reviews.book = $self;

      stats    : Association to one BookStats
                   on stats.book = $self;

}

entity BookStats : managed {
  key ID            : Integer;
      views         : Integer;
      averageRating : Double;
      book          : Association to one Books;
}

entity Authors : managed {
  key ID           : Integer;
      name         : String(111) @mandatory;
      dateOfBirth  : Date;
      dateOfDeath  : Date;
      placeOfBirth : String;
      placeOfDeath : String;
      books        : Association to many Books
                       on books.author = $self;


}

entity Genres : sap.common.CodeList {
  key ID       : Integer;
      parent   : Association to Genres;
      children : Composition of many Genres
                   on children.parent = $self;
}


entity Reviews : managed {
  key ID       : Integer;
      book     : Association to Books;
      reviewer : Association to Users;
      rating   : Integer
      @assert.range: [
        1,
        5
      ];
      comment  : String;
}

entity BookEvents : managed, cuid {
  name  : String;
  types : String enum {
    BOOK_SIGNING;
    AUTHOR_TALK;
    BOOK_LUNCH
  };

}


// **************************************************************************************************

// **************************************************************************************************
// Admin - Service
// **************************************************************************************************

entity Users : managed {
  key ID       : Integer;
      username : String(255) @mandatory;
      email    : String(255) @mandatory;
      role     : Roles       @mandatory;
      reviews  : Association to many Reviews
                   on reviews.reviewer = $self;
}

entity UserActivityLog : managed {
  key ID         : Integer;
      actionType : String
}

entity Promotions {
  key ID          : Integer;
      name        : String(255) @mandatory;
      description : String(1000);
      startDate   : Date        @mandatory;
      endDate     : Date        @mandatory;
      discount    : Decimal     @mandatory;
      // Add more fields as needed

      // Associations
      books       : Association to many Books;
// Add more associations as needed
}

// **************************************************************************************************
