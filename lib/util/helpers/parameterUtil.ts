import { retrieveJwt } from '@sap-cloud-sdk/connectivity';

import util from '../util';

import type { MetadataFields } from '../../types/internalTypes';
import type { IncomingMessage } from 'http';
import type { Request } from '../../types/types';

const parameterUtil = {
  applyIsRole(req: Request, args: any[], metadata: MetadataFields[]): void {
    metadata.forEach((parameter) => {
      if (parameter.type === 'ROLE') {
        args[parameter.parameterIndex] = parameter.property.some((role) => req.user.is(role));
      }
    });
  },

  applyIsColumnSupplied(req: Request, args: any[], metadata: MetadataFields[]): void {
    metadata.forEach((parameter) => {
      if (parameter.type === 'CHECK_COLUMN_VALUE') {
        if (req.query.INSERT) {
          args[parameter.parameterIndex] = req.query.INSERT.columns.includes(parameter.property);
          return;
        }

        if (req.query.UPSERT) {
          args[parameter.parameterIndex] = req.query.UPSERT.columns.includes(parameter.property);
          return;
        }

        if (req.query.SELECT?.columns && req.query.SELECT.columns.length > 0) {
          args[parameter.parameterIndex] = req.query.SELECT.columns.some(
            (column) => column.ref && column.ref?.length > 0 && column.ref[0] === parameter.property,
          );
        }
      }
    });
  },

  isSingleInstance(req: Request): boolean {
    const hasParameters = req.params && req.params.length > 0;
    const SINGLE_INSTANCE = true;
    const ENTITY_SET = false;

    if (hasParameters) {
      return SINGLE_INSTANCE;
    }

    return ENTITY_SET;
  },

  handleRequestOptions(req: Request, args: unknown[], metadata: MetadataFields[]): void {
    metadata.forEach((parameter) => {
      if (parameter.type === 'REQ') {
        const key = parameter.property;
        args[parameter.parameterIndex] = req[key];
      }
    });
  },

  applyIsPresentOrGetDecorator(
    type: 'Get' | 'IsPresent',
    metadataParameters: MetadataFields[],
    req: Request,
    args: unknown[],
  ): void {
    for (const parameter of metadataParameters) {
      if (parameter.type !== 'QUERY') {
        break;
      }

      const queryOption = parameter.property;

      switch (queryOption) {
        case 'mixin':
        case 'limit':
        case 'orderBy':
        case 'groupBy':
        case 'having':
        case 'excluding':
        case 'distinct':
        case 'one': {
          if (parameter.key === 'SELECT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'limit.offset':
        case 'limit.rows': {
          const words = queryOption.split('.');
          const props = words[words.length - 1] as 'rows' | 'offset';

          args[parameter.parameterIndex] =
            type === 'Get' ? req.query.SELECT?.limit?.[props] : !!req.query.SELECT?.limit?.[props];

          break;
        }

        case 'data':
        case 'entity': {
          if (parameter.key === 'UPDATE') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'as': {
          if (parameter.key === 'INSERT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'rows':
        case 'values':
        case 'entries':
        case 'into': {
          if (parameter.key === 'INSERT' || parameter.key === 'UPSERT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'from': {
          if (parameter.key === 'SELECT' || parameter.key === 'DELETE') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'where': {
          if (parameter.key === 'SELECT' || parameter.key === 'UPDATE' || parameter.key === 'DELETE') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query[parameter.key]?.[queryOption];
          }

          break;
        }

        case 'columns': {
          if (parameter.key === 'SELECT' || parameter.key === 'INSERT' || parameter.key === 'UPSERT') {
            args[parameter.parameterIndex] =
              type === 'Get' ? req.query[parameter.key]?.[queryOption] : !!req.query.SELECT?.[queryOption];
          }

          break;
        }

        default:
          util.throwErrorMessage('Option not handled !');
          break;
      }
    }
  },

  retrieveJwt(req: Request): string | undefined {
    return retrieveJwt(req.http?.req as IncomingMessage);
  },
};

export default parameterUtil;
