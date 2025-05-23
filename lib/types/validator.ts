import type {
  AlphaLocale,
  AlphanumericLocale,
  ContainsOptions,
  HashAlgorithm,
  IdentityCardLocale,
  IPVersion,
  IsAlphanumericOptions,
  IsAlphaOptions,
  ISBNVersion,
  IsCreditCardOptions,
  IsCurrencyOptions,
  IsDateOptions,
  IsDecimalOptions,
  IsEmailOptions,
  IsFloatOptions,
  IsIMEIOptions,
  IsIntOptions,
  IsLengthOptions,
  IsMobilePhoneOptions,
  IsNumericOptions,
  IsTimeOptions,
  IsURLOptions,
  MobilePhoneLocale,
  PostalCodeLocale,
  UUIDVersion,
} from 'validator';

import type { IsIBANOptions } from 'validator/lib/isIBAN';
import type { Options } from 'validator/lib/isBoolean';
import type { CdsFunction } from './types';

// * ########################################################################################################
// * START Validator types
// * ########################################################################################################

// Types which has properties : 'action' and 'options'
export type IsBoolean = {
  /**
   * check if a string is a boolean.
   */
  action: 'isBoolean';
  options?: Options;
};

export type IsDecimal = {
  /**
   * Check if the string represents a decimal number,
   * such as `0.1`, `.3`, `1.1`, `1.00003`, `4.0` etc.
   *
   * @param [options] - Options
   */
  action: 'isDecimal';
  options?: IsDecimalOptions;
};

export type IsFloat = {
  /**
   * Check if the string is an integer.
   *
   * @param [options] - Options
   */
  action: 'isFloat';
  options?: IsFloatOptions;
};

export type IsInt = {
  /**
   * Check if the string is an integer.
   *
   * @param [options] - Options
   */
  action: 'isInt';
  options?: IsIntOptions;
};

export type IsMailtoURI = {
  /**
   *  check if the string is a [Magnet URI format][Mailto URI Format].<br/><br/>`options` is an object of validating emails inside the URI (check `isEmail`s options for details).
   * @param [options] [optional]
   */
  action: 'isMailtoURI';
  options?: IsEmailOptions;
};

export type IsNumeric = {
  /**
   * Check if the string contains only numbers.
   *
   * @param [options] [optional]
   */
  action: 'isNumeric';
  options?: IsNumericOptions;
};

export type IsTime = {
  /**
   * Check if the string is a valid time.
   *
   * @param [options] [optional]
   */
  action: 'isTime';
  options?: IsTimeOptions;
};

export type IsDateValidator = {
  /**
   * Check if the string is a valid date.
   *
   * @param [options] [optional]
   */
  action: 'isDate';
  options?: IsDateOptions;
};

export type IsEmailValidator = {
  /**
   * Check if the string is an email.
   *
   * @param [options] [optional]
   */
  action: 'isEmail';
  options?: IsEmailOptions;
};

export type IsCurrency = {
  /**
   * Check if the string is a valid currency amount.
   *
   * @param [options] [optional]
   */
  action: 'isCurrency';
  options?: IsCurrencyOptions;
};

export type IsIBAN = {
  /**
   * Check if a string is a IBAN (International Bank Account Number).
   *
   * @param [options] [optional]
   */
  action: 'isIBAN';
  options?: IsIBANOptions;
};

export type IsIMEI = {
  /**
   * Check if the string is a valid IMEI.
   * Non-hyphenated (`###############`) only is supported by default.
   * Use the `options` param to enable hyphenated (`##-######-######-#`) support.
   *
   * @param [options] [optional]
   */
  action: 'isIMEI';
  options?: IsIMEIOptions;
};

export type IsURL = {
  /**
   * Check if the string is an URL.
   *
   * @param [options] [optional]
   */
  action: 'isURL';
  options?: IsURLOptions;
};

