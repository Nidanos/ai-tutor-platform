"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./AuthProvider";

// Learner screens render only for a signed-in user; anyone else is sent to the login page.
export default function RequireLogin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (user) return children;
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 text-indigo-100">
      {isLoading ? "Checking your session..." : "Redirecting to sign in..."}
    </main>
  );
}
