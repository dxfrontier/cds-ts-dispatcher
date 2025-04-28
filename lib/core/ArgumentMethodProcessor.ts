/* eslint-disable prefer-const */
import 'reflect-metadata';

import constants from '../constants/internalConstants';
import parameterUtil from '../util/parameter/parameterUtil';
import util from '../util/util';

import type { MetadataFields, MetadataInputs, ParameterDecorators, TemporaryArgs } from '../types/internalTypes';
import { Validators } from '../types/validator';

/**
 * The `ArgumentMethodProcessor` class is responsible for processing method arguments, including reordering arguments by type and applying decorators.
 */
export class ArgumentMethodProcessor {
  /**
   * A temporary storage for arguments, organized by type.
   */
  private temporaryArgs: TemporaryArgs = Object.create({});

  /**
   * Creates an instance of `ArgumentMethodProcessor`.
   * @param target - The target object.
   * @param propertyName - The name of the property.
   * @param args - The arguments to be processed.
   */
  constructor(
    private readonly target: object,
    private readonly propertyName: string | symbol,
    private args: any[],
  ) {
    this.onLoadReorderArgsByType();
  }

  // PRIVATE ROUTINES

  /**
   * This method is executed on creation of the instance ArgumentMethodProcessor and serves as an ordering of the args based on the type for later use.
   */
  private onLoadReorderArgsByType(): void {
    this.temporaryArgs = parameterUtil.extractArguments(this.args);
  }

  /**
   * Retrieves metadata for the given metadata key.
   * @param metadataKey - The metadata key.
   * @returns The metadata fields or undefined.
   */
  private getMetadata(metadataKey: ParameterDecorators): MetadataFields[] | undefined {
    return Reflect.getOwnMetadata(constants.DECORATOR.PARAMETER[metadataKey], this.target, this.propertyName);
  }

  /**
   * Checks if a decorator exists for the given metadata key.
   * @param metadataKey - The metadata key.
   * @returns True if the decorator exists, otherwise undefined.
   */
  private existsDecorator(metadataKey: ParameterDecorators): boolean | undefined {
    const metadata = this.getMetadata(metadataKey);

    if (!util.lodash.isUndefined(metadata)) {
      return metadata.length > 0;
    }
  }

  /**
   * Retrieves the assigned decorators, checking if for the current parameter if there's any decorator assigned.
   * VALIDATORS is excluded from typing
   * @returns An array of decorator keys.
   */
  private getAttachedDecorators(): Exclude<ParameterDecorators, 'VALIDATORS'>[] {
    const decorators = Object.keys(constants.DECORATOR.PARAMETER) as ParameterDecorators[];
    return (
      decorators
        // exclude VALIDATORS
        .filter((decorator) => decorator !== 'VALIDATORS')
        .filter((decorator) => this.existsDecorator(decorator))
    );
  }

  /**
   * Checks if any decorators are attached.
   * @returns True if any decorators are attached, otherwise false.
   */
  private hasDecoratorsAttached(): boolean {
    return this.getAttachedDecorators().length > 0;
  }

  /**
   * Applies a single decorator by key. This method is used only for single decorators, the ones which can appear only once, like Next, Req, Results, etc.
   * @param decorator - The decorator metadata and data.
   */

  private applySingleDecoratorByKey(decorator: { metadataKey: ParameterDecorators; data: unknown }): void {
    const metadata = this.getMetadata(decorator.metadataKey)!;

    this.args[metadata[0].parameterIndex] = decorator.data;
  }

  /**
   * Applies multiple decorators by key.
   * @param metadataKey - The metadata key.
   */
  private applyMultipleDecoratorsByKey(metadataKey: ParameterDecorators): void {
    const metadata = this.getMetadata(metadataKey)!;

    switch (metadataKey) {
      case 'IS_ROLE':
        parameterUtil.applyIsRole(this.temporaryArgs.req, this.args, metadata);
        break;

      case 'GET_REQUEST':
        parameterUtil.handleRequestOptions(this.temporaryArgs.req, this.args, metadata);
        break;

      case 'IS_COLUMN_SUPPLIED':
        parameterUtil.applyIsColumnSupplied(this.temporaryArgs.req, this.args, metadata);
        break;

      case 'IS_PRESENT':
      case 'GET_QUERY': {
        parameterUtil.applyIsPresentOrGetDecorator(
          metadataKey === 'GET_QUERY' ? 'Get' : 'IsPresent',
          metadata,
          this.temporaryArgs.req,
          this.args,
        );

        break;
      }

      case 'ENV': {
        parameterUtil.applyEnv(this.args, metadata);
        break;
      }

      default:
        util.throwErrorMessage('Unsupported decorator key');
    }
  }

