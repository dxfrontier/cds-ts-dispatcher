import 'reflect-metadata';

import constants from '../constants/internalConstants';

import type { MiddlewareImpl } from '../types/types';
import type { BaseHandler, Constructable, Entity } from '../types/internalTypes';
import type CDS_DISPATCHER from '../constants/constants';

/**
 * The `MetadataDispatcher` class handles metadata operations for target objects,
 * such as setting and retrieving metadata related to entity handlers, middlewares, and method handlers.
 */
export class MetadataDispatcher {
  /**
   * Creates an instance of `MetadataDispatcher`.
   * @param target - The target object on which metadata operations will be performed.
   * @param metadataKey - The key used to store metadata.
   */
  constructor(
    private readonly target: object,
    private readonly metadataKey: string | symbol,
  ) {}

  // PRIVATE ROUTINES

  /**
   * Checks if metadata is already set for the target object.
   * @returns `true` if metadata is set, `false` otherwise.
   */
  private hasMetadataSet(): boolean {
    return Reflect.hasMetadata(this.metadataKey, this.target);
  }

  /**
   * Retrieves existing metadata or creates a new accumulator array if metadata is not set.
   * @returns An array of metadata.
   */
  private getOrCreateAccumulator(): any[] {
    return this.hasMetadataSet() ? Reflect.getMetadata(this.metadataKey, this.target) : [];
  }

  // STATIC METHODS

  /**
   * Retrieves the entity metadata for the given entity.
   * @param entity - The entity constructor.
   * @returns The entity metadata, or `undefined` if not found.
   */
  public static getEntity(entity: Constructable): Entity | undefined {
    return Reflect.getMetadata(constants.DECORATOR.ENTITY_HANDLER_NAME, entity.constructor);
  }

  /**
   * Retrieves the middlewares metadata for the given entity.
   * @param entity - The entity constructor.
   * @returns An array of middleware constructors.
   */
  public static getMiddlewares(entity: Constructable): Constructable<MiddlewareImpl>[] {
    return Reflect.getMetadata(constants.DECORATOR.MIDDLEWARE_NAME, entity.constructor);
  }

  /**
   * Retrieves the method handlers metadata for the given entity.
   * @param entity - The entity constructor.
   * @returns An array of `BaseHandler` objects.
   */
  public static getMetadataHandlers(entity: Constructable): BaseHandler[] {
    return Reflect.getMetadata(constants.DECORATOR.METHOD_ACCUMULATOR_NAME, entity);
  }

  // PUBLIC METHODS

  /**
   * Sets the middlewares metadata for the target object.
   * @param middlewares - An array of middleware constructors.
   */
  public setMiddlewares(middlewares: Constructable<MiddlewareImpl>[]): void {
    Reflect.defineMetadata(constants.DECORATOR.MIDDLEWARE_NAME, middlewares, this.target);
  }

  /**
   * Adds entity handler metadata to the target object.
   * @param entity - The entity constructor or a constant representing all entities.
   */
  public addEntityHandlerMetadata(entity: Constructable | typeof CDS_DISPATCHER.ALL_ENTITIES): void {
    Reflect.defineMetadata(constants.DECORATOR.ENTITY_HANDLER_NAME, entity, this.target);
  }

  /**
   * Adds method handler metadata to the target object.
   * @param props - The `BaseHandler` object containing handler metadata.
   */
  public addMethodMetadata(props: BaseHandler): void {
    const accumulator = this.getOrCreateAccumulator();

    accumulator.push(props);

    Reflect.defineMetadata(this.metadataKey, accumulator, this.target);
  }
}
