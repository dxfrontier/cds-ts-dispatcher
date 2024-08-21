import constants from '../../constants/internalConstants';
import { MetadataDispatcher } from '../../core/MetadataDispatcher';
import util from '../util';
import middlewareUtil from './middlewareUtil';

import type { Constructable, ServiceBeforeHandlers } from '../../types/internalTypes';
import type { Service } from '@sap/cds';

import type { Request } from '../../types/types';

/**
 * This class registers the middleware classes for `@Use` decorator.
 */
export class MiddlewareEntityRegistry {
  /**
   * Creates an instance of MiddlewareEntityRegistry.
   * @param entityInstance The entity instance to be used.
   * @param srv The service instance to be used.
   */
  constructor(
    private readonly entityInstance: Constructable,
    private readonly srv: Service,
  ) {}

  // PRIVATE routines

  /**
   * Executes the middleware chain starting from the specified index.
   * @param req The request object.
   * @param startIndex The index from which to start the middleware chain.
   */
  private readonly executeMiddlewareChain = async (req: Request, startIndex = 0): Promise<void> => {
    const middlewares = MetadataDispatcher.getMiddlewares(this.entityInstance);
    await middlewareUtil.executeMiddlewareChain(req, startIndex, middlewares, this.entityInstance);
  };

  /**
   * Retrieves the active entity or its draft entity.
   * @returns The active entity or its draft entity if available.
   */
  private getActiveEntityOrDraftEntity(): string | undefined {
    const entity = MetadataDispatcher.getEntity(this.entityInstance);

    if (!util.lodash.isUndefined(entity)) {
      return entity.drafts ? entity.drafts.name : entity.name;
    }
  }

  /**
   * Registers the `before` handlers for the entity.
   */
  private registerBeforeHandlers(): void {
    const entity = this.getActiveEntityOrDraftEntity();
    if (entity) {
      this.srv.before(constants.ALL_EVENTS, entity, async (req: Request) => {
        await this.executeMiddlewareChain(req);
      });
    }
  }

  /**
   * Registers the `on` actions for the entity.
   */
  private registerOnActions(): void {
    const handlers = MetadataDispatcher.getMetadataHandlers(this.entityInstance);
    handlers.forEach((handler) => {
      switch (handler.event) {
        case 'ACTION':
        case 'FUNC':
          if (handler.type === 'ACTION_FUNCTION') {
            this.srv.before(handler.actionName?.toString(), async (req) => {
              await this.executeMiddlewareChain(req);
            });
          }

          break;

        case 'EVENT':
          if (handler.type === 'EVENT') {
            this.srv.before(handler.eventName, async (req) => {
              await this.executeMiddlewareChain(req);
            });
          }

          break;

        case 'ERROR':
          this.srv.before('error', async (req) => {
            await this.executeMiddlewareChain(req);
          });

          break;

        default:
          util.throwErrorMessage(`Unexpected event type: ${handler.event}`);
      }
    });
  }

  /**
   * Sorts the `before` events to ensure the '*' events are triggered first.
   */
  private sortBeforeEvents(): void {
    (this.srv as unknown as ServiceBeforeHandlers)._handlers.before.sort(
      (a: { before: string }, b: { before: string }) => {
        if (a.before < b.before) {
          return -1;
        }

        if (a.before > b.before) {
          return 1;
        }

        return 0;
      },
    );
  }

  // PUBLIC routines

  /**
   * Builds the middleware chain for the entity.
   */
  public buildMiddlewares(): void {
    const entity = this.getActiveEntityOrDraftEntity();

    // All decorators except actions
    const hasActiveHandlers = !util.lodash.isEmpty(entity);
    if (hasActiveHandlers) {
      this.registerBeforeHandlers();
    }

    // All actions
    const hasUnboundActions = util.lodash.isUndefined(entity);
    if (hasUnboundActions) {
      this.registerOnActions();
    }

    this.sortBeforeEvents();
  }

  /**
   * Checks if the entity has middleware attached.
   * @returns True if the entity has middleware attached, otherwise false.
   */
  public hasEntityMiddlewaresAttached(): boolean {
    const middlewares = MetadataDispatcher.getMiddlewares(this.entityInstance);
    return middlewares && middlewares.length > 0;
  }
}