export type IsUUID = {
  /**
   * Check if the string is a UUID (version 1, 2, 3, 4 or 5).
   *
   * @param [version="all"] - UUID version
   */
  action: 'isUUID';
  options?: UUIDVersion;
};

export type IsCreditCard = {
  /**
   * Check if the string is a credit card.
   *
   * @param [options] [optional]
   */
  action: 'isCreditCard';
  options?: IsCreditCardOptions;
};

export type IsLength = {
  /**
   * Check if the string's length falls in a range.
   *
   * Note: this export function takes into account surrogate pairs.
   *
   * @param [options] [optional]
   */
  action: 'isLength';
  options?: IsLengthOptions;
};

export type ValidatorsWithOptions =
  | IsBoolean
  | IsDecimal
  | IsFloat
  | IsInt
  | IsMailtoURI
  | IsNumeric
  | IsTime
  | IsDateValidator
  | IsEmailValidator
  | IsCurrency
  | IsIBAN
  | IsIMEI
  | IsURL
  | IsUUID
  | IsCreditCard
  | IsLength;

// ######################################################################################################

// Types which has only 'action' and 'countryCode' properties

export type IsPassportNumber = {
  /**
   * Check if the string is a valid passport number relative to a specific country code.
   *
   * @param [countryCode] - Country code
   */
  action: 'isPassportNumber';
  countryCode?: string;
};

export type IsVAT = {
  /**
   * Checks that the string is a [valid VAT number
   */
  action: 'isVAT';
  countryCode: string;
};

export type ValidatorsWithCountryCode = IsPassportNumber | IsVAT;

// ######################################################################################################

// Types which has only 'action' and 'locale' properties

export type IsPostalCode = {
  /**
   * Check if the string is a postal code
   *
   * @param locale - PostalCodeLocale
   */
  action: 'isPostalCode';
  locale?: 'any' | PostalCodeLocale;
};

export type IsIdentityCard = {
  /**
   * Check if the string is a valid identity card code.
   *
   * @param [locale="any"] - IdentityCardLocale
   */
  action: 'isIdentityCard';
  locale?: 'any' | IdentityCardLocale;
};

export type ValidatorsWithLocale = IsPostalCode | IsIdentityCard;

// ######################################################################################################

// Types which has only 'action' property

export type IsBIC = {
  /**
   * Check if a string is a BIC (Bank Identification Code) or SWIFT code.
   */
  action: 'isBIC';
};

export type IsEAN = {
  /**
   * Check if the string is an EAN (European Article Number).
   */
  action: 'isEAN';
};

export type IsHexadecimal = {
  /**
   * Check if the string is a hexadecimal number.
   */
  action: 'isHexadecimal';
};

export type IsLatLong = {
  /**
   * Check if the string is a valid latitude-longitude coordinate in the format:
   *
   * `lat,long` or `lat, long`.
   */
  action: 'isLatLong';
};

export type IsMD5 = {
  /**
   * Check if the string is a MD5 hash.
   */
  action: 'isMD5';
};

export type IsMimeType = {
  /**
   * Check if the string matches to a valid [MIME export type](https://en.wikipedia.org/wiki/Media_export type) format.
   */
  action: 'isMimeType';
};

export type IsPort = {
  /**
   * check if the string is a valid port number.
   */
  action: 'isPort';
};

export type IsSlug = {
  /**
   * Check if the string is of export type slug.
   */
  action: 'isSlug';
};

export type IsEmpty = {
  /**
   * Check if the string has a length of zero.
   *
   * @param [options] [optional]
   */
  action: 'isEmpty';
};

export type IsLowercase = {
  /**
   * Check if the string is lowercase.
   */
  action: 'isLowercase';
};

export type IsUppercase = {
  /**
   * Check if the string is uppercase.
   */
  action: 'isUppercase';
};

export type IsDataURI = {
  /**
   * Check if the string is a [data uri format](https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs).
   */
  action: 'isDataURI';
};

