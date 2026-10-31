import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

function LandingNavbar() {
  return (
    <header className="relative z-20 mx-auto mt-5 w-[95%] max-w-7xl">
      <nav className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/15 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-6">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">

          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm">
            <Sparkles size={22} fill="currentColor" />
          </span>

          <span className="flex flex-col">
            <span className="text-base font-bold leading-tight text-white">
              AI Tutor
            </span>

            <span className="text-[9px] leading-tight text-white/70">
              Learn. Build. Go Further.
            </span>
          </span>

        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-white/90 transition hover:text-white"
          >
            Features
          </a>
        </div>

        {/* Authentication Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-950/50 sm:px-5 sm:text-sm"
          >
            Log In
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-950/20 transition hover:bg-blue-400 sm:px-5 sm:text-sm"
          >
            Get Started
            <ArrowUpRight size={15} />
          </Link>

        </div>

      </nav>
    </header>
  );
}

export default LandingNavbar;