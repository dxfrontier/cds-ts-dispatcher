import 'reflect-metadata'
import Constants from '../util/constants/Constants'
import { MetadataDispatcher } from '../util/helpers/MetadataDispatcher'
import { injectable } from 'inversify'
import { CDSTyperEntity } from '../util/types/types'

/**
 *
 * This decorator can be applied to handler classes that correspond to specific entities.
 * All 'handlers' in that class will have that corresponding entity as a base for execution of their handlers.
 *
 * @param {CDSTyperEntity<T>} entity - The entity to associate with the handler class.
 *
 * @example
 * // Apply the decorator to associate the 'Product' entity with the handler class.
 * @EntityHandler(Customer)
 * class Customer {
 *     // Handler implementation for the 'Product' entity.
 * }
 */

function EntityHandler<T>(entity: CDSTyperEntity<T>) {
  return function (target: any) {
    const metadataDispatcher = new MetadataDispatcher(target, Constants.DECORATOR.ENTITY_HANDLER_NAME)

    metadataDispatcher.addEntityHandlerMetadata(entity)

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

function ServiceLogic() {
  return function (target: any) {
    injectable()(target)
  }
}
export { EntityHandler, Repository, ServiceLogic }
