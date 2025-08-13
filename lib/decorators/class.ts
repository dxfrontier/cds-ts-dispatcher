import { injectable } from 'inversify';

import constants from '../constants/internalConstants';
import { MetadataDispatcher } from '../core/MetadataDispatcher';

import type { CDSTyperEntity } from '../types/types';
import type CDS_DISPATCHER from '../constants/constants';

/**
 * Associates a handler class with a specific entity and makes it injectable for dependency injection.
 *
 * This decorator ensures that all handlers within the class operate with the specified entity context.
 * It enables type-safe entity operations and automatic dependency injection within the handler class.
 *
 * @param entity - The entity to associate with the handler class. Must be a `CDS-Typer` generated entity class.
 * @returns A decorator function that applies the entity association and injectable configuration to the target class.
 *
 * @example "@EntityHandler(Customer)"
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#entityhandler | CDS-TS-Dispatcher - @EntityHandler}
 */
function EntityHandler<T>(entity: CDSTyperEntity<T>): (target: new (...args: never) => unknown) => void;

/**
 * Associates a handler class with all entities and makes it injectable for dependency injection.
 *
 * This decorator ensures that all handlers within the class operate with a generic context applicable
 * to all entities. Use this when you need to create handlers that work across multiple entity types.
 *
 * @param entity - A wildcard constant indicating all entities. Use `CDS_DISPATCHER.ALL_ENTITIES`.
 * @returns A decorator function that applies the entity association and injectable configuration to the target class.
 *
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
 * Marks a class as containing repository logic and makes it injectable for dependency injection.
 *
 * Repository classes typically handle data access operations, database interactions, and entity
 * management.
 *
 * @returns A decorator function that applies the injectable configuration to the target class.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#repository | CDS-TS-Dispatcher - @Repository}
 */
function Repository<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * Marks a class as containing service logic and makes it injectable for dependency injection.
 *
 * This decorator configures the dependency injection scope for the service class, allowing
 * control over instance lifecycle and sharing across the application.
 *
 * @param scope - (Optional) The dependency injection scope for the service class:
 *   - `'Singleton'` - Single instance shared across the entire application
 *   - `'Transient'` - New instance created for each injection
 *   If not provided, defaults to `'Transient'` scope behavior.
 *
 * @returns A decorator function that applies the injectable configuration to the target class.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#servicelogic | CDS-TS-Dispatcher - @ServiceLogic}
 */
function ServiceLogic<Target extends new (...args: never) => unknown>(scope?: 'Singleton' | 'Transient') {
  return function (target: Target) {
    injectable(scope)(target);
  };
}

/**
 * Marks a class as containing unbound actions and makes it injectable for dependency injection.
 *
 * Unbound actions are operations that are not tied to a specific entity and can be called
 * independently without requiring entity context.
 *
 * @returns A decorator function that applies the injectable configuration to the target class.
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher#unboundactions | CDS-TS-Dispatcher - @UnboundActions}
 */
function UnboundActions<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

export { EntityHandler, Repository, ServiceLogic, UnboundActions };
