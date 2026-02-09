export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export type Unsubscribe = () => void;

export type SocketClientOptions = {
  url: string;
  reconnectDelayMs?: number; // base delay
  maxReconnectDelayMs?: number;
};

export type SocketEnvelope = { type: string; [key: string]: unknown };
