import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

const sortInPlace = (fn: string) => (args: string) => `{ std::vector<int> v = ${args}; ${fn}(v); gen::show(v); }`;

// Many splits are correct, so the harness checks the split instead of comparing one exact order.
const SPLIT_CHECK = String.raw`
namespace gen {
// Prints k, then "ok" if v is a rearrangement of input with exactly its k negative values first.
void checkNegativesFirst(std::vector<int> input, std::vector<int> v, int k) {
    bool ok = k >= 0 && k <= (int)v.size();
    for (int i = 0; ok && i < (int)v.size(); i++) ok = (i < k) == (v[i] < 0);
    std::vector<int> after = v;
    std::sort(input.begin(), input.end());
    std::sort(after.begin(), after.end());
    std::cout << k << (ok && after == input ? " ok" : " not split") << "\n";
}
}  // namespace gen
`;

const TWO_WAY_QUICKSORT = `#include <utility>
#include <vector>

void quickSortRange(std::vector<int>& v, int lo, int hi) {  // sorts v[lo..hi]
    if (lo >= hi) return;
    std::swap(v[lo + (hi - lo) / 2], v[hi]);  // the middle item as pivot
    int pivot = v[hi], store = lo;
    for (int i = lo; i < hi; i++)
        if (v[i] < pivot) std::swap(v[i], v[store++]);
    std::swap(v[store], v[hi]);
    quickSortRange(v, lo, store - 1);
    quickSortRange(v, store + 1, hi);
}

std::vector<int> quickSort(std::vector<int> v) {
    if (!v.empty()) quickSortRange(v, 0, (int)v.size() - 1);
    return v;
}
`;

