"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useActiveCourse } from "./useActiveCourse";

const links: Array<{ label: string; icon: IconName; href: string }> = [
  { label: "Home", icon: "home", href: "/dashboard" }, { label: "Learning", icon: "book", href: "/learn" },
  { label: "Practice", icon: "code", href: "/practice" }, { label: "Progress", icon: "chart", href: "/progress" },
  { label: "Account", icon: "user", href: "/account" },
];

export default function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const course = useActiveCourse();
  return <nav id="main-navigation" aria-label="Main navigation" className="flex flex-col gap-1.5 px-2.5 py-4">{links.map((item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-[54px] w-full items-center gap-3 rounded-xl border px-3.5 text-left transition ${active ? "border-blue-400/35 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white" : "border-transparent text-indigo-100/80 hover:bg-white/[.045] hover:text-white"}`}>
      <Icon name={item.icon} size={23}/><span className="truncate text-sm font-medium">{item.href === "/learn" ? `${course.title} Learning` : item.label}</span>
    </Link>;
  })}</nav>;
}
