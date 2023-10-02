/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request } from '@sap/cds';
import {
  type ReturnRequest,
  type ReturnResultsAndRequest,
  type ReturnRequestAndNext,
  type Handler,
} from '../types/types';

export const Util = {
  isRequest(fn: any): fn is ReturnRequest {
    return fn.length === 1;
  },

  isRequestAndResults(fn: any): fn is ReturnResultsAndRequest {
    return fn.length >= 2;
  },

  isRequestAndNext(fn: any): fn is ReturnRequestAndNext {
    return fn.length === 2;
  },

  isRequestSingleInstance<T extends Request>(handler: Handler, request: T): boolean {
    return (request.params.length > 0 && handler?.isSingleInstance) ?? false;
  },
};

export default Util;