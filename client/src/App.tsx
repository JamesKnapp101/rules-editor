import { useRuleEditorSocket } from "./hooks/useRuleEditorSocket";
import { NotificationsPanel } from "./components/NotificationsPanel";
import "./App.css";
import { useEffect, useRef, useState } from "react";

const RULES = Array.from({ length: 10 }).map((_, i) => ({
  id: `RULE-${100 + i}`,
  name: `Rule ${100 + i}`,
}));

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
  const [room, setRoom] = useState("general");
  const [notifUnread, setNotifUnread] = useState(0);
  const feedScrollRef = useRef<HTMLDivElement | null>(null);

  const socket = useRuleEditorSocket({
    url: "wss://localhost:5176",
    userId,
    displayName,
    room,
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
    setSwitching(true);
    const t = window.setTimeout(() => setSwitching(false), 160);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            <div>
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
                {RULES.map((r) => (
                  <li key={r.id} className="ruleRow">
                    <div className="listLine">
                      <b>{r.id}</b> — {r.name}
                    </div>
                    <div className="ruleActions">
                      <button onClick={() => socket.startEdit(r.id)}>
                        Start edit
                      </button>
                      <button onClick={() => socket.cancelEdit(r.id)}>
                        Cancel
                      </button>
                      <button onClick={() => socket.saveRule(r.id)}>
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
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {["general", "team-1", "team-2"].map((r) => {
                    const count = socket.roomCounts?.[r] ?? null;

                    return (
                      <li key={r} style={{ marginBottom: 8 }}>
                        <button
                          onClick={() => setRoom(r)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #333",
                            background:
                              room === r
                                ? "rgba(100,108,255,0.15)"
                                : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              gap: 8,
                            }}
                          >
                            <div style={{ fontWeight: 500 }}>{r}</div>

                            {/* Optional count display; shows only when available */}
                            {count !== null && (
                              <div className="muted" style={{ fontSize: 12 }}>
                                {count}
                              </div>
                            )}
                          </div>

                          {room === r && (
                            <div className="muted" style={{ fontSize: 11 }}>
                              current room
                            </div>
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

              <div className="panelBody scroll" ref={feedScrollRef}>
                <NotificationsPanel
                  url="wss://localhost:5176"
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