export type IsJSON = {
  /**
   * Check if the string is valid JSON (note: uses `JSON.parse`).
   */
  action: 'isJSON';
};

export type IsJWT = {
  /**
   * Check if the string is valid JWT token.
   */
  action: 'isJWT';
};

export type ValidatorsWithNoOptions =
  | IsBIC
  | IsEAN
  | IsHexadecimal
  | IsLatLong
  | IsMD5
  | IsMimeType
  | IsPort
  | IsSlug
  | IsDataURI
  | IsEmpty
  | IsLowercase
  | IsUppercase
  | IsJSON
  | IsJWT;

// ######################################################################################################

//  Types which has properties various properties

export type IsAfter = {
  /**
   * Check if the string is a date that's after the specified date.
   *
   * @param [date] - Date string (defaults to now)
   */
  action: 'isAfter';
  date?: string;
};

export type IsBefore = {
  /**
   * Check if the string is a date that's before the specified date.
   *
   * @param [date] - Date string (defaults to now)
   */
  action: 'isBefore';
  date?: string;
};

export type IsHash = {
  /**
   * Check if the string is a hash of export type algorithm.
   *
   * @param algorithm - HashAlgorithm
   */
  action: 'isHash';
  algorithm: HashAlgorithm;
};

export type IsIP = {
  /**
   * Check if the string is an IP (version 4 or 6).
   *
   * @param [version] - IP Version
   */
  action: 'isIP';
  version?: IPVersion;
};

export type IsISBN = {
  /**
   * Check if the string is an ISBN (version 10 or 13).
   *
   * @param [version] - ISBN Version
   */
  action: 'isISBN';
  version?: ISBNVersion;
};

export type IsIn = {
  /**
   * Check if the string is in a array of allowed values.
   *
   * @param values - Allowed values.
   */
  action: 'isIn';
  values: any[];
};

export type IsWhitelisted = {
  /**
   * Checks characters if they appear in the whitelist.
   *
   * @param chars - whitelist
   */
  action: 'isWhitelisted';
  chars: string | string[];
};

export type IsEquals = {
  /**
   * Check if the string matches the comparison.
   *
   * @param comparison - String to compare
   */
  action: 'equals';
  comparison: string;
};

export type Contains = {
  /**
   * Check if the string contains the seed.
   *
   * @param seed - Seed
   * @param options - [Optional] Options
   */
  action: 'contains';
  seed: string;
  options?: ContainsOptions;
};

export type Matches = {
  /**
   * Check if string matches the pattern.
   *
   * @param pattern - `/foo/i`
   */
  action: 'matches';
  pattern: RegExp;
};

export type ValidatorsWithMultipleOptions =
  | IsAfter
  | IsBefore
  | IsHash
  | IsIP
  | IsISBN
  | IsIn
  | IsWhitelisted
  | IsEquals
  | Contains
  | Matches;

// ######################################################################################################

// Types which has properties :  'action', 'locale' and 'options'

export type IsAlpha = {
  /**
   * Check if the string contains only letters (a-zA-Z).
   *
   * @param locale [optional] - AlphaLocale
   * @param options [optional] - IsAlphaOptions
   */
  action: 'isAlpha';
  locale?: AlphaLocale;
  options?: IsAlphaOptions;
};

export type IsAlphaNumeric = {
  /**
   * Check if the string contains only letters and numbers.
   *
   * @param [locale] - AlphanumericLocale
   * @param [options] - IsAlphanumericOptions
   */
  action: 'isAlphanumeric';
  locale?: AlphanumericLocale;
  options?: IsAlphanumericOptions;
};

export type isMobilePhoneValidator = {
  /**
   * Check if the string is a mobile phone number.
   *
   * @param locale [optional] - MobilePhoneLocale(s)
   * @param options [optional] [optional]
   */
  action: 'isMobilePhone';
  locale?: 'any' | MobilePhoneLocale | MobilePhoneLocale[];
  options?: IsMobilePhoneOptions;
};

