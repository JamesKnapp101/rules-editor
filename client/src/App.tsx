import { useRuleEditorSocket } from "./hooks/useRuleEditorSocket";
import { NotificationsPanel } from "./components/NotificationsPanel";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import type { Rule } from "./schemas/ruleSchemas";

type RoomId = "general" | "billing" | "clinical";
const ROOMS: Array<{ id: RoomId; label: string }> = [
  { id: "general", label: "General (Admin)" },
  { id: "billing", label: "Billing" },
  { id: "clinical", label: "Clinical" },
];

function formatWhen(
  predicates: Array<{ op: string; field: string; value: any }>,
): string {
  if (!predicates || predicates.length === 0) return "Always";

  return predicates
    .map((p) => {
      switch (p.op) {
        case "=":
        case "!=":
        case "<":
        case "<=":
        case ">":
        case ">=":
          return `${p.field} ${p.op} ${p.value}`;
        case "in":
          return `${p.field} in (${p.value.join(", ")})`;
        case "notIn":
          return `${p.field} not in (${p.value.join(", ")})`;
        case "exists":
          return p.value ? `${p.field} exists` : `${p.field} is empty`;
        case "between":
          return `${p.field} between ${p.value[0]} and ${p.value[1]}`;
        default:
          return "—";
      }
    })
    .join(" AND ");
}

function makeId() {
  return Math.random().toString(16).slice(2);
}

function ConnectScreen(props: { onConnect: (name: string) => void }) {
  const { onConnect } = props;
  const [draftName, setDraftName] = useState("");

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>RuleEditor</h2>

      <label>
        Display name{" "}
        <input
          autoFocus
          style={{ color: "black", backgroundColor: "white" }}
          placeholder="James, Alice, Bob…"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draftName.trim()) {
              onConnect(draftName.trim());
            }
          }}
        />
      </label>

      <p style={{ opacity: 0.7 }}>
        Press Enter to connect. Open this page in multiple tabs and use
        different names.
      </p>
    </div>
  );
}

function RuleEditorScreen(props: { userId: string; displayName: string }) {
  const { userId, displayName } = props;
  const [room, setRoom] = useState<RoomId>("general");
  const [notifUnread, setNotifUnread] = useState(0);
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<
    Array<{ userId: string; displayName: string }>
  >([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [feed, setFeed] = useState<string[]>([]);

  const socket = useRuleEditorSocket({
    url: "ws://localhost:5176",
    userId,
    displayName,
    room,
    users,
    rules,
    feed,
    setUsers,
    setRules,
    setFeed,
  });

  const prevRoomRef = useRef(room);
  useEffect(() => {
    const prev = prevRoomRef.current;
    if (prev !== room) {
      prevRoomRef.current = room;
    }
  }, [room]);

  const [switching, setSwitching] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSwitching(false), 160);
    return () => window.clearTimeout(t);
  }, [room]);

  useEffect(() => {
    const el = feedScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "smooth" });
  }, [socket.feed.length]);

  const roomFadeClass = `roomFade ${switching ? "roomFade--switching" : ""}`;

  return (
    <div className="appShell">
      <div className="appFrame">
        {/* Top bar */}
        <div className="panel">
          <div className="topBar">
            <div className="title">Rule Editor</div>

            <div className="muted">
              Signed in as <b>{displayName}</b>
            </div>

            <div className="statusBadge">
              <span
                className={`statusDot ${
                  socket.status === "connected"
                    ? "statusDot--connected"
                    : socket.status === "connecting"
                      ? "statusDot--connecting"
                      : ""
                }`}
              />
              Status: <b>{socket.status}</b>
            </div>

            <div className="muted">conn: {socket.connectionId ?? "—"}</div>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          {/* Left: Rules */}
          <div className={`panel leftCol ${roomFadeClass}`}>
            <div className="panelHeader">Rules</div>
            <div className="panelBody scroll">
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {socket.rules.map((r) => (
                  <li key={r.id} className="ruleRow">
                    {/* Column: Type */}
                    <div className="ruleType">{r.event}</div>

                    {/* Column: Field */}
                    <div className="ruleField">{r.target.field}</div>

                    {/* Column: Condition */}
                    <div className="ruleCondition">{formatWhen(r.when)}</div>

                    {/* Column: Actions */}
                    <div className="ruleActions">
                      <button
                        className="button buttonPrimary"
                        onClick={() => socket.startEdit(r.id)}
                      >
                        Start edit
                      </button>
                      <button
                        className="button buttonDanger"
                        onClick={() => socket.cancelEdit(r.id)}
                      >
                        Cancel
                      </button>
                      <button
                        className="button"
                        onClick={() => socket.saveRule(r.id)}
                      >
                        Save
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: sidebar stack */}
          <div className="rightCol">
            <div className="panel">
              <div className="panelHeader">Rooms</div>
              <div className="panelBody">
                <ul className="roomList">
                  {ROOMS.map(({ id, label }) => {
                    const count = socket.roomCounts?.[id] ?? null;
                    const active = room === id;

                    return (
                      <li key={id}>
                        <button
                          onClick={() => {
                            setRoom(id);
                            setUsers([]);
                            setRules([]);
                            setFeed([]);
                            setSwitching(true);
                          }}
                          className={`roomButton ${active ? "roomButtonActive" : ""}`}
                        >
                          <div className="roomButtonRow">
                            <div className="roomName">{label}</div>
                            {count !== null && (
                              <div className="roomCountPill">{count}</div>
                            )}
                          </div>
                          {active && (
                            <div className="roomMeta">current room</div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Activity Feed */}
            <div className={`panel ${roomFadeClass}`} style={{ minHeight: 0 }}>
              <div className="panelHeader">Activity Feed</div>
              <div className="panelBody scroll" ref={feedScrollRef}>
                {socket.feed.length === 0 ? (
                  <div className="muted">No events yet.</div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {socket.feed.map((line, idx) => (
                      <li key={idx} className="listLine">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Notifications + badge */}
            <div className={`panel ${roomFadeClass}`} style={{ minHeight: 0 }}>
              <div
                className="panelHeader"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>Notifications</span>

                {notifUnread > 0 && (
                  <span className="pill" title={`${notifUnread} unread`}>
                    {notifUnread}
                  </span>
                )}
              </div>

              <div className="panelBody scroll">
                <NotificationsPanel
                  url="ws://localhost:5176"
                  currentDisplayName={displayName}
                  onUnreadCountChange={setNotifUnread}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar: online */}
        <div className="panel">
          <div className="bottomBar">
            <div style={{ fontWeight: 600 }}>Currently online:</div>
            <div className="onlineList">
              {socket.users.map((u) => (
                <span key={u.userId} className="pill">
                  {u.displayName}
                </span>
              ))}
              {socket.users.length === 0 && <span className="muted">—</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId] = useState(() => makeId());

  if (!displayName) {
    return <ConnectScreen onConnect={setDisplayName} />;
  }

  return <RuleEditorScreen userId={userId} displayName={displayName} />;
}
