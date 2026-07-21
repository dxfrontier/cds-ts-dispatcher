/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { AfterDelete, Affected, EntityHandler, OnBoundFunction, Req, Subject } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import constants from '../../../lib/constants/internalConstants';
import { Book } from '../../sample-project/bookshop/@cds-models/CatalogService';

import type { Constructable } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

@EntityHandler(Book)
class SubjectAffectedHandler {
  public capturedSubject: unknown = 'NOT_SET';
  public capturedAffected: unknown = 'NOT_SET';

  // F2: @Subject injects `req.subject` (the CQN ref of the request target).
  @OnBoundFunction('SomeBoundFunction')
  public async boundFunction(@Subject() subject: unknown, @Req() req: Request) {
    this.capturedSubject = subject;
  }

  // F3: @Affected injects the database `affected` row count stashed on the request.
  @AfterDelete()
  public async afterDelete(@Affected() affected: number | undefined, @Req() req: Request) {
    this.capturedAffected = affected;
  }
}

const instanceOf = (Handler: Constructable) => new Handler();
const handlers = MetadataDispatcher.getMetadataHandlers(instanceOf(SubjectAffectedHandler));

// A request-like object recognized by `parameterUtil.extractArguments` (via the `isMsgEvent` keys).
const buildReq = (extra: Record<string | symbol, unknown> = {}) => ({
  inbound: {},
  event: 'READ',
  data: {},
  headers: {},
  ...extra,
});

describe('@Subject (F2)', () => {
  test('It should REGISTER : SUBJECT parameter metadata at index 0', () => {
    const metadata = Reflect.getOwnMetadata(
      constants.DECORATOR.PARAMETER.SUBJECT,
      SubjectAffectedHandler.prototype,
      'boundFunction',
    );

    expect(metadata).toBeDefined();
    expect(metadata[0].parameterIndex).toBe(0);
    expect(metadata[0].type).toBe('INDEX_DECORATOR');
  });

  test('It should INJECT : `req.subject` into the decorated parameter', async () => {
    const handler = handlers.find((item) => item.type === 'ACTION_FUNCTION' && item.event === 'BOUND_FUNC');
    const instance = new SubjectAffectedHandler();
    const subject = { ref: ['CatalogService.Books'] };

    await handler!.callback.call(instance, buildReq({ subject }));

    expect(instance.capturedSubject).toEqual(subject);
  });

  test('It should INJECT : `undefined` when no subject is present on the request', async () => {
    const handler = handlers.find((item) => item.type === 'ACTION_FUNCTION' && item.event === 'BOUND_FUNC');
    const instance = new SubjectAffectedHandler();

    await handler!.callback.call(instance, buildReq());

    expect(instance.capturedSubject).toBeUndefined();
  });
});

describe('@Affected (F3)', () => {
  test('It should REGISTER : AFFECTED parameter metadata at index 0', () => {
    const metadata = Reflect.getOwnMetadata(
      constants.DECORATOR.PARAMETER.AFFECTED,
      SubjectAffectedHandler.prototype,
      'afterDelete',
    );

    expect(metadata).toBeDefined();
    expect(metadata[0].parameterIndex).toBe(0);
    expect(metadata[0].type).toBe('INDEX_DECORATOR');
  });

  test('It should INJECT : the stashed `affected` row count into the decorated parameter', async () => {
    const handler = handlers.find((item) => item.eventKind === 'AFTER' && item.event === 'DELETE');
    const instance = new SubjectAffectedHandler();

    // Fabricated after-callback args: [results-with-affected, req-with-stashed-count].
    const results = Object.assign([{ ID: 1 }], { affected: 3 });
    const req = buildReq({ event: 'DELETE', [constants.AFFECTED]: 3 });

    await handler!.callback.call(instance, results, req);

    expect(instance.capturedAffected).toBe(3);
  });

  test('It should INJECT : `undefined` when no affected count was stashed (e.g. READ)', async () => {
    const handler = handlers.find((item) => item.eventKind === 'AFTER' && item.event === 'DELETE');
    const instance = new SubjectAffectedHandler();

    await handler!.callback.call(instance, [{ ID: 1 }], buildReq({ event: 'DELETE' }));

    expect(instance.capturedAffected).toBeUndefined();
  });
});
