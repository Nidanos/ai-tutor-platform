import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, MATRIX, TEXT } from "./harness.js";

const pairsAtMost = (prepare: string) => `#include <algorithm>
#include <vector>

long long pairsAtMost(std::vector<int> a, long long k) {
${prepare}    long long count = 0;
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        if (a[lo] + (long long)a[hi] <= k) count += hi - lo, lo++;  // a[lo] pairs with everything up to hi
        else hi--;
    }
    return count;
}
`;

const smallestLargest = (step: string) => `#include <algorithm>
#include <numeric>
#include <vector>

long long smallestLargest(const std::vector<int>& a, int k) {
    // Binary search on the answer: can the list be cut into at most k parts, none adding up to more than limit?
    auto fits = [&](long long limit) {
        int parts = 1;
        long long current = 0;
        for (int x : a) {
${step}
        }
        return parts <= k;
    };
    long long lo = *std::max_element(a.begin(), a.end()), hi = std::accumulate(a.begin(), a.end(), 0LL);
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (fits(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
`;

const longestStretch = (track: string, shrink: string) => `#include <algorithm>
#include <string>
#include <vector>

int longestStretch(const std::string& s, int k) {
    std::vector<int> count(26, 0);
    int best = 0${track};
    for (int left = 0, right = 0; right < (int)s.size(); right++) {
${shrink}
        best = std::max(best, right - left + 1);
    }
    return best;
}
`;

