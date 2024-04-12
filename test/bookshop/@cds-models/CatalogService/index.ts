// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as _sap_common from './../sap/common';
export default { name: 'CatalogService' }
export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
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
        stats_ID?: number | null;
        bookFormats?: __.Association.to.many<BookFormats>;
        bookRecomanddations?: __.Association.to.many<BookRecommendations>;
      static actions: {
      }
  };
}
export class Book extends _._managedAspect(_BookAspect(__.Entity)) {}
Object.defineProperty(Book, 'name', { value: 'CatalogService.Books' })
export class Books extends Array<Book> {}
Object.defineProperty(Books, 'name', { value: 'CatalogService.Books' })

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
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
Object.defineProperty(Author, 'name', { value: 'CatalogService.Authors' })
export class Authors extends Array<Author> {}
Object.defineProperty(Authors, 'name', { value: 'CatalogService.Authors' })

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
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
      static actions: {
      }
  };
}
export class Review extends _._managedAspect(_ReviewAspect(__.Entity)) {}
Object.defineProperty(Review, 'name', { value: 'CatalogService.Reviews' })
export class Reviews extends Array<Review> {}
Object.defineProperty(Reviews, 'name', { value: 'CatalogService.Reviews' })

export function _PublisherAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Publisher extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        name?: string | null;
      static actions: {
      }
  };
}
export class Publisher extends _._managedAspect(_PublisherAspect(__.Entity)) {}
Object.defineProperty(Publisher, 'name', { value: 'CatalogService.Publishers' })
export class Publishers extends Array<Publisher> {}
Object.defineProperty(Publishers, 'name', { value: 'CatalogService.Publishers' })

export function _BookOrderAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookOrder extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
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
Object.defineProperty(BookOrder, 'name', { value: 'CatalogService.BookOrders' })
export class BookOrders extends Array<BookOrder> {}
Object.defineProperty(BookOrders, 'name', { value: 'CatalogService.BookOrders' })

export function _BookRecommendationAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookRecommendation extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
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
      static actions: {
      }
  };
}
export class BookRecommendation extends _._managedAspect(_BookRecommendationAspect(__.Entity)) {}
Object.defineProperty(BookRecommendation, 'name', { value: 'CatalogService.BookRecommendations' })
export class BookRecommendations extends Array<BookRecommendation> {}
Object.defineProperty(BookRecommendations, 'name', { value: 'CatalogService.BookRecommendations' })

export function _BookFormatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookFormat extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        format?: string | null;
        price?: number | null;
        pages?: number | null;
        language?: string | null;
        publicationDate?: string | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
      static actions: {
      }
  };
}
export class BookFormat extends _._managedAspect(_BookFormatAspect(__.Entity)) {}
Object.defineProperty(BookFormat, 'name', { value: 'CatalogService.BookFormats' })
export class BookFormats extends Array<BookFormat> {}
Object.defineProperty(BookFormats, 'name', { value: 'CatalogService.BookFormats' })

export function _BookSaleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookSale extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        saleDate?: string | null;
        saleAmount?: number | null;
        quantity?: number | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
        customer?: __.Association.to<_sap_capire_bookshop.User> | null;
        customer_ID?: number | null;
      static actions: {
      }
  };
}
export class BookSale extends _._managedAspect(_._cuidAspect(_BookSaleAspect(__.Entity))) {}
Object.defineProperty(BookSale, 'name', { value: 'CatalogService.BookSales' })
export class BookSales extends Array<BookSale> {}
Object.defineProperty(BookSales, 'name', { value: 'CatalogService.BookSales' })

export function _BookEventAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookEvent extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: string;
        name?: string | null;
        types?: _.BookTypes | null;
      static actions: {
      }
  };
}
export class BookEvent extends _._managedAspect(_._cuidAspect(_BookEventAspect(__.Entity))) {static drafts: typeof BookEvent}
Object.defineProperty(BookEvent, 'name', { value: 'CatalogService.BookEvents' })
export class BookEvents extends Array<BookEvent> {static drafts: typeof BookEvent}
Object.defineProperty(BookEvents, 'name', { value: 'CatalogService.BookEvents' })

export function _BookStatAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class BookStat extends Base {
        createdAt?: string | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: string | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        views?: number | null;
        averageRating?: number | null;
        book?: __.Association.to<Book> | null;
        book_ID?: number | null;
      static actions: {
        GenerateReport: { (ID: __.DeepRequired<Book>['ID']):       {
                book?: __.DeepRequired<Book>['title'] | null;
                stats?: __.DeepRequired<BookStat>['views'] | null;
                rating?: __.DeepRequired<BookStat>['averageRating'] | null;
      }, __parameters: {ID: __.DeepRequired<Book>['ID']}, __returns:       {
                book?: __.DeepRequired<Book>['title'] | null;
                stats?: __.DeepRequired<BookStat>['views'] | null;
                rating?: __.DeepRequired<BookStat>['averageRating'] | null;
      } }
        NotifyAuthor: { (ID: __.DeepRequired<Author>['ID']): boolean, __parameters: {ID: __.DeepRequired<Author>['ID']}, __returns: boolean }
      }
  };
}
export class BookStat extends _._managedAspect(_BookStatAspect(__.Entity)) {}
Object.defineProperty(BookStat, 'name', { value: 'CatalogService.BookStats' })
export class BookStats extends Array<BookStat> {}
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
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
export class Currencies extends Array<Currency> {}
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
Object.defineProperty(Genre, 'name', { value: 'sap.capire.bookshop.Genres' })
export class Genres extends Array<Genre> {}
Object.defineProperty(Genres, 'name', { value: 'sap.capire.bookshop.Genres' })

// event
export class OrderedBook {
    book: __.DeepRequired<Book>['ID'] | null;
    quantity: number | null;
    buyer: string | null;
}
// function
export declare const changeBookProperties: { (format: __.DeepRequired<BookFormat>['format'] | null, language: __.DeepRequired<BookFormat>['language'] | null): {
    language?: string | null;
    format?: __.DeepRequired<BookFormat>['format'] | null;
} | null, __parameters: {format: __.DeepRequired<BookFormat>['format'] | null, language: __.DeepRequired<BookFormat>['language'] | null}, __returns: {
    language?: string | null;
    format?: __.DeepRequired<BookFormat>['format'] | null;
} | null };
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