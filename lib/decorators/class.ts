import 'reflect-metadata'
import Constants from '../util/constants/Constants'
import { MetadataDispatcher } from '../util/helpers/MetadataDispatcher'
import { injectable } from 'inversify'

/**
 *
 * This decorator can be applied to handler classes that correspond to specific entities.
 * All 'handlers' in that class will have that corresponding entity as a base for execution of their handlers.
 *
 * @param {string} entityName - The name of the entity, the name should be exactly like the one from the .cds
 *
 * @example
 * // Apply the decorator to associate the 'Product' entity with the handler class.
 * @EntityHandler('Customers')
 * class Customer {
 *     // Handler implementation for the 'Product' entity.
 * }
 */

function EntityHandler(entityName: string) {
  return function (target: any) {
    const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.ENTITY_HANDLER_NAME)

    metadataDispatcher.addEntityHandlerMetadata(entityName)

    injectable()(target)
  }
}

/**
 * This decorator can be applied to classes containing repository logic.
 *
 * @example
 * // Apply the decorator to the repository class.
 * @Repository()
 * class UserRepository {
 *     // Repository implementation logic.
 * }
 *
 * export default UserRepository
 */

function Repository() {
  return function (target: any) {
    injectable()(target)
  }
}

/**
 * This decorator can be applied to classes containing service business logic.
 *
 * @example
 * // Apply the decorator to the service logic class.
 * @ServiceLogic()
 * class UserService {
 *     // Service logic implementation.
 * }
 *
 * export default UserService
 */

function Service() {
  return function (target: any) {
    injectable()(target)
  }
}

export { EntityHandler, Repository, Service }
