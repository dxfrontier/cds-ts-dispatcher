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
        bookFormats?: __.Association.to.many<BookFormats>;
        bookRecomanddations?: __.Association.to.many<BookRecommendations>;
      static readonly actions: Record<never, never>
  };
}
export class Book extends _._managedAspect(_BookAspect(__.Entity)) {}
Object.defineProperty(Book, 'name', { value: 'sap.capire.bookshop.Books' })
Object.defineProperty(Book, 'is_singular', { value: true })
export class Books extends Array<Book> {$count?: number}
Object.defineProperty(Books, 'name', { value: 'sap.capire.bookshop.Books' })

export function _PublisherAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Publisher extends Base {
        ID?: number;
        name?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class Publisher extends _._managedAspect(_PublisherAspect(__.Entity)) {}
Object.defineProperty(Publisher, 'name', { value: 'sap.capire.bookshop.Publishers' })
Object.defineProperty(Publisher, 'is_singular', { value: true })
export class Publishers extends Array<Publisher> {$count?: number}
Object.defineProperty(Publishers, 'name', { value: 'sap.capire.bookshop.Publishers' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends Base {
        ID?: number;
        views?: number | null;
        averageRating?: number | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class BookStat extends _._managedAspect(_BookStatAspect(__.Entity)) {}
Object.defineProperty(BookStat, 'name', { value: 'sap.capire.bookshop.BookStats' })
Object.defineProperty(BookStat, 'is_singular', { value: true })
export class BookStats extends Array<BookStat> {$count?: number}
Object.defineProperty(BookStats, 'name', { value: 'sap.capire.bookshop.BookStats' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
        ID?: number;
        name?: string | null;
        dateOfBirth?: __.CdsDate | null;
        dateOfDeath?: __.CdsDate | null;
        placeOfBirth?: string | null;
        placeOfDeath?: string | null;
        books?: __.Association.to.many<Books>;
      static readonly actions: Record<never, never>
  };
}
export class Author extends _._managedAspect(_AuthorAspect(__.Entity)) {}
Object.defineProperty(Author, 'name', { value: 'sap.capire.bookshop.Authors' })
Object.defineProperty(Author, 'is_singular', { value: true })
export class Authors extends Array<Author> {$count?: number}
Object.defineProperty(Authors, 'name', { value: 'sap.capire.bookshop.Authors' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends Base {
        ID?: number;
        parent?: __.Association.to<Genre> | null;
        parent_ID?: number | null;
        children?: __.Composition.of.many<Genres>;
      static readonly actions: Record<never, never>
  };
}
export class Genre extends _sap_common._CodeListAspect(_GenreAspect(__.Entity)) {}
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
Object.defineProperty(Genre, 'is_singular', { value: true })
export class Genres extends Array<Genre> {$count?: number}
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
      static readonly actions: Record<never, never>
  };
}
export class Review extends _._managedAspect(_ReviewAspect(__.Entity)) {}
Object.defineProperty(Review, 'name', { value: 'sap.capire.bookshop.Reviews' })
Object.defineProperty(Review, 'is_singular', { value: true })
export class Reviews extends Array<Review> {$count?: number}
Object.defineProperty(Reviews, 'name', { value: 'sap.capire.bookshop.Reviews' })

export function _BookEventAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookEvent extends Base {
        name?: string | null;
        types?: _.BookTypes | null;
      static readonly actions: Record<never, never>
  };
}
export class BookEvent extends _._managedAspect(_._cuidAspect(_BookEventAspect(__.Entity))) {static drafts: typeof BookEvent}
Object.defineProperty(BookEvent, 'name', { value: 'sap.capire.bookshop.BookEvents' })
Object.defineProperty(BookEvent, 'is_singular', { value: true })
export class BookEvents extends Array<BookEvent> {static drafts: typeof BookEvent
$count?: number}
Object.defineProperty(BookEvents, 'name', { value: 'sap.capire.bookshop.BookEvents' })

export function _BookSaleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSale extends Base {
        ID?: number;
        saleDate?: __.CdsDate | null;
        saleAmount?: number | null;
        quantity?: number | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
        customer?: __.Association.to<User> | null;
        customer_ID?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class BookSale extends _._managedAspect(_._cuidAspect(_BookSaleAspect(__.Entity))) {}
Object.defineProperty(BookSale, 'name', { value: 'sap.capire.bookshop.BookSales' })
Object.defineProperty(BookSale, 'is_singular', { value: true })
export class BookSales extends Array<BookSale> {$count?: number}
Object.defineProperty(BookSales, 'name', { value: 'sap.capire.bookshop.BookSales' })

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends Base {
        ID?: number;
        username?: string | null;
        email?: string | null;
        role?: _.Roles | null;
        reviews?: __.Association.to.many<Reviews>;
      static readonly actions: Record<never, never>
  };
}
export class User extends _._managedAspect(_UserAspect(__.Entity)) {}
Object.defineProperty(User, 'name', { value: 'sap.capire.bookshop.Users' })
Object.defineProperty(User, 'is_singular', { value: true })
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'sap.capire.bookshop.Users' })