export const problemSolving: ExerciseTemplate[] = [
  predict(
    "problem-solving",
    "What does it print? Reading the limits",
    `#include <bit>
#include <iostream>

int main() {
    const long long budget = 100000000;  // roughly the simple steps that fit in a second
    for (long long n : {1000LL, 100000LL, 1000000LL, 100000000LL}) {
        long long squared = n * n, nLogN = n * std::bit_width((unsigned long long)n);
        std::cout << (squared <= budget) << (nLogN <= budget) << " ";
    }
    std::cout << "\\n";
}
`,
    "11 01 01 00",
  ),
  {
    skill: "problem-solving",
    rung: 2,
    title: "Fix the pair counter",
    promptMd: `\`pairsAtMost(a, k)\` counts the pairs of positions i < j with \`a[i] + a[j] <= k\`. With up to 200,000 numbers, checking every pair is too slow, so it walks two pointers in from both ends. For \`{3, 1, 2}\` and k = 4 that's 2, but it says 1. **Find the fault and fix it.** ${limits("up to 200,000 numbers")}`,
    functionSignature: "long long pairsAtMost(std::vector<int> a, long long k)",
    call: printCall("pairsAtMost"),
    generator: GEN,
    starterCode: pairsAtMost(""),
    reference: pairsAtMost("    std::sort(a.begin(), a.end());  // two pointers only work on sorted numbers\n"),
    bruteForce: `#include <vector>

long long pairsAtMost(std::vector<int> a, long long k) {
    long long count = 0;
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++) count += a[i] + (long long)a[j] <= k;
    return count;
}
`,
    cases: [
      { args: "{3, 1, 2}, 4", expected: "2" },
      { args: "{}, 10", expected: "0" },
      { args: "{5}, 10", expected: "0" },
      { args: "{1, 1, 1, 1}, 2", expected: "6" },
      { args: "{10, -5, 3, -2}, 1", expected: "3" },
      { args: "{1000000000, 1000000000, -1000000000}, 0", expected: "2" },
      { args: "gen::ints(601, 2000, -1000000000, 1000000000), 0" },
      { args: "gen::ints(602, 200000, -1000000000, 1000000000), 500000000" },
    ],
  },
  {
    skill: "problem-solving",
    rung: 3,
    title: "Complete the fairest split",
    promptMd: `\`smallestLargest(a, k)\` cuts the list of positive numbers into at most k runs of neighbours, so that the largest run total is as small as possible, and returns that total. Trying every set of cuts is far too slow, so it binary-searches the answer: for a guessed \`limit\`, a greedy pass checks whether k runs are enough. **Complete the greedy step.** For \`{7, 2, 5, 10, 8}\` and k = 2 that's 18: 7 2 5 | 10 8. ${limits("up to 100,000 numbers up to 1,000,000,000, and k up to the list's length")}`,
    functionSignature: "long long smallestLargest(const std::vector<int>& a, int k)",
    call: printCall("smallestLargest"),
    generator: GEN,
    starterCode: smallestLargest("            // TODO: add x to the current run, or start a new run with x when it would go over limit"),
    reference: smallestLargest(`            if (current + x > limit) parts++, current = x;  // x never exceeds limit: lo starts at the largest number
            else current += x;`),
    bruteForce: `#include <algorithm>
#include <climits>
#include <vector>

long long smallestLargest(const std::vector<int>& a, int k) {
    int n = a.size();
    std::vector<long long> prefix(n + 1, 0);
    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + a[i];
    std::vector<long long> best(n + 1, LLONG_MAX);  // best[i]: the first i numbers in the runs so far
    best[0] = 0;
    for (int run = 1; run <= k; run++) {  // one more run each time, trying every place for its start
        std::vector<long long> next(n + 1, LLONG_MAX);
        next[0] = 0;
        for (int i = 1; i <= n; i++)
            for (int j = 0; j < i; j++)
                if (best[j] != LLONG_MAX) next[i] = std::min(next[i], std::max(best[j], prefix[i] - prefix[j]));
        best = next;
    }
    return best[n];
}
`,
    cases: [
      { args: "{7, 2, 5, 10, 8}, 2", expected: "18" },
      { args: "{1, 2, 3, 4, 5}, 2", expected: "9" },
      { args: "{1, 4, 4}, 3", expected: "4" },
      { args: "{5}, 1", expected: "5" },
      { args: "{2, 3, 1, 2, 4, 3}, 5", expected: "4" },
      { args: "{10, 10, 10}, 1", expected: "30" },
      { args: "gen::ints(603, 200, 1, 1000000000), 10" },
      { args: "gen::ints(604, 100000, 1, 1000000000), 1000" },
    ],
  },
  {
    skill: "problem-solving",
    rung: 4,
    title: "Extend the stretch to k different letters",
    promptMd: `\`longestStretch(s, k)\` slides a window over the lowercase string \`s\` and, so far, returns the length of the longest stretch of neighbouring letters with **no letter twice**, ignoring k. **Extend it** to return the longest stretch that uses **at most k different letters** (k is at least 1); letters may repeat. For "abaccc" and k = 2 that's 4: "accc". ${limits("strings up to 1,000,000 letters")}`,
    functionSignature: "int longestStretch(const std::string& s, int k)",
    call: printCall("longestStretch"),
    generator: GEN + TEXT,
    starterCode: longestStretch(
      "",
      `        count[s[right] - 'a']++;
        while (count[s[right] - 'a'] > 1) count[s[left++] - 'a']--;  // so far: no letter twice`,
    ),
    reference: longestStretch(
      ", distinct = 0",
      `        if (count[s[right] - 'a']++ == 0) distinct++;
        while (distinct > k)  // too many different letters: drop from the left until one is gone
            if (--count[s[left++] - 'a'] == 0) distinct--;`,
    ),
    bruteForce: `#include <algorithm>
#include <string>
#include <vector>

int longestStretch(const std::string& s, int k) {
    int n = s.size(), best = 0;
    for (int left = 0; left < n; left++) {  // every start, grown all the way to the end
        std::vector<bool> seen(26, false);
        int distinct = 0;
        for (int right = left; right < n; right++) {
            if (!seen[s[right] - 'a']) seen[s[right] - 'a'] = true, distinct++;
            if (distinct <= k) best = std::max(best, right - left + 1);
        }
    }
    return best;
}
`,
    cases: [
      { args: `"abaccc", 2`, expected: "4" },
      { args: `"aa", 1`, expected: "2" },
      { args: `"", 3`, expected: "0" },
      { args: `"eceba", 2`, expected: "3" },
      { args: `"abcabcbb", 3`, expected: "8" },
      { args: `"aabbcc", 1`, expected: "2" },
      { args: "gen::text(605, 2000, 5), 3" },
      { args: "gen::text(606, 1000000, 26), 20" },
    ],
  },
  {
    skill: "problem-solving",
    rung: 5,
    title: "The gentlest climb across the map",
    promptMd: `\`heights\` is a map of heights. You walk from the top-left cell to the bottom-right one, a step up, down, left or right at a time. A route's effort is the **largest** height difference between two cells next to each other on it. \`leastEffort(heights)\` returns the smallest effort of any route. For \`{{1, 2, 2}, {3, 8, 2}, {5, 3, 5}}\` that's 2: down the left side and along the bottom. Read the limits first: there can be a million cells. ${TASK} ${limits("maps up to 1000 × 1000 with heights up to 1,000,000,000")}`,
    functionSignature: "int leastEffort(const std::vector<std::vector<int>>& heights)",
    call: printCall("leastEffort"),
    generator: GEN + MATRIX,
    starterCode: `#include <vector>

int leastEffort(const std::vector<std::vector<int>>& heights) {
    return 0;
}
`,
    reference: `#include <cstdlib>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

int leastEffort(const std::vector<std::vector<int>>& heights) {
    int rows = heights.size(), cols = heights[0].size();
    // Dijkstra where a route's cost is its largest step, not its sum: the cheapest cell to settle next is still safe.
    std::vector<int> effort(rows * cols, -1);
    std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<>> pq;  // (effort, cell)
    effort[0] = 0;
    pq.push({0, 0});
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!pq.empty()) {
        auto [e, cell] = pq.top();
        pq.pop();
        if (e > effort[cell]) continue;
        if (cell == rows * cols - 1) return e;
        int r = cell / cols, c = cell % cols;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int next = nr * cols + nc, step = std::max(e, std::abs(heights[nr][nc] - heights[r][c]));
            if (effort[next] == -1 || step < effort[next]) effort[next] = step, pq.push({step, next});
        }
    }
    return 0;
}
`,
    bruteForce: `#include <algorithm>
#include <cstdlib>
#include <vector>

bool reaches(const std::vector<std::vector<int>>& h, int limit) {
    int rows = h.size(), cols = h[0].size();
    std::vector<bool> seen(rows * cols, false);
    std::vector<int> stack = {0};
    seen[0] = true;
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!stack.empty()) {
        int cell = stack.back(), r = cell / cols, c = cell % cols;
        stack.pop_back();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr * cols + nc] || std::abs(h[nr][nc] - h[r][c]) > limit) continue;
            seen[nr * cols + nc] = true;
            stack.push_back(nr * cols + nc);
        }
    }
    return seen.back();
}

int leastEffort(const std::vector<std::vector<int>>& heights) {
    int rows = heights.size(), cols = heights[0].size();
    std::vector<int> steps = {0};  // every height difference on the map is a possible answer: try them smallest first
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) {
            if (r + 1 < rows) steps.push_back(std::abs(heights[r + 1][c] - heights[r][c]));
            if (c + 1 < cols) steps.push_back(std::abs(heights[r][c + 1] - heights[r][c]));
        }
    std::sort(steps.begin(), steps.end());
    for (int limit : steps)
        if (reaches(heights, limit)) return limit;
    return steps.back();
}
`,
    cases: [
      { args: "{{1, 2, 2}, {3, 8, 2}, {5, 3, 5}}", expected: "2" },
      { args: "{{1, 2, 3}, {3, 8, 4}, {5, 3, 5}}", expected: "1" },
      { args: "{{1, 2, 1, 1, 1}, {1, 2, 1, 2, 1}, {1, 2, 1, 2, 1}, {1, 2, 1, 2, 1}, {1, 1, 1, 2, 1}}", expected: "0" },
      { args: "{{7}}", expected: "0" },
      { args: "{{1, 1000000000}}", expected: "999999999" },
      { args: "{{1, 10}, {10, 1}}", expected: "9" },
      { args: "gen::matrix(607, 20, 20, 1, 1000000000)" },
      { args: "gen::matrix(608, 1000, 1000, 1, 1000000000)" },
    ],
  },
];
