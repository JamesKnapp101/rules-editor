import https from "node:https";
import fs from "node:fs";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "node:crypto";

type ClientToServer =
  | { type: "HELLO"; userId: string; displayName: string; room: string }
  | { type: "START_EDIT"; ruleId: string }
  | { type: "CANCEL_EDIT"; ruleId: string }
  | { type: "SAVE_RULE"; ruleId: string }
  | { type: "NOTIF_PUSH"; text: string }
  | { type: "NOTIF_READ"; notifId: string };

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
  | { type: "ROOM_COUNTS"; counts: Record<string, number> };
type Conn = {
  ws: WebSocket;
  connectionId: string;
  room?: string;
  userId?: string;
  displayName?: string;
};

const server = https.createServer({
  cert: fs.readFileSync("./localhost+2.pem"),
  key: fs.readFileSync("./localhost+2-key.pem"),
});

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
    // ignore; socket is effectively dead
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
  // de-dupe by userId
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

  // count unique users per room (matches your presence semantics)
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
      const prevRoom = conn.room;
      const prevUserId = conn.userId;

      const roomChanged = !!prevRoom && prevRoom !== msg.room;
      const userChanged = !!prevUserId && prevUserId !== msg.userId;

      // If they were previously in a room (or identity), notify old room they left
      if (prevRoom && prevUserId && (roomChanged || userChanged)) {
        broadcastExcept(prevRoom, ws, {
          type: "USER_LEFT",
          userId: prevUserId,
        });
      }

      conn.userId = msg.userId;
      conn.displayName = msg.displayName;
      conn.room = msg.room;

      // snapshot to the (re)joining user
      send(ws, { type: "PRESENCE_SNAPSHOT", users: roomUsers(msg.room) });

      // announce join to others (including self is fine)
      broadcastExcept(msg.room, ws, {
        type: "USER_JOINED",
        user: { userId: msg.userId, displayName: msg.displayName },
      });
      emitRoomCounts();

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

const PORT = 5176;
server.listen(PORT, () => {
  console.log(`WSS server listening on https://localhost:${PORT}`);
});
