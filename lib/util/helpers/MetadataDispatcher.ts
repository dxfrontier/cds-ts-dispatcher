import Constants from '../constants/Constants'
import { Handler } from '../types/types'
import { Constructable } from '@sap/cds/apis/internal/inference'
import 'reflect-metadata'

export class MetadataDispatcher {
  private target: any
  private metadataKey: string

  constructor(target: any, metadataKey: string) {
    this.target = target
    this.metadataKey = metadataKey
  }

  // PRIVATE ROUTINES

  private hasMetadataSet(): boolean {
    return Reflect.hasMetadata(this.metadataKey, this.target)
  }

  private getOrCreateAccumulator(): any[] {
    return this.hasMetadataSet() ? Reflect.getMetadata(this.metadataKey, this.target) : []
  }

  // PUBLIC STATIC METHODS

  public static getEntityName(entity: Constructable): string {
    return Reflect.getMetadata(Constants.DECORATOR.ENTITY_HANDLER_NAME, entity.constructor)
  }

  public static getMetadataHandlers(entity: Constructable): Handler[] {
    return Reflect.getMetadata(Constants.DECORATOR.METHOD_ACCUMULATOR_NAME, entity)
  }

  // PUBLIC METHODS

  public setMethodAsDraft(propertyKey: any) {
    Reflect.defineMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, true, this.target, propertyKey)
  }

  public addEntityHandlerMetadata(entityName: string): void {
    Reflect.defineMetadata(Constants.DECORATOR.ENTITY_HANDLER_NAME, entityName, this.target)
  }

  public addMethodMetadata(props: Handler): void {
    const accumulator: Handler[] = this.getOrCreateAccumulator()

    accumulator.push(props)

    Reflect.defineMetadata(this.metadataKey, accumulator, this.target)
  }
}
