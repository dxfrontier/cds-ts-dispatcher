import constants from '../constants/constants';
import type { MiddlewareImpl, Handler } from '../types/types';
import { type Constructable } from '@sap/cds/apis/internal/inference';
import 'reflect-metadata';

export class MetadataDispatcher<T extends Object> {
  private readonly target: T;
  private readonly metadataKey: string;

  constructor(target: T, metadataKey: string) {
    this.target = target;
    this.metadataKey = metadataKey;
  }

  // PRIVATE ROUTINES

  private hasMetadataSet(): boolean {
    return Reflect.hasMetadata(this.metadataKey, this.target);
  }

  private getOrCreateAccumulator(): Handler[] {
    return this.hasMetadataSet() ? Reflect.getMetadata(this.metadataKey, this.target) : [];
  }

  // PUBLIC STATIC METHODS
  public static getEntity(entity: Constructable): { drafts: any; name: string } {
    return Reflect.getMetadata(constants.DECORATOR.ENTITY_HANDLER_NAME, entity.constructor);
  }

  public static getMiddlewares(entity: Constructable): Array<Constructable<MiddlewareImpl>> {
    return Reflect.getMetadata(constants.DECORATOR.MIDDLEWARE_NAME, entity.constructor);
  }

  public static getMetadataHandlers(entity: Constructable): Handler[] {
    return Reflect.getMetadata(constants.DECORATOR.METHOD_ACCUMULATOR_NAME, entity);
  }

  public static getSingleInstanceCapableFlag<Target extends Object>(
    target: Target,
    propertyKey: string | symbol,
  ): boolean {
    return Reflect.getMetadata(constants.DECORATOR.SINGLE_INSTANCE_FLAG_KEY, target, propertyKey);
  }

  // PUBLIC METHODS

  public setMethodAsSingleInstanceCapable(propertyKey: string | symbol): void {
    Reflect.defineMetadata(constants.DECORATOR.SINGLE_INSTANCE_FLAG_KEY, true, this.target, propertyKey);
  }

  public setMiddlewares<Middleware extends Constructable<MiddlewareImpl>>(middlewares: Middleware[]): void {
    Reflect.defineMetadata(constants.DECORATOR.MIDDLEWARE_NAME, middlewares, this.target);
  }

  public addEntityHandlerMetadata(entity: Constructable): void {
    Reflect.defineMetadata(constants.DECORATOR.ENTITY_HANDLER_NAME, entity, this.target);
  }

  public addMethodMetadata(props: Handler): void {
    const accumulator = this.getOrCreateAccumulator();

    accumulator.push(props);

    Reflect.defineMetadata(this.metadataKey, accumulator, this.target);
  }
}
