// This is an automatically generated file. Please do not change its contents manually!
import type * as _sap_common from './sap/common';
import * as __ from './_';
export type Language = __.Association.to<_sap_common.Language>;
export type Currency = __.Association.to<_sap_common.Currency>;
export type Country = __.Association.to<_sap_common.Country>;
export type User = string;
// the following represents the CDS aspect 'cuid'
export function _cuidAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class cuid extends Base {
    ID?: string;
    static actions: {};
  };
}
export class cuid extends _cuidAspect(__.Entity) {}
// the following represents the CDS aspect 'managed'
export function _managedAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class managed extends Base {
    createdAt?: string;
    /**
     * Canonical user ID
     */
    createdBy?: User;
    modifiedAt?: string;
    /**
     * Canonical user ID
     */
    modifiedBy?: User;
    static actions: {};
  };
}
export class managed extends _managedAspect(__.Entity) {}
// the following represents the CDS aspect 'temporal'
export function _temporalAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class temporal extends Base {
    validFrom?: string;
    validTo?: string;
    static actions: {};
  };
}
export class temporal extends _temporalAspect(__.Entity) {}
// the following represents the CDS aspect 'extensible'
export function _extensibleAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extensible extends Base {
    extensions__?: string;
    static actions: {};
  };
}
export class extensible extends _extensibleAspect(__.Entity) {}
