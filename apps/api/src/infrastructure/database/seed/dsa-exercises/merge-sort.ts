import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

const MERGE_TWO = `std::vector<int> mergeTwo(const std::vector<int>& a, const std::vector<int>& b) {
    std::vector<int> out;
    std::size_t i = 0, j = 0;
    while (i < a.size() || j < b.size())
        out.push_back(j == b.size() || (i < a.size() && a[i] <= b[j]) ? a[i++] : b[j++]);
    return out;
}`;

// k sorted lists of the same length, each from its own seed.
const LISTS = String.raw`
namespace gen {
std::vector<std::vector<int>> sortedLists(std::uint64_t seed, int k, int len, int lo, int hi) {
    std::vector<std::vector<int>> lists;
    for (int i = 0; i < k; i++) lists.push_back(sortedInts(seed * 1000003 + i, len, lo, hi));
    return lists;
}
}  // namespace gen
`;

const INSERTION_SORT = `#include <vector>

std::vector<int> mergeSort(std::vector<int> v) {
    for (std::size_t i = 1; i < v.size(); i++)
        for (std::size_t j = i; j > 0 && v[j - 1] > v[j]; j--) {
            int t = v[j];
            v[j] = v[j - 1];
            v[j - 1] = t;
        }
    return v;
}
`;

export const mergeSort: ExerciseTemplate[] = [
  predict(
    "merge-sort",
    "What does it print? The order of the merges",
    `#include <iostream>
#include <vector>

std::vector<int> v = {5, 2, 4, 1};

void sortRange(int lo, int hi) {  // sorts v[lo..hi)
    if (hi - lo < 2) return;
    int mid = (lo + hi) / 2;
    sortRange(lo, mid);
    sortRange(mid, hi);
    std::vector<int> merged;
    int i = lo, j = mid;
    while (i < mid || j < hi) merged.push_back(j == hi || (i < mid && v[i] <= v[j]) ? v[i++] : v[j++]);
    for (int k = 0; k < (int)merged.size(); k++) v[lo + k] = merged[k];
    std::cout << lo << "-" << hi << ":";
    for (int x : merged) std::cout << " " << x;
    std::cout << "\\n";
}

int main() { sortRange(0, 4); }
`,
    "0-2: 2 5\n2-4: 1 4\n0-4: 1 2 4 5",
  ),
  {
    skill: "merge-sort",
    rung: 2,
    title: "Fix the merge that loses values",
    promptMd: `\`mergeSorted(a, b)\` should merge two sorted lists into one sorted list containing every value of both. For \`{1, 4, 9}\` and \`{2, 3, 10, 12}\` it returns \`1 2 3 4 9\`: some values go missing. **Find the fault and fix it.**`,
    functionSignature: "std::vector<int> mergeSorted(const std::vector<int>& a, const std::vector<int>& b)",
    call: showCall("mergeSorted"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> mergeSorted(const std::vector<int>& a, const std::vector<int>& b) {
    std::vector<int> out;
    std::size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) out.push_back(a[i++]);
        else out.push_back(b[j++]);
    }
    while (i < a.size()) out.push_back(a[i++]);
    return out;
}
`,
    reference: `#include <vector>

std::vector<int> mergeSorted(const std::vector<int>& a, const std::vector<int>& b) {
    std::vector<int> out;
    std::size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) out.push_back(a[i++]);
        else out.push_back(b[j++]);
    }
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);  // whatever is left of b
    return out;
}
`,
    cases: [
      { args: "{1, 4, 9}, {2, 3, 10, 12}", expected: "1 2 3 4 9 10 12" },
      { args: "{}, {5, 6}", expected: "5 6" },
      { args: "{7, 8}, {}", expected: "7 8" },
      { args: "{2, 2}, {1, 2, 3}", expected: "1 2 2 2 3" },
      { args: "{-3, 0}, {-5, 1}", expected: "-5 -3 0 1" },
    ],
  },
  {
    skill: "merge-sort",
    rung: 3,
    title: "Complete merge sort's recursion",
    promptMd: `\`mergeSort(v)\` returns v sorted, smallest first. \`sortRange\` sorts the range [lo, hi) of v: it merges the two halves through the scratch list \`buf\`. But it merges them **before sorting them**, so the result isn't sorted. **Complete the missing step.** ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> mergeSort(std::vector<int> v)",
    call: showCall("mergeSort"),
    generator: GEN,
    starterCode: `#include <vector>

void sortRange(std::vector<int>& v, std::vector<int>& buf, std::size_t lo, std::size_t hi) {
    if (hi - lo < 2) return;
    std::size_t mid = lo + (hi - lo) / 2;
    // TODO: sort both halves first
    std::size_t i = lo, j = mid, k = lo;
    while (i < mid || j < hi) buf[k++] = (j == hi || (i < mid && v[i] <= v[j])) ? v[i++] : v[j++];
    for (k = lo; k < hi; k++) v[k] = buf[k];
}

std::vector<int> mergeSort(std::vector<int> v) {
    std::vector<int> buf(v.size());
    sortRange(v, buf, 0, v.size());
    return v;
}
`,
    reference: `#include <vector>

void sortRange(std::vector<int>& v, std::vector<int>& buf, std::size_t lo, std::size_t hi) {
    if (hi - lo < 2) return;
    std::size_t mid = lo + (hi - lo) / 2;
    sortRange(v, buf, lo, mid);
    sortRange(v, buf, mid, hi);
    std::size_t i = lo, j = mid, k = lo;
    while (i < mid || j < hi) buf[k++] = (j == hi || (i < mid && v[i] <= v[j])) ? v[i++] : v[j++];
    for (k = lo; k < hi; k++) v[k] = buf[k];
}

