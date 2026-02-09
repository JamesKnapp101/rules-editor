import { getSocketClient } from "../socket/getSocketClient";
import { createRuleEditorChannel } from "../channels/ruleEditorChannel";
import { useSession } from "./useSession";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useRuleEditorSocket(params: {
  url: string;
  userId: string;
  displayName: string;
  room: string;
}) {
  const { url, userId, displayName, room } = params;
  const { status, connectionId, sessionReady } = useSession({
    url,
    userId,
    displayName,
    room,
  });
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<
    Array<{ userId: string; displayName: string }>
  >([]);
  const [feed, setFeed] = useState<string[]>([]);
  const usersRef = useRef(users);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const log = useCallback((line: string) => {
    setFeed((prev) => [line, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const client = getSocketClient(url);
    const channel = createRuleEditorChannel(client);

    const unsubMessages = channel.subscribe({
      presenceSnapshot: (snapshot) => setUsers(snapshot),
      roomCounts: (counts) => setRoomCounts(counts),

      userJoined: (user) => {
        setUsers((prev) =>
          prev.some((u) => u.userId === user.userId) ? prev : [...prev, user],
        );
        log(`${user.displayName} joined ${room}`);
      },

      userLeft: (leftUserId) => {
        const leaving = usersRef.current.find((u) => u.userId === leftUserId);
        log(`${leaving?.displayName ?? "A user"} left ${room}.`);
        setUsers((prev) => prev.filter((u) => u.userId !== leftUserId));
      },

      editStarted: ({ ruleId, displayName }) =>
        log(`${displayName} started editing ${ruleId}`),
      editCancelled: ({ ruleId, displayName }) =>
        log(`${displayName} cancelled editing ${ruleId}`),
      ruleSaved: ({ ruleId, displayName }) =>
        log(`${displayName} saved ${ruleId}`),

      error: (message) => log(`Server error: ${message}`),
    });

    return () => unsubMessages();
  }, [url, room, log]);

  // Expose channel commands (transport is shared)
  const client = useMemo(() => getSocketClient(url), [url]);
  const channel = useMemo(() => createRuleEditorChannel(client), [client]);

  return {
    status,
    connectionId,
    users,
    feed,
    roomCounts,
    startEdit: (ruleId: string) => {
      if (!sessionReady) return;
      channel.startEdit(ruleId);
    },
    cancelEdit: (ruleId: string) => {
      if (!sessionReady) return;
      channel.cancelEdit(ruleId);
    },
    saveRule: (ruleId: string) => {
      if (!sessionReady) return;
      channel.saveRule(ruleId);
    },
  };
}
