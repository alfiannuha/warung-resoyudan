"use client";

import { useEffect, useState, useRef } from "react";
import { onSnapshotsInSync } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SyncStatus = "synced" | "pending" | "offline";

export default function SyncStatus() {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [pendingCount, setPendingCount] = useState(0);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onSnapshotsInSync(db, () => {
      setStatus("synced");
      setPendingCount(0);
    });

    unsubRef.current = unsub;

    // Listen for online/offline events
    const handleOnline = () => setStatus("synced");
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubRef.current = null;
    };
  }, []);

  // Listen to pending writes via polling (Firestore SDK doesn't expose this directly)
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine === false) {
        setStatus("offline");
        return;
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (status === "synced" && pendingCount === 0) return null;

  const icon = status === "offline" ? "🔴" : "🟡";
  const label =
    status === "offline"
      ? "Offline"
      : pendingCount > 0
        ? `Menyinkronkan...`
        : "Offline";

  return (
    <div
      className={`fixed bottom-4 left-4 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full text-label-md shadow-lg transition-all ${
        status === "offline"
          ? "bg-danger-alert text-white"
          : "bg-warning-debt text-white"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
