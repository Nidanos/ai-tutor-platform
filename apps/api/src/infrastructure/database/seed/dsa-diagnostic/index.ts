// The DSA placement test: a reading item and a code task for each of the 49 skills (ADR-0012), one file per group.
import { algorithmDesign } from "./algorithm-design.js";
import { foundationsSorting } from "./foundations-sorting.js";
import { graphs } from "./graphs.js";
import { weightedGraphs } from "./graphs-weighted.js";
import { linearStructures } from "./linear-structures.js";
import { techniques } from "./techniques.js";
import { trees } from "./trees.js";

export const dsaDiagnostic = [...foundationsSorting, ...techniques, ...linearStructures, ...trees, ...graphs, ...weightedGraphs, ...algorithmDesign];
