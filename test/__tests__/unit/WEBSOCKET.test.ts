/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { OnWebSocketConnect, OnWebSocketDisconnect, OnWebSocketMessage, UnboundActions } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';

import type { BaseHandler, Constructable } from '../../../lib/types/internalTypes';

const eventHandlersOf = (instance: Constructable): BaseHandler[] =>
  MetadataDispatcher.getMetadataHandlers(instance).filter((item) => item.type === 'EVENT');

describe('WEBSOCKET', () => {
  test('It should RECORD : wsConnect / wsDisconnect / named-operation EVENT handlers', () => {
    @UnboundActions()
    class ChatHandler {
      @OnWebSocketConnect()
      public async onConnect() {}

      @OnWebSocketDisconnect()
      public async onDisconnect() {}

      @OnWebSocketMessage('sendMessage')
      public async onMessage() {}
    }

    const handlers = eventHandlersOf(new ChatHandler() as unknown as Constructable);
    const names = handlers.map((h) => (h as { eventName: string }).eventName);

    expect(names).toEqual(['wsConnect', 'wsDisconnect', 'sendMessage']);
    expect(handlers.every((h) => h.eventKind === 'ON')).toBe(true);
    expect(handlers.every((h) => h.isDraft === false)).toBe(true);
  });

  test('It should MATCH : the exact metadata an equivalent @OnEvent produces (pure sugar)', () => {
    const { OnEvent } = require('../../../lib');

    @UnboundActions()
    class Sugar {
      @OnWebSocketConnect()
      public async onConnect() {}
    }

    @UnboundActions()
    class Plain {
      @OnEvent('wsConnect')
      public async onConnect() {}
    }

    const [sugar] = eventHandlersOf(new Sugar() as unknown as Constructable);
    const [plain] = eventHandlersOf(new Plain() as unknown as Constructable);

    expect({ ...sugar, callback: undefined }).toEqual({ ...plain, callback: undefined });
  });
});
