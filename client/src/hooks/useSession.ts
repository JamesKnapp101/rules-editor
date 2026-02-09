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

  // Prevent duplicate HELLO/logging across StrictMode/effect reruns
  const helloKeyRef = useRef<string | null>(null);

  const desiredHelloKey = `${userId}|${displayName}|${room}`;

  useEffect(() => {
    const client = getSocketClient(url);
    const session = createSessionChannel(client);

    // important: reset per mount / identity change
    helloKeyRef.current = null;

    const unsubStatus = client.onStatus((s) => {
      setStatus(s);

      if (s === "connected") {
        if (helloKeyRef.current !== desiredHelloKey) {
          session.hello({ userId, displayName, room });
          helloKeyRef.current = desiredHelloKey;
          setHelloSentKey(desiredHelloKey);
        }
      }
    });

    const unsubMsgs = session.subscribe({
      welcome: (id) => setConnectionId(id),
      error: (_msg) => {
        // Bubble it up in a toast at some point
        console.log("Error: ", _msg);
      },
    });

    return () => {
      unsubMsgs();
      unsubStatus();
    };
  }, [url, userId, displayName, room, desiredHelloKey]);

  const sessionReady =
    helloSentKey === desiredHelloKey && status === "connected";

  return { status, connectionId, sessionReady };
}
