import { SocketClient } from "../socket/SocketClient";
import type { SocketEnvelope, Unsubscribe } from "../socket/types";

export type NotificationsClientToServer =
  | { type: "NOTIF_PUSH"; text: string }
  | { type: "NOTIF_READ"; notifId: string };

export type NotificationsServerToClient =
  | {
      type: "NOTIF_PUSHED";
      notif: {
        id: string;
        text: string;
        fromUserId: string;
        fromDisplayName: string;
        ts: number;
      };
    }
  | {
      type: "NOTIF_READ";
      notifId: string;
      byUserId: string;
      byDisplayName: string;
    };

type Handlers = Partial<{
  pushed: (
    notif: Extract<NotificationsServerToClient, { type: "NOTIF_PUSHED" }>["notif"],
  ) => void;
  read: (p: {
    notifId: string;
    byUserId: string;
    byDisplayName: string;
  }) => void;
}>;

export function createNotificationsChannel(client: SocketClient) {
  function send(msg: NotificationsClientToServer) {
    client.send(msg as unknown as SocketEnvelope);
  }

  function subscribe(handlers: Handlers): Unsubscribe {
    return client.onMessage((raw) => {
      const msg = raw as NotificationsServerToClient;

      switch (msg.type) {
        case "NOTIF_PUSHED":
          handlers.pushed?.(msg.notif);
          return;
        case "NOTIF_READ":
          handlers.read?.({
            notifId: msg.notifId,
            byUserId: msg.byUserId,
            byDisplayName: msg.byDisplayName,
          });
          return;
        default:
          return; // ignore other channels' messages
      }
    });
  }

  return {
    push: (text: string) => send({ type: "NOTIF_PUSH", text }),
    markRead: (notifId: string) => send({ type: "NOTIF_READ", notifId }),
    subscribe,
  };
}
