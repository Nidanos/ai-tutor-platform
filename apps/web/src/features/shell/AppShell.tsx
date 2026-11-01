"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
  return <div className="app-background min-h-screen text-white"><div className="mx-auto flex min-h-screen max-w-[1920px] flex-col gap-4 p-3 sm:p-4 lg:flex-row"><Sidebar/><div className="flex min-w-0 flex-1 flex-col gap-5"><TopBar/><main className="min-w-0 flex-1 px-1 pb-5 sm:px-2">{children}</main></div></div></div>;
}
