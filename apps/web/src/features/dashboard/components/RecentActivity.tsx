"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight } from "lucide-react";
import type { CourseSlug, SkillMastery, Verdict } from "@ai-tutor/types";
import { getMastery, getSkillMastery } from "@/lib/api/learning";
import { VERDICT_TEXT } from "@/lib/verdicts";

const SHOWN = 4;
type Item = { skill: string; dimension: string; label: string; before: number; after: number; at: string };
const lastEvidence = (s: SkillMastery) => [s.reading.lastEvidenceAt, s.writing.lastEvidenceAt].filter(Boolean).sort().at(-1) ?? "";

/** The latest graded evidence: each line is one change to a reading or writing score. GET /mastery lists the
 *  scores only, so the history is read for the few skills practised most recently. */
export default function RecentActivity({ courseSlug, onViewAll }: { courseSlug: CourseSlug; onViewAll: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let active = true;
    getMastery(courseSlug)
      .then(({ skills }) => Promise.all(skills.filter(lastEvidence).sort((a, b) => lastEvidence(b).localeCompare(lastEvidence(a))).slice(0, SHOWN).map((s) => getSkillMastery(s.skill.id))))
      .then((skills) => {
        const all = skills.flatMap((s) => (s.history ?? []).map((h) => ({
          skill: s.skill.name, dimension: h.dimension, before: h.scoreBefore, after: h.scoreAfter, at: h.createdAt,
          label: h.verdict === null ? "Placement test" : (VERDICT_TEXT[h.verdict as Verdict] ?? h.verdict),
        })));
        if (active) setItems(all.sort((a, b) => b.at.localeCompare(a.at)).slice(0, SHOWN));
      })
      .catch(() => { if (active) setItems([]); });
    return () => { active = false; };
  }, [courseSlug]);

  return <article className="rounded-3xl border border-blue-400/20 bg-[linear-gradient(135deg,rgba(17,31,68,.95),rgba(25,24,67,.97))] p-5 shadow-lg sm:p-6">
    <header className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Activity className="text-violet-300" size={22}/><h2 className="text-lg font-bold">Recent Activity</h2></div><button onClick={onViewAll} className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/20 px-3 py-2 text-sm">View all <ArrowRight size={16}/></button></header>
    {items?.length ? <ul className="space-y-2">{items.map((item) => <li key={`${item.at}-${item.skill}-${item.dimension}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-300/10 bg-indigo-400/5 px-4 py-3 text-sm"><span className="min-w-0"><span className="block font-semibold">{item.skill}</span><span className="block text-xs text-indigo-200/80"><span className="capitalize">{item.dimension}</span> · {item.label}</span></span><span className="text-xs text-indigo-100">{Math.floor(item.before * 100)}% → {Math.floor(item.after * 100)}%</span></li>)}</ul>
      : <div className="flex min-h-28 items-center justify-center rounded-xl border border-indigo-300/10 bg-indigo-400/5 px-4 py-5 text-center"><p className="max-w-sm text-sm leading-6 text-indigo-200/80">{items === null ? "Loading your activity…" : "Your graded attempts will appear here once you start practising."}</p></div>}
  </article>;
}
