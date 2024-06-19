import type { MapPrepend, PrependBase, PrependBaseDraft } from '../../types/internalTypes';

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

    if (options.eventDecorator === 'OnAction' || options.eventDecorator === 'OnFunction') {
      eventMap.OnAction = { event: 'ACTION', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnBoundFunction = { event: 'FUNC', eventKind: 'ON', actionName: options.actionName };
    }

    if (options.eventDecorator === 'OnBoundAction' || options.eventDecorator === 'OnBoundFunction') {
      eventMap.OnBoundAction = { event: 'BOUND_ACTION', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnBoundFunction = { event: 'BOUND_FUNC', eventKind: 'ON', actionName: options.actionName };
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
      AfterEditDraft: { event: 'EDIT', eventKind: 'AFTER' },
      AfterSaveDraft: { event: 'SAVE', eventKind: 'AFTER' },
      //
      BeforeCreateDraft: { event: 'CREATE', eventKind: 'BEFORE' },
      BeforeReadDraft: { event: 'READ', eventKind: 'BEFORE' },
      BeforeUpdateDraft: { event: 'UPDATE', eventKind: 'BEFORE' },
      BeforeDeleteDraft: { event: 'DELETE', eventKind: 'BEFORE' },
      BeforeNewDraft: { event: 'NEW', eventKind: 'BEFORE' },
      BeforeCancelDraft: { event: 'CANCEL', eventKind: 'BEFORE' },
      BeforeEditDraft: { event: 'EDIT', eventKind: 'BEFORE' },
      BeforeSaveDraft: { event: 'SAVE', eventKind: 'BEFORE' },
      //
      OnCreateDraft: { event: 'CREATE', eventKind: 'ON' },
      OnReadDraft: { event: 'READ', eventKind: 'ON' },
      OnUpdateDraft: { event: 'UPDATE', eventKind: 'ON' },
      OnDeleteDraft: { event: 'DELETE', eventKind: 'ON' },
      OnNewDraft: { event: 'NEW', eventKind: 'ON' },
      OnCancelDraft: { event: 'CANCEL', eventKind: 'ON' },
      OnEditDraft: { event: 'EDIT', eventKind: 'ON' },
      OnSaveDraft: { event: 'SAVE', eventKind: 'ON' },
    };

    if (options.eventDecorator === 'OnBoundActionDraft' || options.eventDecorator === 'OnBoundFunctionDraft') {
      eventMap.OnBoundActionDraft = { event: 'BOUND_ACTION', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnBoundFunctionDraft = { event: 'BOUND_FUNC', eventKind: 'ON', actionName: options.actionName };
    }

    return eventMap[options.eventDecorator]!;
  },
};

export default decoratorsUtil;
