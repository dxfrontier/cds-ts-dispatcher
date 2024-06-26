/* eslint-disable @typescript-eslint/no-unsafe-argument */
import validator from 'validator';

import util from '../util';

import type { ExtendedRequestWithResults } from '../../types/internalTypes';
import type { Custom, Formatters } from '../../types/formatter';
import type { Request } from '../../types/types';

const formatterUtil = {
  findResults<T>(args: any[]): T | T[] | undefined {
    const req = util.findRequest(args) as ExtendedRequestWithResults;

    // The 'results / result' property
    for (const arg of args) {
      if (!util.lodash.isUndefined(req.results)) {
        const argResults = Array.isArray(req.results) ? arg : arg[0];

        if (argResults === req.results) {
          return arg;
        }
      }
    }

    return undefined;
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
