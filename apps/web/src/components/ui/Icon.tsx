import type { ReactNode } from "react"

export type IconName =
  | "sparkle" | "home" | "book" | "code" | "chart" | "user"
  | "search" | "bell" | "chevron" | "arrow" | "bolt" | "check" | "quote"

const paths: Record<IconName, ReactNode> = {
  sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8"/></>,
  code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,
  chart: <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-8h4v8"/><path d="M3 20h18"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  chevron: <path d="m7 10 5 5 5-5"/>,
  arrow: <><path d="M4 12h15M13 6l6 6-6 6"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  quote: <path d="M7 17H4l2-6h4v6Zm9 0h-3l2-6h4v6Z"/>,
}

export function Icon({ name, size = 20, className = "" }: {
  name: IconName; size?: number; className?: string
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg>
}
