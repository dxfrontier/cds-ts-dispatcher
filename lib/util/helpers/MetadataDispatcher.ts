import Constants from '../constants/Constants';
import { type Handler } from '../types/types';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getEntity(entity: Constructable): { drafts: any } {
    return Reflect.getMetadata(Constants.DECORATOR.ENTITY_HANDLER_NAME, entity.constructor);
  }

  public static getMetadataHandlers(entity: Constructable): Handler[] {
    return Reflect.getMetadata(Constants.DECORATOR.METHOD_ACCUMULATOR_NAME, entity);
  }

  // PUBLIC METHODS
  public setMethodAsDraft(propertyKey: string | symbol): void {
    Reflect.defineMetadata(Constants.DECORATOR.DRAFT_FLAG_KEY, true, this.target, propertyKey);
  }

  public setMethodAsSingleInstanceCapable(propertyKey: string | symbol): void {
    Reflect.defineMetadata(Constants.DECORATOR.SINGLE_INSTANCE_FLAG_KEY, true, this.target, propertyKey);
  }

  public addEntityHandlerMetadata(entity: Constructable): void {
    Reflect.defineMetadata(Constants.DECORATOR.ENTITY_HANDLER_NAME, entity, this.target);
  }

  public addMethodMetadata(props: Handler): void {
    const accumulator = this.getOrCreateAccumulator();

    accumulator.push(props);

    Reflect.defineMetadata(this.metadataKey, accumulator, this.target);
  }
}
