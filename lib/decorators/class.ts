import { injectable } from 'inversify';

import constants from '../constants/internalConstants';
import { MetadataDispatcher } from '../core/MetadataDispatcher';

import type { CDSTyperEntity } from '../types/types';
import type CDS_DISPATCHER from '../constants/constants';

/**
 * @description This decorator is used to associate a handler class with a specific entity.
 * It ensures that all handlers within the class operate with the specified entity context.
 *
 * @param entity - The entity to associate with the handler class. Must be a `CDS-Typer` class.
 * @example "@EntityHandler(Customer)"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#entityhandler | CDS-TS-Dispatcher - @EntityHandler}
 */
function EntityHandler<T>(entity: CDSTyperEntity<T>): (target: new (...args: never) => unknown) => void;

/**
 * @description This decorator is used to associate a handler class with all entities.
 * It ensures that all handlers within the class operate with a generic context applicable to all entities.
 *
 * @param entity - A wildcard `'*'` indicating all entities.
 * @example "@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)"
 * or
 * "@EntityHandler('*')"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#entityhandler | CDS-TS-Dispatcher - @EntityHandler}
 */
function EntityHandler(entity: typeof CDS_DISPATCHER.ALL_ENTITIES): (target: new (...args: never) => unknown) => void;

function EntityHandler<T>(entity: CDSTyperEntity<T> | typeof CDS_DISPATCHER.ALL_ENTITIES) {
  return function <Target extends new (...args: never) => unknown>(target: Target): void {
    new MetadataDispatcher(target, constants.DECORATOR.ENTITY_HANDLER_NAME).addEntityHandlerMetadata(entity);

    injectable()(target);
  };
}

/**
 * @description This decorator is used to mark a class as a repository, containing `repository logic`.
 *
 * It makes the class injectable and allows dependency injection to be used within the class.
 */
function Repository<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * @description This decorator is used to mark a class as containing `business logic`.
 *
 * It makes the class injectable and allows dependency injection to be used within the class.
 */
function ServiceLogic<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * @description This decorator is used to mark a class as containing unbound actions.
 *
 * Unbound actions are operations that are not tied to a specific entity.
 * It makes the class injectable and allows dependency injection to be used within the class.
 */
function UnboundActions<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

export { EntityHandler, Repository, ServiceLogic, UnboundActions };
