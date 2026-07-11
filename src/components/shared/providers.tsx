"use client";

import type { ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ToastProvider } from "./toast-provider";
import FirestoreProvider from "./firestore-provider";
import SyncStatus from "./sync-status";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <ToastProvider>
        <FirestoreProvider>
          {children}
          <SyncStatus />
        </FirestoreProvider>
      </ToastProvider>
    </SerwistProvider>
  );
}
