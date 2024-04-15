import 'reflect-metadata';

import constants from '../constants/constants';

import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { MiddlewareImpl } from '../types/types';
import type { Handler } from '../types/internalTypes';

export class MetadataDispatcher {
  constructor(
    private readonly target: object,
    private readonly metadataKey: string | symbol,
  ) {}

  // PRIVATE ROUTINES

  private hasMetadataSet(): boolean {
    return Reflect.hasMetadata(this.metadataKey, this.target);
  }

  private getOrCreateAccumulator(): any[] {
    return this.hasMetadataSet() ? Reflect.getMetadata(this.metadataKey, this.target) : [];
  }

  // STATIC METHODS

  public static getEntity(entity: Constructable): { drafts: any; name: string } {
    return Reflect.getMetadata(constants.DECORATOR.ENTITY_HANDLER_NAME, entity.constructor);
  }

  public static getMiddlewares(entity: Constructable): Array<Constructable<MiddlewareImpl>> {
    return Reflect.getMetadata(constants.DECORATOR.MIDDLEWARE_NAME, entity.constructor);
  }

  public static getMetadataHandlers(entity: Constructable): Handler[] {
    return Reflect.getMetadata(constants.DECORATOR.METHOD_ACCUMULATOR_NAME, entity);
  }

  // PUBLIC METHODS

  public setMiddlewares(middlewares: Array<Constructable<MiddlewareImpl>>): void {
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
