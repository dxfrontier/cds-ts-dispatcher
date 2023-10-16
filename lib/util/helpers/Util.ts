/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request } from '@sap/cds';
import { type Handler } from '../types/types';

export const Util = {
  isNumber(data: any): boolean {
    return typeof data === 'number';
  },

  isRequestSingleInstance<T extends Request>(handler: Handler, request: T): boolean {
    return (request.params.length > 0 && handler?.isSingleInstance) ?? false;
  },

  isEmptyArray<T>(arr: T[]): arr is T[] {
    return arr.length === 0;
  },
};

export default Util;
