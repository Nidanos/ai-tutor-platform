// FR-M8-04: every generated hint is checked before a learner sees it. Pure, so it is unit-tested.
// Code is compared as overlapping runs of 5 tokens ("fingerprints"). A hint is blocked when it
// carries too many of the fingerprints only the solution has (not the starter, not the learner's
// own code), when it shows more than a fragment of code, or when it gives away a rung-1 output.
const RUN = 5;
const MAX_SHARED = 0.25; // share of the solution's own fingerprints a hint may contain
const MAX_CODE_LINES = 6; // a hint may show a fragment, never a program
const MIN_OUTPUT_CHARS = 4; // shorter outputs ("3") appear in prose by chance

export type FilterContext = { reference: string; starter: string; learnerCode?: string; output?: string };
export type FilterResult = { passed: boolean; shared: number; longestCode: number; givesOutput: boolean };

const TOKEN = /[A-Za-z_]\w*|\d+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\S/g;
const tokens = (code: string) => code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").match(TOKEN) ?? [];
const fingerprints = (text: string) => {
  const t = tokens(text);
  return new Set(Array.from({ length: Math.max(0, t.length - RUN + 1) }, (_, i) => t.slice(i, i + RUN).join(" ")));
};
const codeBlocks = (reply: string) => [...reply.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
const squash = (text: string) => text.replace(/\s+/g, " ").trim();

export function checkHint(reply: string, { reference, starter, learnerCode = "", output }: FilterContext): FilterResult {
  const known = new Set([...fingerprints(starter), ...fingerprints(learnerCode)]);
  const own = [...fingerprints(reference)].filter((f) => !known.has(f));
  const inReply = fingerprints(reply);
  const shared = own.length ? own.filter((f) => inReply.has(f)).length / own.length : 0;
  const longestCode = Math.max(0, ...codeBlocks(reply).map((c) => c.trim().split("\n").length));
  const answer = output ? squash(output) : "";
  const givesOutput = answer.length >= MIN_OUTPUT_CHARS && squash(reply).includes(answer);
  return { passed: shared < MAX_SHARED && longestCode <= MAX_CODE_LINES && !givesOutput, shared, longestCode, givesOutput };
}
