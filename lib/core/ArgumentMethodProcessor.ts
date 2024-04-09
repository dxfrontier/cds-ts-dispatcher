/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { Request } from '@sap/cds';

import constants from '../constants/constants';
import isColumnSuppliedUtil from '../util/helpers/isColumnSuppliedUtil';
import isPresentAndGetDecoratorUtil from '../util/helpers/isPresentAndGetDecoratorUtil';
import isRoleUtil from '../util/helpers/isRoleUtil';
import requestPropertyUtil from '../util/helpers/requestPropertyUtil';
import singleInstanceSwitchUtil from '../util/helpers/singleInstanceSwitchUtil';
import util from '../util/util';

import type { MetadataFields, MetadataInputs } from '../types/internalTypes';
export class ArgumentMethodProcessor {
  private readonly req: Request;
  private readonly temporaryArgs: any[];

  constructor(
    private readonly target: object,
    private readonly propertyName: string | symbol,
    private args: any[],
  ) {
    this.req = util.findRequest(this.args);
    this.temporaryArgs = [...this.args];
  }

  // Private routines
  private getMetadata(metadataKey: keyof typeof constants.DECORATOR): MetadataFields[] | undefined {
    return Reflect.getOwnMetadata(constants.DECORATOR[metadataKey], this.target, this.propertyName);
  }

  private existsDecorator(metadataKey: keyof typeof constants.DECORATOR): boolean | undefined {
    const metadata = this.getMetadata(metadataKey);

    if (metadata !== undefined) {
      return metadata.length > 0;
    }
  }

  private applyDecorator(decorator: { metadataKey: keyof typeof constants.DECORATOR; data: unknown }): void {
    const metadata = this.getMetadata(decorator.metadataKey)!;

    this.args[metadata[0].parameterIndex] = decorator.data;
  }

  private applyIsPresentOrGetDecorator(decorator: {
    type: 'Get' | 'IsPresent';
    metadataKey: keyof typeof constants.DECORATOR;
  }): void {
    const metadata = this.getMetadata(decorator.metadataKey)!;

    isPresentAndGetDecoratorUtil.handleQueryOptions(decorator.type, metadata, this.args);
  }

  private applyGetRequestPropertyDecorator(): void {
    const metadata = this.getMetadata('GET_REQUEST_PROPERTY')!;

    requestPropertyUtil.handleRequestOptions(metadata, this.args);
  }

  // Public static routines
  public static createMetadataBy(metadata: MetadataInputs): void {
    const queryOptions =
      Reflect.getOwnMetadata(constants.DECORATOR[metadata.metadataKey], metadata.target, metadata.propertyKey) || [];

    queryOptions.push(metadata.metadataFields);

    Reflect.defineMetadata(
      constants.DECORATOR[metadata.metadataKey],
      queryOptions,
      metadata.target,
      metadata.propertyKey,
    );
  }

  // Public routines
  public applyArgumentDecorators(): void {
    // Handle @Req() decorator

    if (this.existsDecorator('REQUEST')) {
      util.cleanArgs(this.args);
      this.applyDecorator({ metadataKey: 'REQUEST', data: this.req });
    }

    // Handle @Results & @Result decorators, convenient for 'create' and 'update' and 'delete'
    if (this.existsDecorator('RESULTS')) {
      const results: unknown[] = this.temporaryArgs[0];
      this.applyDecorator({ metadataKey: 'RESULTS', data: results });
    }

    // Handle @Next() decorator
    if (this.existsDecorator('NEXT_FUNCTION')) {
      const next: Function = this.temporaryArgs[1];
      this.applyDecorator({ metadataKey: 'NEXT_FUNCTION', data: next });
    }

    // Handle @Error decorator
    if (this.existsDecorator('ERROR')) {
      const error: Error = this.temporaryArgs[0];
      this.applyDecorator({ metadataKey: 'ERROR', data: error });
    }

    // Handle @SingleInstanceSwitch decorator
    if (this.existsDecorator('SINGLE_INSTANCE_SWITCH')) {
      this.applyDecorator({
        metadataKey: 'SINGLE_INSTANCE_SWITCH',
        data: singleInstanceSwitchUtil.isSingleInstance(this.req),
      });
    }

    // Handle @IsColumnSupplied decorator
    if (this.existsDecorator('IS_COLUMN_SUPPLIED')) {
      const column = this.getMetadata('IS_COLUMN_SUPPLIED')![0];

      this.applyDecorator({
        metadataKey: 'IS_COLUMN_SUPPLIED',
        data: isColumnSuppliedUtil.isColumSupplied(this.req, column),
      });
    }

    // Handle @IsRole decorator
    if (this.existsDecorator('IS_ROLE')) {
      const role = this.getMetadata('IS_ROLE')![0];

      this.applyDecorator({
        metadataKey: 'IS_COLUMN_SUPPLIED',
        data: isRoleUtil.isRoleSupplied(this.req, role),
      });
    }

    // Handle @GetRequestProperty decorator
    if (this.existsDecorator('GET_REQUEST_PROPERTY')) {
      this.applyGetRequestPropertyDecorator();
    }

    // Handle @GetQueryProperty decorator
    if (this.existsDecorator('GET_QUERY_PROPERTY')) {
      this.applyIsPresentOrGetDecorator({ type: 'Get', metadataKey: 'GET_QUERY_PROPERTY' });
    }

    // Handle @IsPresent decorator
    if (this.existsDecorator('IS_PRESENT')) {
      this.applyIsPresentOrGetDecorator({ type: 'IsPresent', metadataKey: 'IS_PRESENT' });
    }
  }
}
