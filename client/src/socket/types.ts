export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export type Unsubscribe = () => void;

export type SocketClientOptions = {
  url: string;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
};

export type SocketEnvelope = { type: string; [key: string]: unknown };