std::vector<int> mergeSort(std::vector<int> v) {
    std::vector<int> buf(v.size());
    sortRange(v, buf, 0, v.size());
    return v;
}
`,
    bruteForce: INSERTION_SORT,
    cases: [
      { args: "{5, 2, 4, 1, 3}", expected: "1 2 3 4 5" },
      { args: "{}", expected: "" },
      { args: "{7}", expected: "7" },
      { args: "{3, 3, 1, 2}", expected: "1 2 3 3" },
      { args: "{-4, 10, -4, 0}", expected: "-4 -4 0 10" },
      { args: "gen::ints(31, 2000, -1000000000, 1000000000)" },
      { args: "gen::ints(32, 1000000, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "merge-sort",
    rung: 4,
    title: "Extend two-way merging to many lists",
    promptMd: `\`mergeTwo\` merges two sorted lists and works. \`mergeAll(lists)\` should merge **any number** of sorted lists into one sorted list, but so far it only merges the first two. **Extend it.** Merging the lists one after another is too slow when there are many short lists, because the early values are copied again and again; merge them in halves, as merge sort does. ${limits("up to 20,000 lists and 1,000,000 values in all")}`,
    functionSignature: "std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists)",
    call: showCall("mergeAll"),
    generator: GEN + LISTS,
    starterCode: `#include <vector>

${MERGE_TWO}

std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists) {
    if (lists.size() < 2) return lists.empty() ? std::vector<int>{} : lists[0];
    return mergeTwo(lists[0], lists[1]);  // only the first two so far
}
`,
    reference: `#include <vector>

${MERGE_TWO}

// Like merge sort: merge each half of the lists, then the two results. Every value is copied about log k times.
std::vector<int> mergeRange(const std::vector<std::vector<int>>& lists, std::size_t lo, std::size_t hi) {
    if (hi == lo) return {};
    if (hi - lo == 1) return lists[lo];
    std::size_t mid = lo + (hi - lo) / 2;
    return mergeTwo(mergeRange(lists, lo, mid), mergeRange(lists, mid, hi));
}

std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists) { return mergeRange(lists, 0, lists.size()); }
`,
    bruteForce: `#include <vector>

${MERGE_TWO}

std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists) {
    std::vector<int> all;
    for (const auto& list : lists) all = mergeTwo(all, list);  // one after another
    return all;
}
`,
    cases: [
      { args: "{{1, 5, 9}, {2, 6}, {3, 4, 10}}", expected: "1 2 3 4 5 6 9 10" },
      { args: "{}", expected: "" },
      { args: "{{7}}", expected: "7" },
      { args: "{{}, {1, 2}, {}}", expected: "1 2" },
      { args: "{{1, 1}, {1}, {0, 2}}", expected: "0 1 1 1 2" },
      { args: "gen::sortedLists(51, 50, 40, 1, 1000000)" },
      { args: "gen::sortedLists(52, 20000, 50, 1, 1000000000)" },
    ],
  },
  {
    skill: "merge-sort",
    rung: 5,
    title: "Smaller values to the right",
    promptMd: `\`smallerToTheRight(a)\` returns, for each position, how many values **after** it are strictly smaller. For \`{7, 3, 8, 2, 5}\` it's \`3 1 2 0 0\`: after the 7 come 3, 2 and 5. Merge sort can count these while it merges: when an item from the left half is placed, every item from the right half placed before it was smaller and came after it. ${TASK} ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> smallerToTheRight(const std::vector<int>& a)",
    call: showCall("smallerToTheRight"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> smallerToTheRight(const std::vector<int>& a) {
    return std::vector<int>(a.size(), 0);
}
`,
    reference: `#include <vector>

// Merge sort over positions, so each count goes back to the right position.
void sortRange(const std::vector<int>& a, std::vector<int>& idx, std::vector<int>& buf, std::vector<int>& smaller, int lo, int hi) {
    if (hi - lo < 2) return;
    int mid = lo + (hi - lo) / 2;
    sortRange(a, idx, buf, smaller, lo, mid);
    sortRange(a, idx, buf, smaller, mid, hi);
    int i = lo, j = mid, k = lo;
    while (i < mid || j < hi) {
        if (j == hi || (i < mid && a[idx[i]] <= a[idx[j]])) {
            smaller[idx[i]] += j - mid;  // right-half items already placed: smaller, and after it
            buf[k++] = idx[i++];
        } else {
            buf[k++] = idx[j++];
        }
    }
    for (k = lo; k < hi; k++) idx[k] = buf[k];
}

std::vector<int> smallerToTheRight(const std::vector<int>& a) {
    int n = a.size();
    std::vector<int> idx(n), buf(n), smaller(n, 0);
    for (int i = 0; i < n; i++) idx[i] = i;
    sortRange(a, idx, buf, smaller, 0, n);
    return smaller;
}
`,
    bruteForce: `#include <vector>

std::vector<int> smallerToTheRight(const std::vector<int>& a) {
    std::vector<int> smaller(a.size(), 0);
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++) smaller[i] += a[j] < a[i];
    return smaller;
}
`,
    cases: [
      { args: "{7, 3, 8, 2, 5}", expected: "3 1 2 0 0" },
      { args: "{}", expected: "" },
      { args: "{3, 3, 3}", expected: "0 0 0" },
      { args: "{1, 2, 3}", expected: "0 0 0" },
      { args: "{4, 3, 2, 1}", expected: "3 2 1 0" },
      { args: "gen::ints(41, 2000, 1, 1000)" },
      { args: "gen::ints(42, 1000000, 1, 1000000000)" },
    ],
  },
];
