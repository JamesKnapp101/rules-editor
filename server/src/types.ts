import type { WebSocket } from "ws";

export type Rule = {
  id: string;
  event: RuleEvent;
  target: { field: string };
  when: Predicate[];
  action:
    | { kind: "setVisibility"; visible: boolean }
    | { kind: "setEnabled"; enabled: boolean }
    | { kind: "setRequired"; required: boolean }
    | {
        kind: "validate";
        validator: "dateOrder" | "range" | "requiredIf";
        params: Record<string, unknown>;
      }
    | { kind: "updateOptions"; mode: "add" | "remove"; options: string[] };
  summary?: string;
};

type RuleEvent =
  | "Hide Field"
  | "Disable Field"
  | "Make Required"
  | "Validation"
  | "AddOptions"
  | "RemoveOptions";

type Predicate =
  | {
      field: string;
      op: "=" | "!=" | "<" | "<=" | ">" | ">=";
      value: string | number | boolean;
    }
  | { field: string; op: "in" | "notIn"; value: Array<string | number> }
  | { field: string; op: "exists"; value: boolean }
  | { field: string; op: "between"; value: [number, number] };

export type ClientToServer =
  | { type: "HELLO"; userId: string; displayName: string }
  | { type: "SUBSCRIBE"; room: string }
  | { type: "UNSUBSCRIBE"; room: string }
  | { type: "START_EDIT"; ruleId: string }
  | { type: "CANCEL_EDIT"; ruleId: string }
  | { type: "SAVE_RULE"; ruleId: string }
  | { type: "NOTIF_PUSH"; text: string }
  | { type: "NOTIF_READ"; notifId: string };

export type ServerToClient =
  | { type: "WELCOME"; connectionId: string }
  | { type: "SUBSCRIBED"; room: string }
  | { type: "UNSUBSCRIBED"; room: string }
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
    }
  | { type: "ROOM_COUNTS"; counts: Record<string, number> }
  | { type: "RULES_SNAPSHOT"; room: string; rules: Rule[] };

export type Conn = {
  ws: WebSocket;
  connectionId: string;
  room?: string;
  userId?: string;
  displayName?: string;
};
