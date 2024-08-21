// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as _sap_common from './../sap/common';
export default { name: 'CatalogService' }
export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare title?: string | null;
        declare descr?: string | null;
        declare stock?: number | null;
        declare price?: number | null;
    /**
    * Type for an association to Currencies
    * 
    * See https://cap.cloud.sap/docs/cds/common#type-currency
    */
        declare currency?: _.Currency | null;
        declare currency_code?: string | null;
        declare image?: Buffer | string | {value: import("stream").Readable, $mediaContentType: string, $mediaContentDispositionFilename?: string, $mediaContentDispositionType?: string} | null;
        declare author?: __.Association.to<Author> | null;
        declare author_ID?: number | null;
        declare genre?: __.Association.to<Genre> | null;
        declare genre_ID?: number | null;
        declare reviews?: __.Association.to.many<Reviews>;
        declare stats?: __.Association.to<BookStat> | null;
        declare bookFormats?: __.Association.to.many<BookFormats>;
        declare bookRecomanddations?: __.Association.to.many<BookRecommendations>;
      declare static readonly actions: Record<never, never>
  };
}
export class Book extends _BookAspect(__.Entity) {}
Object.defineProperty(Book, 'name', { value: 'CatalogService.Books' })
Object.defineProperty(Book, 'is_singular', { value: true })
export class Books extends Array<Book> {$count?: number}
Object.defineProperty(Books, 'name', { value: 'CatalogService.Books' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare name?: string | null;
        declare dateOfBirth?: __.CdsDate | null;
        declare dateOfDeath?: __.CdsDate | null;
        declare placeOfBirth?: string | null;
        declare placeOfDeath?: string | null;
        declare books?: __.Association.to.many<Books>;
      declare static readonly actions: Record<never, never>
  };
}
export class Author extends _AuthorAspect(__.Entity) {}
Object.defineProperty(Author, 'name', { value: 'CatalogService.Authors' })
Object.defineProperty(Author, 'is_singular', { value: true })
export class Authors extends Array<Author> {$count?: number}
Object.defineProperty(Authors, 'name', { value: 'CatalogService.Authors' })

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare book?: __.Association.to<Book> | null;
        declare book_ID?: number | null;
        declare reviewer?: __.Association.to<_sap_capire_bookshop.User> | null;
        declare reviewer_ID?: number | null;
        declare rating?: number | null;
        declare comment?: string | null;
      declare static readonly actions: Record<never, never>
  };
}
export class Review extends _ReviewAspect(__.Entity) {}
Object.defineProperty(Review, 'name', { value: 'CatalogService.Reviews' })
Object.defineProperty(Review, 'is_singular', { value: true })
export class Reviews extends Array<Review> {$count?: number}
Object.defineProperty(Reviews, 'name', { value: 'CatalogService.Reviews' })

export function _PublisherAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Publisher extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare name?: string | null;
      declare static readonly actions: Record<never, never>
  };
}
export class Publisher extends _PublisherAspect(__.Entity) {}
Object.defineProperty(Publisher, 'name', { value: 'CatalogService.Publishers' })
Object.defineProperty(Publisher, 'is_singular', { value: true })
export class Publishers extends Array<Publisher> {$count?: number}
Object.defineProperty(Publishers, 'name', { value: 'CatalogService.Publishers' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare orderNumber?: string | null;
        declare orderDate?: __.CdsDate | null;
        declare totalAmount?: number | null;
        declare status?: string | null;
        declare customer?: __.Association.to<_sap_capire_bookshop.User> | null;
        declare customer_ID?: number | null;
      declare static readonly actions: Record<never, never>
  };
}
export class BookOrder extends _BookOrderAspect(__.Entity) {}
Object.defineProperty(BookOrder, 'name', { value: 'CatalogService.BookOrders' })
Object.defineProperty(BookOrder, 'is_singular', { value: true })
export class BookOrders extends Array<BookOrder> {$count?: number}
Object.defineProperty(BookOrders, 'name', { value: 'CatalogService.BookOrders' })

