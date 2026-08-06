@protocol: 'websocket'
@path    : 'chat'
service ChatService {
  action wsConnect();
  action wsDisconnect(reason : String);
  action sendMessage(text : String) returns String;
  event received {
    text : String;
  }
}
