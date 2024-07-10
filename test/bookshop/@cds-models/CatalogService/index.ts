// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as _sap_common from './../sap/common';
export default { name: 'CatalogService' }
export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
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
Object.defineProperty(Book, 'name', { value: 'CatalogService.Books' })
Object.defineProperty(Book, 'is_singular', { value: true })
export class Books extends Array<Book> {$count?: number}
Object.defineProperty(Books, 'name', { value: 'CatalogService.Books' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
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
Object.defineProperty(Author, 'name', { value: 'CatalogService.Authors' })
Object.defineProperty(Author, 'is_singular', { value: true })
export class Authors extends Array<Author> {$count?: number}
Object.defineProperty(Authors, 'name', { value: 'CatalogService.Authors' })

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
        reviewer?: __.Association.to<_sap_capire_bookshop.User> | null;
        reviewer_ID?: number | null;
        rating?: number | null;
        comment?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class Review extends _._managedAspect(_ReviewAspect(__.Entity)) {}
Object.defineProperty(Review, 'name', { value: 'CatalogService.Reviews' })
Object.defineProperty(Review, 'is_singular', { value: true })
export class Reviews extends Array<Review> {$count?: number}
Object.defineProperty(Reviews, 'name', { value: 'CatalogService.Reviews' })

export function _PublisherAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Publisher extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        name?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class Publisher extends _._managedAspect(_PublisherAspect(__.Entity)) {}
Object.defineProperty(Publisher, 'name', { value: 'CatalogService.Publishers' })
Object.defineProperty(Publisher, 'is_singular', { value: true })
export class Publishers extends Array<Publisher> {$count?: number}
Object.defineProperty(Publishers, 'name', { value: 'CatalogService.Publishers' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        orderNumber?: string | null;
        orderDate?: __.CdsDate | null;
        totalAmount?: number | null;
        status?: string | null;
        customer?: __.Association.to<_sap_capire_bookshop.User> | null;
        customer_ID?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class BookOrder extends _._managedAspect(_BookOrderAspect(__.Entity)) {}
Object.defineProperty(BookOrder, 'name', { value: 'CatalogService.BookOrders' })
Object.defineProperty(BookOrder, 'is_singular', { value: true })
export class BookOrders extends Array<BookOrder> {$count?: number}
Object.defineProperty(BookOrders, 'name', { value: 'CatalogService.BookOrders' })

export function _BookRecommendationAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookRecommendation extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
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
Object.defineProperty(BookRecommendation, 'name', { value: 'CatalogService.BookRecommendations' })
Object.defineProperty(BookRecommendation, 'is_singular', { value: true })
export class BookRecommendations extends Array<BookRecommendation> {$count?: number}
Object.defineProperty(BookRecommendations, 'name', { value: 'CatalogService.BookRecommendations' })

export function _BookFormatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookFormat extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
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
Object.defineProperty(BookFormat, 'name', { value: 'CatalogService.BookFormats' })
Object.defineProperty(BookFormat, 'is_singular', { value: true })
export class BookFormats extends Array<BookFormat> {$count?: number}
Object.defineProperty(BookFormats, 'name', { value: 'CatalogService.BookFormats' })

export function _BookSaleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSale extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        saleDate?: __.CdsDate | null;
        saleAmount?: number | null;
        quantity?: number | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
        customer?: __.Association.to<_sap_capire_bookshop.User> | null;
        customer_ID?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class BookSale extends _._managedAspect(_._cuidAspect(_BookSaleAspect(__.Entity))) {}
Object.defineProperty(BookSale, 'name', { value: 'CatalogService.BookSales' })
Object.defineProperty(BookSale, 'is_singular', { value: true })
export class BookSales extends Array<BookSale> {$count?: number}
Object.defineProperty(BookSales, 'name', { value: 'CatalogService.BookSales' })

export function _BookEventAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookEvent extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: string;
        name?: string | null;
        types?: _.BookTypes | null;
      static readonly actions: Record<never, never>
  };
}
export class BookEvent extends _._managedAspect(_._cuidAspect(_BookEventAspect(__.Entity))) {static drafts: typeof BookEvent}
Object.defineProperty(BookEvent, 'name', { value: 'CatalogService.BookEvents' })
Object.defineProperty(BookEvent, 'is_singular', { value: true })
export class BookEvents extends Array<BookEvent> {static drafts: typeof BookEvent
$count?: number}
Object.defineProperty(BookEvents, 'name', { value: 'CatalogService.BookEvents' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        views?: number | null;
        averageRating?: number | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
      static readonly actions: {
        GenerateReport: { (ID: __.DeepRequired<Book>['ID']):       {
                book?: __.DeepRequired<Book>['title'] | null;
                stats?: __.DeepRequired<BookStat>['views'] | null;
                rating?: __.DeepRequired<BookStat>['averageRating'] | null;
      }, __parameters: {ID: __.DeepRequired<Book>['ID']}, __returns:       {
                book?: __.DeepRequired<Book>['title'] | null;
                stats?: __.DeepRequired<BookStat>['views'] | null;
                rating?: __.DeepRequired<BookStat>['averageRating'] | null;
      }, kind: 'action'}
        NotifyAuthor: { (ID: __.DeepRequired<Author>['ID']): boolean, __parameters: {ID: __.DeepRequired<Author>['ID']}, __returns: boolean, kind: 'function'}
      }
  };
}
export class BookStat extends _._managedAspect(_BookStatAspect(__.Entity)) {}
Object.defineProperty(BookStat, 'name', { value: 'CatalogService.BookStats' })
Object.defineProperty(BookStat, 'is_singular', { value: true })
export class BookStats extends Array<BookStat> {$count?: number}
Object.defineProperty(BookStats, 'name', { value: 'CatalogService.BookStats' })

/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export function _CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Currency extends Base {
        code?: string;
        symbol?: string | null;
        minorUnit?: number | null;
      static readonly actions: Record<never, never>
  };
}
export class Currency extends _sap_common._CodeListAspect(_CurrencyAspect(__.Entity)) {}
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
Object.defineProperty(Currency, 'is_singular', { value: true })
export class Currencies extends Array<Currency> {$count?: number}
Object.defineProperty(Currencies, 'name', { value: 'sap.common.Currencies' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends Base {
        ID?: number;
        parent?: __.Association.to<_sap_capire_bookshop.Genre> | null;
        parent_ID?: number | null;
        children?: __.Composition.of.many<_sap_capire_bookshop.Genres>;
      static readonly actions: Record<never, never>
  };
}
export class Genre extends _sap_common._CodeListAspect(_GenreAspect(__.Entity)) {}
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
Object.defineProperty(Genre, 'is_singular', { value: true })
export class Genres extends Array<Genre> {$count?: number}
Object.defineProperty(Genres, 'name', { value: 'sap.capire.bookshop.Genres' })

// event
export declare class OrderedBook {
    book: __.DeepRequired<Book>['ID'] | null;
    quantity: number | null;
    buyer: string | null;
}
export declare const changeBookProperties: { (format: __.DeepRequired<BookFormat>['format'] | null, language: __.DeepRequired<BookFormat>['language'] | null):  {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null | null, __parameters: {format: __.DeepRequired<BookFormat>['format'] | null, language: __.DeepRequired<BookFormat>['language'] | null}, __returns:  {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null | null, kind: 'action'};
export declare const submitOrder: { (book: __.DeepRequired<Book>['ID'], quantity: number | null):  {
  stock?: number | null,
} | null | null, __parameters: {book: __.DeepRequired<Book>['ID'], quantity: number | null}, __returns:  {
  stock?: number | null,
} | null | null, kind: 'action'};
export declare const submitOrderFunction: { (book: __.DeepRequired<Book>['ID'], quantity: number | null):  {
  stock?: number | null,
} | null | null, __parameters: {book: __.DeepRequired<Book>['ID'], quantity: number | null}, __returns:  {
  stock?: number | null,
} | null | null, kind: 'function'};