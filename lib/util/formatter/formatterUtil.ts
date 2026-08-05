import validator from 'validator';

import util from '../util';

import type { ExtendedRequestWithResults } from '../../types/internalTypes';
import type { Custom, Formatters } from '../../types/formatter';
import type { Request } from '../../types/types';

/**
 * Utility functions for applying formatters to various data structures.
 */
const formatterUtil = {
  /**
   * Finds and returns results from the request object within the provided arguments.
   * @param args - The array of arguments to search for the results.
   * @returns The found results or `undefined` if no results are found.
   */
  findResults<T>(args: any[]): T | T[] | undefined {
    const req = util.findRequest(args) as ExtendedRequestWithResults | undefined;

    // If no request found, return undefined
    if (util.lodash.isUndefined(req)) {
      return undefined;
    }

    // BEFORE / ON events never carry '.results' - the `@FieldsFormatter` request-data path (formatting
    // `req.data` instead) depends on this staying `undefined` here; do not change this branch.
    if (util.lodash.isUndefined(req.results)) {
      return undefined;
    }

    // The 'results / result' property
    for (const arg of args) {
      if (Array.isArray(req.results)) {
        if (arg === req.results) {
          return arg;
        }

        continue;
      }

      // req.results is a single (non-array) result: match either the bare object directly
      // (e.g. AfterReadSingleInstance-style callbacks), or an array wrapping it (arg[0] === req.results),
      // kept for backward compatibility with any caller relying on the wrapped shape.
      if (arg === req.results || arg?.[0] === req.results) {
        return arg;
      }
    }

    // FALLBACK: `@sap/cds` >= 10 write events (CREATE/UPDATE/DELETE) have `CDSDispatcher.executeAfterCallback`
    // swap the callback argument to `req.data` (or a boolean, for DELETE) to restore the pre-cds-10 `@After*`
    // contract - so none of `args` is ever identity-equal to `req.results` there, and the loop above never
    // matches. `req.results` itself still holds CAP's real result, so returning it lets `@Exclude` /
    // `@Include` / `@Mask` / `@FieldsFormatter` operate on the real results instead of silently no-op'ing
    // (never fall back to `req.data` - that's the request payload, not a result). NOTE: generic OData/REST
    // write RESPONSE BODIES are rebuilt after this phase (read-after-write / `req.data`) - see the
    // `@Exclude` / `@Include` / `@Mask` docs for what shaping `req.results` does and does not reach.
    // Guard: only object-shaped results are transformable - a `null` reply from a custom `@On*` handler or
    // a numeric delete count (`legacy_srv_results: true`) must keep the pre-fix no-op instead of throwing
    // inside the transformers (`delete null[field]`, `'x' in 1`). Do NOT "simplify" this away.
    return util.lodash.isObjectLike(req.results) ? (req.results as T | T[]) : undefined;
  },

  /**
   * Applies the specified formatter to the given value.
   * @param formatter - The formatter to apply.
   * @param value - The value to format.
   * @returns The formatted value.
   */
  applyFormatter<T = any>(formatter: Exclude<Formatters<T>, Custom<T>>, value: any) {
    const input = String(value);

    switch (formatter.action) {
      // START 'Lodash' formatters

      case 'truncate': {
        return util.lodash.truncate(input, formatter.options);
      }

      case 'replace': {
        return util.lodash.replace(input, formatter.pattern, formatter.replacement);
      }

      // No arguments
      case 'camelCase':
      case 'kebabCase':
      case 'snakeCase':
      case 'toUpper':
      case 'toLower':
      case 'upperFirst':
      case 'lowerFirst': {
        return util.lodash[formatter.action](input);
      }

      // END 'Lodash'

      // -------------------------------------------------------------------------

      // START 'Validator' formatters

      case 'blacklist': {
        return validator[formatter.action](input, formatter.charsToRemove);
      }

      case 'ltrim':
      case 'rtrim':
      case 'trim': {
        return validator[formatter.action](input, formatter.chars);
      }

      // No arguments
      case 'escape':
      case 'unescape': {
        return validator[formatter.action](input);
      }

      // END 'Validator'

      default:
        return '';
    }
  },

  /**
   * Applies the specified formatter to a single field of a single item.
   * @param formatter - The formatter to apply.
   * @param result - The item to format.
   * @param field - The field of the item to format.
   */
  handleOneItem<T, Result extends T = any, Field extends keyof T = any>(
    formatter: Exclude<Formatters<T>, Custom<T>>,
    result: Result,
    field: Field,
  ): void {
    (result[field] as string) = this.applyFormatter(formatter, result[field]);
  },

  /**
   * Applies the specified formatter to a single field of multiple items.
   * @param formatter - The formatter to apply.
   * @param results - The items to format.
   * @param field - The field of the items to format.
   */
  handleManyItems<T, Results extends T[] = any, Field extends keyof Results[number] = any>(
    formatter: Exclude<Formatters<T>, Custom<T>>,
    results: Results,
    field: Field,
  ): void {
    results.forEach((entry: any) => (entry[field] = this.applyFormatter(formatter, entry[field])));
  },

  /**
   * Applies the specified formatter to a single field of the request data.
   * @param req - The request containing the data to format.
   * @param formatter - The formatter to apply.
   * @param field - The field of the request data to format.
   */
  handleOneItemOfRequest<T, Field extends keyof T = any>(
    req: Request,
    formatter: Exclude<Formatters<T>, Custom<T>>,
    field: Field,
  ): void {
    if (util.isFieldEmpty(req.data[field])) {
      util.raiseBadRequestEmptyField(req, formatter, field as string);
    }

    req.data[field] = this.applyFormatter(formatter, req.data[field]);
  },

  /**
   * Handles the application of a custom formatter.
   * @param req - The request object.
   * @param formatter - The custom formatter to apply.
   * @param results - The results to format.
   */
  async handleCustomFormatter<T>(req: Request, formatter: Custom<T>, results: T | T[] | undefined) {
    await formatter.callback(req, results as T[]);
  },
};

export default formatterUtil;
