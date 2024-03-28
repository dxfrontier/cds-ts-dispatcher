/* eslint-disable @typescript-eslint/no-unsafe-argument */
import validator from 'validator';

import util from '../util';

import type { Custom, Formatters } from '../../types/formatter';
import type { Request } from '../../types/types';

const formatterUtil = {
  getResults<T>(args: any[]): T | T[] | undefined {
    const filtered = args.filter((arg): boolean => {
      // Exclude elements that are boolean and not objects
      if (typeof arg === 'boolean') {
        return false;
      }

      if (typeof arg === 'function') {
        return false;
      }

      // Exclude elements that are of type Request
      if (util.isRequestType(arg)) {
        return false;
      }

      // Include all other elements
      return true;
    });

    // The 'results' property
    if (Array.isArray(filtered[0])) {
      return filtered[0];
    }

    return filtered[0];
  },

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

  handleOneItem<T, Result extends T = any, Field extends keyof T = any>(
    formatter: Exclude<Formatters<T>, Custom<T>>,
    result: Result,
    field: Field,
  ): void {
    (result[field] as string) = this.applyFormatter(formatter, result[field]);
  },

  handleManyItems<T, Results extends T[] = any, Field extends keyof Results[number] = any>(
    formatter: Exclude<Formatters<T>, Custom<T>>,
    results: Results,
    field: Field,
  ): void {
    results.forEach((entry: any) => (entry[field] = this.applyFormatter(formatter, entry[field])));
  },

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

  async handleCustomFormatter<T>(req: Request, formatter: Custom<T>, results: T | T[] | undefined) {
    await formatter.callback(req, results as T[]);
  },
};

export default formatterUtil;
