// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as _sap_common from './../sap/common';

export default class {
  declare static readonly changeBookProperties: typeof changeBookProperties;
  declare static readonly submitOrder: typeof submitOrder;
  declare static readonly submitOrderFunction: typeof submitOrderFunction;
}

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
    declare currency_code?: string | null
    declare image?: import("stream").Readable | null
    declare author?: __.Association.to<Author> | null
    declare author_ID?: number | null
    declare genre?: __.Association.to<Genre> | null
    declare genre_ID?: number | null
    declare reviews?: __.Association.to.many<Reviews>
    declare stats?: __.Association.to<BookStat> | null
    declare bookFormats?: __.Association.to.many<BookFormats>
    declare bookRecomanddations?: __.Association.to.many<BookRecommendations>
    declare series?: __.Association.to<BookSery> | null
    declare series_ID?: number | null
    declare texts?: __.Composition.of.many<Books.texts>
    declare localized?: __.Association.to<Books.text> | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Book>;
    declare static readonly elements: __.ElementsOf<Book>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
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
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Author>;
    declare static readonly elements: __.ElementsOf<Author>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
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
    declare book_ID?: number | null
    declare reviewer?: __.Association.to<_sap_capire_bookshop.User> | null
    declare reviewer_ID?: number | null
    declare rating?: number | null
    declare comment?: string | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Review>;
    declare static readonly elements: __.ElementsOf<Review>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
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
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Publisher>;
    declare static readonly elements: __.ElementsOf<Publisher>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
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
    declare customer_ID?: number | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookOrder>;
    declare static readonly elements: __.ElementsOf<BookOrder>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
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
    declare book_ID?: number | null
    declare recommended?: __.Association.to<Book> | null
    declare recommended_ID?: number | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookRecommendation>;
    declare static readonly elements: __.ElementsOf<BookRecommendation>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
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
    declare book_ID?: number | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookFormat>;
    declare static readonly elements: __.ElementsOf<BookFormat>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
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
    declare book_ID?: number | null
    declare customer?: __.Association.to<_sap_capire_bookshop.User> | null
    declare customer_ID?: number | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookSale>;
    declare static readonly elements: __.ElementsOf<BookSale>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSales extends Array<BookSale> {$count?: number}
Object.defineProperty(BookSales, 'name', { value: 'CatalogService.BookSales' })

export function _WishlistAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Wishlist extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare user?: __.Association.to<_sap_capire_bookshop.User> | null
    declare user_ID?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    declare addedAt?: __.CdsDateTime | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Wishlist>;
    declare static readonly elements: __.ElementsOf<Wishlist>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Wishlist extends _WishlistAspect(__.Entity) {}
