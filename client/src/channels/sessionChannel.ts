import { SocketClient } from "../socket/SocketClient";
import type { Unsubscribe } from "../socket/types";

export type SessionServerToClient =
  | { type: "WELCOME"; connectionId: string }
  | { type: "SUBSCRIBED"; room: string }
  | { type: "UNSUBSCRIBED"; room: string }
  | { type: "ERROR"; message: string };

type Handlers = Partial<{
  welcome: (connectionId: string) => void;
  subscribed: (room: string) => void;
  unsubscribed: (room: string) => void;
  error: (message: string) => void;
}>;

export function createSessionChannel(client: SocketClient) {
  function hello(p: { userId: string; displayName: string }) {
    client.send({ type: "HELLO", ...p });
  }

  function subscribeRoom(p: { room: string }) {
    client.send({ type: "SUBSCRIBE", ...p });
  }

  function unsubscribe(p: { room: string }) {
    client.send({ type: "UNSUBSCRIBE", ...p });
  }

  function subscribe(handlers: Handlers): Unsubscribe {
    return client.onMessage((raw) => {
      const msg = raw as SessionServerToClient;

      switch (msg.type) {
        case "WELCOME":
          handlers.welcome?.(msg.connectionId);
          return;
        case "SUBSCRIBED":
          handlers.subscribed?.(msg.room);
          return;
        case "UNSUBSCRIBED":
          handlers.unsubscribed?.(msg.room);
          return;
        case "ERROR":
          handlers.error?.(msg.message);
          return;
        default:
          return;
      }
    });
  }

  return { hello, subscribeRoom, unsubscribe, subscribe };
}
