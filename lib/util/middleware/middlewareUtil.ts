import constants from '../../constants/internalConstants';
import { MetadataDispatcher } from '../../core/MetadataDispatcher';
import util from '../util';

import type { MiddlewareImpl, Request, RequestType } from '../../types/types';
import type { Constructable } from '@sap/cds/apis/internal/inference';

/**
 * Utility object for handling middleware operations.
 */
const middlewareUtil = {
  /**
   * Executes a chain of middleware functions.
   * @template Middleware
   * @param req The request object.
   * @param index The current index in the middleware chain. Defaults to 0.
   * @param middlewares An array of middleware classes to execute.
   * @param entityInstance An optional entity instance.
   * @returns A promise that resolves when the middleware chain is complete.
   */
  async executeMiddlewareChain<Middleware extends Constructable<MiddlewareImpl>>(
    req: Request,
    index: number = 0,
    middlewares: Middleware[],
    entityInstance?: Constructable<any>,
  ) {
    // stop the chain if req.reject was used
    if (middlewareUtil.isRejectUsed(req)) {
      return;
    }

    if (index < middlewares.length) {
      const CurrentMiddleware = middlewares[index];
      const currentMiddlewareInstance = new CurrentMiddleware();

      const next = async (): Promise<void> => {
        if (!util.lodash.isUndefined(entityInstance)) {
          await this.executeMiddlewareChain(req, index + 1, middlewares, entityInstance);
        }

        await this.executeMiddlewareChain(req, index + 1, middlewares);
      };

      await currentMiddlewareInstance.use(req, next);
    }
  },

  /**
   * Registers middleware functions to a method.
   * @template Middleware
   * @param middlewares An array of middleware classes to register.
   * @param descriptor The property descriptor of the method.
   */
  registerToMethod<Middleware extends Constructable<MiddlewareImpl>>(
    middlewares: Middleware[],
    descriptor: TypedPropertyDescriptor<RequestType>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find(util.isRequestType);

      if (req) {
        await middlewareUtil.executeMiddlewareChain(req, 0, middlewares);
      }

      await originalMethod!.apply(this, args);
    };
  },

  /**
   * Registers middleware functions to a class.
   * @template Middleware
   * @template Target
   * @param target The target class.
   * @param middlewareClasses An array of middleware classes to register.
   */
  registerToClass<Middleware extends Constructable<MiddlewareImpl>, Target extends object>(
    target: Target,
    middlewareClasses: Middleware[],
  ): void {
    const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.MIDDLEWARE_KEY);
    metadataDispatcher.setMiddlewares(middlewareClasses);
  },

  /**
   * Checks if the request object has been rejected.
   * @param req The request object.
   * @returns True if the request has been rejected, otherwise false.
   */
  isRejectUsed(req: Request): boolean {
    return req instanceof Error;
  },
};

export default middlewareUtil;
