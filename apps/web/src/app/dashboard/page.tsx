"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <p className="p-8">Checking your session...</p>;
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">
        Welcome, {user.displayName}!
      </h1>
      <p className="mt-2">Your learning dashboard is ready.</p>

      <button
        type="button"
        onClick={async () => {
            await logout();
            router.replace("/login");
        }}
        className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
            Log out
     </button>
    </main>
  );
}