import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

export const twoPointers: ExerciseTemplate[] = [
  predict(
    "two-pointers",
    "What does it print? Walking two sorted lists",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {1, 3, 4, 7, 9}, b = {2, 3, 7, 8, 9};
    std::size_t i = 0, j = 0;
    int common = 0, steps = 0;
    while (i < a.size() && j < b.size()) {
        steps++;
        if (a[i] == b[j]) {
            common++;
            i++;
            j++;
        } else if (a[i] < b[j]) {
            i++;
        } else {
            j++;
        }
    }
    std::cout << common << " " << steps << "\\n";
}
`,
    "3 7",
  ),
  {
    skill: "two-pointers",
    rung: 2,
    title: "Fix the sorted squares",
    promptMd: `\`sortedSquares(v)\` gets a sorted list that may contain negative values and returns the squares of its values, sorted. It fills the answer from the largest square down, taking from whichever end of v has the bigger square. For \`{-6, -2, 1, 4, 5}\` it should return \`1 4 16 25 36\`, but the order comes out wrong. **Find the fault and fix it.** ${limits("up to 1,000,000 values from -10⁹ to 10⁹")}`,
    functionSignature: "std::vector<long long> sortedSquares(const std::vector<int>& v)",
    call: showCall("sortedSquares"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<long long> sortedSquares(const std::vector<int>& v) {
    std::vector<long long> out(v.size());
    int lo = 0, hi = (int)v.size() - 1;
    for (int k = (int)v.size() - 1; k >= 0; k--) {  // from the largest square down
        if (v[lo] > v[hi]) {
            out[k] = (long long)v[lo] * v[lo];
            lo++;
        } else {
            out[k] = (long long)v[hi] * v[hi];
            hi--;
        }
    }
    return out;
}
`,
    reference: `#include <vector>

std::vector<long long> sortedSquares(const std::vector<int>& v) {
    std::vector<long long> out(v.size());
    int lo = 0, hi = (int)v.size() - 1;
    for (int k = (int)v.size() - 1; k >= 0; k--) {  // from the largest square down
        long long left = (long long)v[lo] * v[lo], right = (long long)v[hi] * v[hi];
        if (left > right) {  // compare the squares, not the values: -6 beats 5
            out[k] = left;
            lo++;
        } else {
            out[k] = right;
            hi--;
        }
    }
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<long long> sortedSquares(const std::vector<int>& v) {
    std::vector<long long> out;
    for (int x : v) out.push_back((long long)x * x);
    for (std::size_t i = 1; i < out.size(); i++)
        for (std::size_t j = i; j > 0 && out[j - 1] > out[j]; j--) {
            long long t = out[j];
            out[j] = out[j - 1];
            out[j - 1] = t;
        }
    return out;
}
`,
    cases: [
      { args: "{-6, -2, 1, 4, 5}", expected: "1 4 16 25 36" },
      { args: "{-3, -3}", expected: "9 9" },
      { args: "{0}", expected: "0" },
      { args: "{1, 2}", expected: "1 4" },
      { args: "{-1000000000, 1000000000}", expected: "1000000000000000000 1000000000000000000" },
      { args: "{}", expected: "" },
      { args: "gen::sortedInts(211, 2000, -1000000000, 1000000000)" },
      { args: "gen::sortedInts(212, 1000000, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "two-pointers",
    rung: 3,
    title: "Complete the closest pair sum",
    promptMd: `\`closestPairSum(sorted, target)\` gets a sorted list of at least two values and returns the sum of two of them (at different positions) that is closest to target, taking the **smaller** sum on a tie. For \`{1, 4, 6, 9}\` and 12 it's 13. The two ends move inward and keep the best sum seen. **Complete the step that moves them.** ${limits("up to 1,000,000 values")}`,
    functionSignature: "long long closestPairSum(const std::vector<int>& sorted, long long target)",
    call: printCall("closestPairSum"),
    generator: GEN,
    starterCode: `#include <cstdlib>
#include <vector>

long long closestPairSum(const std::vector<int>& sorted, long long target) {
    int lo = 0, hi = (int)sorted.size() - 1;
    long long best = (long long)sorted[0] + sorted[1];
    while (lo < hi) {
        long long sum = (long long)sorted[lo] + sorted[hi];
        long long d = std::llabs(sum - target), bestD = std::llabs(best - target);
        if (d < bestD || (d == bestD && sum < best)) best = sum;
        // TODO: move lo or hi
    }
    return best;
}
`,
    reference: `#include <cstdlib>
#include <vector>

long long closestPairSum(const std::vector<int>& sorted, long long target) {
    int lo = 0, hi = (int)sorted.size() - 1;
    long long best = (long long)sorted[0] + sorted[1];
    while (lo < hi) {
        long long sum = (long long)sorted[lo] + sorted[hi];
        long long d = std::llabs(sum - target), bestD = std::llabs(best - target);
        if (d < bestD || (d == bestD && sum < best)) best = sum;
        if (sum < target) lo++;  // too small: only a bigger left value can help
        else hi--;               // too big (or exact): only a smaller right value can help
    }
    return best;
}
`,
    bruteForce: `#include <cstdlib>
#include <vector>

long long closestPairSum(const std::vector<int>& sorted, long long target) {
    long long best = (long long)sorted[0] + sorted[1];
    for (std::size_t i = 0; i < sorted.size(); i++)
        for (std::size_t j = i + 1; j < sorted.size(); j++) {
            long long sum = (long long)sorted[i] + sorted[j];
            long long d = std::llabs(sum - target), bestD = std::llabs(best - target);
            if (d < bestD || (d == bestD && sum < best)) best = sum;
        }
    return best;
}
`,
    cases: [
      { args: "{1, 4, 6, 9}, 12", expected: "13" },
      { args: "{2, 5}, 0", expected: "7" },
      { args: "{-5, -1, 3, 8}, 4", expected: "3" },
      { args: "{1, 3, 5}, 6", expected: "6" },
      { args: "{1, 4, 8}, 7", expected: "5" },
      { args: "gen::sortedInts(213, 2000, -1000000000, 1000000000), 12345" },
      { args: "gen::sortedInts(214, 1000000, -1000000000, 1000000000), 777777777" },
    ],
  },
  {
    skill: "two-pointers",
    rung: 4,
    title: "Extend the close stretch to counting close pairs",
    promptMd: `\`closePairs(sorted, k)\` should return how many pairs i < j in the sorted list have \`sorted[j] - sorted[i] <= k\`. For \`{1, 3, 4, 8}\` and k = 3 that's 3. So far it returns the length of the longest stretch whose values differ by at most k. That stretch is a window that never moves backwards. **Extend it to count the pairs**: when the window ends at \`right\`, how many pairs end there? ${limits("up to 1,000,000 values")}`,
    functionSignature: "long long closePairs(const std::vector<int>& sorted, int k)",
    call: printCall("closePairs"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

long long closePairs(const std::vector<int>& sorted, int k) {
    long long best = 0;
    std::size_t left = 0;
    for (std::size_t right = 0; right < sorted.size(); right++) {
        while ((long long)sorted[right] - sorted[left] > k) left++;
        best = std::max<long long>(best, right - left + 1);
    }
    return best;
}
`,
    reference: `#include <vector>

long long closePairs(const std::vector<int>& sorted, int k) {
    long long pairs = 0;
    std::size_t left = 0;
    for (std::size_t right = 0; right < sorted.size(); right++) {
        while ((long long)sorted[right] - sorted[left] > k) left++;
        pairs += right - left;  // right pairs with every index from left to right - 1
    }
    return pairs;
}
`,
    bruteForce: `#include <vector>

long long closePairs(const std::vector<int>& sorted, int k) {
    long long pairs = 0;
    for (std::size_t i = 0; i < sorted.size(); i++)
        for (std::size_t j = i + 1; j < sorted.size(); j++) pairs += (long long)sorted[j] - sorted[i] <= k;
    return pairs;
}
`,
    cases: [
      { args: "{1, 3, 4, 8}, 3", expected: "3" },
      { args: "{5, 5, 5}, 0", expected: "3" },
      { args: "{}, 2", expected: "0" },
      { args: "{1, 10}, 5", expected: "0" },
      { args: "{-2, 0, 2}, 4", expected: "3" },
      { args: "gen::sortedInts(215, 2000, 1, 100000), 50" },
      { args: "gen::sortedInts(216, 1000000, 1, 1000000000), 100000" },
    ],
  },
  {
    skill: "two-pointers",
    rung: 5,
    title: "The fewest boats",
    promptMd: `Each boat carries **at most two people** and at most \`limit\` kilos. \`boatsNeeded(weights, limit)\` returns the fewest boats that carry everyone; nobody weighs more than limit. For \`{4, 1, 3, 5}\` and limit 5 it's 3: (5), (1, 4) and (3). Hint: the heaviest person needs a boat anyway, so let the lightest person ride along whenever they fit. ${TASK} ${limits("up to 1,000,000 people")}`,
    functionSignature: "int boatsNeeded(std::vector<int> weights, int limit)",
    call: printCall("boatsNeeded"),
    generator: GEN,
    starterCode: `#include <vector>

int boatsNeeded(std::vector<int> weights, int limit) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

int boatsNeeded(std::vector<int> weights, int limit) {
    std::sort(weights.begin(), weights.end());
    int lo = 0, hi = (int)weights.size() - 1, boats = 0;
    while (lo <= hi) {
        if (lo < hi && weights[lo] + weights[hi] <= limit) lo++;  // the lightest rides along
        hi--;                                                       // the heaviest always goes
        boats++;
    }
    return boats;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

int boatsNeeded(std::vector<int> weights, int limit) {
    std::sort(weights.begin(), weights.end());
    std::vector<bool> used(weights.size(), false);
    int boats = 0;
    for (int i = (int)weights.size() - 1; i >= 0; i--) {
        if (used[i]) continue;
        used[i] = true;
        boats++;
        for (int j = i - 1; j >= 0; j--)  // the heaviest partner who still fits
            if (!used[j] && weights[i] + weights[j] <= limit) {
                used[j] = true;
                break;
            }
    }
    return boats;
}
`,
    cases: [
      { args: "{4, 1, 3, 5}, 5", expected: "3" },
      { args: "{2}, 5", expected: "1" },
      { args: "{1, 1, 1, 1}, 2", expected: "2" },
      { args: "{5, 5, 5}, 5", expected: "3" },
      { args: "{}, 3", expected: "0" },
      { args: "gen::ints(217, 2000, 1, 1000), 1000" },
      { args: "gen::ints(218, 1000000, 1, 1000000000), 1000000000" },
    ],
  },
];
