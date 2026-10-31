"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import DeleteSection from "./DeleteSection";
import PrivacySection from "./PrivacySection";
import ProfileSection from "./ProfileSection";

// The (dashboard) layout renders this only for a signed-in user.
export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Account</h1>
            <p className="mt-1 text-sm text-slate-400">Your profile, your privacy choices and your data.</p>
          </div>
          <button type="button" onClick={() => void handleLogout()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
            <LogOut size={16} /> Log out
          </button>
        </header>
        <section className="grid gap-5 lg:grid-cols-2">
          <ProfileSection user={user!} />
          <PrivacySection />
        </section>
        <DeleteSection timezone={user!.timezone} />
      </main>
    </div>
  );
}
