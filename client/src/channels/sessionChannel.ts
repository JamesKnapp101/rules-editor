import { SocketClient } from "../socket/SocketClient";
import type { SocketEnvelope, Unsubscribe } from "../socket/types";

export type SessionClientToServer = {
  type: "HELLO";
  userId: string;
  displayName: string;
  room: string;
};

export type SessionServerToClient =
  | { type: "WELCOME"; connectionId: string }
  | { type: "ERROR"; message: string };

type Handlers = Partial<{
  welcome: (connectionId: string) => void;
  error: (message: string) => void;
}>;

export function createSessionChannel(client: SocketClient) {
  function hello(p: { userId: string; displayName: string; room: string }) {
    client.send({ type: "HELLO", ...p } as unknown as SocketEnvelope);
  }

  function subscribe(handlers: Handlers): Unsubscribe {
    return client.onMessage((raw) => {
      const msg = raw as SessionServerToClient;

      switch (msg.type) {
        case "WELCOME":
          handlers.welcome?.(msg.connectionId);
          return;
        case "ERROR":
          handlers.error?.(msg.message);
          return;
        default:
          return; // ignore other channel messages
      }
    });
  }

  return { hello, subscribe };
}
