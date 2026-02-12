import http from "node:http";
import crypto from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import type { ClientToServer, Conn, Rule, ServerToClient } from "./types.js";
import { MOCK_ADMIN_RULES } from "./mocks/mockAdminRules.js";
import { MOCK_BILLING_RULES } from "./mocks/mockBillingRules.js";
import { MOCK_CLINICAL_RULES } from "./mocks/mockClinicalRules.js";

const rulesByRoom: Record<string, Rule[]> = {
  general: MOCK_ADMIN_RULES,
  billing: MOCK_BILLING_RULES,
  clinical: MOCK_CLINICAL_RULES,
};

function requireIdentity(
  conn: Conn,
  ws: WebSocket,
): conn is Conn & { userId: string; displayName: string } {
  if (!conn.userId || !conn.displayName) {
    send(ws, { type: "ERROR", message: "Send HELLO first" });
    return false;
  }
  return true;
}

function requireRoom(
  conn: Conn,
  ws: WebSocket,
): conn is Conn & { room: string; userId: string; displayName: string } {
  if (!requireIdentity(conn, ws)) return false;
  if (!conn.room) {
    send(ws, { type: "ERROR", message: "Subscribe to a room first" });
    return false;
  }
  return true;
}

const PORT = 5176;

const server = http.createServer();
const wss = new WebSocketServer({ server });

const conns = new Map<WebSocket, Conn>();

function id() {
  return crypto.randomUUID();
}

function send(ws: WebSocket, msg: ServerToClient) {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    // ignore send errors (e.g. if the connection is closing)
  }
}

function broadcast(room: string, msg: ServerToClient) {
  for (const c of conns.values()) {
    if (c.room === room && c.ws.readyState === WebSocket.OPEN) {
      send(c.ws, msg);
    }
  }
}

function broadcastExcept(
  room: string,
  exceptWs: WebSocket,
  msg: ServerToClient,
) {
  for (const c of conns.values()) {
    if (c.ws === exceptWs) continue;
    if (c.room === room && c.ws.readyState === WebSocket.OPEN) {
      send(c.ws, msg);
    }
  }
}

function roomUsers(room: string) {
  const users: Array<{ userId: string; displayName: string }> = [];
  for (const c of conns.values()) {
    if (c.room === room && c.userId && c.displayName) {
      users.push({ userId: c.userId, displayName: c.displayName });
    }
  }

  const seen = new Set<string>();
  return users.filter((u) =>
    seen.has(u.userId) ? false : (seen.add(u.userId), true),
  );
}

function broadcastAll(msg: ServerToClient) {
  for (const c of conns.values()) {
    if (c.ws.readyState === WebSocket.OPEN) send(c.ws, msg);
  }
}

function roomCounts() {
  const counts: Record<string, number> = {};
  const seenByRoom = new Map<string, Set<string>>();

  for (const c of conns.values()) {
    if (!c.room || !c.userId) continue;
    let set = seenByRoom.get(c.room);
    if (!set) {
      set = new Set<string>();
      seenByRoom.set(c.room, set);
    }
    set.add(c.userId);
  }

  for (const [room, set] of seenByRoom.entries()) {
    counts[room] = set.size;
  }

  return counts;
}

function emitRoomCounts() {
  broadcastAll({ type: "ROOM_COUNTS", counts: roomCounts() });
}

wss.on("connection", (ws) => {
  const connectionId = id();
  const conn: Conn = { ws, connectionId };
  conns.set(ws, conn);

  send(ws, { type: "WELCOME", connectionId });

  ws.on("message", (raw) => {
    let msg: ClientToServer;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "ERROR", message: "Invalid JSON" });
      return;
    }

    if (msg.type === "HELLO") {
      conn.userId = msg.userId;
      conn.displayName = msg.displayName;

      emitRoomCounts();
      return;
    }

    if (msg.type === "SUBSCRIBE") {
      if (!requireIdentity(conn, ws)) return;

      const nextRoom = msg.room;
      const prevRoom = conn.room;

      if (prevRoom === nextRoom) {
        send(ws, { type: "SUBSCRIBED", room: nextRoom });
        send(ws, { type: "PRESENCE_SNAPSHOT", users: roomUsers(nextRoom) });
        send(ws, {
          type: "RULES_SNAPSHOT",
          room: nextRoom,
          rules: rulesByRoom[nextRoom] ?? [],
        });
        return;
      }

      if (prevRoom && conn.userId) {
        broadcastExcept(prevRoom, ws, {
          type: "USER_LEFT",
          userId: conn.userId,
        });
      }

      conn.room = nextRoom;

      send(ws, { type: "SUBSCRIBED", room: nextRoom });
      send(ws, { type: "PRESENCE_SNAPSHOT", users: roomUsers(nextRoom) });
      send(ws, {
        type: "RULES_SNAPSHOT",
        room: nextRoom,
        rules: rulesByRoom[nextRoom] ?? [],
      });

      broadcastExcept(nextRoom, ws, {
        type: "USER_JOINED",
        user: { userId: conn.userId, displayName: conn.displayName },
      });

      emitRoomCounts();
      return;
    }

    if (msg.type === "UNSUBSCRIBE") {
      if (!requireIdentity(conn, ws)) return;

      if (conn.room !== msg.room) {
        send(ws, { type: "ERROR", message: "Not subscribed to that room" });
        return;
      }

      const prevRoom = conn.room;
      conn.room = undefined;

      broadcastExcept(prevRoom, ws, { type: "USER_LEFT", userId: conn.userId });
      send(ws, { type: "UNSUBSCRIBED", room: prevRoom });

      emitRoomCounts();
      return;
    }

    if (!requireRoom(conn, ws)) return;

    switch (msg.type) {
      case "START_EDIT":
        broadcast(conn.room, {
          type: "EDIT_STARTED",
          ruleId: msg.ruleId,
          userId: conn.userId,
          displayName: conn.displayName,
        });
        return;

      case "CANCEL_EDIT":
        broadcast(conn.room, {
          type: "EDIT_CANCELLED",
          ruleId: msg.ruleId,
          userId: conn.userId,
          displayName: conn.displayName,
        });
        return;

      case "SAVE_RULE": {
        const list = rulesByRoom[conn.room] ?? [];
        const idx = list.findIndex((r) => r.id === msg.ruleId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], summary: `${list[idx].summary} (saved)` };
        }
        broadcast(conn.room, {
          type: "RULE_SAVED",
          ruleId: msg.ruleId,
          userId: conn.userId,
          displayName: conn.displayName,
        });
        return;
      }

      case "NOTIF_PUSH": {
        const notif = {
          id: id(),
          text: msg.text,
          fromUserId: conn.userId,
          fromDisplayName: conn.displayName,
          ts: Date.now(),
        };

        broadcast(conn.room, { type: "NOTIF_PUSHED", notif });
        return;
      }

      case "NOTIF_READ": {
        broadcast(conn.room, {
          type: "NOTIF_READ",
          notifId: msg.notifId,
          byUserId: conn.userId,
          byDisplayName: conn.displayName,
        });
        return;
      }

      default:
        send(ws, { type: "ERROR", message: "Unknown message type" });
    }
  });

  ws.on("close", () => {
    const c = conns.get(ws);
    conns.delete(ws);

    if (c?.room && c.userId) {
      broadcast(c.room, { type: "USER_LEFT", userId: c.userId });
    }

    emitRoomCounts();
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});
