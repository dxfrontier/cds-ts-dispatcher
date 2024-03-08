// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './../../..';
import * as __ from './../../../_';
import * as _sap_common from './../../common';
export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        ID?: number;
        title?: string | null;
        descr?: string | null;
        stock?: number | null;
        price?: number | null;
    /**
    * Type for an association to Currencies
    * 
    * See https://cap.cloud.sap/docs/cds/common#type-currency
    */
        currency?: _.Currency | null;
        currency_code?: string | null;
        image?: Buffer | string | {value: import("stream").Readable, $mediaContentType: string, $mediaContentDispositionFilename?: string, $mediaContentDispositionType?: string} | null;
        author?: __.Association.to<Author> | null;
        author_ID?: number | null;
        genre?: __.Association.to<Genre> | null;
        genre_ID?: number | null;
        reviews?: __.Association.to.many<Reviews>;
        stats?: __.Association.to<BookStat> | null;
        stats_ID?: number | null;
      static actions: {
      }
  };
}
export class Book extends _._managedAspect(_BookAspect(__.Entity)) {}
export class Books extends Array<Book> {}
Object.defineProperty(Book, 'name', { value: 'sap.capire.bookshop.Books' })
Object.defineProperty(Books, 'name', { value: 'sap.capire.bookshop.Books' })

export function _PublisherAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Publisher extends Base {
        ID?: number;
        name?: string | null;
      static actions: {
      }
  };
}
export class Publisher extends _._managedAspect(_PublisherAspect(__.Entity)) {}
export class Publishers extends Array<Publisher> {}
Object.defineProperty(Publisher, 'name', { value: 'sap.capire.bookshop.Publishers' })
Object.defineProperty(Publishers, 'name', { value: 'sap.capire.bookshop.Publishers' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends Base {
        ID?: number | null;
        views?: number | null;
        averageRating?: number | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
      static actions: {
      }
  };
}
export class BookStat extends _._managedAspect(_BookStatAspect(__.Entity)) {}
export class BookStats extends Array<BookStat> {}
Object.defineProperty(BookStat, 'name', { value: 'sap.capire.bookshop.BookStats' })
Object.defineProperty(BookStats, 'name', { value: 'sap.capire.bookshop.BookStats' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
        ID?: number | null;
        name?: string | null;
        dateOfBirth?: string | null;
        dateOfDeath?: string | null;
        placeOfBirth?: string | null;
        placeOfDeath?: string | null;
        books?: __.Association.to.many<Books>;
      static actions: {
      }
  };
}
export class Author extends _._managedAspect(_AuthorAspect(__.Entity)) {}
export class Authors extends Array<Author> {}
Object.defineProperty(Author, 'name', { value: 'sap.capire.bookshop.Authors' })
Object.defineProperty(Authors, 'name', { value: 'sap.capire.bookshop.Authors' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends Base {
        ID?: number | null;
        parent?: __.Association.to<Genre> | null;
        parent_ID?: number | null;
        children?: __.Composition.of.many<Genres>;
      static actions: {
      }
  };
}
export class Genre extends _sap_common._CodeListAspect(_GenreAspect(__.Entity)) {}
export class Genres extends Array<Genre> {}
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
Object.defineProperty(Genres, 'name', { value: 'sap.capire.bookshop.Genres' })

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
        ID?: number;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
        reviewer?: __.Association.to<User> | null;
        reviewer_ID?: number | null;
        rating?: number | null;
        comment?: string | null;
      static actions: {
      }
  };
}
export class Review extends _._managedAspect(_ReviewAspect(__.Entity)) {}
export class Reviews extends Array<Review> {}
Object.defineProperty(Review, 'name', { value: 'sap.capire.bookshop.Reviews' })
Object.defineProperty(Reviews, 'name', { value: 'sap.capire.bookshop.Reviews' })

export function _BookEventAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookEvent extends Base {
        name?: string | null;
        types?: _.BookTypes | null;
      static actions: {
      }
  };
}
export class BookEvent extends _._managedAspect(_._cuidAspect(_BookEventAspect(__.Entity))) {static drafts: typeof BookEvent}
export class BookEvents extends Array<BookEvent> {static drafts: typeof BookEvent}
Object.defineProperty(BookEvent, 'name', { value: 'sap.capire.bookshop.BookEvents' })
Object.defineProperty(BookEvents, 'name', { value: 'sap.capire.bookshop.BookEvents' })

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends Base {
        ID?: number | null;
        username?: string | null;
        email?: string | null;
        role?: _.Roles | null;
        reviews?: __.Association.to.many<Reviews>;
      static actions: {
      }
  };
}
export class User extends _._managedAspect(_UserAspect(__.Entity)) {}
export class Users extends Array<User> {}
Object.defineProperty(User, 'name', { value: 'sap.capire.bookshop.Users' })
Object.defineProperty(Users, 'name', { value: 'sap.capire.bookshop.Users' })

export function _UserActivityLogAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class UserActivityLog extends Base {
        ID?: number;
        actionType?: string | null;
      static actions: {
      }
  };
}
export class UserActivityLog extends _._managedAspect(_UserActivityLogAspect(__.Entity)) {static drafts: typeof UserActivityLog}
export class UserActivityLog_ extends Array<UserActivityLog> {static drafts: typeof UserActivityLog}
Object.defineProperty(UserActivityLog, 'name', { value: 'sap.capire.bookshop.UserActivityLog' })
Object.defineProperty(UserActivityLog_, 'name', { value: 'sap.capire.bookshop.UserActivityLog' })

export function _PromotionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Promotion extends Base {
        ID?: number;
        name?: string | null;
        description?: string | null;
        startDate?: string | null;
        endDate?: string | null;
        discount?: number | null;
        books?: __.Association.to.many<Books>;
      static actions: {
      }
  };
}
export class Promotion extends _PromotionAspect(__.Entity) {static drafts: typeof Promotion}
export class Promotions extends Array<Promotion> {static drafts: typeof Promotion}
Object.defineProperty(Promotion, 'name', { value: 'sap.capire.bookshop.Promotions' })
Object.defineProperty(Promotions, 'name', { value: 'sap.capire.bookshop.Promotions' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends Base {
        ID?: number;
        orderNumber?: string | null;
        orderDate?: string | null;
        totalAmount?: number | null;
        status?: string | null;
        customer?: __.Association.to<User> | null;
        customer_ID?: number | null;
      static actions: {
      }
  };
}
export class BookOrder extends _._managedAspect(_BookOrderAspect(__.Entity)) {}
export class BookOrders extends Array<BookOrder> {}
Object.defineProperty(BookOrder, 'name', { value: 'sap.capire.bookshop.BookOrders' })
Object.defineProperty(BookOrders, 'name', { value: 'sap.capire.bookshop.BookOrders' })
