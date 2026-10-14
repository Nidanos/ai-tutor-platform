// The prerequisite graph must be acyclic (FR-M2-02). Postgres can't check this, so we do.
// prerequisitesOf maps each skill to the skills it needs. Returns one cycle (a → b → a), or null.
export function findCycle(prerequisitesOf: Map<string, string[]>): string[] | null {
  const state = new Map<string, "visiting" | "done">();

  const visit = (skill: string, path: string[]): string[] | null => {
    if (state.get(skill) === "done") return null;
    if (state.get(skill) === "visiting") return [...path.slice(path.indexOf(skill)), skill];
    state.set(skill, "visiting");
    for (const prerequisite of prerequisitesOf.get(skill) ?? []) {
      const cycle = visit(prerequisite, [...path, skill]);
      if (cycle) return cycle;
    }
    state.set(skill, "done");
    return null;
  };

  for (const skill of prerequisitesOf.keys()) {
    const cycle = visit(skill, []);
    if (cycle) return cycle;
  }
  return null;
}
