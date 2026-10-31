import type { CourseOption, CourseSlug } from "./types";

/** API guide documents these course slugs; add future subjects here once live. */
export const COURSE_OPTIONS: CourseOption[] = [
  { slug: "cpp-basics", title: "C++ Basics" },
  { slug: "dsa", title: "Data Structures & Algorithms" },
];

/** Isolated until enrollment is exposed by authenticated platform state. */
export const DEFAULT_COURSE: CourseSlug = "cpp-basics";
export const DEFAULT_LANGUAGE = "cpp" as const;
