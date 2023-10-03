// This is an automatically generated file. Please do not change its contents manually!
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
import * as __ from './../_';
import * as _ from './..';
/**
* For displaying lists of Books
*/
export function _ListOfBookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class ListOfBook extends Base {
        ID?: number;
        title?: string;
        descr?: string;
        author?: __.Association.to<_sap_capire_bookshop.Author>;
        author_ID?: number;
        genre?: __.Association.to<_sap_capire_bookshop.Genre>;
        genre_ID?: number;
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
export class ListOfBook extends _._managedAspect(_ListOfBookAspect(__.Entity)) {}
export class ListOfBooks extends Array<ListOfBook> {}

/**
* For display in details pages
*/
export function _BookAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Book extends Base {
        ID?: number;
        title?: string;
        descr?: string;
        author?: __.Association.to<_sap_capire_bookshop.Author>;
        author_ID?: number;
        genre?: __.Association.to<_sap_capire_bookshop.Genre>;
        genre_ID?: number;
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

// event
export class OrderedBook {
    book: __.DeepRequired<Book>['ID'];
    quantity: number;
    buyer: string;
}
// function
export declare const submitOrder: { (book: __.DeepRequired<Book>['ID'], quantity: number): {
    stock?: number;
}, __parameters: {book: __.DeepRequired<Book>['ID'], quantity: number}, __returns: {
    stock?: number;
} };
// action
export declare const submitFunctionOrder: { (book: __.DeepRequired<Book>['ID'], quantity: number): {
    stock?: number;
}, __parameters: {book: __.DeepRequired<Book>['ID'], quantity: number}, __returns: {
    stock?: number;
} };
// function
export declare const sendMail: { (request: _.HelloRequest): _.HelloResponse, __parameters: {request: _.HelloRequest}, __returns: _.HelloResponse };