"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import DashboardHome from "@/features/dashboard/components/DashboardHome";

// The (dashboard) layout renders this only for a signed-in user.
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return <DashboardHome user={user!} onLogout={handleLogout} />;
}