export function _UserActivityLogAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class UserActivityLog extends Base {
        ID?: number;
        actionType?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class UserActivityLog extends _._managedAspect(_UserActivityLogAspect(__.Entity)) {static drafts: typeof UserActivityLog}
Object.defineProperty(UserActivityLog, 'name', { value: 'sap.capire.bookshop.UserActivityLog' })
Object.defineProperty(UserActivityLog, 'is_singular', { value: true })
export class UserActivityLog_ extends Array<UserActivityLog> {static drafts: typeof UserActivityLog
$count?: number}
Object.defineProperty(UserActivityLog_, 'name', { value: 'sap.capire.bookshop.UserActivityLog' })

export function _PromotionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Promotion extends Base {
        ID?: number;
        name?: string | null;
        description?: string | null;
        startDate?: __.CdsDate | null;
        endDate?: __.CdsDate | null;
        discount?: number | null;
        books?: __.Association.to.many<Books>;
      static readonly actions: Record<never, never>
  };
}
export class Promotion extends _PromotionAspect(__.Entity) {static drafts: typeof Promotion}
Object.defineProperty(Promotion, 'name', { value: 'sap.capire.bookshop.Promotions' })
Object.defineProperty(Promotion, 'is_singular', { value: true })
export class Promotions extends Array<Promotion> {static drafts: typeof Promotion
$count?: number}
Object.defineProperty(Promotions, 'name', { value: 'sap.capire.bookshop.Promotions' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends Base {
        ID?: number;
        orderNumber?: string | null;
        orderDate?: __.CdsDate | null;
        totalAmount?: number | null;
        status?: string | null;
        customer?: __.Association.to<User> | null;
        customer_ID?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class BookOrder extends _._managedAspect(_BookOrderAspect(__.Entity)) {}
Object.defineProperty(BookOrder, 'name', { value: 'sap.capire.bookshop.BookOrders' })
Object.defineProperty(BookOrder, 'is_singular', { value: true })
export class BookOrders extends Array<BookOrder> {$count?: number}
Object.defineProperty(BookOrders, 'name', { value: 'sap.capire.bookshop.BookOrders' })

export function _BookRecommendationAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookRecommendation extends Base {
        ID?: number;
        rating?: number | null;
        comment?: string | null;
        description?: string | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
        recommended?: __.Association.to<Book> | null;
        recommended_ID?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class BookRecommendation extends _._managedAspect(_BookRecommendationAspect(__.Entity)) {}
Object.defineProperty(BookRecommendation, 'name', { value: 'sap.capire.bookshop.BookRecommendations' })
Object.defineProperty(BookRecommendation, 'is_singular', { value: true })
export class BookRecommendations extends Array<BookRecommendation> {$count?: number}
Object.defineProperty(BookRecommendations, 'name', { value: 'sap.capire.bookshop.BookRecommendations' })

export function _BookFormatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookFormat extends Base {
        ID?: number;
        format?: string | null;
        price?: number | null;
        pages?: number | null;
        language?: string | null;
        publicationDate?: __.CdsDate | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class BookFormat extends _._managedAspect(_BookFormatAspect(__.Entity)) {}
Object.defineProperty(BookFormat, 'name', { value: 'sap.capire.bookshop.BookFormats' })
Object.defineProperty(BookFormat, 'is_singular', { value: true })
export class BookFormats extends Array<BookFormat> {$count?: number}
Object.defineProperty(BookFormats, 'name', { value: 'sap.capire.bookshop.BookFormats' })
