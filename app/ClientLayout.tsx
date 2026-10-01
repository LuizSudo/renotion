"use client";

import Sidebar from "@/components/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <ErrorBoundary>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </ErrorBoundary>
    </div>
  );
}