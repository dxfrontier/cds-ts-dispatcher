import type { MapPrepend, PrependBase, PrependBaseDraft } from '../../types/internalTypes';
import type { Request } from '../../types/types';

import { getReasonPhrase } from 'http-status-codes';

const decoratorsUtil = {
  mapPrependEvent(options: PrependBase): MapPrepend {
    const eventMap: Partial<Record<PrependBase['eventDecorator'], MapPrepend>> = {
      AfterCreate: { event: 'CREATE', eventKind: 'AFTER' },
      AfterRead: { event: 'READ', eventKind: 'AFTER' },
      AfterReadSingleInstance: { event: 'READ', eventKind: 'AFTER_SINGLE' },
      AfterReadEachInstance: { event: 'each', eventKind: 'AFTER' },
      AfterUpdate: { event: 'UPDATE', eventKind: 'AFTER' },
      AfterDelete: { event: 'DELETE', eventKind: 'AFTER' },
      AfterAll: { event: '*', eventKind: 'AFTER' },
      //
      BeforeCreate: { event: 'CREATE', eventKind: 'BEFORE' },
      BeforeRead: { event: 'READ', eventKind: 'BEFORE' },
      BeforeUpdate: { event: 'UPDATE', eventKind: 'BEFORE' },
      BeforeDelete: { event: 'DELETE', eventKind: 'BEFORE' },
      BeforeAll: { event: '*', eventKind: 'BEFORE' },
      //
      OnCreate: { event: 'CREATE', eventKind: 'ON' },
      OnRead: { event: 'READ', eventKind: 'ON' },
      OnUpdate: { event: 'UPDATE', eventKind: 'ON' },
      OnDelete: { event: 'DELETE', eventKind: 'ON' },
      OnAll: { event: '*', eventKind: 'ON' },
      //
      OnError: { event: 'ERROR', eventKind: 'ON' },
    };

    if (
      options.eventDecorator === 'OnAction' ||
      options.eventDecorator === 'OnFunction' ||
      options.eventDecorator === 'OnBoundAction' ||
      options.eventDecorator === 'OnBoundFunction' ||
      //
      options.eventDecorator === 'AfterAction' ||
      options.eventDecorator === 'AfterFunction' ||
      options.eventDecorator === 'AfterBoundAction' ||
      options.eventDecorator === 'AfterBoundFunction' ||
      //
      options.eventDecorator === 'BeforeAction' ||
      options.eventDecorator === 'BeforeFunction' ||
      options.eventDecorator === 'BeforeBoundAction' ||
      options.eventDecorator === 'BeforeBoundFunction'
    ) {
      eventMap.OnAction = { event: 'ACTION', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnFunction = { event: 'FUNC', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnBoundAction = { event: 'BOUND_ACTION', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnBoundFunction = { event: 'BOUND_FUNC', eventKind: 'ON', actionName: options.actionName };
      //
      eventMap.BeforeAction = { event: 'ACTION', eventKind: 'BEFORE', actionName: options.actionName };
      eventMap.BeforeFunction = { event: 'FUNC', eventKind: 'BEFORE', actionName: options.actionName };
      eventMap.BeforeBoundAction = { event: 'BOUND_ACTION', eventKind: 'BEFORE', actionName: options.actionName };
      eventMap.BeforeBoundFunction = { event: 'BOUND_FUNC', eventKind: 'BEFORE', actionName: options.actionName };
      //
      eventMap.AfterAction = { event: 'ACTION', eventKind: 'AFTER', actionName: options.actionName };
      eventMap.AfterFunction = { event: 'FUNC', eventKind: 'AFTER', actionName: options.actionName };
      eventMap.AfterBoundAction = { event: 'BOUND_ACTION', eventKind: 'AFTER', actionName: options.actionName };
      eventMap.AfterBoundFunction = { event: 'BOUND_FUNC', eventKind: 'AFTER', actionName: options.actionName };
    }

    if (options.eventDecorator === 'OnEvent') {
      eventMap.OnEvent = { event: 'EVENT', eventKind: 'ON', eventName: options.eventName };
    }

    return eventMap[options.eventDecorator]!;
  },

  mapPrependDraftEvent(options: PrependBaseDraft): MapPrepend {
    const eventMap: Partial<Record<PrependBaseDraft['eventDecorator'], MapPrepend>> = {
      AfterCreateDraft: { event: 'CREATE', eventKind: 'AFTER' },
      AfterReadDraft: { event: 'READ', eventKind: 'AFTER' },
      AfterReadDraftSingleInstance: { event: 'READ', eventKind: 'AFTER_SINGLE' },
      AfterReadDraftEachInstance: { event: 'each', eventKind: 'AFTER' },
      AfterUpdateDraft: { event: 'UPDATE', eventKind: 'AFTER' },
      AfterDeleteDraft: { event: 'DELETE', eventKind: 'AFTER' },
      AfterNewDraft: { event: 'NEW', eventKind: 'AFTER' },
      AfterCancelDraft: { event: 'CANCEL', eventKind: 'AFTER' },
      AfterPatchDraft: { event: 'PATCH', eventKind: 'AFTER' },
      AfterDiscardDraft: { event: 'DISCARD', eventKind: 'AFTER' },
      // EDIT/SAVE mirror their own decorator's isDraft: false - they dispatch on the ACTIVE entity, not
      // '<Entity>.drafts', so a @PrependDraft targeting one of them must register there too.
      AfterEditDraft: { event: 'EDIT', eventKind: 'AFTER', isDraft: false },
      AfterSaveDraft: { event: 'SAVE', eventKind: 'AFTER', isDraft: false },
      //
      BeforeCreateDraft: { event: 'CREATE', eventKind: 'BEFORE' },
      BeforeReadDraft: { event: 'READ', eventKind: 'BEFORE' },
      BeforeUpdateDraft: { event: 'UPDATE', eventKind: 'BEFORE' },
      BeforeDeleteDraft: { event: 'DELETE', eventKind: 'BEFORE' },
      BeforeNewDraft: { event: 'NEW', eventKind: 'BEFORE' },
      BeforeCancelDraft: { event: 'CANCEL', eventKind: 'BEFORE' },
      BeforePatchDraft: { event: 'PATCH', eventKind: 'BEFORE' },
      BeforeDiscardDraft: { event: 'DISCARD', eventKind: 'BEFORE' },
      BeforeEditDraft: { event: 'EDIT', eventKind: 'BEFORE', isDraft: false },
      BeforeSaveDraft: { event: 'SAVE', eventKind: 'BEFORE', isDraft: false },
      //
      OnCreateDraft: { event: 'CREATE', eventKind: 'ON' },
      OnReadDraft: { event: 'READ', eventKind: 'ON' },
      OnUpdateDraft: { event: 'UPDATE', eventKind: 'ON' },
      OnDeleteDraft: { event: 'DELETE', eventKind: 'ON' },
      OnNewDraft: { event: 'NEW', eventKind: 'ON' },
      OnCancelDraft: { event: 'CANCEL', eventKind: 'ON' },
      OnPatchDraft: { event: 'PATCH', eventKind: 'ON' },
      OnDiscardDraft: { event: 'DISCARD', eventKind: 'ON' },
      OnEditDraft: { event: 'EDIT', eventKind: 'ON', isDraft: false },
      OnSaveDraft: { event: 'SAVE', eventKind: 'ON', isDraft: false },
    };

    if (options.eventDecorator === 'OnBoundActionDraft' || options.eventDecorator === 'OnBoundFunctionDraft') {
      eventMap.OnBoundActionDraft = { event: 'BOUND_ACTION', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnBoundFunctionDraft = { event: 'BOUND_FUNC', eventKind: 'ON', actionName: options.actionName };
    }

    return eventMap[options.eventDecorator]!;
  },

  handleError(options: { req: Request; message?: string; code?: string }): Error | undefined {
    const { req, message, code } = options;

    // Case 1: If only `code` is provided (CatchAndSetErrorCode decorator)
    if (code && !message) {
      const statusCode = code.split('-')[1];
      return req.reject({ code: statusCode, message: getReasonPhrase(statusCode) });
    }

    // Case 2: If both `message` and `code` are provided (CatchAndSetErrorMessage decorator with status code)
    if (code && message) {
      const statusCode = code.split('-')[1];
      return req.reject({ code: statusCode, message });
    }

    // Case 3: If only `message` is provided (CatchAndSetErrorMessage decorator without status code)
    if (message) {
      return req.reject(message);
    }
  },

  async handleAsyncErrors(originalMethod: () => Promise<unknown>, req: Request): Promise<unknown> {
    const result: [PromiseSettledResult<unknown>] = await Promise.allSettled([originalMethod()]);
    const [settled] = result;
    const rejected: PromiseRejectedResult | undefined = result.find((response) => response.status === 'rejected');

    if (rejected && (req as any).errors === undefined) {
      throw rejected.reason;
    }

    // Success (or a rejection already communicated via req.reject()/req.errors, swallowed above):
    // propagate the wrapped method's fulfilled value instead of discarding it.
    return settled.status === 'fulfilled' ? settled.value : undefined;
  },
};

export default decoratorsUtil;
