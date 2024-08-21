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
        declare ID?: string;
      declare static readonly actions: Record<never, never>
  };
}
export class cuid extends _cuidAspect(__.Entity) {}
// the following represents the CDS aspect 'managed'
export function _managedAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class managed extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: User | null;
      declare static readonly actions: Record<never, never>
  };
}
export class managed extends _managedAspect(__.Entity) {}
// the following represents the CDS aspect 'temporal'
export function _temporalAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class temporal extends Base {
        declare validFrom?: __.CdsTimestamp | null;
        declare validTo?: __.CdsTimestamp | null;
      declare static readonly actions: Record<never, never>
  };
}
export class temporal extends _temporalAspect(__.Entity) {}
export function _HelloRequestAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class HelloRequest extends Base {
        greeterName?: string | null;
        toName?: string | null;
      declare static readonly actions: Record<never, never>
  };
}
export class HelloRequest extends _HelloRequestAspect(__.Entity) {}
Object.defineProperty(HelloRequest, 'name', { value: 'HelloRequest' })
Object.defineProperty(HelloRequest, 'is_singular', { value: true })

export function _HelloResponseAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class HelloResponse extends Base {
        greetingMessage?: string | null;
      declare static readonly actions: Record<never, never>
  };
}
export class HelloResponse extends _HelloResponseAspect(__.Entity) {}
Object.defineProperty(HelloResponse, 'name', { value: 'HelloResponse' })
Object.defineProperty(HelloResponse, 'is_singular', { value: true })
