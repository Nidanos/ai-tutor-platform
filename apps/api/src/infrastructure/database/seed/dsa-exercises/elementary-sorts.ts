import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, showCall } from "./harness.js";

// These sorts are O(n²) by nature, so the tasks have small tests only (ADR-0020: no faster version to require).
const sortInPlace = (fn: string) => (args: string) => `{ std::vector<int> v = ${args}; ${fn}(v); gen::show(v); }`;

export const elementarySorts: ExerciseTemplate[] = [
  predict(
    "elementary-sorts",
    "What does it print? Bubble sort's passes and swaps",
    `#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<int> v = {4, 1, 3, 2};
    int passes = 0, swaps = 0;
    bool swapped = true;
    while (swapped) {
        swapped = false;
        passes++;
        for (std::size_t i = 0; i + 1 < v.size(); i++)
            if (v[i] > v[i + 1]) {
                std::swap(v[i], v[i + 1]);
                swaps++;
                swapped = true;
            }
    }
    std::cout << passes << " " << swaps << "\\n";
}
`,
    "3 4",
  ),
  {
    skill: "elementary-sorts",
    rung: 2,
    title: "Fix bubble sort's early stop",
    promptMd: `\`bubbleSort(v)\` sorts the list in place, smallest first. It's meant to stop early once a pass makes no swaps, because the list is then sorted. But it often stops while the list is still out of order: for \`{2, 3, 1}\` it leaves \`2 1 3\`. **Find the fault and fix it.** Each test prints the list after sorting.`,
    functionSignature: "void bubbleSort(std::vector<int>& v)",
    call: sortInPlace("bubbleSort"),
    generator: GEN,
    starterCode: `#include <utility>
#include <vector>

void bubbleSort(std::vector<int>& v) {
    for (std::size_t pass = 0; pass + 1 < v.size(); pass++) {
        bool swapped = false;
        for (std::size_t i = 0; i + 1 < v.size() - pass; i++)
            if (v[i] > v[i + 1]) {
                std::swap(v[i], v[i + 1]);
                swapped = true;
            }
        if (swapped) break;  // stop early when the list is sorted
    }
}
`,
    reference: `#include <utility>
#include <vector>

void bubbleSort(std::vector<int>& v) {
    for (std::size_t pass = 0; pass + 1 < v.size(); pass++) {
        bool swapped = false;
        for (std::size_t i = 0; i + 1 < v.size() - pass; i++)
            if (v[i] > v[i + 1]) {
                std::swap(v[i], v[i + 1]);
                swapped = true;
            }
        if (!swapped) break;  // a pass without swaps: the list is sorted
    }
}
`,
    cases: [
      { args: "{2, 3, 1}", expected: "1 2 3" },
      { args: "{5, 4, 3, 2, 1}", expected: "1 2 3 4 5" },
      { args: "{1, 2, 3}", expected: "1 2 3" },
      { args: "{2, 2, 1}", expected: "1 2 2" },
      { args: "{-1, -5, 0}", expected: "-5 -1 0" },
      { args: "{}", expected: "" },
    ],
  },
  {
    skill: "elementary-sorts",
    rung: 3,
    title: "Complete a stable ranking",
    promptMd: `\`rankIds(records)\` gets (id, marks) records and returns the ids ranked by marks, **highest first**. Records with equal marks must keep their original order, so the sort has to be stable. It's an insertion sort: each record moves left past the records that should come after it. **Complete the condition** that decides when \`records[j - 1]\` moves right.`,
    functionSignature: "std::vector<int> rankIds(std::vector<std::pair<int, int>> records)",
    call: showCall("rankIds"),
    generator: GEN,
    starterCode: `#include <utility>
#include <vector>

std::vector<int> rankIds(std::vector<std::pair<int, int>> records) {
    for (std::size_t i = 1; i < records.size(); i++) {
        auto current = records[i];
        std::size_t j = i;
        while (j > 0 && false) {  // TODO: when should records[j - 1] move right?
            records[j] = records[j - 1];
            j--;
        }
        records[j] = current;
    }
    std::vector<int> ids;
    for (const auto& r : records) ids.push_back(r.first);
    return ids;
}
`,
    reference: `#include <utility>
#include <vector>

std::vector<int> rankIds(std::vector<std::pair<int, int>> records) {
    for (std::size_t i = 1; i < records.size(); i++) {
        auto current = records[i];
        std::size_t j = i;
        while (j > 0 && records[j - 1].second < current.second) {  // strictly less: equal marks stay in order
            records[j] = records[j - 1];
            j--;
        }
        records[j] = current;
    }
    std::vector<int> ids;
    for (const auto& r : records) ids.push_back(r.first);
    return ids;
}
`,
    cases: [
      { args: "{{1, 70}, {2, 90}, {3, 70}, {4, 85}}", expected: "2 4 1 3" },
      { args: "{{5, 50}}", expected: "5" },
      { args: "{{1, 60}, {2, 60}, {3, 60}}", expected: "1 2 3" },
      { args: "{{9, 10}, {8, 20}, {7, 30}}", expected: "7 8 9" },
      { args: "{{4, 75}, {2, 80}, {7, 75}, {1, 80}, {3, 60}}", expected: "2 1 4 7 3" },
      { args: "{}", expected: "" },
    ],
  },
  {
    skill: "elementary-sorts",
    rung: 4,
    title: "Extend selection sort to the k smallest",
    promptMd: `Selection sort fixes one position per pass: after the first k passes, the first k positions hold the k smallest values, in order. \`smallestK(v, k)\` sorts the whole list so far. **Extend it** to stop after k passes and return only the k smallest values, smallest first (0 ≤ k ≤ the list's size).`,
    functionSignature: "std::vector<int> smallestK(std::vector<int> v, int k)",
    call: showCall("smallestK"),
    generator: GEN,
    starterCode: `#include <utility>
#include <vector>

std::vector<int> smallestK(std::vector<int> v, int k) {
    for (std::size_t i = 0; i + 1 < v.size(); i++) {
        std::size_t smallest = i;
        for (std::size_t j = i + 1; j < v.size(); j++)
            if (v[j] < v[smallest]) smallest = j;
        std::swap(v[i], v[smallest]);
    }
    return v;
}
`,
    reference: `#include <utility>
#include <vector>

std::vector<int> smallestK(std::vector<int> v, int k) {
    for (std::size_t i = 0; i < (std::size_t)k; i++) {  // pass i fixes position i
        std::size_t smallest = i;
        for (std::size_t j = i + 1; j < v.size(); j++)
            if (v[j] < v[smallest]) smallest = j;
        std::swap(v[i], v[smallest]);
    }
    return std::vector<int>(v.begin(), v.begin() + k);
}
`,
    cases: [
      { args: "{7, 2, 9, 4, 1}, 2", expected: "1 2" },
      { args: "{5, 3, 8}, 3", expected: "3 5 8" },
      { args: "{4, 4, 1}, 1", expected: "1" },
      { args: "{6, -2, 6, 0}, 3", expected: "-2 0 6" },
      { args: "{6}, 0", expected: "" },
    ],
  },
  {
    skill: "elementary-sorts",
    rung: 5,
    title: "How many neighbour swaps to sort?",
    promptMd: `Bubble sort only ever swaps two neighbours that are out of order. \`adjacentSwapsToSort(v)\` returns how many such swaps it takes to sort the list, smallest first. Equal values are never swapped. For \`{3, 1, 2}\` it's 2. Lists have at most 3000 values. ${TASK}`,
    functionSignature: "long long adjacentSwapsToSort(const std::vector<int>& v)",
    call: printCall("adjacentSwapsToSort"),
    starterCode: `#include <vector>

long long adjacentSwapsToSort(const std::vector<int>& v) {
    return 0;
}
`,
    reference: `#include <vector>

// Each swap fixes exactly one out-of-order pair, so the answer is the number of such pairs.
long long adjacentSwapsToSort(const std::vector<int>& v) {
    long long pairs = 0;
    for (std::size_t i = 0; i < v.size(); i++)
        for (std::size_t j = i + 1; j < v.size(); j++)
            if (v[i] > v[j]) pairs++;
    return pairs;
}
`,
    cases: [
      { args: "{3, 1, 2}", expected: "2" },
      { args: "{1, 2, 3}", expected: "0" },
      { args: "{5, 4, 3, 2, 1}", expected: "10" },
      { args: "{2, 2, 1}", expected: "2" },
      { args: "{}", expected: "0" },
    ],
  },
];
