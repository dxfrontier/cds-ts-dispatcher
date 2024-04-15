import type { MiddlewareImpl, Request, RequestType } from '../../types/types';

import type { Constructable } from '@sap/cds/apis/internal/inference';
import constants from '../../constants/constants';
import { MetadataDispatcher } from '../../core/MetadataDispatcher';
import util from '../util';

const middlewareUtil = {
  registerToMethod<Middleware extends Constructable<MiddlewareImpl>>(
    middlewares: Middleware[],
    descriptor: TypedPropertyDescriptor<RequestType>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const executeMiddlewareChain = async (req: Request, index: number = 0): Promise<void> => {
        // stop the chain if req.reject was used
        if (middlewareUtil.isRejectUsed(req)) {
          return;
        }

        if (index < middlewares.length) {
          const CurrentMiddleware = middlewares[index];
          const currentMiddlewareInstance = new CurrentMiddleware();

          const next = async (): Promise<void> => {
            await executeMiddlewareChain(req, index + 1);
          };

          await currentMiddlewareInstance.use(req, next);
        }
      };

      const req = args.find(util.isRequestType);

      if (req) {
        await executeMiddlewareChain(req);
      }

      await originalMethod!.apply(this, args);
    };
  },

  registerToClass<Middleware extends Constructable<MiddlewareImpl>, Target extends object>(
    target: Target,
    middlewareClasses: Middleware[],
  ): void {
    const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.MIDDLEWARE_KEY);
    metadataDispatcher.setMiddlewares(middlewareClasses);
  },

  isRejectUsed(req: Request): boolean {
    return req instanceof Error;
  },

  /**
   * This routine will sort the 'Before' events over '*'. The '*' will be firstly and after the named ones as events are triggered in order.
   */
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

export default middlewareUtil;
