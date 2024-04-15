import { injectable } from 'inversify';

import constants from '../constants/constants';
import { MetadataDispatcher } from '../core/MetadataDispatcher';

import type { CDSTyperEntity } from '../types/types';

/**
 *
 * @description This decorator can be applied to handler classes that correspond to specific entities.
 *
 * `Note:` All 'handlers' in that class will have that corresponding entity as a base for execution of their handlers.
 *
 * @param entity - The entity to associate with the handler class. Must be a `CDS-Typer` class.
 */

function EntityHandler<T, Target extends new (...args: never) => unknown>(entity: CDSTyperEntity<T>) {
  return function (target: Target) {
    const metadataDispatcher = new MetadataDispatcher(target, constants.DECORATOR.ENTITY_HANDLER_NAME);

    metadataDispatcher.addEntityHandlerMetadata(entity);

    injectable()(target);
  };
}

/**
 * @description This decorator can be applied to classes containing repository logic.
 */

function Repository<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * @description This decorator can be applied to classes containing business logic.
 */

function ServiceLogic<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * @description This decorator can be applied to classes containing `Unbound actions`.
 */

function UnboundActions<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

export { EntityHandler, Repository, ServiceLogic, UnboundActions };
