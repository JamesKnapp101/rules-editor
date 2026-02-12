import { getSocketClient } from "../socket/getSocketClient";
import type { SocketStatus } from "../socket/types";
import { createSessionChannel } from "../channels/sessionChannel";
import { useEffect, useRef, useState } from "react";

export function useSession(params: {
  url: string;
  userId: string;
  displayName: string;
  room: string;
}) {
  const { url, userId, displayName, room } = params;
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [helloSentKey, setHelloSentKey] = useState<string | null>(null);
  const helloKeyRef = useRef<string | null>(null);
  const subscribedRoomRef = useRef<string | null>(null);
  const desiredHelloKey = `${userId}|${displayName}`;
  const sessionRef = useRef<ReturnType<typeof createSessionChannel> | null>(
    null,
  );

  useEffect(() => {
    const client = getSocketClient(url);
    const session = createSessionChannel(client);
    sessionRef.current = session;

    helloKeyRef.current = null;
    subscribedRoomRef.current = null;

    const unsubStatus = client.onStatus((s) => {
      setStatus(s);

      if (s === "connected") {
        if (helloKeyRef.current !== desiredHelloKey) {
          session.hello({ userId, displayName });
          helloKeyRef.current = desiredHelloKey;
          setHelloSentKey(desiredHelloKey);
        }
      }
    });

    const unsubMsgs = session.subscribe({
      welcome: (id) => setConnectionId(id),
      error: (_msg) => console.log("Error: ", _msg),
    });

    return () => {
      sessionRef.current = null;
      unsubMsgs();
      unsubStatus();
    };
  }, [url, userId, displayName, desiredHelloKey]);

  useEffect(() => {
    if (status !== "connected") return;
    const session = sessionRef.current;
    if (!session) return;

    if (subscribedRoomRef.current === room) return;

    const prev = subscribedRoomRef.current;
    if (prev) session.unsubscribe({ room: prev });

    session.subscribeRoom({ room });
    subscribedRoomRef.current = room;
  }, [room, status]);

  const sessionReady =
    helloSentKey === desiredHelloKey && status === "connected";
  return { status, connectionId, sessionReady };
}
