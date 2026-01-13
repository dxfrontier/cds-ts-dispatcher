import util from '../util';
import formatterUtil from '../formatter/formatterUtil';

import type { MaskOptions } from '../../types/responseTransformers';

/**
 * Utility functions for response transformation decorators (@Exclude, @Include, @Mask).
 */
const transformersUtil = {
  /**
   * Finds and returns results from the arguments.
   * Re-uses the findResults from formatterUtil.
   */
  findResults<T>(args: any[]): T | T[] | undefined {
    return formatterUtil.findResults<T>(args);
  },

  /**
   * Excludes specified fields from a single item.
   * @param item - The item to process.
   * @param fields - The fields to exclude.
   */
  excludeFieldsFromItem<T>(item: T, fields: (keyof T)[]): void {
    for (const field of fields) {
      delete item[field];
    }
  },

  /**
   * Excludes specified fields from results (single item or array).
   * @param results - The results to process.
   * @param fields - The fields to exclude.
   */
  excludeFields<T>(results: T | T[] | undefined, fields: (keyof T)[]): void {
    if (util.lodash.isUndefined(results)) {
      return;
    }

    if (util.lodash.isArray(results)) {
      for (const item of results) {
        this.excludeFieldsFromItem(item, fields);
      }
    } else {
      this.excludeFieldsFromItem(results, fields);
    }
  },

  /**
   * Includes only specified fields in a single item (removes all others).
   * @param item - The item to process.
   * @param fields - The fields to include.
   */
  includeOnlyFieldsFromItem<T>(item: T, fields: (keyof T)[]): void {
    const allKeys = Object.keys(item as object) as (keyof T)[];
    const fieldsToRemove = allKeys.filter((key) => !fields.includes(key));

    for (const field of fieldsToRemove) {
      delete item[field];
    }
  },

  /**
   * Includes only specified fields in results (single item or array).
   * @param results - The results to process.
   * @param fields - The fields to include.
   */
  includeFields<T>(results: T | T[] | undefined, fields: (keyof T)[]): void {
    if (util.lodash.isUndefined(results)) {
      return;
    }

    if (util.lodash.isArray(results)) {
      for (const item of results) {
        this.includeOnlyFieldsFromItem(item, fields);
      }
    } else {
      this.includeOnlyFieldsFromItem(results, fields);
    }
  },

  /**
   * Masks a single field value.
   * @param value - The value to mask.
   * @param options - The mask options.
   * @returns The masked value.
   */
  maskValue(value: unknown, options: Required<MaskOptions>): string {
    if (util.lodash.isNil(value)) {
      return '';
    }

    const strValue = String(value);
    const { char, visibleStart, visibleEnd } = options;

    if (strValue.length <= visibleStart + visibleEnd) {
      return strValue;
    }

    const visibleStartStr = strValue.slice(0, visibleStart);
    const visibleEndStr = strValue.slice(-visibleEnd || strValue.length);
    const maskedLength = strValue.length - visibleStart - visibleEnd;
    const maskedStr = char.repeat(maskedLength);

    return visibleStartStr + maskedStr + visibleEndStr;
  },

  /**
   * Masks specified fields in a single item.
   * @param item - The item to process.
   * @param fields - The fields to mask.
   * @param options - The mask options.
   */
  maskFieldsInItem<T>(item: T, fields: (keyof T)[], options: Required<MaskOptions>): void {
    for (const field of fields) {
      if (field in (item as object)) {
        (item as any)[field] = this.maskValue(item[field], options);
      }
    }
  },

  /**
   * Masks specified fields in results (single item or array).
   * @param results - The results to process.
   * @param fields - The fields to mask.
   * @param options - The mask options.
   */
  maskFields<T>(results: T | T[] | undefined, fields: (keyof T)[], options: MaskOptions): void {
    if (util.lodash.isUndefined(results)) {
      return;
    }

    const resolvedOptions: Required<MaskOptions> = {
      char: options.char ?? '*',
      visibleStart: options.visibleStart ?? 0,
      visibleEnd: options.visibleEnd ?? 4,
    };

    if (util.lodash.isArray(results)) {
      for (const item of results) {
        this.maskFieldsInItem(item, fields, resolvedOptions);
      }
    } else {
      this.maskFieldsInItem(results, fields, resolvedOptions);
    }
  },
};

export default transformersUtil;
