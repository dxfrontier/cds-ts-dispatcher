import 'reflect-metadata';
import Constants from '../util/constants/Constants';
import { MetadataDispatcher } from '../util/helpers/MetadataDispatcher';
import { injectable } from 'inversify';
import { type CDSTyperEntity } from '../util/types/types';

/**
 *
 * This decorator can be applied to handler classes that correspond to specific entities.
 * All 'handlers' in that class will have that corresponding entity as a base for execution of their handlers.
 *
 * @param {CDSTyperEntity<T>} entity - The entity to associate with the handler class.
 */

function EntityHandler<T, Target extends new (...args: never) => unknown>(entity: CDSTyperEntity<T>) {
  return function (target: Target) {
    const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.ENTITY_HANDLER_NAME);

    metadataDispatcher.addEntityHandlerMetadata(entity);

    injectable()(target);
  };
}

/**
 * This decorator can be applied to classes containing repository logic.
 */

function Repository<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}

/**
 * This decorator can be applied to classes containing service business logic.
 */

function ServiceLogic<Target extends new (...args: never) => unknown>() {
  return function (target: Target) {
    injectable()(target);
  };
}
export { EntityHandler, Repository, ServiceLogic };
