import {
  OnWebSocketConnect,
  OnWebSocketDisconnect,
  OnWebSocketMessage,
  Req,
  Request,
  UnboundActions,
} from '../../../../../../../lib';

@UnboundActions()
class ChatHandler {
  @OnWebSocketConnect()
  public async onConnect(@Req() req: Request) {
    console.log('[Chat] connect');
  }

  @OnWebSocketMessage('sendMessage')
  public async onMessage(@Req() req: Request<{ text: string }>) {
    console.log(`[Chat] message ${req.data.text}`);
    return req.data.text;
  }

  @OnWebSocketDisconnect()
  public async onDisconnect(@Req() req: Request<{ reason?: string }>) {
    // Under kind 'ws' the plugin delivers the socket close CODE as a string (e.g. '1000'), not a phrase.
    console.log(`[Chat] disconnect ${req.data?.reason ?? ''}`);
  }
}

export default ChatHandler;