Object.defineProperty(Wishlist, 'name', { value: 'CatalogService.Wishlists' })
Object.defineProperty(Wishlist, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Wishlists extends Array<Wishlist> {$count?: number}
Object.defineProperty(Wishlists, 'name', { value: 'CatalogService.Wishlists' })

export function _ShoppingCartAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class ShoppingCart extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare user?: __.Association.to<_sap_capire_bookshop.User> | null
    declare user_ID?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    declare quantity?: number | null
    declare addedAt?: __.CdsDateTime | null
    declare notes?: string | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<ShoppingCart>;
    declare static readonly elements: __.ElementsOf<ShoppingCart>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class ShoppingCart extends _ShoppingCartAspect(__.Entity) {}
Object.defineProperty(ShoppingCart, 'name', { value: 'CatalogService.ShoppingCart' })
Object.defineProperty(ShoppingCart, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class ShoppingCart_ extends Array<ShoppingCart> {$count?: number}
Object.defineProperty(ShoppingCart_, 'name', { value: 'CatalogService.ShoppingCart' })

export function _BookSeryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSery extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare name?: string | null
    declare description?: string | null
    declare books?: __.Association.to.many<Books>
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookSery>;
    declare static readonly elements: __.ElementsOf<BookSery>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSery extends _BookSeryAspect(__.Entity) {}
Object.defineProperty(BookSery, 'name', { value: 'CatalogService.BookSeries' })
Object.defineProperty(BookSery, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSeries extends Array<BookSery> {$count?: number}
Object.defineProperty(BookSeries, 'name', { value: 'CatalogService.BookSeries' })

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
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookEvent>;
    declare static readonly elements: __.ElementsOf<BookEvent>;
    declare static readonly actions: globalThis.Record<never, never>;
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
/**
* Aspect for entities with canonical universal IDs
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-cuid
*/
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
    declare book_ID?: number | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookStat>;
    declare static readonly elements: __.ElementsOf<BookStat>;
    declare static readonly actions: {
      GenerateReport:  {
        // positional
        (ID: __.Key<__.DeepRequired<Book>['ID']>):     {
      book?: __.DeepRequired<Book>['title'] | null
      stats?: __.DeepRequired<BookStat>['views'] | null
      rating?: __.DeepRequired<BookStat>['averageRating'] | null
    }
        // named
        ({ID}: {ID?: __.Key<__.DeepRequired<Book>['ID']>}):     {
      book?: __.DeepRequired<Book>['title'] | null
      stats?: __.DeepRequired<BookStat>['views'] | null
      rating?: __.DeepRequired<BookStat>['averageRating'] | null
    }
        // metadata (do not use)
        __parameters: {ID?: __.Key<__.DeepRequired<Book>['ID']>}, __returns:     {
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
    };
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
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookStats extends Array<BookStat> {$count?: number}
Object.defineProperty(BookStats, 'name', { value: 'CatalogService.BookStats' })

export function _CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Currency extends Base {
    declare name?: string | null
    declare descr?: string | null
    declare code?: __.Key<string>
    declare symbol?: string | null
    declare minorUnit?: number | null
    declare texts?: __.Composition.of.many<Currencies.texts>
    declare localized?: __.Association.to<Currencies.text> | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Currency>;
    declare static readonly elements: __.ElementsOf<Currency>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currency extends _CurrencyAspect(__.Entity) {}
Object.defineProperty(Currency, 'name', { value: 'CatalogService.Currencies' })
Object.defineProperty(Currency, 'is_singular', { value: true })
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currencies extends Array<Currency> {$count?: number}
Object.defineProperty(Currencies, 'name', { value: 'CatalogService.Currencies' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends Base {
    declare name?: string | null
    declare descr?: string | null
    declare ID?: __.Key<number>
    declare parent?: __.Association.to<Genre> | null
    declare parent_ID?: number | null
    declare children?: __.Composition.of.many<Genres>
    declare texts?: __.Composition.of.many<Genres.texts>
    declare localized?: __.Association.to<Genres.text> | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Genre>;
    declare static readonly elements: __.ElementsOf<Genre>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect for a code list with name and description
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-codelist
*/
export class Genre extends _GenreAspect(__.Entity) {}
Object.defineProperty(Genre, 'name', { value: 'CatalogService.Genres' })
Object.defineProperty(Genre, 'is_singular', { value: true })
/**
* Aspect for a code list with name and description
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-codelist
*/
export class Genres extends Array<Genre> {$count?: number}
Object.defineProperty(Genres, 'name', { value: 'CatalogService.Genres' })

// event
export declare class OrderedBook {
  declare book: __.DeepRequired<Book>['ID'] | null
  declare quantity: number | null
  declare buyer: string | null
}
// event
export declare class event_2 {
  declare foo: number | null
  declare bar: string | null
}

export declare const changeBookProperties:  {
  // positional
  (format: __.DeepRequired<BookFormat>['format'] | null, language: __.DeepRequired<BookFormat>['language'] | null): globalThis.Promise< {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null> |  {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null
  // named
  ({format, language}: {format?: __.DeepRequired<BookFormat>['format'] | null, language?: __.DeepRequired<BookFormat>['language'] | null}): globalThis.Promise< {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null> |  {
  language?: string | null,
  format?: __.DeepRequired<BookFormat>['format'] | null,
} | null
  // metadata (do not use)
  __parameters: {format?: __.DeepRequired<BookFormat>['format'] | null, language?: __.DeepRequired<BookFormat>['language'] | null}, __returns: globalThis.Promise< {
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
  (book: __.Key<__.DeepRequired<Book>['ID']>, quantity: number | null): globalThis.Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // named
  ({book, quantity}: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}): globalThis.Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // metadata (do not use)
  __parameters: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}, __returns: globalThis.Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  kind: 'action'
}

export declare const submitOrderFunction:  {
  // positional
  (book: __.Key<__.DeepRequired<Book>['ID']>, quantity: number | null): globalThis.Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // named
  ({book, quantity}: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}): globalThis.Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  // metadata (do not use)
  __parameters: {book?: __.Key<__.DeepRequired<Book>['ID']>, quantity?: number | null}, __returns: globalThis.Promise< {
  stock?: number | null,
} | null> |  {
  stock?: number | null,
} | null
  kind: 'function'
}
export namespace Books {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends Base {
      /** Type for a language code */
      declare locale?: __.Key<_sap_common.Locale>
      declare ID?: __.Key<number>
      declare title?: string | null
      declare descr?: string | null
      static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text>;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'CatalogService.Books.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'CatalogService.Books.texts' })
  
}
export namespace Currencies {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends Base {
      /** Type for a language code */
      declare locale?: __.Key<_sap_common.Locale>
      declare name?: string | null
      declare descr?: string | null
      declare code?: __.Key<string>
      static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text>;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'CatalogService.Currencies.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'CatalogService.Currencies.texts' })
  
}
export namespace Genres {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends Base {
      /** Type for a language code */
      declare locale?: __.Key<_sap_common.Locale>
      declare name?: string | null
      declare descr?: string | null
      declare ID?: __.Key<number>
      static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text>;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'CatalogService.Genres.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'CatalogService.Genres.texts' })
  
}