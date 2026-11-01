"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import SidebarNav from "./SidebarNav";
import SidebarFooter from "./SidebarFooter";

// Below lg the sidebar folds into its top row, and the menu button opens the links.
export default function Sidebar() {
  const [open, setOpen] = useState(false);
  return <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-b from-[#13234a] via-[#122044] to-[#101a37] lg:sticky lg:top-3 lg:h-[calc(100vh-1.5rem)] lg:w-[268px]">
    <div className="flex items-center gap-3 border-b border-white/[.07] px-5 py-4 lg:py-5"><span className="grid size-12 place-items-center rounded-xl bg-white text-violet-600"><Icon name="sparkle" size={25}/></span><span className="flex-1"><strong className="block text-lg font-bold">AI Tutor</strong><small className="text-xs text-indigo-200/75">Learn. Build. Go Further.</small></span>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-navigation" aria-label={open ? "Close menu" : "Open menu"} className="grid size-11 place-items-center rounded-xl text-indigo-100 hover:bg-white/5 lg:hidden">{open ? <X size={24}/> : <Menu size={24}/>}</button>
    </div>
    <div className={`${open ? "flex" : "hidden"} flex-1 flex-col lg:flex`}><SidebarNav onNavigate={() => setOpen(false)}/><SidebarFooter/></div>
  </aside>;
}