export const quickSort: ExerciseTemplate[] = [
  predict(
    "quick-sort",
    "What does it print? Hoare's partition",
    `#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<int> v = {6, 3, 9, 1, 6, 2, 8};
    int pivot = v[0], i = -1, j = (int)v.size();
    while (true) {
        do i++; while (v[i] < pivot);
        do j--; while (v[j] > pivot);
        if (i >= j) break;
        std::swap(v[i], v[j]);
    }
    for (int x : v) std::cout << x << " ";
    std::cout << "\\n" << j << "\\n";
}
`,
    "2 3 6 1 9 6 8\n3",
  ),
  {
    skill: "quick-sort",
    rung: 2,
    title: "Fix the negatives-first split",
    promptMd: `\`negativesFirst(v)\` is a partition step, like quick sort's: it should rearrange v so that every negative value comes before every other value, and return how many are negative. The order inside each part doesn't matter. For \`{3, -1, 4, -5}\` it should return 2, but it returns 0 and leaves the values in the wrong places. **Find the fault and fix it.** Each test prints the count and whether the list is split correctly.`,
    functionSignature: "int negativesFirst(std::vector<int>& v)",
    call: (args) => `{ std::vector<int> input = ${args}, v = input; int k = negativesFirst(v); gen::checkNegativesFirst(input, v, k); }`,
    generator: GEN + SPLIT_CHECK,
    starterCode: `#include <utility>
#include <vector>

int negativesFirst(std::vector<int>& v) {
    int store = 0;  // where the next negative value goes
    for (int i = 0; i < (int)v.size(); i++)
        if (v[i] < 0) std::swap(v[i], v[store]);
    return store;
}
`,
    reference: `#include <utility>
#include <vector>

int negativesFirst(std::vector<int>& v) {
    int store = 0;  // where the next negative value goes
    for (int i = 0; i < (int)v.size(); i++)
        if (v[i] < 0) std::swap(v[i], v[store++]);
    return store;
}
`,
    cases: [
      { args: "{3, -1, 4, -5}", expected: "2 ok" },
      { args: "{1, 2}", expected: "0 ok" },
      { args: "{-1, -2}", expected: "2 ok" },
      { args: "{}", expected: "0 ok" },
      { args: "{0, -7, 0}", expected: "1 ok" },
      { args: "{-3, 5, -2, 0, -9, 8}", expected: "3 ok" },
    ],
  },
  {
    skill: "quick-sort",
    rung: 3,
    title: "Complete the three-colour sort",
    promptMd: `\`sortColours(v)\` sorts a list of 0s, 1s and 2s in one pass, with three markers: \`v[0, low)\` holds 0s, \`v[low, mid)\` holds 1s, and everything after \`high\` holds 2s. The 0s and 1s are handled. **Complete the case for a 2**, which belongs at the end. ${limits("up to 1,000,000 values")} Each test prints the list after sorting.`,
    functionSignature: "void sortColours(std::vector<int>& v)",
    call: sortInPlace("sortColours"),
    generator: GEN,
    starterCode: `#include <utility>
#include <vector>

void sortColours(std::vector<int>& v) {
    int low = 0, mid = 0, high = (int)v.size() - 1;
    while (mid <= high) {
        if (v[mid] == 0) std::swap(v[low++], v[mid++]);
        else if (v[mid] == 1) mid++;
        else mid++;  // TODO: a 2 belongs at the end
    }
}
`,
    reference: `#include <utility>
#include <vector>

void sortColours(std::vector<int>& v) {
    int low = 0, mid = 0, high = (int)v.size() - 1;
    while (mid <= high) {
        if (v[mid] == 0) std::swap(v[low++], v[mid++]);
        else if (v[mid] == 1) mid++;
        else std::swap(v[mid], v[high--]);  // the value swapped in hasn't been looked at, so mid stays
    }
}
`,
    bruteForce: `#include <vector>

void sortColours(std::vector<int>& v) {
    for (std::size_t i = 1; i < v.size(); i++)
        for (std::size_t j = i; j > 0 && v[j - 1] > v[j]; j--) {
            int t = v[j];
            v[j] = v[j - 1];
            v[j - 1] = t;
        }
}
`,
    cases: [
      { args: "{2, 0, 1, 2, 1, 0}", expected: "0 0 1 1 2 2" },
      { args: "{2, 2, 0}", expected: "0 2 2" },
      { args: "{1}", expected: "1" },
      { args: "{}", expected: "" },
      { args: "{2, 1, 0}", expected: "0 1 2" },
      { args: "gen::ints(61, 2000, 0, 2)" },
      { args: "gen::ints(62, 1000000, 0, 2)" },
    ],
  },
  {
    skill: "quick-sort",
    rung: 4,
    title: "Extend quick sort for repeated values",
    promptMd: `\`quickSort(v)\` returns v sorted and is fast on varied values. But when most values are equal, every partition puts nearly everything on one side, and it slows down to O(n²). **Extend the partition to three parts**: less than the pivot, equal to it, and greater. Then recurse only into the first and last parts. ${limits("up to 1,000,000 values, often with only a few different values")}`,
    functionSignature: "std::vector<int> quickSort(std::vector<int> v)",
    call: showCall("quickSort"),
    generator: GEN,
    starterCode: TWO_WAY_QUICKSORT,
    reference: `#include <utility>
#include <vector>

void quickSortRange(std::vector<int>& v, int lo, int hi) {  // sorts v[lo..hi]
    if (lo >= hi) return;
    int pivot = v[lo + (hi - lo) / 2];
    int lt = lo, i = lo, gt = hi;  // v[lo, lt) < pivot, v[lt, i) == pivot, v(gt, hi] > pivot
    while (i <= gt) {
        if (v[i] < pivot) std::swap(v[lt++], v[i++]);
        else if (v[i] > pivot) std::swap(v[i], v[gt--]);
        else i++;
    }
    quickSortRange(v, lo, lt - 1);  // the equal part is already in place
    quickSortRange(v, gt + 1, hi);
}

std::vector<int> quickSort(std::vector<int> v) {
    if (!v.empty()) quickSortRange(v, 0, (int)v.size() - 1);
    return v;
}
`,
    bruteForce: TWO_WAY_QUICKSORT,
    cases: [
      { args: "{5, 2, 8, 2, 9, 1}", expected: "1 2 2 5 8 9" },
      { args: "{4, 4, 4, 4}", expected: "4 4 4 4" },
      { args: "{}", expected: "" },
      { args: "{3, 1}", expected: "1 3" },
      { args: "{7, 7, 1, 7, 9, 7}", expected: "1 7 7 7 7 9" },
      { args: "gen::ints(71, 2000, 1, 50)" },
      { args: "gen::ints(72, 1000000, 1, 2)" },
    ],
  },
  {
    skill: "quick-sort",
    rung: 5,
    title: "The sum of the k smallest",
    promptMd: `\`sumOfSmallest(v, k)\` returns the sum of the k smallest values in v (0 ≤ k ≤ the list's size). For \`{9, 2, 7, 4, 5}\` and k = 3 it's 2 + 4 + 5 = 11. You don't need the whole list sorted, only the k smallest values at the front in any order: quickselect, or \`std::nth_element\`, does exactly that. ${TASK} ${limits("up to 1,000,000 values from -10⁹ to 10⁹, and k up to the list's size")}`,
    functionSignature: "long long sumOfSmallest(std::vector<int> v, int k)",
    call: printCall("sumOfSmallest"),
    generator: GEN,
    starterCode: `#include <vector>

long long sumOfSmallest(std::vector<int> v, int k) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

long long sumOfSmallest(std::vector<int> v, int k) {
    if (k == 0) return 0;
    std::nth_element(v.begin(), v.begin() + (k - 1), v.end());  // the k smallest now come first, in some order
    long long sum = 0;
    for (int i = 0; i < k; i++) sum += v[i];
    return sum;
}
`,
    bruteForce: `#include <utility>
#include <vector>

long long sumOfSmallest(std::vector<int> v, int k) {
    long long sum = 0;
    for (int t = 0; t < k; t++) {  // take the smallest remaining value, k times
        std::size_t best = t;
        for (std::size_t j = t + 1; j < v.size(); j++)
            if (v[j] < v[best]) best = j;
        std::swap(v[t], v[best]);
        sum += v[t];
    }
    return sum;
}
`,
    cases: [
      { args: "{9, 2, 7, 4, 5}, 3", expected: "11" },
      { args: "{3}, 1", expected: "3" },
      { args: "{5, 5, 1}, 2", expected: "6" },
      { args: "{8, -3, 0}, 0", expected: "0" },
      { args: "{-1000000000, -1000000000, 7}, 2", expected: "-2000000000" },
      { args: "gen::ints(81, 2000, -1000000000, 1000000000), 1000" },
      { args: "gen::ints(82, 1000000, -1000000000, 1000000000), 500000" },
    ],
  },
];
