// This is an automatically generated file. Please do not change its contents manually!
import cds from '@sap/cds'
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as _sap_common from './../sap/common';

export class CatalogService extends cds.Service {
  declare changeBookProperties: typeof changeBookProperties
  declare submitOrder: typeof submitOrder
  declare submitOrderFunction: typeof submitOrderFunction
}
export default CatalogService

export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare title?: string | null
    declare descr?: string | null
    declare stock?: number | null
    declare price?: number | null
    /**
    * Type for an association to Currencies
    * 
    * See https://cap.cloud.sap/docs/cds/common#type-currency
    */
    declare currency?: _.Currency | null
    declare currency_code?: __.Key<string> | null
    declare image?: Buffer | string | {value: import("stream").Readable, $mediaContentType: string, $mediaContentDispositionFilename?: string, $mediaContentDispositionType?: string} | null
    declare author?: __.Association.to<Author> | null
    declare author_ID?: __.Key<number> | null
    declare genre?: __.Association.to<Genre> | null
    declare genre_ID?: __.Key<number> | null
    declare reviews?: __.Association.to.many<Reviews>
    declare stats?: __.Association.to<BookStat> | null
    declare bookFormats?: __.Association.to.many<BookFormats>
    declare bookRecomanddations?: __.Association.to.many<BookRecommendations>
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Book>;
    declare static readonly elements: __.ElementsOf<Book>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Book extends _BookAspect(__.Entity) {}
