using {
  Currency,
  managed,
  sap
} from '@sap/cds/common';

namespace sap.capire.bookshop;

type Roles : String enum {
  USER;
  ADMIN;
}

entity Books : managed {
  key ID       : Integer;
      title    : localized String(111)  @mandatory;
      descr    : localized String(1111);
      author   : Association to Authors @mandatory;
      genre    : Association to Genres;
      reviews  : Association to many Reviews;
      stock    : Integer;
      price    : Decimal;
      currency : Currency;
      image    : LargeBinary            @Core.MediaType: 'image/png';
}

entity BookStatistics : managed {
  key ID            : Integer;
      views         : Integer;
      averageRating : Decimal(3, 2);
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

/**
 * Hierarchically organized Code List for Genres
 */
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

entity Users : managed {
  key ID       : Integer;
      username : String(255) @mandatory;
      email    : String(255) @mandatory;
      role     : Roles;
      reviews  : Association to many Reviews
                   on reviews.reviewer = $self;
}

entity UserActivityLog : managed {
  key ID         : Integer;
      actionType : String
}
