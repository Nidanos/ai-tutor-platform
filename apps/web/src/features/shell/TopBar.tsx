"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Search, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getProgress } from "@/lib/api/learning";
import { useActiveCourse } from "./useActiveCourse";

const MAX_RESULTS = 6;

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const course = useActiveCourse();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewsDue, setReviewsDue] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const displayName = user?.displayName ?? "";

  const term = query.trim().toLowerCase();
  const matches = term
    ? course.topics.flatMap((topic) => topic.subtopics.filter((name) => `${topic.name} ${name}`.toLowerCase().includes(term))).slice(0, MAX_RESULTS)
    : [];

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    let active = true;
    getProgress(course.slug).then((value) => { if (active) setReviewsDue(value.summary.review_due); }).catch(() => undefined);
    return () => { active = false; };
  }, [course.slug]);

  function openSkill(name: string) {
    setQuery("");
    router.push(`/learn?skill=${encodeURIComponent(name)}`);
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex min-h-[70px] items-center gap-4 rounded-2xl border border-blue-400/20 bg-[#111c40]/75 px-4 py-3 shadow-lg shadow-blue-950/10 backdrop-blur-xl sm:px-6">
      <div className="relative mx-auto flex min-w-0 flex-1 justify-center">
        <label className="flex w-full max-w-[640px] items-center gap-3 rounded-xl border border-indigo-400/15 bg-gradient-to-r from-blue-950/70 to-indigo-950/60 px-4 py-3 text-indigo-200 focus-within:border-violet-400/50">
          <Search size={21} className="shrink-0 text-indigo-300" />

          <input
            ref={searchRef}
            type="search"
            aria-label="Search skills and topics"
            placeholder="Search skills, topics, or anything..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches[0]) openSkill(matches[0]);
              if (event.key === "Escape") setQuery("");
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-indigo-200/80"
          />

          <kbd className="hidden shrink-0 rounded-md border border-indigo-300/20 px-2 py-1 text-xs text-indigo-200 sm:block">
            Ctrl K
          </kbd>
        </label>

        {term && (
          <ul className="absolute top-full z-30 mt-2 w-full max-w-[640px] overflow-hidden rounded-xl border border-indigo-400/20 bg-[#111c40] shadow-2xl">
            {matches.length ? matches.map((name) => (
              <li key={name}>
                <button type="button" onClick={() => openSkill(name)} className="block w-full px-4 py-3 text-left text-sm text-indigo-100 hover:bg-white/5">{name}</button>
              </li>
            )) : <li className="px-4 py-3 text-sm text-indigo-300">No skills match “{query.trim()}”.</li>}
          </ul>
        )}
      </div>

      <Link
        href="/progress"
        aria-label={reviewsDue ? `Notifications: ${reviewsDue} skills due for review` : "Notifications: nothing due"}
        title={reviewsDue ? `${reviewsDue} skills due for review` : "Nothing due for review"}
        className="relative grid size-10 shrink-0 place-items-center rounded-xl text-indigo-200 transition hover:bg-white/5 hover:text-white"
      >
        <Bell size={24} />
        {reviewsDue > 0 && <span className="absolute right-1 top-1 size-2.5 rounded-full bg-pink-500 ring-2 ring-[#111c40]" />}
      </Link>

      <div className="hidden h-9 w-px bg-white/10 sm:block" />

      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="User menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
          className="flex shrink-0 items-center gap-3 rounded-xl px-1 py-1 text-white hover:bg-white/5"
        >
          <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xl font-semibold shadow-lg shadow-violet-950/30">
            {displayName.charAt(0).toUpperCase()}
          </span>

          <span className="hidden text-sm font-medium sm:block">{displayName}</span>
          <ChevronDown
            size={19}
            className="hidden text-indigo-200 sm:block"
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-indigo-400/20 bg-[#111c40] py-1 shadow-2xl">
            <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-indigo-100 hover:bg-white/5"><UserRound size={16} /> Account</Link>
            <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-indigo-100 hover:bg-white/5"><LogOut size={16} /> Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}