Object.defineProperty(Book, 'name', { value: 'CatalogService.Books' })
Object.defineProperty(Book, 'is_singular', { value: true })
export class Books extends Array<Book> {$count?: number}
Object.defineProperty(Books, 'name', { value: 'CatalogService.Books' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare name?: string | null
    declare dateOfBirth?: __.CdsDate | null
    declare dateOfDeath?: __.CdsDate | null
    declare placeOfBirth?: string | null
    declare placeOfDeath?: string | null
    declare books?: __.Association.to.many<Books>
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Author>;
    declare static readonly elements: __.ElementsOf<Author>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Author extends _AuthorAspect(__.Entity) {}
Object.defineProperty(Author, 'name', { value: 'CatalogService.Authors' })
Object.defineProperty(Author, 'is_singular', { value: true })
export class Authors extends Array<Author> {$count?: number}
Object.defineProperty(Authors, 'name', { value: 'CatalogService.Authors' })

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare book?: __.Association.to<Book> | null
    declare book_ID?: __.Key<number> | null
    declare reviewer?: __.Association.to<_sap_capire_bookshop.User> | null
    declare reviewer_ID?: __.Key<number> | null
    declare rating?: number | null
    declare comment?: string | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Review>;
    declare static readonly elements: __.ElementsOf<Review>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Review extends _ReviewAspect(__.Entity) {}
Object.defineProperty(Review, 'name', { value: 'CatalogService.Reviews' })
Object.defineProperty(Review, 'is_singular', { value: true })
export class Reviews extends Array<Review> {$count?: number}
Object.defineProperty(Reviews, 'name', { value: 'CatalogService.Reviews' })

export function _PublisherAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Publisher extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare name?: string | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Publisher>;
    declare static readonly elements: __.ElementsOf<Publisher>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Publisher extends _PublisherAspect(__.Entity) {}
Object.defineProperty(Publisher, 'name', { value: 'CatalogService.Publishers' })
Object.defineProperty(Publisher, 'is_singular', { value: true })
export class Publishers extends Array<Publisher> {$count?: number}
Object.defineProperty(Publishers, 'name', { value: 'CatalogService.Publishers' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare orderNumber?: string | null
    declare orderDate?: __.CdsDate | null
    declare totalAmount?: number | null
    declare status?: string | null
    declare customer?: __.Association.to<_sap_capire_bookshop.User> | null
    declare customer_ID?: __.Key<number> | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<BookOrder>;
    declare static readonly elements: __.ElementsOf<BookOrder>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookOrder extends _BookOrderAspect(__.Entity) {}
Object.defineProperty(BookOrder, 'name', { value: 'CatalogService.BookOrders' })
Object.defineProperty(BookOrder, 'is_singular', { value: true })
export class BookOrders extends Array<BookOrder> {$count?: number}
Object.defineProperty(BookOrders, 'name', { value: 'CatalogService.BookOrders' })

export function _BookRecommendationAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookRecommendation extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare rating?: number | null
    declare comment?: string | null
    declare description?: string | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: __.Key<number> | null
    declare recommended?: __.Association.to<Book> | null
    declare recommended_ID?: __.Key<number> | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<BookRecommendation>;
    declare static readonly elements: __.ElementsOf<BookRecommendation>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookRecommendation extends _BookRecommendationAspect(__.Entity) {}
Object.defineProperty(BookRecommendation, 'name', { value: 'CatalogService.BookRecommendations' })
Object.defineProperty(BookRecommendation, 'is_singular', { value: true })
export class BookRecommendations extends Array<BookRecommendation> {$count?: number}
Object.defineProperty(BookRecommendations, 'name', { value: 'CatalogService.BookRecommendations' })

export function _BookFormatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookFormat extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare format?: string | null
    declare price?: number | null
    declare pages?: number | null
    declare language?: string | null
    declare publicationDate?: __.CdsDate | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: __.Key<number> | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<BookFormat>;
    declare static readonly elements: __.ElementsOf<BookFormat>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookFormat extends _BookFormatAspect(__.Entity) {}
Object.defineProperty(BookFormat, 'name', { value: 'CatalogService.BookFormats' })
Object.defineProperty(BookFormat, 'is_singular', { value: true })
export class BookFormats extends Array<BookFormat> {$count?: number}
Object.defineProperty(BookFormats, 'name', { value: 'CatalogService.BookFormats' })

export function _BookSaleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSale extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare saleDate?: __.CdsDate | null
    declare saleAmount?: number | null
    declare quantity?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: __.Key<number> | null
    declare customer?: __.Association.to<_sap_capire_bookshop.User> | null
    declare customer_ID?: __.Key<number> | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<BookSale>;
    declare static readonly elements: __.ElementsOf<BookSale>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSale extends _BookSaleAspect(__.Entity) {}
Object.defineProperty(BookSale, 'name', { value: 'CatalogService.BookSales' })
Object.defineProperty(BookSale, 'is_singular', { value: true })
export class BookSales extends Array<BookSale> {$count?: number}
Object.defineProperty(BookSales, 'name', { value: 'CatalogService.BookSales' })

export function _BookEventAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookEvent extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<string>
    declare name?: string | null
    declare types?: _.BookTypes | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<BookEvent>;
    declare static readonly elements: __.ElementsOf<BookEvent>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect for entities with canonical universal IDs
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-cuid
*/
export class BookEvent extends _BookEventAspect(__.Entity) {static drafts: __.DraftOf<BookEvent>}
Object.defineProperty(BookEvent, 'name', { value: 'CatalogService.BookEvents' })
Object.defineProperty(BookEvent, 'is_singular', { value: true })
export class BookEvents extends Array<BookEvent> {static drafts: __.DraftsOf<BookEvent>
$count?: number}
Object.defineProperty(BookEvents, 'name', { value: 'CatalogService.BookEvents' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare views?: number | null
    declare averageRating?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: __.Key<number> | null
    static readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<BookStat>;
    declare static readonly elements: __.ElementsOf<BookStat>;
    declare static readonly actions: {
      GenerateReport:  {
        // positional
        (ID: __.Key<__.DeepRequired<Book>['ID']>):       {
        book?: __.DeepRequired<Book>['title'] | null
        stats?: __.DeepRequired<BookStat>['views'] | null
        rating?: __.DeepRequired<BookStat>['averageRating'] | null
      }
        // named
        ({ID}: {ID?: __.Key<__.DeepRequired<Book>['ID']>}):       {
        book?: __.DeepRequired<Book>['title'] | null
        stats?: __.DeepRequired<BookStat>['views'] | null
        rating?: __.DeepRequired<BookStat>['averageRating'] | null
      }
        // metadata (do not use)
        __parameters: {ID?: __.Key<__.DeepRequired<Book>['ID']>}, __returns:       {
        book?: __.DeepRequired<Book>['title'] | null
        stats?: __.DeepRequired<BookStat>['views'] | null
        rating?: __.DeepRequired<BookStat>['averageRating'] | null
      }
        kind: 'action'
      }
      NotifyAuthor:  {
        // positional
        (ID: __.Key<__.DeepRequired<Author>['ID']>): boolean
        // named
        ({ID}: {ID?: __.Key<__.DeepRequired<Author>['ID']>}): boolean
        // metadata (do not use)
        __parameters: {ID?: __.Key<__.DeepRequired<Author>['ID']>}, __returns: boolean
        kind: 'function'
      }
    }
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookStat extends _BookStatAspect(__.Entity) {}
Object.defineProperty(BookStat, 'name', { value: 'CatalogService.BookStats' })
Object.defineProperty(BookStat, 'is_singular', { value: true })
export class BookStats extends Array<BookStat> {$count?: number}
Object.defineProperty(BookStats, 'name', { value: 'CatalogService.BookStats' })

export function _CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Currency extends _sap_common._CodeListAspect(Base) {
    declare code?: __.Key<string>
    declare symbol?: string | null
    declare minorUnit?: number | null
    static override readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Currency>;
    declare static readonly elements: __.ElementsOf<Currency>;
    static readonly actions: typeof _sap_common.CodeList.actions & Record<never, never>;
  };
}
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currency extends _CurrencyAspect(__.Entity) {}
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
Object.defineProperty(Currency, 'is_singular', { value: true })
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currencies extends Array<Currency> {$count?: number}
Object.defineProperty(Currencies, 'name', { value: 'sap.common.Currencies' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends _sap_common._CodeListAspect(Base) {
    declare ID?: __.Key<number>
    declare parent?: __.Association.to<_sap_capire_bookshop.Genre> | null
    declare parent_ID?: __.Key<number> | null
    declare children?: __.Composition.of.many<_sap_capire_bookshop.Genres>
    static override readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Genre>;
    declare static readonly elements: __.ElementsOf<Genre>;
    static readonly actions: typeof _sap_common.CodeList.actions & Record<never, never>;
  };
}
export class Genre extends _GenreAspect(__.Entity) {}
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
Object.defineProperty(Genre, 'is_singular', { value: true })
export class Genres extends Array<Genre> {$count?: number}
Object.defineProperty(Genres, 'name', { value: 'sap.capire.bookshop.Genres' })

// event
export declare class OrderedBook {
  declare book: __.DeepRequired<Book>['ID'] | null
  declare quantity: number | null
  declare buyer: string | null
}

export declare const changeBookProperties:  {
  // positional
  (format: __.DeepRequired<BookFormat>['format'] | null, language: __.DeepRequired<BookFormat>['language'] | null): Promise< {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null> |  {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null
  // named
  ({format, language}: {format?: __.DeepRequired<BookFormat>['format'] | null, language?: __.DeepRequired<BookFormat>['language'] | null}): Promise< {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null> |  {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null
  // metadata (do not use)
  __parameters: {format?: __.DeepRequired<BookFormat>['format'] | null, language?: __.DeepRequired<BookFormat>['language'] | null}, __returns: Promise< {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null> |  {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null
  kind: 'action'
}

export declare const submitOrder:  {
  // positional
  (book: __.Key<__.DeepRequired<Book>['ID']>, quantity: number | null): Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // named
  ({book, quantity}: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}): Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // metadata (do not use)
  __parameters: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}, __returns: Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  kind: 'action'
}

export declare const submitOrderFunction:  {
  // positional
  (book: __.Key<__.DeepRequired<Book>['ID']>, quantity: number | null): Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // named
  ({book, quantity}: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}): Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // metadata (do not use)
  __parameters: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}, __returns: Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  kind: 'function'
}