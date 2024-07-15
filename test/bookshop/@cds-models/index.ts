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
  return class extends Base {
        ID?: string;
      static readonly actions: Record<never, never>
  };
}
export class cuid extends _cuidAspect(__.Entity) {}
// the following represents the CDS aspect 'managed'
export function _managedAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: User | null;
      static readonly actions: Record<never, never>
  };
}
export class managed extends _managedAspect(__.Entity) {}
// the following represents the CDS aspect 'temporal'
export function _temporalAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base {
        validFrom?: __.CdsTimestamp | null;
        validTo?: __.CdsTimestamp | null;
      static readonly actions: Record<never, never>
  };
}
export class temporal extends _temporalAspect(__.Entity) {}
// the following represents the CDS aspect 'extensible'
export function _extensibleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base {
        extensions__?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class extensible extends _extensibleAspect(__.Entity) {}
export function _HelloRequestAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base {
        greeterName?: string | null;
        toName?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class HelloRequest extends _HelloRequestAspect(__.Entity) {}
Object.defineProperty(HelloRequest, 'name', { value: 'HelloRequest' })
Object.defineProperty(HelloRequest, 'is_singular', { value: true })

export function _HelloResponseAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base {
        greetingMessage?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class HelloResponse extends _HelloResponseAspect(__.Entity) {}
Object.defineProperty(HelloResponse, 'name', { value: 'HelloResponse' })
Object.defineProperty(HelloResponse, 'is_singular', { value: true })
