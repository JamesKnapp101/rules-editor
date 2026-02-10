import { SocketClient } from "../socket/SocketClient";
import type { Unsubscribe } from "../socket/types";
import type { Rule } from "../types";

export type RuleEditorClientToServer =
  | { type: "HELLO"; userId: string; displayName: string }
  | { type: "START_EDIT"; ruleId: string }
  | { type: "CANCEL_EDIT"; ruleId: string }
  | { type: "SAVE_RULE"; ruleId: string };

export type RuleEditorServerToClient =
  | { type: "WELCOME"; connectionId: string }
  | {
      type: "PRESENCE_SNAPSHOT";
      users: Array<{ userId: string; displayName: string }>;
    }
  | { type: "USER_JOINED"; user: { userId: string; displayName: string } }
  | { type: "USER_LEFT"; userId: string }
  | {
      type: "EDIT_STARTED";
      ruleId: string;
      userId: string;
      displayName: string;
    }
  | {
      type: "EDIT_CANCELLED";
      ruleId: string;
      userId: string;
      displayName: string;
    }
  | { type: "RULE_SAVED"; ruleId: string; userId: string; displayName: string }
  | { type: "ERROR"; message: string }
  | { type: "ROOM_COUNTS"; counts: Record<string, number> }
  | { type: "RULES_SNAPSHOT"; room: string; rules: Rule[] };

type Handlers = Partial<{
  welcome: (connectionId: string) => void;
  presenceSnapshot: (
    users: Array<{ userId: string; displayName: string }>,
  ) => void;
  rulesSnapshot: (p: { room: string; rules: Rule[] }) => void;
  roomCounts: (counts: Record<string, number>) => void;
  userJoined: (user: { userId: string; displayName: string }) => void;
  userLeft: (userId: string) => void;
  editStarted: (p: {
    ruleId: string;
    userId: string;
    displayName: string;
  }) => void;
  editCancelled: (p: {
    ruleId: string;
    userId: string;
    displayName: string;
  }) => void;
  ruleSaved: (p: {
    ruleId: string;
    userId: string;
    displayName: string;
  }) => void;
  error: (message: string) => void;
}>;

export function createRuleEditorChannel(client: SocketClient) {
  function send(msg: RuleEditorClientToServer) {
    client.send(msg);
  }

  function subscribe(handlers: Handlers): Unsubscribe {
    return client.onMessage((raw) => {
      const msg = raw as RuleEditorServerToClient;

      switch (msg.type) {
        case "WELCOME":
          handlers.welcome?.(msg.connectionId);
          return;
        case "PRESENCE_SNAPSHOT":
          handlers.presenceSnapshot?.(msg.users);
          return;
        case "RULES_SNAPSHOT":
          handlers.rulesSnapshot?.({ room: msg.room, rules: msg.rules });
          return;
        case "USER_JOINED":
          handlers.userJoined?.(msg.user);
          return;
        case "USER_LEFT":
          handlers.userLeft?.(msg.userId);
          return;
        case "EDIT_STARTED":
          handlers.editStarted?.({
            ruleId: msg.ruleId,
            userId: msg.userId,
            displayName: msg.displayName,
          });
          return;
        case "EDIT_CANCELLED":
          handlers.editCancelled?.({
            ruleId: msg.ruleId,
            userId: msg.userId,
            displayName: msg.displayName,
          });
          return;
        case "RULE_SAVED":
          handlers.ruleSaved?.({
            ruleId: msg.ruleId,
            userId: msg.userId,
            displayName: msg.displayName,
          });
          return;
        case "ERROR":
          handlers.error?.(msg.message);
          return;
        case "ROOM_COUNTS":
          handlers.roomCounts?.(msg.counts);
          return;

        default:
          return;
      }
    });
  }

  return {
    hello: (p: { userId: string; displayName: string; room: string }) =>
      send({ type: "HELLO", ...p }),
    startEdit: (ruleId: string) => send({ type: "START_EDIT", ruleId }),
    cancelEdit: (ruleId: string) => send({ type: "CANCEL_EDIT", ruleId }),
    saveRule: (ruleId: string) => send({ type: "SAVE_RULE", ruleId }),
    subscribe,
  };
}
