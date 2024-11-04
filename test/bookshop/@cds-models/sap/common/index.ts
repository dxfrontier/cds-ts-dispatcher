// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../../_';

export type Locale = string;
// the following represents the CDS aspect 'CodeList'
export function _CodeListAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class CodeList extends Base {
    declare name?: string | null
    declare descr?: string | null
    static readonly kind: "entity" | "type" | "aspect" = 'aspect';
    declare static readonly keys: __.KeysOf<CodeList>;
    declare static readonly elements: __.ElementsOf<CodeList>;
    static readonly actions: Record<never, never>;
  };
}
/**
* Aspect for a code list with name and description
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-codelist
*/
export class CodeList extends _CodeListAspect(__.Entity) {}
// the following represents the CDS aspect 'TextsAspect'
export function _TextsAspectAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class TextsAspect extends Base {
    /** Type for a language code */
    declare locale?: __.Key<Locale>
    static readonly kind: "entity" | "type" | "aspect" = 'aspect';
    declare static readonly keys: __.KeysOf<TextsAspect>;
    declare static readonly elements: __.ElementsOf<TextsAspect>;
    static readonly actions: Record<never, never>;
  };
}
export class TextsAspect extends _TextsAspectAspect(__.Entity) {}
export function _LanguageAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Language extends _CodeListAspect(Base) {
    /** Type for a language code */
    declare code?: __.Key<Locale>
    static override readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Language>;
    declare static readonly elements: __.ElementsOf<Language>;
    static readonly actions: typeof CodeList.actions & Record<never, never>;
  };
}
/**
* Code list for languages
* 
* See https://cap.cloud.sap/docs/cds/common#entity-languages
*/
export class Language extends _LanguageAspect(__.Entity) {}
Object.defineProperty(Language, 'name', { value: 'sap.common.Languages' })
Object.defineProperty(Language, 'is_singular', { value: true })
/**
* Code list for languages
* 
* See https://cap.cloud.sap/docs/cds/common#entity-languages
*/
export class Languages extends Array<Language> {$count?: number}
Object.defineProperty(Languages, 'name', { value: 'sap.common.Languages' })

export function _CountryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Country extends _CodeListAspect(Base) {
    declare code?: __.Key<string>
    static override readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Country>;
    declare static readonly elements: __.ElementsOf<Country>;
    static readonly actions: typeof CodeList.actions & Record<never, never>;
  };
}
/**
* Code list for countries
* 
* See https://cap.cloud.sap/docs/cds/common#entity-countries
*/
export class Country extends _CountryAspect(__.Entity) {}
Object.defineProperty(Country, 'name', { value: 'sap.common.Countries' })
Object.defineProperty(Country, 'is_singular', { value: true })
/**
* Code list for countries
* 
* See https://cap.cloud.sap/docs/cds/common#entity-countries
*/
export class Countries extends Array<Country> {$count?: number}
Object.defineProperty(Countries, 'name', { value: 'sap.common.Countries' })

export function _CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Currency extends _CodeListAspect(Base) {
    declare code?: __.Key<string>
    declare symbol?: string | null
    declare minorUnit?: number | null
    static override readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Currency>;
    declare static readonly elements: __.ElementsOf<Currency>;
    static readonly actions: typeof CodeList.actions & Record<never, never>;
  };
}
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currency extends _CurrencyAspect(__.Entity) {}
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
Object.defineProperty(Currency, 'is_singular', { value: true })
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currencies extends Array<Currency> {$count?: number}
Object.defineProperty(Currencies, 'name', { value: 'sap.common.Currencies' })

export function _TimezoneAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Timezone extends _CodeListAspect(Base) {
    declare code?: __.Key<string>
    static override readonly kind: "entity" | "type" | "aspect" = 'entity';
    declare static readonly keys: __.KeysOf<Timezone>;
    declare static readonly elements: __.ElementsOf<Timezone>;
    static readonly actions: typeof CodeList.actions & Record<never, never>;
  };
}
/**
* Code list for time zones
* 
* See https://cap.cloud.sap/docs/cds/common#entity-timezones
*/
export class Timezone extends _TimezoneAspect(__.Entity) {}
Object.defineProperty(Timezone, 'name', { value: 'sap.common.Timezones' })
Object.defineProperty(Timezone, 'is_singular', { value: true })
/**
* Code list for time zones
* 
* See https://cap.cloud.sap/docs/cds/common#entity-timezones
*/
export class Timezones extends Array<Timezone> {$count?: number}
Object.defineProperty(Timezones, 'name', { value: 'sap.common.Timezones' })
