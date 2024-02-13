// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as __ from './../_';
import * as _sap_common from './../sap/common';
export default { name: 'CatalogService' }
export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        ID?: number | null;
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
        author?: __.Association.to<_sap_capire_bookshop.Author> | null;
        author_ID?: number | null;
        genre?: __.Association.to<_sap_capire_bookshop.Genre> | null;
        genre_ID?: number | null;
        reviews?: __.Association.to.many<_sap_capire_bookshop.Reviews>;
        stats?: __.Association.to<_sap_capire_bookshop.BookStat> | null;
        stats_ID?: number | null;
      static actions: {
    }
  };
}
export class Book extends _._managedAspect(_BookAspect(__.Entity)) {}
export class Books extends Array<Book> {}
Object.defineProperty(Book, 'name', { value: 'CatalogService.Books' })
Object.defineProperty(Books, 'name', { value: 'CatalogService.Books' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
        ID?: number | null;
        name?: string | null;
        dateOfBirth?: string | null;
        dateOfDeath?: string | null;
        placeOfBirth?: string | null;
        placeOfDeath?: string | null;
        books?: __.Association.to.many<_sap_capire_bookshop.Books>;
      static actions: {
    }
  };
}
export class Author extends _._managedAspect(_AuthorAspect(__.Entity)) {}
export class Authors extends Array<Author> {}
Object.defineProperty(Author, 'name', { value: 'CatalogService.Authors' })
Object.defineProperty(Authors, 'name', { value: 'CatalogService.Authors' })

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
        ID?: number;
        book?: __.Association.to<_sap_capire_bookshop.Book> | null;
        book_ID?: number | null;
        reviewer?: __.Association.to<_sap_capire_bookshop.User> | null;
        reviewer_ID?: number | null;
        rating?: number | null;
        comment?: string | null;
      static actions: {
    }
  };
}
export class Review extends _._managedAspect(_ReviewAspect(__.Entity)) {}
export class Reviews extends Array<Review> {}
Object.defineProperty(Review, 'name', { value: 'CatalogService.Reviews' })
Object.defineProperty(Reviews, 'name', { value: 'CatalogService.Reviews' })

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
Object.defineProperty(Publisher, 'name', { value: 'CatalogService.Publishers' })
Object.defineProperty(Publishers, 'name', { value: 'CatalogService.Publishers' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends Base {
        ID?: number;
        orderNumber?: string | null;
        orderDate?: string | null;
        totalAmount?: number | null;
        status?: string | null;
        customer?: __.Association.to<_sap_capire_bookshop.User> | null;
        customer_ID?: number | null;
      static actions: {
    }
  };
}
export class BookOrder extends _._managedAspect(_BookOrderAspect(__.Entity)) {}
export class BookOrders extends Array<BookOrder> {}
Object.defineProperty(BookOrder, 'name', { value: 'CatalogService.BookOrders' })
Object.defineProperty(BookOrders, 'name', { value: 'CatalogService.BookOrders' })

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
Object.defineProperty(BookEvent, 'name', { value: 'CatalogService.BookEvents' })
Object.defineProperty(BookEvents, 'name', { value: 'CatalogService.BookEvents' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends Base {
        ID?: number | null;
        views?: number | null;
        averageRating?: number | null;
        book?: __.Association.to<_sap_capire_bookshop.Book> | null;
        book_ID?: number | null;
      static actions: {
        GenerateReport: { (ID: __.DeepRequired<Book>['ID'] | null):         {
                    book?: __.DeepRequired<Book>['title'] | null;
                    stats?: __.DeepRequired<BookStat>['views'] | null;
                    rating?: __.DeepRequired<BookStat>['averageRating'] | null;
        }, __parameters: {ID: __.DeepRequired<Book>['ID'] | null}, __returns:         {
                    book?: __.DeepRequired<Book>['title'] | null;
                    stats?: __.DeepRequired<BookStat>['views'] | null;
                    rating?: __.DeepRequired<BookStat>['averageRating'] | null;
        } }
        NotifyAuthor: { (ID: __.DeepRequired<Author>['ID'] | null): boolean, __parameters: {ID: __.DeepRequired<Author>['ID'] | null}, __returns: boolean }
    }
  };
}
export class BookStat extends _._managedAspect(_BookStatAspect(__.Entity)) {}
export class BookStats extends Array<BookStat> {}
Object.defineProperty(BookStat, 'name', { value: 'CatalogService.BookStats' })
Object.defineProperty(BookStats, 'name', { value: 'CatalogService.BookStats' })

/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export function _CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Currency extends Base {
        code?: string | null;
        symbol?: string | null;
        minorUnit?: number | null;
      static actions: {
    }
  };
}
export class Currency extends _sap_common._CodeListAspect(_CurrencyAspect(__.Entity)) {}
export class Currencies extends Array<Currency> {}
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
Object.defineProperty(Currencies, 'name', { value: 'sap.common.Currencies' })

export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends Base {
        ID?: number | null;
        parent?: __.Association.to<_sap_capire_bookshop.Genre> | null;
        parent_ID?: number | null;
        children?: __.Composition.of.many<_sap_capire_bookshop.Genres>;
      static actions: {
    }
  };
}
export class Genre extends _sap_common._CodeListAspect(_GenreAspect(__.Entity)) {}
export class Genres extends Array<Genre> {}
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
Object.defineProperty(Genres, 'name', { value: 'sap.capire.bookshop.Genres' })

// event
export class OrderedBook {
    book: __.DeepRequired<Book>['ID'] | null;
    quantity: number | null;
    buyer: string | null;
}
// function
export declare const submitOrder: { (book: __.DeepRequired<Book>['ID'] | null, quantity: number | null): {
    stock?: number | null;
} | null, __parameters: {book: __.DeepRequired<Book>['ID'] | null, quantity: number | null}, __returns: {
    stock?: number | null;
} | null };
// action
export declare const submitOrderFunction: { (book: __.DeepRequired<Book>['ID'] | null, quantity: number | null): {
    stock?: number | null;
} | null, __parameters: {book: __.DeepRequired<Book>['ID'] | null, quantity: number | null}, __returns: {
    stock?: number | null;
} | null };