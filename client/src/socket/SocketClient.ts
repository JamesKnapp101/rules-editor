import type {
  SocketClientOptions,
  SocketEnvelope,
  SocketStatus,
  Unsubscribe,
} from "./types";

type MessageHandler = (msg: SocketEnvelope) => void;
type StatusHandler = (status: SocketStatus) => void;

export class SocketClient {
  private ws: WebSocket | null = null;
  private status: SocketStatus = "disconnected";
  private readonly url: string;

  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();

  private reconnectTimer: number | null = null;
  private shouldRun = true;

  private reconnectDelayMs: number;
  private maxReconnectDelayMs: number;
  private currentDelayMs: number;

  constructor(opts: SocketClientOptions) {
    this.url = opts.url;
    this.reconnectDelayMs = opts.reconnectDelayMs ?? 750;
    this.maxReconnectDelayMs = opts.maxReconnectDelayMs ?? 8000;
    this.currentDelayMs = this.reconnectDelayMs;
  }

  getStatus() {
    return this.status;
  }

  connect() {
    if (!this.shouldRun) return;

    const existing = this.ws;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.setStatus(this.status === "connected" ? "connected" : "connecting");

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.currentDelayMs = this.reconnectDelayMs;
      this.setStatus("connected");
    };

    ws.onmessage = (ev) => {
      let msg: unknown;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      // lightweight shape check
      if (!msg || typeof msg !== "object" || !("type" in msg)) return;

      for (const h of this.messageHandlers) h(msg as SocketEnvelope);
    };

    ws.onclose = () => {
      this.setStatus(
        this.status === "connected" ? "reconnecting" : "disconnected",
      );
      this.ws = null;

      if (!this.shouldRun) return;

      if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
      const delay = this.currentDelayMs;

      this.currentDelayMs = Math.min(
        this.currentDelayMs * 1.6,
        this.maxReconnectDelayMs,
      );

      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, delay);
    };

    ws.onerror = () => {
      // onclose will follow
    };
  }

  disconnect() {
    this.shouldRun = false;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;

    const ws = this.ws;
    this.ws = null;

    if (ws) ws.close();
    this.setStatus("disconnected");
  }

  send<T extends SocketEnvelope>(msg: T) {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(msg));
    return true;
  }

  onMessage(handler: MessageHandler): Unsubscribe {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): Unsubscribe {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(next: SocketStatus) {
    if (this.status === next) return;
    this.status = next;
    for (const h of this.statusHandlers) h(next);
  }
}
