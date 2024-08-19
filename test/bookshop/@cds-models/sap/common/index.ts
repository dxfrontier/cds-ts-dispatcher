// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../../_';
export type Locale = string;
// the following represents the CDS aspect 'CodeList'
export function _CodeListAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class CodeList extends Base {
        declare name?: string | null;
        declare descr?: string | null;
      declare static readonly actions: Record<never, never>
  };
}
export class CodeList extends _CodeListAspect(__.Entity) {}
// the following represents the CDS aspect 'TextsAspect'
export function _TextsAspectAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class TextsAspect extends Base {
    /**
    * Type for a language code
    */
        declare locale?: Locale;
      declare static readonly actions: Record<never, never>
  };
}
export class TextsAspect extends _TextsAspectAspect(__.Entity) {}
/**
* Code list for languages
* 
* See https://cap.cloud.sap/docs/cds/common#entity-languages
*/
export function _LanguageAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Language extends _CodeListAspect(Base) {
    /**
    * Type for a language code
    */
        declare code?: Locale;
      declare static readonly actions: typeof CodeList.actions & Record<never, never>
  };
}
export class Language extends _LanguageAspect(__.Entity) {}
Object.defineProperty(Language, 'name', { value: 'sap.common.Languages' })
Object.defineProperty(Language, 'is_singular', { value: true })
export class Languages extends Array<Language> {$count?: number}
Object.defineProperty(Languages, 'name', { value: 'sap.common.Languages' })

/**
* Code list for countries
* 
* See https://cap.cloud.sap/docs/cds/common#entity-countries
*/
export function _CountryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Country extends _CodeListAspect(Base) {
        declare code?: string;
      declare static readonly actions: typeof CodeList.actions & Record<never, never>
  };
}
export class Country extends _CountryAspect(__.Entity) {}
Object.defineProperty(Country, 'name', { value: 'sap.common.Countries' })
Object.defineProperty(Country, 'is_singular', { value: true })
export class Countries extends Array<Country> {$count?: number}
Object.defineProperty(Countries, 'name', { value: 'sap.common.Countries' })

/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export function _CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Currency extends _CodeListAspect(Base) {
        declare code?: string;
        declare symbol?: string | null;
        declare minorUnit?: number | null;
      declare static readonly actions: typeof CodeList.actions & Record<never, never>
  };
}
export class Currency extends _CurrencyAspect(__.Entity) {}
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
Object.defineProperty(Currency, 'is_singular', { value: true })
export class Currencies extends Array<Currency> {$count?: number}
Object.defineProperty(Currencies, 'name', { value: 'sap.common.Currencies' })

/**
* Code list for time zones
* 
* See https://cap.cloud.sap/docs/cds/common#entity-timezones
*/
export function _TimezoneAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Timezone extends _CodeListAspect(Base) {
        declare code?: string;
      declare static readonly actions: typeof CodeList.actions & Record<never, never>
  };
}
export class Timezone extends _TimezoneAspect(__.Entity) {}
Object.defineProperty(Timezone, 'name', { value: 'sap.common.Timezones' })
Object.defineProperty(Timezone, 'is_singular', { value: true })
export class Timezones extends Array<Timezone> {$count?: number}
Object.defineProperty(Timezones, 'name', { value: 'sap.common.Timezones' })
