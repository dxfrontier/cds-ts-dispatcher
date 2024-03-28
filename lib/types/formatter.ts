import type { TypedRequest } from './types';
import type { ReplaceFunction, TruncateOptions } from 'lodash';

export type BlacklistAction = {
  /**
   * Remove characters that appear in the blacklist.
   */
  action: 'blacklist';
  /**
   * The characters are used in a `RegExp` and so you will need to escape some chars, e.g. `blacklist(input, '\\[\\]')`.
   */
  charsToRemove: string;
};

export type LTrim = {
  /**
   * Trim characters from the left-side of the input.
   */
  action: 'ltrim';
  /**
   * characters (defaults to whitespace)
   */
  chars?: string;
};

export type RTrim = {
  /**
   * Trim characters from the right-side of the input.
   */
  action: 'rtrim';
  /**

   * characters (defaults to whitespace)
   */
  chars?: string;
};

export type Trim = {
  /**
   * Trim characters from both sides of the input.
   */
  action: 'trim';
  /**
   * characters (defaults to whitespace)
   */
  chars?: string;
};

export type Unescape = {
  /**
   * Replaces HTML encoded entities with `<`, `>`, `&`, `'`, `"` and `/`.
   */
  action: 'unescape';
};

export type Escape = {
  /**
   * Replace `<`, `>`, `&`, `'`, `"` and `/` with HTML entities.
   */
  action: 'escape';
};

export type ToLower = {
  /**
   * Converts `string`, as a whole, to lower case.
   */
  action: 'toLower';
};

export type ToUpper = {
  /**
   * Converts `string`, as a whole, to upper case.
   */
  action: 'toUpper';
};

export type UpperFirst = {
  /**
   * Converts the first character of `string` to upper case.
   */
  action: 'upperFirst';
};

export type LowerFirst = {
  /**
   * Converts the first character of `string` to lower case.
   */
  action: 'lowerFirst';
};

export type Truncate = {
  /**
   * Truncates string if it’s longer than the given maximum string length. The last characters of the truncated
   * string are replaced with the omission string which defaults to "…".
   *
   * @param string The string to truncate.
   * @param options The options object or maximum string length.
   * @return Returns the truncated string.
   */
  action: 'truncate';
  options?: TruncateOptions;
};

export type Replace = {
  /**
   * Replaces matches for pattern in string with replacement.
   *
   * Note: This method is based on String#replace.
   *
   * @return Returns the modified string.
   */
  action: 'replace';
  pattern: RegExp | string;
  replacement: ReplaceFunction | string;
};

export type Custom<T> = {
  action: 'customFormatter';
  callback: (req: TypedRequest<T>, results?: T[]) => Promise<void | Error> | void | Error;
};

export type LodashFormatters = ToLower | ToUpper | UpperFirst | LowerFirst | Truncate | Replace;
export type ValidatorFormatters = BlacklistAction | LTrim | RTrim | Trim | Unescape | Escape;
export type Formatters<T> = ValidatorFormatters | LodashFormatters | Custom<T>;
