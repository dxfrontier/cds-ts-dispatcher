/* eslint-disable prefer-const */
import 'reflect-metadata';

// import { EventContext, Request } from '@sap/cds';
import constants from '../constants/constants';
import parameterUtil from '../util/parameter/parameterUtil';
import util from '../util/util';

import type { MetadataFields, MetadataInputs, TemporaryArgs } from '../types/internalTypes';

export class ArgumentMethodProcessor {
  private temporaryArgs: TemporaryArgs = Object.create({});

  constructor(
    private readonly target: object,
    private readonly propertyName: string | symbol,
    private args: any[],
  ) {
    this.onLoadReorderArgsByType();
  }

  // PRIVATE ROUTINES

  /**
   * This method is executed on creation of the instance ArgumentMethodProcessor and serves as a ordering of the args based on the type for later use
   * @private
   */
  private onLoadReorderArgsByType(): void {
    this.temporaryArgs = parameterUtil.extractArguments(this.args);
  }

  private getMetadata(metadataKey: keyof typeof constants.DECORATOR.PARAMETER): MetadataFields[] | undefined {
    return Reflect.getOwnMetadata(constants.DECORATOR.PARAMETER[metadataKey], this.target, this.propertyName);
  }

  private existsDecorator(metadataKey: keyof typeof constants.DECORATOR.PARAMETER): boolean | undefined {
    const metadata = this.getMetadata(metadataKey);

    if (!util.lodash.isUndefined(metadata)) {
      return metadata.length > 0;
    }
  }

  /**
   * This method will retrieve the assigned decorators, this means that it will check if for the current parameter if there's any decorator assigned
   * @private
   */
  private getAttachedDecorators(): Array<keyof typeof constants.DECORATOR.PARAMETER> {
    const decorators = Object.keys(constants.DECORATOR.PARAMETER) as Array<keyof typeof constants.DECORATOR.PARAMETER>;
    return decorators.filter((decorator) => this.existsDecorator(decorator));
  }

  private hasDecoratorsAttached(): boolean {
    return this.getAttachedDecorators().length > 0;
  }

  /**
   * This method is used only for single decorators, the ones which can appear only once, like Next, Req, Results ...
   * @private
   */
  private applySingleDecoratorByKey(decorator: {
    metadataKey: keyof typeof constants.DECORATOR.PARAMETER;
    data: unknown;
  }): void {
    const metadata = this.getMetadata(decorator.metadataKey)!;
    this.args[metadata[0].parameterIndex] = decorator.data;
  }

  private applyMultipleDecoratorsByKey(metadataKey: keyof typeof constants.DECORATOR.PARAMETER): void {
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
      case 'GET_QUERY':
        parameterUtil.applyIsPresentOrGetDecorator(
          metadataKey === 'GET_QUERY' ? 'Get' : 'IsPresent',
          metadata,
          this.temporaryArgs.req,
          this.args,
        );
        break;

      default:
        util.throwErrorMessage('Unsupported decorator key');
    }
  }

  // STATIC ROUTINES

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
         * @Req(), @Res(), @Error(), @Next(), @Results(), @Result(), @Jwt, @SingleInstanceSwitch can be present only once per callback
         */
        case 'ERROR':
        case 'NEXT':
        case 'RESULTS':
        case 'REQ': {
          let key = util.lodash.lowerCase(metadataKey) as 'req' | 'results' | 'next' | 'error';
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

        case 'JWT':
          this.applySingleDecoratorByKey({
            metadataKey,
            data: parameterUtil.retrieveJwt(this.temporaryArgs.req),
          });
          break;

        case 'SINGLE_INSTANCE_SWITCH':
          this.applySingleDecoratorByKey({
            metadataKey,
            data: parameterUtil.isSingleInstance(this.temporaryArgs.req),
          });
          break;

        /**
         * @IsColumnSupplied, @IsRole, @GetRequest, @GetQuery, @IsPresent, can be present multiple times per callback.
         */
        case 'GET_QUERY':
        case 'IS_PRESENT':
        case 'IS_ROLE':
        case 'GET_REQUEST':
        case 'IS_COLUMN_SUPPLIED': {
          this.applyMultipleDecoratorsByKey(metadataKey);
          break;
        }

        default:
          util.throwErrorMessage('Parameter decorator option not handled !');
          break;
      }
    });
  }
}
