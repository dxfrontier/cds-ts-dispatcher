/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import {
  BeforeCreate,
  BeforeDelete,
  BeforeUpdate,
  Data,
  EntityHandler,
  OnCreate,
  OnRead,
  OnUpdate,
  Param,
  Req,
  Tenant,
  UserInfo,
} from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import constants from '../../../lib/constants/internalConstants';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { Constructable } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

@EntityHandler(Book)
class DataParamsHandler {
  public capturedData: unknown = 'NOT_SET';
  public capturedTitle: unknown = 'NOT_SET';
  public capturedUser: unknown = 'NOT_SET';
  public capturedTenant: unknown = 'NOT_SET';
  public capturedCombined: unknown = 'NOT_SET';
  public capturedTwoParams: unknown = 'NOT_SET';

  // F1: @Data injects `req.data` (the payload of the current request).
  @BeforeCreate()
  public async dataMethod(@Data() data: Book) {
    this.capturedData = data;
  }

  // F2: @Param injects `req.data[field]` - a single field of the payload.
  @BeforeUpdate()
  public async paramMethod(@Param<Book>('title') title: string) {
    this.capturedTitle = title;
  }

  // F3: @UserInfo injects `req.user`.
  @BeforeDelete()
  public async userInfoMethod(@UserInfo() user: unknown) {
    this.capturedUser = user;
  }

  // F4: @Tenant injects `req.tenant`.
  @OnRead()
  public async tenantMethod(@Tenant() tenant: string | undefined) {
    this.capturedTenant = tenant;
  }

  // Repeatability: TWO @Param decorators on one method must each inject into their own index.
  @OnCreate()
  public async twoParamsMethod(@Param<Book>('title') title: string, @Param<Book>('descr') descr: string) {
    this.capturedTwoParams = { title, descr };
  }

  // Index mapping: @Req + @Data + @Param + @Tenant combined on the same method.
  @OnUpdate()
  public async combinedMethod(
    @Req() req: Request,
    @Data() data: Book,
    @Param<Book>('title') title: string,
    @Tenant() tenant: string | undefined,
  ) {
    this.capturedCombined = { req, data, title, tenant };
  }
}

const instanceOf = (Handler: Constructable) => new Handler();
const handlers = MetadataDispatcher.getMetadataHandlers(instanceOf(DataParamsHandler));

// A request-like object recognized by `parameterUtil.extractArguments` (via the `isMsgEvent` keys).
const buildReq = (extra: Record<string | symbol, unknown> = {}) => ({
  inbound: {},
  event: 'READ',
  data: {},
  headers: {},
  ...extra,
});

describe('@Data', () => {
  test('It should REGISTER : DATA parameter metadata at index 0', () => {
    const metadata = Reflect.getOwnMetadata(
      constants.DECORATOR.PARAMETER.DATA,
      DataParamsHandler.prototype,
      'dataMethod',
    );

    expect(metadata).toBeDefined();
    expect(metadata[0].parameterIndex).toBe(0);
    expect(metadata[0].type).toBe('INDEX_DECORATOR');
  });

  test('It should INJECT : `req.data` object identity into the decorated parameter', async () => {
    const handler = handlers.find((item) => item.eventKind === 'BEFORE' && item.event === 'CREATE');
    const instance = new DataParamsHandler();
    const data = { title: 'Wuthering Heights' };

    await handler!.callback.call(instance, buildReq({ event: 'CREATE', data }));

    expect(instance.capturedData).toBe(data);
  });
});

describe('@Param', () => {
  test("It should REGISTER : PARAM parameter metadata at index 0 with the 'title' property", () => {
    const metadata = Reflect.getOwnMetadata(
      constants.DECORATOR.PARAMETER.PARAM,
      DataParamsHandler.prototype,
      'paramMethod',
    );

    expect(metadata).toBeDefined();
    expect(metadata[0].parameterIndex).toBe(0);
    expect(metadata[0].type).toBe('DATA_PARAM');
    expect(metadata[0].property).toBe('title');
  });

  test('It should INJECT : the `req.data.title` field value into the decorated parameter', async () => {
    const handler = handlers.find((item) => item.eventKind === 'BEFORE' && item.event === 'UPDATE');
    const instance = new DataParamsHandler();

    await handler!.callback.call(instance, buildReq({ event: 'UPDATE', data: { title: 'Wuthering Heights' } }));

    expect(instance.capturedTitle).toBe('Wuthering Heights');
  });

  test('It should INJECT : TWO @Param decorators on one method, each into its own parameter index', async () => {
    const handler = handlers.find((item) => item.eventKind === 'ON' && item.event === 'CREATE');
    const instance = new DataParamsHandler();

    await handler!.callback.call(instance, buildReq({ event: 'CREATE', data: { title: 'T', descr: 'D' } }));

    expect(instance.capturedTwoParams).toEqual({ title: 'T', descr: 'D' });
  });
});

describe('@UserInfo', () => {
  test('It should REGISTER : USER_INFO parameter metadata at index 0', () => {
    const metadata = Reflect.getOwnMetadata(
      constants.DECORATOR.PARAMETER.USER_INFO,
      DataParamsHandler.prototype,
      'userInfoMethod',
    );

    expect(metadata).toBeDefined();
    expect(metadata[0].parameterIndex).toBe(0);
    expect(metadata[0].type).toBe('INDEX_DECORATOR');
  });

  test('It should INJECT : `req.user` into the decorated parameter', async () => {
    const handler = handlers.find((item) => item.eventKind === 'BEFORE' && item.event === 'DELETE');
    const instance = new DataParamsHandler();
    const user = { id: 'x', is: () => true };

    await handler!.callback.call(instance, buildReq({ event: 'DELETE', user }));

    expect(instance.capturedUser).toBe(user);
  });
});

describe('@Tenant', () => {
  test('It should REGISTER : TENANT parameter metadata at index 0', () => {
    const metadata = Reflect.getOwnMetadata(
      constants.DECORATOR.PARAMETER.TENANT,
      DataParamsHandler.prototype,
      'tenantMethod',
    );

    expect(metadata).toBeDefined();
    expect(metadata[0].parameterIndex).toBe(0);
    expect(metadata[0].type).toBe('INDEX_DECORATOR');
  });

  test('It should INJECT : `req.tenant` into the decorated parameter', async () => {
    const handler = handlers.find((item) => item.eventKind === 'ON' && item.event === 'READ');
    const instance = new DataParamsHandler();

    await handler!.callback.call(instance, buildReq({ tenant: 't1' }));

    expect(instance.capturedTenant).toBe('t1');
  });
});

describe('@Req + @Data + @Param + @Tenant (index mapping)', () => {
  test('It should INJECT : each decorator into its own parameter index when combined on one method', async () => {
    const handler = handlers.find((item) => item.eventKind === 'ON' && item.event === 'UPDATE');
    const instance = new DataParamsHandler();
    const data = { title: 'Moby Dick' };
    const req = buildReq({ event: 'UPDATE', data, tenant: 't1' });

    await handler!.callback.call(instance, req);

    expect(instance.capturedCombined).toEqual({ req, data, title: 'Moby Dick', tenant: 't1' });
  });
});
