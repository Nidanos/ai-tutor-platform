import type { ReactNode } from "react";

import RequireLogin from "@/features/auth/RequireLogin";

export default function LearnerLayout({ children }: { children: ReactNode }) {
  return <RequireLogin>{children}</RequireLogin>;
}
