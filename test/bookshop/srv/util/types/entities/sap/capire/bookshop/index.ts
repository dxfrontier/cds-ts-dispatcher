// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../../../_';
import * as _ from './../../..';
import * as _sap_common from './../../common';
// enum
export const Roles = {
  USER: "USER",
  ADMIN: "ADMIN",
}
export type Roles = "USER" | "ADMIN"

export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        ID?: number;
        title?: string;
        descr?: string;
        author?: __.Association.to<Author>;
        author_ID?: number;
        genre?: __.Association.to<Genre>;
        genre_ID?: number;
        reviews?: __.Association.to.many<Reviews>;
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
        books?: __.Association.to.many<Books>;
        books_ID?: number;
    static actions: {
    }
  };
}
export class Author extends _._managedAspect(_AuthorAspect(__.Entity)) {}
export class Authors extends Array<Author> {}

/**
* Hierarchically organized Code List for Genres
*/
export function _GenreAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Genre extends Base {
        ID?: number;
        parent?: __.Association.to<Genre>;
        parent_ID?: number;
        children?: __.Composition.of.many<Genres>;
        children_ID?: number;
    static actions: {
    }
  };
}
export class Genre extends _sap_common._CodeListAspect(_GenreAspect(__.Entity)) {}
export class Genres extends Array<Genre> {}

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
        ID?: number;
        book?: __.Association.to<Book>;
        book_ID?: number;
        reviewer?: __.Association.to<User>;
        reviewer_ID?: number;
        rating?: number;
        comment?: string;
    static actions: {
    }
  };
}
export class Review extends _._managedAspect(_ReviewAspect(__.Entity)) {static drafts: typeof Review}
export class Reviews extends Array<Review> {static drafts: typeof Review}

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends Base {
        ID?: number;
        username?: string;
        email?: string;
        role?: Roles;
        reviews?: __.Association.to.many<Reviews>;
        reviews_ID?: number;
    static actions: {
    }
  };
}
export class User extends _._managedAspect(_UserAspect(__.Entity)) {}
export class Users extends Array<User> {}
