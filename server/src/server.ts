import https from "node:https";
import fs from "node:fs";

import { WebSocketServer, WebSocket } from "ws";

type ClientToServer =
  | { type: "HELLO"; userId: string; displayName: string; room: string }
  | { type: "START_EDIT"; ruleId: string }
  | { type: "CANCEL_EDIT"; ruleId: string }
  | { type: "SAVE_RULE"; ruleId: string };

type ServerToClient =
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
  | { type: "ERROR"; message: string };

type Conn = {
  ws: WebSocket;
  connectionId: string;
  room?: string;
  userId?: string;
  displayName?: string;
};

const server = https.createServer();
const wss = new WebSocketServer({ server });

const conns = new Map<WebSocket, Conn>();

function id() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function send(ws: WebSocket, msg: ServerToClient) {
  ws.send(JSON.stringify(msg));
}

function broadcast(room: string, msg: ServerToClient) {
  for (const c of conns.values()) {
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
  // de-dupe by userId in case of weirdness
  const seen = new Set<string>();
  return users.filter((u) =>
    seen.has(u.userId) ? false : (seen.add(u.userId), true),
  );
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
      conn.room = msg.room;

      // snapshot to the new user
      send(ws, { type: "PRESENCE_SNAPSHOT", users: roomUsers(msg.room) });

      // announce join to others (and also ok if they see themselves join)
      broadcast(msg.room, {
        type: "USER_JOINED",
        user: { userId: msg.userId, displayName: msg.displayName },
      });
      return;
    }

    // require HELLO before other actions
    if (!conn.room || !conn.userId || !conn.displayName) {
      send(ws, { type: "ERROR", message: "Send HELLO first" });
      return;
    }

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

      case "SAVE_RULE":
        broadcast(conn.room, {
          type: "RULE_SAVED",
          ruleId: msg.ruleId,
          userId: conn.userId,
          displayName: conn.displayName,
        });
        return;

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
  });
});

const PORT = 5176;
server.listen(PORT, () => {
  console.log(`WS server listening on http://localhost:${PORT}`);
});
