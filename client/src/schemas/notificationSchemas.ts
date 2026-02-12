import { z } from "zod";

export type NotificationsClientToServer =
  | { type: "NOTIF_PUSH"; text: string }
  | { type: "NOTIF_READ"; notifId: string };

export const NotifSchema = z.object({
  id: z.string(),
  text: z.string(),
  fromUserId: z.string(),
  fromDisplayName: z.string(),
  ts: z.number(),
});

export const NotificationsServerToClientSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("NOTIF_PUSHED"),
    notif: NotifSchema,
  }),
  z.object({
    type: z.literal("NOTIF_READ"),
    notifId: z.string(),
    byUserId: z.string(),
    byDisplayName: z.string(),
  }),
]);

export type NotificationsServerToClient = z.infer<
  typeof NotificationsServerToClientSchema
>;