export function _BookRecommendationAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookRecommendation extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare rating?: number | null;
        declare comment?: string | null;
        declare description?: string | null;
        declare book?: __.Association.to<Book> | null;
        declare book_ID?: number | null;
        declare recommended?: __.Association.to<Book> | null;
        declare recommended_ID?: number | null;
      declare static readonly actions: Record<never, never>
  };
}
export class BookRecommendation extends _BookRecommendationAspect(__.Entity) {}
Object.defineProperty(BookRecommendation, 'name', { value: 'CatalogService.BookRecommendations' })
Object.defineProperty(BookRecommendation, 'is_singular', { value: true })
export class BookRecommendations extends Array<BookRecommendation> {$count?: number}
Object.defineProperty(BookRecommendations, 'name', { value: 'CatalogService.BookRecommendations' })

export function _BookFormatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookFormat extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare format?: string | null;
        declare price?: number | null;
        declare pages?: number | null;
        declare language?: string | null;
        declare publicationDate?: __.CdsDate | null;
        declare book?: __.Association.to<Book> | null;
        declare book_ID?: number | null;
      declare static readonly actions: Record<never, never>
  };
}
export class BookFormat extends _BookFormatAspect(__.Entity) {}
Object.defineProperty(BookFormat, 'name', { value: 'CatalogService.BookFormats' })
Object.defineProperty(BookFormat, 'is_singular', { value: true })
export class BookFormats extends Array<BookFormat> {$count?: number}
Object.defineProperty(BookFormats, 'name', { value: 'CatalogService.BookFormats' })

export function _BookSaleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSale extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare saleDate?: __.CdsDate | null;
        declare saleAmount?: number | null;
        declare quantity?: number | null;
        declare book?: __.Association.to<Book> | null;
        declare book_ID?: number | null;
        declare customer?: __.Association.to<_sap_capire_bookshop.User> | null;
        declare customer_ID?: number | null;
      declare static readonly actions: Record<never, never>
  };
}
export class BookSale extends _BookSaleAspect(__.Entity) {}
Object.defineProperty(BookSale, 'name', { value: 'CatalogService.BookSales' })
Object.defineProperty(BookSale, 'is_singular', { value: true })
export class BookSales extends Array<BookSale> {$count?: number}
Object.defineProperty(BookSales, 'name', { value: 'CatalogService.BookSales' })

export function _BookEventAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookEvent extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: string;
        declare name?: string | null;
        declare types?: _.BookTypes | null;
      declare static readonly actions: Record<never, never>
  };
}
export class BookEvent extends _BookEventAspect(__.Entity) {static drafts: typeof BookEvent}
Object.defineProperty(BookEvent, 'name', { value: 'CatalogService.BookEvents' })
Object.defineProperty(BookEvent, 'is_singular', { value: true })
export class BookEvents extends Array<BookEvent> {static drafts: typeof BookEvent
$count?: number}
Object.defineProperty(BookEvents, 'name', { value: 'CatalogService.BookEvents' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare views?: number | null;
        declare averageRating?: number | null;
        declare book?: __.Association.to<Book> | null;
        declare book_ID?: number | null;
      declare static readonly actions: {
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
export class BookStat extends _BookStatAspect(__.Entity) {}
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
  return class Currency extends _sap_common._CodeListAspect(Base) {
        declare code?: string;
        declare symbol?: string | null;
        declare minorUnit?: number | null;
      declare static readonly actions: typeof _sap_common.CodeList.actions & Record<never, never>
  };
}
export class Currency extends _CurrencyAspect(__.Entity) {}
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
Object.defineProperty(Currency, 'is_singular', { value: true })
export class Currencies extends Array<Currency> {$count?: number}
Object.defineProperty(Currencies, 'name', { value: 'sap.common.Currencies' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends _sap_common._CodeListAspect(Base) {
        declare ID?: number;
        declare parent?: __.Association.to<_sap_capire_bookshop.Genre> | null;
        declare parent_ID?: number | null;
        declare children?: __.Composition.of.many<_sap_capire_bookshop.Genres>;
      declare static readonly actions: typeof _sap_common.CodeList.actions & Record<never, never>
  };
}
export class Genre extends _GenreAspect(__.Entity) {}
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
Object.defineProperty(Genre, 'is_singular', { value: true })
export class Genres extends Array<Genre> {$count?: number}
Object.defineProperty(Genres, 'name', { value: 'sap.capire.bookshop.Genres' })

// event
export declare class OrderedBook {
    declare book: __.DeepRequired<Book>['ID'] | null;
    declare quantity: number | null;
    declare buyer: string | null;
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