import constants from '../../constants/constants';
import { MetadataDispatcher } from '../../core/MetadataDispatcher';
import util from '../util';
import middlewareUtil from './middlewareUtil';

import type { ServiceBeforeHandlers } from '../../types/internalTypes';
import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { Service } from '@sap/cds';

import type { Request } from '../../types/types';
/**
 * @description This class registers the middleware classes for `@Use` decorator.
 */
export class MiddlewareEntityRegistry {
  constructor(
    private readonly entityInstance: Constructable,
    private readonly srv: Service,
  ) {}

  // PRIVATE routines

  private readonly executeMiddlewareChain = async (req: Request, startIndex: number = 0): Promise<void> => {
    const middlewares = MetadataDispatcher.getMiddlewares(this.entityInstance);
    await middlewareUtil.executeMiddlewareChain(req, startIndex, middlewares, this.entityInstance);
  };

  private getActiveEntityOrDraftEntity(): any {
    const entity = MetadataDispatcher.getEntity(this.entityInstance);
    return entity?.drafts ? entity.drafts : entity?.name;
  }

  private registerBeforeHandlers(): void {
    this.srv.before(constants.CDS_DISPATCHER.ALL_EVENTS, this.getActiveEntityOrDraftEntity(), async (req: Request) => {
      await this.executeMiddlewareChain(req);
    });
  }

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
   * This routine will sort the 'Before' events over '*'. The '*' will be firstly and after the named ones as events are triggered in order.
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

  public hasEntityMiddlewaresAttached(): boolean {
    const middlewares = MetadataDispatcher.getMiddlewares(this.entityInstance);
    return middlewares && middlewares.length > 0;
  }
}
