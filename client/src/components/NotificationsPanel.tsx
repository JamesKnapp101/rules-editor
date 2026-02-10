import * as React from "react";
import { getSocketClient } from "../socket/getSocketClient";
import { createNotificationsChannel } from "../channels/notificationsChannel";
import { useEffect, useMemo, useState } from "react";

type Notif = {
  id: string;
  text: string;
  fromDisplayName: string;
  ts: number;
  readBy: string[];
};

const USER_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#9333ea", // purple
  "#db2777", // pink
  "#ea580c", // orange
  "#0d9488", // teal
  "#4f46e5", // indigo
  "#65a30d", // lime
];

export function getUserColor(name: string): string {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }

  const idx = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[idx];
}

export function NotificationsPanel(props: {
  url: string;
  currentDisplayName: string;
  onUnreadCountChange?: (n: number) => void;
}) {
  const { url, currentDisplayName, onUnreadCountChange } = props;
  const [draft, setDraft] = useState("");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const client = useMemo(() => getSocketClient(url), [url]);
  const channel = useMemo(() => createNotificationsChannel(client), [client]);
  const notifScrollRef = React.useRef<HTMLDivElement | null>(null);

  const unreadCount = notifs.filter((n) => {
    if (n.fromDisplayName === currentDisplayName) return false;
    return !n.readBy.includes(currentDisplayName);
  }).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    const unsub = channel.subscribe({
      pushed: (n) => {
        setNotifs((prev) => [
          {
            id: n.id,
            text: n.text,
            fromDisplayName: n.fromDisplayName,
            ts: n.ts,
            readBy: [],
          },
          ...prev,
        ]);
      },
      read: ({ notifId, byDisplayName }) => {
        setNotifs((prev) =>
          prev.map((n) =>
            n.id !== notifId || n.readBy.includes(byDisplayName)
              ? n
              : { ...n, readBy: [...n.readBy, byDisplayName] },
          ),
        );
      },
    });

    return () => unsub();
  }, [channel]);

  React.useEffect(() => {
    const el = notifScrollRef.current;
    if (!el) return;
    const scroller = el.closest(".panelBody.scroll") as HTMLDivElement | null;
    if (!scroller) return;
    scroller.scrollTo({ top: 0, behavior: "smooth" });
  }, [notifs.length]);

  return (
    <div ref={notifScrollRef}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          value={draft}
          placeholder="Type a notification..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              channel.push(draft.trim());
              setDraft("");
            }
          }}
          style={{ flex: 1 }}
        />
        <button
          className="button buttonPrimary"
          onClick={() => {
            if (!draft.trim()) return;
            channel.push(draft.trim());
            setDraft("");
          }}
        >
          Push
        </button>
      </div>

      {notifs.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No notifications yet.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {notifs.map((n) => (
            <li key={n.id} className="listLine" style={{ marginBottom: 8 }}>
              <div>
                <span
                  className="userTag"
                  style={{
                    ["--userColor" as any]: getUserColor(n.fromDisplayName),
                  }}
                >
                  <span className="userDot" />
                  <span className="userName">{n.fromDisplayName}:</span>
                </span>
                <span className="notifText">{n.text}</span>
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {new Date(n.ts).toLocaleTimeString()}{" "}
                {n.readBy.length > 0 ? `• Read by ${n.readBy.join(", ")}` : ""}
              </div>
              <div style={{ marginTop: 4 }}>
                {n.fromDisplayName !== currentDisplayName &&
                  !n.readBy.includes(currentDisplayName) && (
                    <button
                      className="button"
                      onClick={() => channel.markRead(n.id)}
                    >
                      Mark read
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
