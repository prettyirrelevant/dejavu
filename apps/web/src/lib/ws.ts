import type { ClientMessage, ServerMessage } from '@dejavu/shared';
import { HEARTBEAT_INTERVAL } from '@dejavu/shared';

type MessageHandler = (message: ServerMessage) => void;
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

interface WebSocketClientOptions {
  url: string;
  onMessage: MessageHandler;
  onStatusChange: StatusHandler;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private pingInterval: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private options: WebSocketClientOptions;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
  }

  connect(): void {
    this.options.onStatusChange('connecting');

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.options.onStatusChange('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          this.options.onMessage(message);
        } catch {}
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.options.onStatusChange('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        this.options.onStatusChange('error');
      };
    } catch {
      this.options.onStatusChange('error');
    }
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.maxReconnectAttempts = 0;
    this.ws?.close();
    this.ws = null;
  }

  private startHeartbeat(): void {
    this.pingInterval = window.setInterval(() => {
      this.send({
        type: 'ping',
        payload: { clientTime: Date.now() },
      });
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    window.setTimeout(() => {
      this.connect();
    }, delay);
  }
}
