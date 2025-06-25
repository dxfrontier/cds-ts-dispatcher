// This is an automatically generated file. Please do not change its contents manually!
import * as _sap_common from './sap/common';
import * as __ from './_';

export type Language = __.Association.to<_sap_common.Language>;
export type Currency = __.Association.to<_sap_common.Currency>;
export type Country = __.Association.to<_sap_common.Country>;
export type Timezone = __.Association.to<_sap_common.Timezone>;
export type User = string;
// enum
export const Roles = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Roles = "USER" | "ADMIN"

// enum
export const BookTypes = {
  BOOK_SIGNING: "BOOK_SIGNING",
  AUTHOR_TALK: "AUTHOR_TALK",
  BOOK_LUNCH: "BOOK_LUNCH",
} as const;
export type BookTypes = "BOOK_SIGNING" | "AUTHOR_TALK" | "BOOK_LUNCH"

// the following represents the CDS aspect 'cuid'
export function _cuidAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class cuid extends Base {
    declare ID?: __.Key<string>
    static readonly kind: 'entity' | 'type' | 'aspect' = 'aspect';
    declare static readonly keys: __.KeysOf<cuid>;
    declare static readonly elements: __.ElementsOf<cuid>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect for entities with canonical universal IDs
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-cuid
*/
export class cuid extends _cuidAspect(__.Entity) {}
/**
* Aspect for entities with canonical universal IDs
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-cuid
*/
export class cuid_ extends Array<cuid> {$count?: number}
Object.defineProperty(cuid_, 'name', { value: 'cuid' })
// the following represents the CDS aspect 'managed'
export function _managedAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class managed extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: User | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'aspect';
    declare static readonly keys: __.KeysOf<managed>;
    declare static readonly elements: __.ElementsOf<managed>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class managed extends _managedAspect(__.Entity) {}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class managed_ extends Array<managed> {$count?: number}
Object.defineProperty(managed_, 'name', { value: 'managed' })
// the following represents the CDS aspect 'temporal'
export function _temporalAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class temporal extends Base {
    declare validFrom?: __.CdsTimestamp | null
    declare validTo?: __.CdsTimestamp | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'aspect';
    declare static readonly keys: __.KeysOf<temporal>;
    declare static readonly elements: __.ElementsOf<temporal>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect for entities with temporal data
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-temporal
*/
export class temporal extends _temporalAspect(__.Entity) {}
/**
* Aspect for entities with temporal data
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-temporal
*/
export class temporal_ extends Array<temporal> {$count?: number}
Object.defineProperty(temporal_, 'name', { value: 'temporal' })
export function _HelloRequestAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class HelloRequest extends Base {
    greeterName?: string | null
    toName?: string | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'type';
    declare static readonly keys: __.KeysOf<HelloRequest>;
    declare static readonly elements: __.ElementsOf<HelloRequest>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class HelloRequest extends _HelloRequestAspect(__.Entity) {}
Object.defineProperty(HelloRequest, 'name', { value: 'HelloRequest' })
Object.defineProperty(HelloRequest, 'is_singular', { value: true })

export function _HelloResponseAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class HelloResponse extends Base {
    greetingMessage?: string | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'type';
    declare static readonly keys: __.KeysOf<HelloResponse>;
    declare static readonly elements: __.ElementsOf<HelloResponse>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class HelloResponse extends _HelloResponseAspect(__.Entity) {}
Object.defineProperty(HelloResponse, 'name', { value: 'HelloResponse' })
Object.defineProperty(HelloResponse, 'is_singular', { value: true })

export function _ProductsEntityAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class ProductsEntity extends _cuidAspect(Base) {
    declare name?: string | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<ProductsEntity> & typeof cuid.keys;
    declare static readonly elements: __.ElementsOf<ProductsEntity>;
    declare static readonly actions: typeof cuid.actions & globalThis.Record<never, never>;
  };
}
export class ProductsEntity extends _ProductsEntityAspect(__.Entity) {}
Object.defineProperty(ProductsEntity, 'name', { value: 'ProductsEntity' })
Object.defineProperty(ProductsEntity, 'is_singular', { value: true })
export class ProductsEntity_ extends Array<ProductsEntity> {$count?: number}
Object.defineProperty(ProductsEntity_, 'name', { value: 'ProductsEntity' })