  // STATIC ROUTINES

  /**
   * Creates metadata by given input.
   * @param metadata - The metadata inputs.
   */
  public static createMetadataBy(metadata: MetadataInputs): void {
    const createOrGetMetadata =
      Reflect.getOwnMetadata(
        constants.DECORATOR.PARAMETER[metadata.metadataKey],
        metadata.target,
        metadata.propertyKey,
      ) || [];

    createOrGetMetadata.push(metadata.metadataFields);

    Reflect.defineMetadata(
      constants.DECORATOR.PARAMETER[metadata.metadataKey],
      createOrGetMetadata,
      metadata.target,
      metadata.propertyKey,
    );
  }

  // PUBLIC ROUTINES

  public setValidatorFlags(validators: Record<Validators['action'], boolean>): void {
    const metadata = Reflect.getOwnMetadata(
      constants.DECORATOR.PARAMETER['VALIDATORS'],
      this.target,
      this.propertyName,
    );
    const parameterIndex = metadata[0].parameterIndex;

    // private routines for this func

    // If parameter exists add to the existing one
    const assignToExistingParameter = () => {
      Object.assign(this.args[parameterIndex], validators);
    };

    // If parameter does not exist, fill it.
    const initializeValidatorFlags = () => {
      this.args[parameterIndex] = validators;
    };

    if (this.args[parameterIndex]) {
      assignToExistingParameter();
      return;
    }

    initializeValidatorFlags();
  }

  /**
   * Registration of decorators
   */
  public applyDecorators(): void {
    if (this.hasDecoratorsAttached()) {
      util.cleanArgs(this.args);
    }

    this.getAttachedDecorators().forEach((metadataKey) => {
      switch (metadataKey) {
        /**
         * @Req(), @Res(), @Error(), @Next(), @Results(), @Result(), @Jwt, '@SingleInstanceSwitch' can be present only once per callback
         */
        case 'MSG':
        case 'ERROR':
        case 'NEXT':
        case 'RESULTS':
        case 'REQ': {
          let key = util.lodash.lowerCase(metadataKey) as 'req' | 'results' | 'next' | 'msg' | 'error';
          this.applySingleDecoratorByKey({ metadataKey, data: this.temporaryArgs[key] });

          break;
        }

        case 'RES': {
          this.applySingleDecoratorByKey({
            metadataKey,
            data: parameterUtil.retrieveResponse(this.temporaryArgs.req),
          });

          break;
        }

        case 'JWT': {
          this.applySingleDecoratorByKey({
            metadataKey,
            data: parameterUtil.retrieveJwt(this.temporaryArgs.req),
          });

          break;
        }

        case 'SINGLE_INSTANCE_SWITCH': {
          this.applySingleDecoratorByKey({
            metadataKey,
            data: parameterUtil.isSingleInstance(this.temporaryArgs.req),
          });

          break;
        }

        case 'LOCALE': {
          this.applySingleDecoratorByKey({
            metadataKey,
            data: parameterUtil.retrieveLocale(this.temporaryArgs.req),
          });

          break;
        }

        /**
         * @IsColumnSupplied, @IsRole, @GetRequest, @GetQuery, @IsPresent, can be present multiple times per callback.
         */
        case 'GET_QUERY':
        case 'IS_PRESENT':
        case 'IS_ROLE':
        case 'GET_REQUEST':
        case 'IS_COLUMN_SUPPLIED':
        case 'ENV': {
          this.applyMultipleDecoratorsByKey(metadataKey);
          break;
        }

        default:
          util.throwErrorMessage(`Parameter decorator ${metadataKey} option not handled !`);
          break;
      }
    });
  }
}
