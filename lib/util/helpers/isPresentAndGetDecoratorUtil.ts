import util from '../util';

import type {
  MetadataFields,
  QueryDeleteProps,
  QueryInsertProps,
  QuerySelectProps,
  QueryUpdateProps,
  QueryUpsertProps,
} from '../../types/internalTypes';

const isPresentAndGetDecoratorUtil = {
  handleQueryOptions(type: 'Get' | 'IsPresent', metadataParameters: MetadataFields[], args: any[]): void {
    const req = util.findRequest(args);

    for (const parameter of metadataParameters) {
      if (parameter.type !== 'QUERY') {
        break;
      }

      if (parameter.requestQueryKey === 'INSERT') {
        const queryOption = parameter.property as QueryInsertProps['props'];

        switch (queryOption) {
          case 'entries':
          case 'rows':
          case 'values':
          case 'columns': {
            // @GetQueryProperty()
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.INSERT?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] =
              !!req.query.INSERT?.[queryOption] && req.query.INSERT?.[queryOption].length > 0;

            break;
          }

          case 'into': {
            // @GetQueryProperty()
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.INSERT?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] = !!req.query.INSERT?.[queryOption];

            break;
          }

          case 'as': {
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.INSERT?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] = !!req.query.INSERT?.[queryOption];
          }
        }
      }

      if (parameter.requestQueryKey === 'SELECT') {
        const queryOption = parameter.property as QuerySelectProps['props'];

        switch (queryOption) {
          case 'columns':
          case 'where':
          case 'orderBy':
          case 'groupBy':
          case 'excluding':
          case 'having': {
            // @GetQueryProperty()
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.SELECT?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] =
              !!req.query.SELECT?.[queryOption] && req.query.SELECT?.[queryOption]!.length > 0;

            break;
          }

          case 'limit':
          case 'one':
          case 'distinct': {
            // @GetQueryProperty()
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.SELECT?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] = !!req.query.SELECT?.[queryOption];

            break;
          }

          case 'limit.rows':
          case 'limit.offset': {
            const words = queryOption.split('.');
            const props = words[words.length - 1] as 'rows' | 'offset';

            // @GetQueryProperty
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.SELECT?.limit?.[props];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] = !!req.query.SELECT?.limit?.[props];

            break;
          }
        }
      }

      if (parameter.requestQueryKey === 'UPDATE') {
        const queryOption = parameter.property as QueryUpdateProps['props'];
        switch (queryOption) {
          case 'entity':
          case 'where':
          case 'data': {
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.UPDATE?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] = !!req.query.UPDATE?.[queryOption];
          }
        }
      }

      if (parameter.requestQueryKey === 'UPSERT') {
        const queryOption = parameter.property as QueryUpsertProps['props'];
        switch (queryOption) {
          case 'columns':
          case 'entries':
          case 'rows':
          case 'values': {
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.UPSERT?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] =
              !!req.query.UPSERT?.[queryOption] && req.query.UPSERT?.[queryOption].length > 0;

            break;
          }

          case 'into': {
            // @GetQueryProperty()
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.UPSERT?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] = !!req.query.UPSERT?.[queryOption];

            break;
          }
        }
      }

      if (parameter.requestQueryKey === 'DELETE') {
        const queryOption = parameter.property as QueryDeleteProps['props'];
        switch (queryOption) {
          case 'from':
          case 'where': {
            if (type === 'Get') {
              args[parameter.parameterIndex] = req.query.DELETE?.[queryOption];
              break;
            }

            // @IsPresent()
            args[parameter.parameterIndex] = !!req.query.DELETE?.[queryOption];
          }
        }
      }
    }
  },
};

export default isPresentAndGetDecoratorUtil;
