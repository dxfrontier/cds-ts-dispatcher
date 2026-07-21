/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { Request as CdsRequest } from '@sap/cds';

import decoratorsUtil from '../../../lib/util/decorators/decoratorsUtil';
import { CatchAndSetErrorCode, CatchAndSetErrorMessage, Prepend, PrependDraft } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';

import type { PrependBase, PrependBaseDraft, StatusCodeMapping } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

describe('DECORATORS-UTIL', () => {
  // ============================================================================================================
  // decoratorsUtil.mapPrependEvent (backs @Prepend)
  // ============================================================================================================

  describe('decoratorsUtil.mapPrependEvent', () => {
    describe('CRUD / lifecycle decorators (no actionName / eventName)', () => {
      const cases: Array<[PrependBase['eventDecorator'], string, string]> = [
        ['AfterCreate', 'CREATE', 'AFTER'],
        ['AfterRead', 'READ', 'AFTER'],
        ['AfterReadSingleInstance', 'READ', 'AFTER_SINGLE'],
        ['AfterReadEachInstance', 'each', 'AFTER'],
        ['AfterUpdate', 'UPDATE', 'AFTER'],
        ['AfterDelete', 'DELETE', 'AFTER'],
        ['AfterAll', '*', 'AFTER'],
        ['BeforeCreate', 'CREATE', 'BEFORE'],
        ['BeforeRead', 'READ', 'BEFORE'],
        ['BeforeUpdate', 'UPDATE', 'BEFORE'],
        ['BeforeDelete', 'DELETE', 'BEFORE'],
        ['BeforeAll', '*', 'BEFORE'],
        ['OnCreate', 'CREATE', 'ON'],
        ['OnRead', 'READ', 'ON'],
        ['OnUpdate', 'UPDATE', 'ON'],
        ['OnDelete', 'DELETE', 'ON'],
        ['OnAll', '*', 'ON'],
        ['OnError', 'ERROR', 'ON'],
      ];

      test.each(cases)('It should MAP : %s -> { event: %s, eventKind: %s }', (eventDecorator, event, eventKind) => {
        const result = decoratorsUtil.mapPrependEvent({ eventDecorator } as unknown as PrependBase);

        expect(result).toEqual({ event, eventKind });
      });
    });

    describe('Action / function decorators (with actionName)', () => {
      const cases: Array<[string, string, string]> = [
        ['OnAction', 'ACTION', 'ON'],
        ['OnFunction', 'FUNC', 'ON'],
        ['OnBoundAction', 'BOUND_ACTION', 'ON'],
        ['OnBoundFunction', 'BOUND_FUNC', 'ON'],
        ['BeforeAction', 'ACTION', 'BEFORE'],
        ['BeforeFunction', 'FUNC', 'BEFORE'],
        ['BeforeBoundAction', 'BOUND_ACTION', 'BEFORE'],
        ['BeforeBoundFunction', 'BOUND_FUNC', 'BEFORE'],
        ['AfterAction', 'ACTION', 'AFTER'],
        ['AfterFunction', 'FUNC', 'AFTER'],
        ['AfterBoundAction', 'BOUND_ACTION', 'AFTER'],
        ['AfterBoundFunction', 'BOUND_FUNC', 'AFTER'],
      ];

      test.each(cases)(
        'It should MAP : %s -> { event: %s, eventKind: %s, actionName }',
        (eventDecorator, event, eventKind) => {
          const result = decoratorsUtil.mapPrependEvent({
            eventDecorator,
            actionName: 'myAction',
          } as unknown as PrependBase);

          expect(result).toEqual({ event, eventKind, actionName: 'myAction' });
        },
      );

      // Regression guard for a FIXED lib bug: the "On" group used to assign `eventMap.OnBoundFunction`
      // TWICE (once with `{ event: 'FUNC', ... }`, then again with `{ event: 'BOUND_FUNC', ... }`) and
      // never assigned `eventMap.OnFunction` at all - unlike the "Before"/"After" groups, which correctly
      // set both `*Function` and `*BoundFunction` distinctly. That made `@Prepend({ eventDecorator:
      // 'OnFunction' })` resolve to `undefined`, which threw ("Cannot destructure property 'event' of
      // 'undefined'") at the `@Prepend` call site in lib/decorators/method.ts. Fixed in decoratorsUtil.ts.
      test('It should DISTINGUISH : OnFunction (FUNC) from OnBoundFunction (BOUND_FUNC), each with its own actionName', () => {
        const onFunction = decoratorsUtil.mapPrependEvent({
          eventDecorator: 'OnFunction',
          actionName: 'myAction',
        } as unknown as PrependBase);
        const onBoundFunction = decoratorsUtil.mapPrependEvent({
          eventDecorator: 'OnBoundFunction',
          actionName: 'myAction',
        } as unknown as PrependBase);

        expect(onFunction).toEqual({ event: 'FUNC', eventKind: 'ON', actionName: 'myAction' });
        expect(onBoundFunction).toEqual({ event: 'BOUND_FUNC', eventKind: 'ON', actionName: 'myAction' });
        expect(onFunction).not.toEqual(onBoundFunction);
      });
    });

    describe('Event decorator (OnEvent, with eventName)', () => {
      test('It should MAP : OnEvent -> { event: EVENT, eventKind: ON, eventName }', () => {
        const result = decoratorsUtil.mapPrependEvent({
          eventDecorator: 'OnEvent',
          eventName: 'MyEvent',
        } as unknown as PrependBase);

        expect(result).toEqual({ event: 'EVENT', eventKind: 'ON', eventName: 'MyEvent' });
      });
    });
  });

  // ============================================================================================================
  // decoratorsUtil.mapPrependDraftEvent (backs @PrependDraft)
  // ============================================================================================================

  describe('decoratorsUtil.mapPrependDraftEvent', () => {
    describe('Draft lifecycle decorators (no actionName)', () => {
      const cases: Array<[PrependBaseDraft['eventDecorator'], string, string]> = [
        ['AfterCreateDraft', 'CREATE', 'AFTER'],
        ['AfterReadDraft', 'READ', 'AFTER'],
        ['AfterReadDraftSingleInstance', 'READ', 'AFTER_SINGLE'],
        ['AfterReadDraftEachInstance', 'each', 'AFTER'],
        ['AfterUpdateDraft', 'UPDATE', 'AFTER'],
        ['AfterDeleteDraft', 'DELETE', 'AFTER'],
        ['AfterNewDraft', 'NEW', 'AFTER'],
        ['AfterCancelDraft', 'CANCEL', 'AFTER'],
        ['AfterPatchDraft', 'PATCH', 'AFTER'],
        ['AfterDiscardDraft', 'DISCARD', 'AFTER'],
        ['AfterEditDraft', 'EDIT', 'AFTER'],
        ['AfterSaveDraft', 'SAVE', 'AFTER'],
        //
        ['BeforeCreateDraft', 'CREATE', 'BEFORE'],
        ['BeforeReadDraft', 'READ', 'BEFORE'],
        ['BeforeUpdateDraft', 'UPDATE', 'BEFORE'],
        ['BeforeDeleteDraft', 'DELETE', 'BEFORE'],
        ['BeforeNewDraft', 'NEW', 'BEFORE'],
        ['BeforeCancelDraft', 'CANCEL', 'BEFORE'],
        ['BeforePatchDraft', 'PATCH', 'BEFORE'],
        ['BeforeDiscardDraft', 'DISCARD', 'BEFORE'],
        ['BeforeEditDraft', 'EDIT', 'BEFORE'],
        ['BeforeSaveDraft', 'SAVE', 'BEFORE'],
        //
        ['OnCreateDraft', 'CREATE', 'ON'],
        ['OnReadDraft', 'READ', 'ON'],
        ['OnUpdateDraft', 'UPDATE', 'ON'],
        ['OnDeleteDraft', 'DELETE', 'ON'],
        ['OnNewDraft', 'NEW', 'ON'],
        ['OnCancelDraft', 'CANCEL', 'ON'],
        ['OnPatchDraft', 'PATCH', 'ON'],
        ['OnDiscardDraft', 'DISCARD', 'ON'],
        ['OnEditDraft', 'EDIT', 'ON'],
        ['OnSaveDraft', 'SAVE', 'ON'],
      ];

      test.each(cases)('It should MAP : %s -> { event: %s, eventKind: %s }', (eventDecorator, event, eventKind) => {
        const result = decoratorsUtil.mapPrependDraftEvent({ eventDecorator } as unknown as PrependBaseDraft);

        expect(result).toEqual({ event, eventKind });
      });
    });

    describe('Bound action / function draft decorators (with actionName)', () => {
      const cases: Array<[string, string]> = [
        ['OnBoundActionDraft', 'BOUND_ACTION'],
        ['OnBoundFunctionDraft', 'BOUND_FUNC'],
      ];

      test.each(cases)('It should MAP : %s -> { event: %s, eventKind: ON, actionName }', (eventDecorator, event) => {
        const result = decoratorsUtil.mapPrependDraftEvent({
          eventDecorator,
          actionName: 'myDraftAction',
        } as unknown as PrependBaseDraft);

        expect(result).toEqual({ event, eventKind: 'ON', actionName: 'myDraftAction' });
      });
    });
  });

  // ============================================================================================================
  // decoratorsUtil.handleError (backs @CatchAndSetErrorCode / @CatchAndSetErrorMessage)
  // ============================================================================================================

  describe('decoratorsUtil.handleError', () => {
    describe('Case 1: code only (@CatchAndSetErrorCode) - status-code mapping table', () => {
      const cases: Array<[keyof StatusCodeMapping, string, string]> = [
        ['BAD_REQUEST-400', '400', 'Bad Request'],
        ['UNAUTHORIZED-401', '401', 'Unauthorized'],
        ['FORBIDDEN-403', '403', 'Forbidden'],
        ['NOT_FOUND-404', '404', 'Not Found'],
        ['CONFLICT-409', '409', 'Conflict'],
        ['UNPROCESSABLE_ENTITY-422', '422', 'Unprocessable Entity'],
        ['TOO_MANY_REQUESTS-429', '429', 'Too Many Requests'],
        ['INTERNAL_SERVER_ERROR-500', '500', 'Internal Server Error'],
      ];

      test.each(cases)(
        'It should REJECT : with { code: %s, message: <reason phrase> }, for %s',
        (code, expectedCode, expectedPhrase) => {
          const req = { reject: jest.fn() };

          decoratorsUtil.handleError({ req: req as unknown as Request, code });

          expect(req.reject).toHaveBeenCalledWith({ code: expectedCode, message: expectedPhrase });
        },
      );
    });

    describe('Case 2: code AND message (@CatchAndSetErrorMessage with a status code)', () => {
      test('It should REJECT : with { code, message: <the provided message> }', () => {
        const req = { reject: jest.fn() };

        decoratorsUtil.handleError({
          req: req as unknown as Request,
          code: 'NOT_FOUND-404',
          message: 'Book not found',
        });

        expect(req.reject).toHaveBeenCalledWith({ code: '404', message: 'Book not found' });
      });
    });

    describe('Case 3: message only (@CatchAndSetErrorMessage without a status code)', () => {
      test('It should REJECT : with the plain message string (original status code preserved)', () => {
        const req = { reject: jest.fn() };

        decoratorsUtil.handleError({ req: req as unknown as Request, message: 'Something went wrong' });

        expect(req.reject).toHaveBeenCalledWith('Something went wrong');
      });
    });

    describe('Neither code nor message', () => {
      test('It should RETURN : undefined and NOT reject', () => {
        const req = { reject: jest.fn() };

        const result = decoratorsUtil.handleError({ req: req as unknown as Request });

        expect(result).toBeUndefined();
        expect(req.reject).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================================================
  // decoratorsUtil.handleAsyncErrors (the try/catch core of @CatchAndSetErrorCode / @CatchAndSetErrorMessage)
  // ============================================================================================================

  describe('decoratorsUtil.handleAsyncErrors', () => {
    test("It should RESOLVE : to the wrapped method's fulfilled value on success", async () => {
      const req = {};

      await expect(
        decoratorsUtil.handleAsyncErrors(async () => 'the-return-value', req as unknown as Request),
      ).resolves.toBe('the-return-value');
    });

    test('It should RESOLVE : to undefined on success, when the wrapped method resolves with no value (void handler)', async () => {
      const req = {};

      await expect(
        decoratorsUtil.handleAsyncErrors(async () => undefined, req as unknown as Request),
      ).resolves.toBeUndefined();
    });

    test('It should RE-THROW : the original error, when the method throws and req.errors was never populated', async () => {
      const req = {};
      const boom = new Error('boom');

      await expect(
        decoratorsUtil.handleAsyncErrors(
          async () => {
            throw boom;
          },
          req as unknown as Request,
        ),
      ).rejects.toBe(boom);
    });

    test('It should SWALLOW : the error (resolve to undefined), when req.errors is already populated (method self-rejected via req.reject)', async () => {
      const req = { errors: [{ message: 'already rejected by the method itself' }] };
      const boom = new Error('boom');

      await expect(
        decoratorsUtil.handleAsyncErrors(
          async () => {
            throw boom;
          },
          req as unknown as Request,
        ),
      ).resolves.toBeUndefined();
    });
  });

  // ============================================================================================================
  // Public path: @CatchAndSetErrorCode / @CatchAndSetErrorMessage (covers the decorator glue)
  // ============================================================================================================

  describe('@CatchAndSetErrorCode / @CatchAndSetErrorMessage (public path)', () => {
    class ActionHandler {
      @CatchAndSetErrorCode('BAD_REQUEST-400')
      public async okAction(req: Request): Promise<{ stock: number }> {
        return { stock: 42 };
      }

      @CatchAndSetErrorCode('BAD_REQUEST-400')
      public async failingAction(req: Request): Promise<{ stock: number }> {
        throw new Error('downstream boom');
      }

      @CatchAndSetErrorMessage('Custom failure message')
      public async failingActionCustomMessage(req: Request): Promise<void> {
        throw new Error('downstream boom');
      }

      @CatchAndSetErrorMessage('Custom failure message', 'NOT_FOUND-404')
      public async failingActionCustomMessageWithCode(req: Request): Promise<void> {
        throw new Error('downstream boom');
      }

      @CatchAndSetErrorCode('BAD_REQUEST-400')
      public async selfRejectingAction(req: Request): Promise<void> {
        req.reject(422, 'business validation failed');
      }
    }

    test("It should RETURN : the handler's own return value on success (propagated via decoratorsUtil.handleAsyncErrors)", async () => {
      const instance = new ActionHandler();
      const req = new CdsRequest({ data: {} });

      const result = await instance.okAction(req as unknown as Request);

      expect(result).toEqual({ stock: 42 });
    });

    test('It should REJECT : with { code: 400, message: "Bad Request" }, when the method throws a plain error (@CatchAndSetErrorCode)', async () => {
      const instance = new ActionHandler();
      const req = new CdsRequest({ data: {} });

      await expect(instance.failingAction(req as unknown as Request)).rejects.toMatchObject({
        code: '400',
        message: 'Bad Request',
      });
    });

    test('It should REJECT : with the custom message and NO code, when only a message is configured (@CatchAndSetErrorMessage)', async () => {
      const instance = new ActionHandler();
      const req = new CdsRequest({ data: {} });

      const error = await instance
        .failingActionCustomMessage(req as unknown as Request)
        .catch((error_: Error) => error_);

      expect(error).toMatchObject({ message: 'Custom failure message' });
      expect((error as { code?: string }).code).toBeUndefined();
    });

    test('It should REJECT : with the custom message AND code, when both are configured (@CatchAndSetErrorMessage)', async () => {
      const instance = new ActionHandler();
      const req = new CdsRequest({ data: {} });

      await expect(instance.failingActionCustomMessageWithCode(req as unknown as Request)).rejects.toMatchObject({
        code: '404',
        message: 'Custom failure message',
      });
    });

    test("It should PRESERVE : a self-issued req.reject(...) call unchanged - resolves to undefined, does NOT overwrite it with the decorator's code", async () => {
      const instance = new ActionHandler();
      const req = new CdsRequest({ data: {} });

      await expect(instance.selfRejectingAction(req as unknown as Request)).resolves.toBeUndefined();

      const errors = (req as unknown as { errors: Array<{ code: number; message: string }> }).errors;
      expect(errors[0]).toMatchObject({ code: 422, message: 'business validation failed' });
    });
  });

  // ============================================================================================================
  // Public path: @Prepend / @PrependDraft (covers mapPrependEvent / mapPrependDraftEvent registration glue)
  // ============================================================================================================

  describe('@Prepend / @PrependDraft (public path - metadata registration)', () => {
    class ReportHandler {
      @Prepend({ eventDecorator: 'BeforeRead' })
      public async beforeReadPrepend(req: Request): Promise<void> {}

      @PrependDraft({ eventDecorator: 'OnPatchDraft' })
      public async onPatchDraftPrepend(req: Request, next: Function): Promise<unknown> {
        return next();
      }

      @PrependDraft({ eventDecorator: 'OnDiscardDraft' })
      public async onDiscardDraftPrepend(req: Request, next: Function): Promise<unknown> {
        return next();
      }
    }

    const handlers = MetadataDispatcher.getMetadataHandlers(new ReportHandler());

    test('It should REGISTER : a PREPEND/BEFORE/READ handler via @Prepend (uses decoratorsUtil.mapPrependEvent)', () => {
      const found = handlers.find(
        (item) => item.type === 'PREPEND' && item.event === 'READ' && item.eventKind === 'BEFORE',
      );

      expect(found).toBeDefined();
      expect(found!.isDraft).toBe(false);
      expect(found!.callback).toBeDefined();
    });

    test('It should REGISTER : a PREPEND/ON/PATCH draft handler via @PrependDraft (uses decoratorsUtil.mapPrependDraftEvent)', () => {
      const found = handlers.find(
        (item) => item.type === 'PREPEND' && item.event === 'PATCH' && item.eventKind === 'ON',
      );

      expect(found).toBeDefined();
      expect(found!.isDraft).toBe(true);
    });

    test('It should REGISTER : a PREPEND/ON/DISCARD draft handler via @PrependDraft (uses decoratorsUtil.mapPrependDraftEvent)', () => {
      const found = handlers.find(
        (item) => item.type === 'PREPEND' && item.event === 'DISCARD' && item.eventKind === 'ON',
      );

      expect(found).toBeDefined();
      expect(found!.isDraft).toBe(true);
    });
  });
});
