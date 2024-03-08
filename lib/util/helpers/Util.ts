import { type Handler, type Request } from '../types/types';

const util = {
  isNumber(data: any): boolean {
    return typeof data === 'number';
  },

  isRequestSingleInstance<T extends Request>(handler: Handler, request: T): boolean {
    return ('params' in request && request.params.length > 0 && handler?.isSingleInstance) ?? false;
  },

  isEmptyArray<T>(arr: T[]): arr is T[] {
    return arr.length === 0;
  },

  isRequestType: (arg: any): Request | undefined => {
    if ('data' in arg && 'path' in arg) {
      return arg as Request;
    }
  },

  sortBeforeEvents(service: any) {
    service._handlers.before.sort((a: { before: string }, b: { before: string }) => {
      if (a.before < b.before) {
        return -1;
      }

      if (a.before > b.before) {
        return 1;
      }

      return 0;
    });
  },
};

export default util;
