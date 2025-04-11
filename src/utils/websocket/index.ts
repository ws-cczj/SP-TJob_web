import { Log } from "../log/log";
import { errorMsg, warnMsg } from "../message/message";

export default class CCZJWebSocket {
  private ws: WebSocket;
  private connecting: boolean;
  private heartbeat: NodeJS.Timeout;
  private timeout: NodeJS.Timeout;

  constructor(token: string, callback?: () => void) {
    this.ws = new WebSocket(`ws://8.134.19.49:8437/v1/api/ws?token=${token}`);
    this.ws.onopen = (_e: Event) => {
      callback && callback();
      Log.debug('websocket', 'ws连接成功');
    };
    // 统一错误处理 
    this.ws.onerror = (e: Event) => {
      this.connecting = false;
      Log.error('websocket','ws连接发生错误', e);
      errorMsg('ws连接发生错误');
      clearInterval(this.heartbeat);
      this.ws.close(3001, 'ws连接发生错误');
    };
    this.timeout = setTimeout(() => { });
    this.connecting = true;
    this.heartbeat = setInterval(() => this.heartbeatInterval(), 1000 * 30);
  }

  // 接收信息
  public recive<T>(callback: (data: T) => void) {
    if (!this.connecting) return;
    this.ws.onmessage = (event) => {
      if (event.data === 'pong') {
        clearTimeout(this.timeout);
        Log.debug('websocket','收到心跳回复');
        return;
      }
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (err) {
        Log.error('websocket','消息解析失败', err);
      }
    }
  }
  // 发送信息
  public send<T>(msg: T) {
    if (!this.connecting) return;
    this.ws.send(JSON.stringify(msg));
  }
  public close() {
    if (!this.connecting) return;
    this.connecting = false;
    clearInterval(this.heartbeat);
    this.ws.close(1000, '主动关闭');
    Log.debug('websocket','主动关闭ws连接');
  }
  // 检查连接状态
  public check():boolean {
    return this.connecting;
  }
  // 心跳检测
  private heartbeatInterval() {
    if (!this.connecting) return;
    this.ws.send('ping'); // 发送自定义心跳消息
    // 添加超时断连检测
    this.timeout = setTimeout(() => {
      if (this.connecting) {
        warnMsg('心跳超时，主动断开连接');
        Log.error('websocket','心跳超时，主动断开连接');
        this.close();
      }
    }, 5000);
  }
}