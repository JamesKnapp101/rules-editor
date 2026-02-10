import { getSocketClient } from "../socket/getSocketClient";
import { createRuleEditorChannel } from "../channels/ruleEditorChannel";
import { useSession } from "./useSession";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { Rule } from "../types";

function socketOrigin(url: string) {
  // Keep the WS client stable even if callers append query params.
  // Room should be part of SUBSCRIBE, not part of the URL.
  const u = new URL(url);
  u.search = "";
  u.hash = "";
  return u.toString();
}

export function useRuleEditorSocket(params: {
  url: string;
  userId: string;
  displayName: string;
  room: string;
}) {
  const { url, userId, displayName, room } = params;

  const { status, connectionId, sessionReady } = useSession({
    url: socketOrigin(url),
    userId,
    displayName,
    room, // session hook can still SUBSCRIBE based on room; just don’t encode it into the URL
  });

  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<
    Array<{ userId: string; displayName: string }>
  >([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [feed, setFeed] = useState<string[]>([]);

  const log = useCallback((line: string) => {
    setFeed((prev) => [line, ...prev].slice(0, 50));
  }, []);

  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const baseUrl = useMemo(() => socketOrigin(url), [url]);

  // IMPORTANT: stable client + channel (don’t recreate per room change)
  const client = useMemo(() => getSocketClient(baseUrl), [baseUrl]);
  const channel = useMemo(() => createRuleEditorChannel(client), [client]);

  // Subscribe once per channel instance.
  useEffect(() => {
    const unsubMessages = channel.subscribe({
      presenceSnapshot: (snapshot) => setUsers(snapshot),
      roomCounts: (counts) => setRoomCounts(counts),

      rulesSnapshot: ({ room: snapshotRoom, rules }) => {
        // Prevent late snapshots from stomping new room’s UI
        if (snapshotRoom !== roomRef.current) return;
        setRules(rules);
      },

      userJoined: (user) => {
        setUsers((prev) =>
          prev.some((u) => u.userId === user.userId) ? prev : [...prev, user],
        );
        log(`${user.displayName} joined ${roomRef.current}`);
      },

      userLeft: (leftUserId) => {
        setUsers((prev) => {
          const leaving = prev.find((u) => u.userId === leftUserId);
          log(`${leaving?.displayName ?? "A user"} left ${roomRef.current}.`);
          return prev.filter((u) => u.userId !== leftUserId);
        });
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
  }, [channel, log]);

  // Optional: clear room-scoped state immediately on room change (prevents “flash”)
  useEffect(() => {
    setUsers([]);
    setRules([]);
    setFeed([]);
  }, [room]);

  return {
    status,
    connectionId,
    users,
    rules,
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
