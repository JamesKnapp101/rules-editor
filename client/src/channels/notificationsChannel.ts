import {
  NotificationsServerToClientSchema,
  type NotificationsClientToServer,
  type NotifSchema,
} from "../schemas/notificationSchemas";
import { SocketClient } from "../socket/SocketClient";
import type { Unsubscribe } from "../socket/types";
import z from "zod";

type Handlers = Partial<{
  pushed: (notif: z.infer<typeof NotifSchema>) => void;
  read: (p: {
    notifId: string;
    byUserId: string;
    byDisplayName: string;
  }) => void;
}>;

export function createNotificationsChannel(client: SocketClient) {
  function send(msg: NotificationsClientToServer) {
    client.send(msg);
  }

  function subscribe(handlers: Handlers): Unsubscribe {
    return client.onMessage((raw) => {
      const parsed = NotificationsServerToClientSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn(
          "Invalid notifications message",
          parsed.error.flatten(),
          raw,
        );
        return;
      }
      const msg = parsed.data;
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
          return;
      }
    });
  }

  return {
    push: (text: string) => send({ type: "NOTIF_PUSH", text }),
    markRead: (notifId: string) => send({ type: "NOTIF_READ", notifId }),
    subscribe,
  };
}
