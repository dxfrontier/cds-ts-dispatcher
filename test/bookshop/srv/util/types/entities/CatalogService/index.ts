// This is an automatically generated file. Please do not change its contents manually!
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as __ from './../_';
import * as _ from './..';
export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        ID?: number;
        title?: string;
        descr?: string;
        author?: __.Association.to<_sap_capire_bookshop.Author>;
        author_ID?: number;
        genre?: __.Association.to<_sap_capire_bookshop.Genre>;
        genre_ID?: number;
        reviews?: __.Association.to.many<_sap_capire_bookshop.Reviews>;
        reviews_ID?: number;
        stock?: number;
        price?: number;
    /**
    * Type for an association to Currencies
    * 
    * See https://cap.cloud.sap/docs/cds/common#type-currency
    */
        currency?: _.Currency;
        currency_code?: string;
        image?: Buffer | string;
    static actions: {
    }
  };
}
export class Book extends _._managedAspect(_BookAspect(__.Entity)) {}
export class Books extends Array<Book> {}

export function _AuthorAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Author extends Base {
        ID?: number;
        name?: string;
        dateOfBirth?: string;
        dateOfDeath?: string;
        placeOfBirth?: string;
        placeOfDeath?: string;
        books?: __.Association.to.many<_sap_capire_bookshop.Books>;
        books_ID?: number;
    static actions: {
    }
  };
}
export class Author extends _._managedAspect(_AuthorAspect(__.Entity)) {}
export class Authors extends Array<Author> {}

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends Base {
        ID?: number;
        username?: string;
        email?: string;
        role?: _sap_capire_bookshop.Roles;
        reviews?: __.Association.to.many<_sap_capire_bookshop.Reviews>;
        reviews_ID?: number;
    static actions: {
    }
  };
}
export class User extends _._managedAspect(_UserAspect(__.Entity)) {}
export class Users extends Array<User> {}

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
        ID?: number;
        book?: __.Association.to<_sap_capire_bookshop.Book>;
        book_ID?: number;
        reviewer?: __.Association.to<_sap_capire_bookshop.User>;
        reviewer_ID?: number;
        rating?: number;
        comment?: string;
    static actions: {
    }
  };
}
export class Review extends _._managedAspect(_ReviewAspect(__.Entity)) {static drafts: typeof Review}
export class Reviews extends Array<Review> {static drafts: typeof Review}

// function
export declare const submitOrder: { (book: __.DeepRequired<Book>['ID'], quantity: number): {
    stock?: number;
}, __parameters: {book: __.DeepRequired<Book>['ID'], quantity: number}, __returns: {
    stock?: number;
} };
// function
export declare const sendMail: { (request: _.HelloRequest): _.HelloResponse, __parameters: {request: _.HelloRequest}, __returns: _.HelloResponse };