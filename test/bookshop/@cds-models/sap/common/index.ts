// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../../_';
export type Locale = string;
// the following represents the CDS aspect 'CodeList'
export function _CodeListAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class CodeList extends Base {
        name?: string | null;
        descr?: string | null;
      static actions: {
    }
  };
}
export class CodeList extends _CodeListAspect(__.Entity) {}
// the following represents the CDS aspect 'TextsAspect'
export function _TextsAspectAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class TextsAspect extends Base {
    /**
    * Type for a language code
    */
        locale?: Locale;
      static actions: {
    }
  };
}
export class TextsAspect extends _TextsAspectAspect(__.Entity) {}
/**
* Code list for languages
* 
* See https://cap.cloud.sap/docs/cds/common#entity-languages
*/
export function _LanguageAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Language extends Base {
    /**
    * Type for a language code
    */
        code?: Locale;
      static actions: {
    }
  };
}
export class Language extends _CodeListAspect(_LanguageAspect(__.Entity)) {}
export class Languages extends Array<Language> {}
Object.defineProperty(Language, 'name', { value: 'sap.common.Languages' })
Object.defineProperty(Languages, 'name', { value: 'sap.common.Languages' })

/**
* Code list for countries
* 
* See https://cap.cloud.sap/docs/cds/common#entity-countries
*/
export function _CountryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Country extends Base {
        code?: string;
      static actions: {
    }
  };
}
export class Country extends _CodeListAspect(_CountryAspect(__.Entity)) {}
export class Countries extends Array<Country> {}
Object.defineProperty(Country, 'name', { value: 'sap.common.Countries' })
Object.defineProperty(Countries, 'name', { value: 'sap.common.Countries' })

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
export class Currency extends _CodeListAspect(_CurrencyAspect(__.Entity)) {}
export class Currencies extends Array<Currency> {}
Object.defineProperty(Currency, 'name', { value: 'sap.common.Currencies' })
Object.defineProperty(Currencies, 'name', { value: 'sap.common.Currencies' })