export type ValidatorsWithLocaleAndOptions = isMobilePhoneValidator | IsAlphaNumeric | IsAlpha;

// ######################################################################################################

// * ########################################################################################################
// * END Validator types
// * ########################################################################################################

// * ########################################################################################################
// * START Lodash types
// * ########################################################################################################

export type StartsWith = {
  /**
   * Checks if string starts with the given target string.
   *
   * @param target The string to search for.
   * @param position [optional] The position to search from.
   * @return Returns true if string starts with target, else false.
   */
  action: 'startsWith';
  target: string;
  position?: number;
};

export type EndsWith = {
  /**
   * Checks if string ends with the given target string.
   *
   * @param target The string to search for.
   * @param position [optional] The position to search from.
   * @return Returns true if string ends with target, else false.
   */
  action: 'endsWith';
  target: string;
  position?: number;
};

export type LodashValidators = StartsWith | EndsWith;

// * ########################################################################################################
// * END Lodash types
// * ########################################################################################################

export type ExposeFields<T extends CdsFunction> = { data: T['__parameters'] }['data'];

type ValidatorBase = {
  /**
   * Controls whether the validator requires the presence of the fields in `Request.data`.
   *
   * - If set to `true`, the fields are required in `Request.data`, and validation will fail if it is absent.
   * - If set to `false` (or omitted), validation will pass even if the field is missing in `Request.data`.
   *
   * @default false
   */
  mandatoryFieldValidation?: boolean;
};

/**
 * This type must have 'customMessage' when 'exposeValidatorResult' is false
 */
type ValidatorBaseWithMessage = {
  /**
   * Determines if the validator results are captured and passed to the method as parameters.
   *
   * - If set to `true`, the validator results (e.g., `ValidatorFlags<'isBoolean' | 'equals'>`) will be caught
   *   and made available as a parameter in the method where validation is applied.
   * - If set to `false` (or omitted), the method will not receive these validator results as parameters.
   *
   * This option is useful when a method requires access to the validation outcomes to conditionally
   * handle logic based on validator flags.
   *
   * **Note:** To access these results, apply the `@ValidationResults` decorator to the method `parameter` where
   * the validator flags should be injected.
   *
   * Example usage:
   * ```typescript
   * /@Validate<MyEntity>({ action: 'startsWith', target: 'Comment:', exposeValidatorResult: true }, 'comment')
   * /@Validate<MyEntity>({ action: 'endsWith', target: 'N', exposeValidatorResult: true }, 'description')
   * public async beforeCreate(
   *   /@Req() req: Request<BookRecommendation>,
   *   /@ValidationResults() validator: ValidatorFlags<'endsWith' | 'startsWith'>,
   * ) {
   *   // validator will contain the results of 'isBoolean' and 'equals' validations
   *   if (validator.endsWith) {
   *     // handle logic based on the validation result
   *   }
   * }
   * ```
   *
   * @default false
   */
  exposeValidatorResult?: false;

  /**
   * Custom message to replace the standard validation error message.
   * If provided, this message will be displayed instead of the default.
   */
  customMessage?: string;
};

/**
 * This type must NOT have 'customMessage' when 'exposeValidatorResult' is true
 */
type ValidatorBaseWithoutMessage = {
  exposeValidatorResult?: true;
};

export type ValidatorFlags<T extends Validators['action']> = Record<T, boolean>;

// Concatenation of all properties
export type Validators = ValidatorBase &
  (ValidatorBaseWithMessage | ValidatorBaseWithoutMessage) &
  (
    | LodashValidators
    | ValidatorsWithOptions
    | ValidatorsWithLocaleAndOptions
    | ValidatorsWithNoOptions
    | ValidatorsWithLocale
    | ValidatorsWithCountryCode
    | ValidatorsWithMultipleOptions
  );
