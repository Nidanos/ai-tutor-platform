"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import DashboardHome from "@/components/dashboard/DashboardHome";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <p className="p-8 text-sm text-slate-500">Checking your session…</p>;
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return <DashboardHome user={user} onLogout={handleLogout} />;
}
