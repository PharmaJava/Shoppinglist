"use client";

import { useSyncExternalStore } from "react";
import { getPendingCountSnapshot, subscribePendingCount } from "@/lib/sync/pending-store";

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

export function usePendingSync() {
  const pendingCount = useSyncExternalStore(
    subscribePendingCount,
    getPendingCountSnapshot,
    () => 0,
  );
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot,
  );

  return { isOffline: !isOnline, pendingCount };
}
