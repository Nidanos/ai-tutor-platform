import type { ReactNode } from "react";
import AppShell from "@/features/shell/AppShell";

// The sidebar and top bar around every learner screen except the placement test and the study session.
export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
