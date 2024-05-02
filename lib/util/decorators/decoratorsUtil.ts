import type { MapPrepend, PrependBase, PrependBaseDraft } from '../../types/internalTypes';

const decoratorsUtil = {
  mapPrependEvent(options: PrependBase): MapPrepend {
    const eventMap: Partial<Record<PrependBase['eventDecorator'], MapPrepend>> = {
      AfterCreate: { event: 'CREATE', eventKind: 'AFTER' },
      AfterRead: { event: 'READ', eventKind: 'AFTER' },
      AfterReadSingleInstance: { event: 'READ', eventKind: 'AFTER_SINGLE' },
      AfterUpdate: { event: 'UPDATE', eventKind: 'AFTER' },
      AfterDelete: { event: 'DELETE', eventKind: 'AFTER' },
      BeforeCreate: { event: 'CREATE', eventKind: 'BEFORE' },
      BeforeRead: { event: 'READ', eventKind: 'BEFORE' },
      BeforeUpdate: { event: 'UPDATE', eventKind: 'BEFORE' },
      BeforeDelete: { event: 'DELETE', eventKind: 'BEFORE' },
      OnCreate: { event: 'CREATE', eventKind: 'ON' },
      OnRead: { event: 'READ', eventKind: 'ON' },
      OnUpdate: { event: 'UPDATE', eventKind: 'ON' },
      OnDelete: { event: 'DELETE', eventKind: 'ON' },
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
      AfterUpdateDraft: { event: 'UPDATE', eventKind: 'AFTER' },
      AfterDeleteDraft: { event: 'DELETE', eventKind: 'AFTER' },
      BeforeCreateDraft: { event: 'CREATE', eventKind: 'BEFORE' },
      BeforeReadDraft: { event: 'READ', eventKind: 'BEFORE' },
      BeforeUpdateDraft: { event: 'UPDATE', eventKind: 'BEFORE' },
      BeforeDeleteDraft: { event: 'DELETE', eventKind: 'BEFORE' },
      OnCreateDraft: { event: 'CREATE', eventKind: 'ON' },
      OnReadDraft: { event: 'READ', eventKind: 'ON' },
      OnUpdateDraft: { event: 'UPDATE', eventKind: 'ON' },
      OnDeleteDraft: { event: 'DELETE', eventKind: 'ON' },
    };

    if (options.eventDecorator === 'OnBoundActionDraft' || options.eventDecorator === 'OnBoundFunctionDraft') {
      eventMap.OnBoundActionDraft = { event: 'BOUND_ACTION', eventKind: 'ON', actionName: options.actionName };
      eventMap.OnBoundFunctionDraft = { event: 'BOUND_FUNC', eventKind: 'ON', actionName: options.actionName };
    }

    return eventMap[options.eventDecorator]!;
  },
};

export default decoratorsUtil;
