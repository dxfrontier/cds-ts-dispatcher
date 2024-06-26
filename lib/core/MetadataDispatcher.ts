import 'reflect-metadata';

import constants from '../constants/internalConstants';

import type { Constructable } from '@sap/cds/apis/internal/inference';
import type { MiddlewareImpl } from '../types/types';
import type { BaseHandler } from '../types/internalTypes';
import type CDS_DISPATCHER from '../constants/constants';

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

  public static getEntity(entity: Constructable): { drafts: any; name: string } | undefined {
    return Reflect.getMetadata(constants.DECORATOR.ENTITY_HANDLER_NAME, entity.constructor);
  }

  public static getMiddlewares(entity: Constructable): Array<Constructable<MiddlewareImpl>> {
    return Reflect.getMetadata(constants.DECORATOR.MIDDLEWARE_NAME, entity.constructor);
  }

  public static getMetadataHandlers(entity: Constructable): BaseHandler[] {
    return Reflect.getMetadata(constants.DECORATOR.METHOD_ACCUMULATOR_NAME, entity);
  }

  // PUBLIC METHODS

  public setMiddlewares(middlewares: Array<Constructable<MiddlewareImpl>>): void {
    Reflect.defineMetadata(constants.DECORATOR.MIDDLEWARE_NAME, middlewares, this.target);
  }

  public addEntityHandlerMetadata(entity: Constructable | typeof CDS_DISPATCHER.ALL_ENTITIES): void {
    Reflect.defineMetadata(constants.DECORATOR.ENTITY_HANDLER_NAME, entity, this.target);
  }

  public addMethodMetadata(props: BaseHandler): void {
    const accumulator = this.getOrCreateAccumulator();

    accumulator.push(props);

    Reflect.defineMetadata(this.metadataKey, accumulator, this.target);
  }
}
