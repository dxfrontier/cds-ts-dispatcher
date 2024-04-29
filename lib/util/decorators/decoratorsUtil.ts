import type { MapPrepend, PrependBase } from '../../types/internalTypes';

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
};

export default decoratorsUtil;
