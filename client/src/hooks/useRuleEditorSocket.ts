import { getSocketClient } from "../socket/getSocketClient";
import { createRuleEditorChannel } from "../channels/ruleEditorChannel";
import { useSession } from "./useSession";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { Rule } from "../schemas/ruleSchemas";

function socketOrigin(url: string) {
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
  users: Array<{ userId: string; displayName: string }>;
  rules: Rule[];
  feed: string[];
  setUsers: React.Dispatch<
    React.SetStateAction<Array<{ userId: string; displayName: string }>>
  >;
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
  setFeed: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const {
    url,
    userId,
    displayName,
    room,
    users,
    rules,
    feed,
    setUsers,
    setRules,
    setFeed,
  } = params;
  const { status, connectionId, sessionReady } = useSession({
    url: socketOrigin(url),
    userId,
    displayName,
    room,
  });

  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const usersRef = useRef(users);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const log = useCallback(
    (line: string) => {
      setFeed((prev) => [line, ...prev].slice(0, 50));
    },
    [setFeed],
  );

  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const baseUrl = useMemo(() => socketOrigin(url), [url]);
  const client = useMemo(() => getSocketClient(baseUrl), [baseUrl]);
  const channel = useMemo(() => createRuleEditorChannel(client), [client]);

  useEffect(() => {
    const unsubMessages = channel.subscribe({
      presenceSnapshot: (snapshot) => setUsers(snapshot),
      roomCounts: (counts) => setRoomCounts(counts),

      rulesSnapshot: ({ room: snapshotRoom, rules }) => {
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
        const leaving = usersRef.current.find((u) => u.userId === leftUserId);
        log(`${leaving?.displayName ?? "A user"} left ${roomRef.current}.`);
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
  }, [channel, log, setUsers, setRules]);

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
