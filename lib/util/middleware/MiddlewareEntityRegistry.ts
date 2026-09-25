import constants from '../../constants/internalConstants';
import { MetadataDispatcher } from '../../core/MetadataDispatcher';
import util from '../util';
import middlewareUtil from './middlewareUtil';

import type { Constructable, ServiceBeforeHandlers } from '../../types/internalTypes';
import type { Service } from '@sap/cds';

import type { Request } from '../../types/types';

/**
 * Handler types which are never `middleware-wrapped` by `@Use` - they carry neither an `entity` nor an `action`
 * to hook a middleware chain on.
 */
const NON_ACTION_HANDLER_TYPES = ['REQUEST_LIFECYCLE', 'SCHEDULED_OUTCOME', 'SCHEDULED', 'SERVER_LIFECYCLE'];

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
   * Retrieves the names of the entity the class is bound to: the active entity and, for a draft-enabled
   * entity, also its `.drafts` - requests on the active entity (direct CRUD on active instances, on by default
   * since `@sap/cds` 10) and on its drafts must both pass the class-level middleware chain.
   * @returns The entity names, or an empty array when the class is not bound to a named entity.
   */
  private getEntityNames(): string[] {
    const entity = MetadataDispatcher.getEntity(this.entityInstance);

    if (util.lodash.isUndefined(entity) || util.lodash.isEmpty(entity.name)) {
      return [];
    }

    return entity.drafts ? [entity.name, entity.drafts.name] : [entity.name];
  }

  /**
   * Checks if the request is the write which `draftActivate` dispatches on the active entity (`CREATE` for a
   * new row, `UPDATE` for an edited one). `@sap/cds` marks it by the event of the outer request, the same test
   * its own `SAVE` handlers use.
   * @param req The request object.
   * @returns True if the request is the internal write of a draft activation, otherwise false.
   */
  private isDraftActivationWrite(req: Request): boolean {
    return (req as unknown as { _?: { event?: string } })._?.event === 'draftActivate';
  }

  /**
   * Registers the `before` handlers for the active entity and, if draft-enabled, for its drafts.
   * On the active entity of a draft-enabled entity the chain skips the internal write of `draftActivate`: the
   * draft's content already passed the chain at `NEW` / `EDIT` / `PATCH`.
   * @param entityNames The entity names to register the middleware chain on, the active entity first.
   */
  private registerBeforeHandlers(entityNames: string[]): void {
    const isDraftEnabled = entityNames.length > 1;

    entityNames.forEach((entityName, index) => {
      const isActiveOfDraftEntity = isDraftEnabled && index === 0;

      this.srv.before(constants.ALL_EVENTS, entityName, async (req: Request) => {
        if (isActiveOfDraftEntity && this.isDraftActivationWrite(req)) {
          return;
        }

        await this.executeMiddlewareChain(req);
      });
    });
  }

  /**
   * Registers the `on` actions for the entity.
   */
  private registerOnActions(): void {
    const handlers = MetadataDispatcher.getMetadataHandlers(this.entityInstance) ?? [];
    handlers.forEach((handler) => {
      // '@BeforeCommit' & co, '@OnScheduled' / '@Schedule' and the scheduled outcomes are NO action events:
      // they hook the transaction of the current request, respectively a queued task, so there is no action
      // to wrap a middleware chain around - they are skipped instead of running into the 'default' throw.
      if (NON_ACTION_HANDLER_TYPES.includes(handler.type)) {
        return;
      }

      switch (handler.event) {
        case 'ACTION':
        case 'FUNC':
          if (handler.type === 'ACTION_FUNCTION') {
            this.srv.before(handler.actionName?.toString(), async (req) => {
              await this.executeMiddlewareChain(req);
            });
          }

          break;

        case 'MESSAGING_EVENT': {
          const eventName: string = util.subtractLastDotString(handler.options.eventName as string);

          this.srv.before(eventName, async (msg) => {
            await this.executeMiddlewareChain(msg);
          });

          break;
        }

        case 'EVENT':
          if (handler.type === 'EVENT') {
            const eventName: string = util.subtractLastDotString(handler.eventName);

            this.srv.before(eventName, async (req) => {
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
    (this.srv as unknown as ServiceBeforeHandlers).handlers.before.sort(
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
    const entityNames = this.getEntityNames();

    // All decorators except actions
    const hasActiveHandlers = entityNames.length > 0;
    if (hasActiveHandlers) {
      this.registerBeforeHandlers(entityNames);
    }

    // All actions
    const hasUnboundActions = !hasActiveHandlers;
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
