// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './../../..';
import * as __ from './../../../_';
import * as _sap_common from './../../common';

export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends _._managedAspect(Base) {
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
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Book>;
    declare static readonly elements: __.ElementsOf<Book>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Book extends _BookAspect(__.Entity) {}
Object.defineProperty(Book, 'name', { value: 'sap.capire.bookshop.Books' })
Object.defineProperty(Book, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Books extends Array<Book> {$count?: number}
Object.defineProperty(Books, 'name', { value: 'sap.capire.bookshop.Books' })

export function _PublisherAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Publisher extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare name?: string | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Publisher>;
    declare static readonly elements: __.ElementsOf<Publisher>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Publisher extends _PublisherAspect(__.Entity) {}
Object.defineProperty(Publisher, 'name', { value: 'sap.capire.bookshop.Publishers' })
Object.defineProperty(Publisher, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Publishers extends Array<Publisher> {$count?: number}
Object.defineProperty(Publishers, 'name', { value: 'sap.capire.bookshop.Publishers' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare views?: number | null
    declare averageRating?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookStat>;
    declare static readonly elements: __.ElementsOf<BookStat>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookStat extends _BookStatAspect(__.Entity) {}
Object.defineProperty(BookStat, 'name', { value: 'sap.capire.bookshop.BookStats' })
Object.defineProperty(BookStat, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookStats extends Array<BookStat> {$count?: number}
Object.defineProperty(BookStats, 'name', { value: 'sap.capire.bookshop.BookStats' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare name?: string | null
    declare dateOfBirth?: __.CdsDate | null
    declare dateOfDeath?: __.CdsDate | null
    declare placeOfBirth?: string | null
    declare placeOfDeath?: string | null
    declare books?: __.Association.to.many<Books>
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Author>;
    declare static readonly elements: __.ElementsOf<Author>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Author extends _AuthorAspect(__.Entity) {}
Object.defineProperty(Author, 'name', { value: 'sap.capire.bookshop.Authors' })
Object.defineProperty(Author, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Authors extends Array<Author> {$count?: number}
Object.defineProperty(Authors, 'name', { value: 'sap.capire.bookshop.Authors' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends _sap_common._CodeListAspect(Base) {
    declare ID?: __.Key<number>
    declare parent?: __.Association.to<Genre> | null
    declare parent_ID?: number | null
    declare children?: __.Composition.of.many<Genres>
    declare texts?: __.Composition.of.many<Genres.texts>
    declare localized?: __.Association.to<Genres.text> | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Genre>;
    declare static readonly elements: __.ElementsOf<Genre>;
    declare static readonly actions: typeof _sap_common.CodeList.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect for a code list with name and description
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-codelist
*/
export class Genre extends _GenreAspect(__.Entity) {}
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
Object.defineProperty(Genre, 'is_singular', { value: true })
/**
* Aspect for a code list with name and description
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-codelist
*/
export class Genres extends Array<Genre> {$count?: number}
Object.defineProperty(Genres, 'name', { value: 'sap.capire.bookshop.Genres' })

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    declare reviewer?: __.Association.to<User> | null
    declare reviewer_ID?: number | null
    declare rating?: number | null
    declare comment?: string | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Review>;
    declare static readonly elements: __.ElementsOf<Review>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Review extends _ReviewAspect(__.Entity) {}
Object.defineProperty(Review, 'name', { value: 'sap.capire.bookshop.Reviews' })
Object.defineProperty(Review, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Reviews extends Array<Review> {$count?: number}
Object.defineProperty(Reviews, 'name', { value: 'sap.capire.bookshop.Reviews' })

export function _BookEventAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookEvent extends _._managedAspect(_._cuidAspect(Base)) {
    declare name?: string | null
    declare types?: _.BookTypes | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookEvent> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<BookEvent>;
    declare static readonly actions: typeof _.cuid.actions & typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect for entities with canonical universal IDs
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-cuid
*/
export class BookEvent extends _BookEventAspect(__.Entity) {}
Object.defineProperty(BookEvent, 'name', { value: 'sap.capire.bookshop.BookEvents' })
Object.defineProperty(BookEvent, 'is_singular', { value: true })
/**
* Aspect for entities with canonical universal IDs
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-cuid
*/
export class BookEvents extends Array<BookEvent> {$count?: number}
Object.defineProperty(BookEvents, 'name', { value: 'sap.capire.bookshop.BookEvents' })

export function _BookSaleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSale extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare saleDate?: __.CdsDate | null
    declare saleAmount?: number | null
    declare quantity?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    declare customer?: __.Association.to<User> | null
    declare customer_ID?: number | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookSale>;
    declare static readonly elements: __.ElementsOf<BookSale>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSale extends _BookSaleAspect(__.Entity) {}
Object.defineProperty(BookSale, 'name', { value: 'sap.capire.bookshop.BookSales' })
Object.defineProperty(BookSale, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSales extends Array<BookSale> {$count?: number}
Object.defineProperty(BookSales, 'name', { value: 'sap.capire.bookshop.BookSales' })

export function _WishlistAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Wishlist extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare user?: __.Association.to<User> | null
    declare user_ID?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    declare addedAt?: __.CdsDateTime | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Wishlist>;
    declare static readonly elements: __.ElementsOf<Wishlist>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Wishlist extends _WishlistAspect(__.Entity) {}
Object.defineProperty(Wishlist, 'name', { value: 'sap.capire.bookshop.Wishlists' })
Object.defineProperty(Wishlist, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Wishlists extends Array<Wishlist> {$count?: number}
Object.defineProperty(Wishlists, 'name', { value: 'sap.capire.bookshop.Wishlists' })

export function _ShoppingCartAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class ShoppingCart extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare user?: __.Association.to<User> | null
    declare user_ID?: number | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    declare quantity?: number | null
    declare addedAt?: __.CdsDateTime | null
    declare notes?: string | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<ShoppingCart>;
    declare static readonly elements: __.ElementsOf<ShoppingCart>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class ShoppingCart extends _ShoppingCartAspect(__.Entity) {}
Object.defineProperty(ShoppingCart, 'name', { value: 'sap.capire.bookshop.ShoppingCart' })
Object.defineProperty(ShoppingCart, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class ShoppingCart_ extends Array<ShoppingCart> {$count?: number}
Object.defineProperty(ShoppingCart_, 'name', { value: 'sap.capire.bookshop.ShoppingCart' })

export function _BookSeryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSery extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare name?: string | null
    declare description?: string | null
    declare books?: __.Association.to.many<Books>
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookSery>;
    declare static readonly elements: __.ElementsOf<BookSery>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSery extends _BookSeryAspect(__.Entity) {}
Object.defineProperty(BookSery, 'name', { value: 'sap.capire.bookshop.BookSeries' })
Object.defineProperty(BookSery, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookSeries extends Array<BookSery> {$count?: number}
Object.defineProperty(BookSeries, 'name', { value: 'sap.capire.bookshop.BookSeries' })

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare username?: string | null
    declare email?: string | null
    declare role?: _.Roles | null
    declare reviews?: __.Association.to.many<Reviews>
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<User>;
    declare static readonly elements: __.ElementsOf<User>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class User extends _UserAspect(__.Entity) {}
Object.defineProperty(User, 'name', { value: 'sap.capire.bookshop.Users' })
Object.defineProperty(User, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'sap.capire.bookshop.Users' })

export function _UserActivityLogAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class UserActivityLog extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare actionType?: string | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<UserActivityLog>;
    declare static readonly elements: __.ElementsOf<UserActivityLog>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class UserActivityLog extends _UserActivityLogAspect(__.Entity) {}
Object.defineProperty(UserActivityLog, 'name', { value: 'sap.capire.bookshop.UserActivityLog' })
Object.defineProperty(UserActivityLog, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class UserActivityLog_ extends Array<UserActivityLog> {$count?: number}
Object.defineProperty(UserActivityLog_, 'name', { value: 'sap.capire.bookshop.UserActivityLog' })

export function _PromotionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Promotion extends Base {
    declare ID?: __.Key<number>
    declare name?: string | null
    declare description?: string | null
    declare startDate?: __.CdsDate | null
    declare endDate?: __.CdsDate | null
    declare discount?: number | null
    declare books?: __.Association.to.many<Books>
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Promotion>;
    declare static readonly elements: __.ElementsOf<Promotion>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Promotion extends _PromotionAspect(__.Entity) {}
Object.defineProperty(Promotion, 'name', { value: 'sap.capire.bookshop.Promotions' })
Object.defineProperty(Promotion, 'is_singular', { value: true })
export class Promotions extends Array<Promotion> {$count?: number}
Object.defineProperty(Promotions, 'name', { value: 'sap.capire.bookshop.Promotions' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare orderNumber?: string | null
    declare orderDate?: __.CdsDate | null
    declare totalAmount?: number | null
    declare status?: string | null
    declare customer?: __.Association.to<User> | null
    declare customer_ID?: number | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookOrder>;
    declare static readonly elements: __.ElementsOf<BookOrder>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookOrder extends _BookOrderAspect(__.Entity) {}
Object.defineProperty(BookOrder, 'name', { value: 'sap.capire.bookshop.BookOrders' })
Object.defineProperty(BookOrder, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookOrders extends Array<BookOrder> {$count?: number}
Object.defineProperty(BookOrders, 'name', { value: 'sap.capire.bookshop.BookOrders' })

export function _BookRecommendationAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookRecommendation extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare rating?: number | null
    declare comment?: string | null
    declare description?: string | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    declare recommended?: __.Association.to<Book> | null
    declare recommended_ID?: number | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookRecommendation>;
    declare static readonly elements: __.ElementsOf<BookRecommendation>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookRecommendation extends _BookRecommendationAspect(__.Entity) {}
Object.defineProperty(BookRecommendation, 'name', { value: 'sap.capire.bookshop.BookRecommendations' })
Object.defineProperty(BookRecommendation, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookRecommendations extends Array<BookRecommendation> {$count?: number}
Object.defineProperty(BookRecommendations, 'name', { value: 'sap.capire.bookshop.BookRecommendations' })

export function _BookFormatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookFormat extends _._managedAspect(Base) {
    declare ID?: __.Key<number>
    declare format?: string | null
    declare price?: number | null
    declare pages?: number | null
    declare language?: string | null
    declare publicationDate?: __.CdsDate | null
    declare book?: __.Association.to<Book> | null
    declare book_ID?: number | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<BookFormat>;
    declare static readonly elements: __.ElementsOf<BookFormat>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookFormat extends _BookFormatAspect(__.Entity) {}
Object.defineProperty(BookFormat, 'name', { value: 'sap.capire.bookshop.BookFormats' })
Object.defineProperty(BookFormat, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class BookFormats extends Array<BookFormat> {$count?: number}
Object.defineProperty(BookFormats, 'name', { value: 'sap.capire.bookshop.BookFormats' })

export namespace Books {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends _sap_common._TextsAspectAspect(Base) {
      declare ID?: __.Key<number>
      declare title?: string | null
      declare descr?: string | null
      static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text> & typeof _sap_common.TextsAspect.keys;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: typeof _sap_common.TextsAspect.actions & globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'sap.capire.bookshop.Books.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'sap.capire.bookshop.Books.texts' })
  
}
export namespace Genres {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends _sap_common._TextsAspectAspect(Base) {
      declare name?: string | null
      declare descr?: string | null
      declare ID?: __.Key<number>
      static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text> & typeof _sap_common.TextsAspect.keys;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: typeof _sap_common.TextsAspect.actions & globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'sap.capire.bookshop.Genres.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'sap.capire.bookshop.Genres.texts' })
  
}