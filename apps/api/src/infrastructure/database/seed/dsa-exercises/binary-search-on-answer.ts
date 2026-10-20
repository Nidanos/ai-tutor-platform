import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

const PIECES = `// How many pieces of length len can be cut from the ropes.
long long pieces(const std::vector<int>& ropes, long long len) {
    long long total = 0;
    for (int r : ropes) total += r / len;
    return total;
}`;

const MADE = `// How many items the machines finish within T seconds, counting no further than p.
long long made(const std::vector<int>& times, long long T, long long p) {
    long long total = 0;
    for (int t : times) {
        total += T / t;
        if (total >= p) return p;
    }
    return total;
}`;

export const binarySearchOnAnswer: ExerciseTemplate[] = [
  predict(
    "binary-search-on-answer",
    "What does it print? Searching for a cube root",
    `#include <iostream>

int main() {
    long long n = 200, lo = 0, hi = 200;  // the largest x with x * x * x <= n
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;
        std::cout << mid << " ";
        if (mid * mid * mid <= n) lo = mid;
        else hi = mid - 1;
    }
    std::cout << "\\n" << lo << "\\n";
}
`,
    "100 50 25 12 6 3 4 5\n5",
  ),
  {
    skill: "binary-search-on-answer",
    rung: 2,
    title: "Fix the search that never ends",
    promptMd: `A staircase of coins needs 1 coin in its first row, 2 in its second, and so on. \`fullRows(n)\` returns how many **complete** rows n coins can build: 2 for 5 coins (1 + 2, with 2 left over). It binary searches for the largest k with k(k + 1) / 2 ≤ n, but for most inputs it never finishes. **Find the fault and fix it.** n is up to 10¹⁸.`,
    functionSignature: "long long fullRows(long long n)",
    call: printCall("fullRows"),
    starterCode: `long long fullRows(long long n) {
    long long lo = 0, hi = 2000000000;  // lo always fits, hi might not
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * (mid + 1) / 2 <= n) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}
`,
    reference: `long long fullRows(long long n) {
    long long lo = 0, hi = 2000000000;  // lo always fits, hi might not
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;  // round up, or lo = mid can stand still
        if (mid * (mid + 1) / 2 <= n) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}
`,
    cases: [
      { args: "5", expected: "2" },
      { args: "0", expected: "0" },
      { args: "1", expected: "1" },
      { args: "6", expected: "3" },
      { args: "1000000000000000000LL", expected: "1414213561" },
    ],
  },
  {
    skill: "binary-search-on-answer",
    rung: 3,
    title: "Complete the longest rope piece",
    promptMd: `\`longestPiece(ropes, k)\` returns the longest whole length L such that at least k pieces of length L can be cut from the ropes (pieces can't be joined). It returns 0 if even length 1 gives fewer than k pieces. For ropes \`{8, 5, 12}\` and k = 5 it's 4: that gives 2 + 1 + 3 = 6 pieces, while length 5 gives only 4. A longer length never gives more pieces, so the answer can be binary searched, and \`pieces\` does the counting. **Complete the loop**, keeping \`lo\` a length that works. ${limits("up to 200,000 ropes of up to 10⁹, and k up to 10⁹")}`,
    functionSignature: "long long longestPiece(const std::vector<int>& ropes, long long k)",
    call: printCall("longestPiece"),
    generator: GEN,
    starterCode: `#include <vector>

${PIECES}

long long longestPiece(const std::vector<int>& ropes, long long k) {
    long long lo = 0, hi = 1000000000;  // lo always works (0 means none), hi might not
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;
        // TODO: move lo or hi, keeping lo a length that works
    }
    return lo;
}
`,
    reference: `#include <vector>

${PIECES}

long long longestPiece(const std::vector<int>& ropes, long long k) {
    long long lo = 0, hi = 1000000000;  // lo always works (0 means none), hi might not
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;
        if (pieces(ropes, mid) >= k) lo = mid;  // mid works: the answer is mid or longer
        else hi = mid - 1;
    }
    return lo;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

${PIECES}

long long longestPiece(const std::vector<int>& ropes, long long k) {
    long long longest = ropes.empty() ? 0 : *std::max_element(ropes.begin(), ropes.end());
    for (long long len = longest; len >= 1; len--)
        if (pieces(ropes, len) >= k) return len;
    return 0;
}
`,
    cases: [
      { args: "{8, 5, 12}, 5", expected: "4" },
      { args: "{10}, 3", expected: "3" },
      { args: "{1, 1}, 3", expected: "0" },
      { args: "{1000000000}, 1", expected: "1000000000" },
      { args: "{7, 7, 7}, 3", expected: "7" },
      { args: "gen::ints(101, 2000, 1, 1000), 5000" },
      { args: "gen::ints(102, 200000, 1, 1000000000), 1000000000" },
    ],
  },
  {
    skill: "binary-search-on-answer",
    rung: 4,
    title: "Extend the machine check to the least time",
    promptMd: `Machine i makes one item every \`times[i]\` seconds, and all the machines work at once. \`made(times, T, p)\` counts the items finished within T seconds, stopping at p. So far, \`minTime(times, p)\` only checks whether 1 second is enough. **Extend it** to return the least whole number of seconds in which at least p items are made. For \`{2, 3}\` and 5 items that's 6: by then the machines have made 3 + 2. More time never means fewer items. ${limits("up to 200,000 machines, times up to 10⁹, and p up to 10⁹")}`,
    functionSignature: "long long minTime(const std::vector<int>& times, long long p)",
    call: printCall("minTime"),
    generator: GEN,
    starterCode: `#include <vector>

${MADE}

long long minTime(const std::vector<int>& times, long long p) {
    return made(times, 1, p) >= p ? 1 : -1;  // so far: is 1 second enough?
}
`,
    reference: `#include <algorithm>
#include <vector>

${MADE}

long long minTime(const std::vector<int>& times, long long p) {
    long long lo = 1, hi = (long long)*std::min_element(times.begin(), times.end()) * p;  // the fastest machine alone is enough
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (made(times, mid, p) >= p) hi = mid;  // mid is enough: the answer is mid or less
        else lo = mid + 1;
    }
    return lo;
}
`,
    bruteForce: `#include <vector>

${MADE}

long long minTime(const std::vector<int>& times, long long p) {
    long long T = 1;
    while (made(times, T, p) < p) T++;
    return T;
}
`,
    cases: [
      { args: "{2, 3}, 5", expected: "6" },
      { args: "{5}, 3", expected: "15" },
      { args: "{1, 1, 1}, 7", expected: "3" },
      { args: "{4, 6}, 1", expected: "4" },
      { args: "gen::ints(103, 2000, 1, 100), 2000" },
      { args: "gen::ints(104, 200000, 1, 1000000000), 1000000000" },
    ],
  },
  {
    skill: "binary-search-on-answer",
    rung: 5,
    title: "The k-th smallest in a multiplication table",
    promptMd: `An n × m multiplication table holds i × j in row i and column j. \`kthInTable(n, m, k)\` returns the k-th smallest of its n·m values, counting repeats. For the 3 × 3 table and k = 6 it's 4: the sorted values are 1 2 2 3 3 4 6 6 9. The table is far too big to build, but you can count how many values are at most x, row by row. ${TASK} ${limits("n and m up to 100,000")}`,
    functionSignature: "long long kthInTable(long long n, long long m, long long k)",
    call: printCall("kthInTable"),
    starterCode: `long long kthInTable(long long n, long long m, long long k) {
    return 0;
}
`,
    reference: `#include <algorithm>

// How many values of the table are at most x: row i holds i, 2i, ..., mi.
long long atMost(long long n, long long m, long long x) {
    long long count = 0;
    for (long long i = 1; i <= n; i++) count += std::min(x / i, m);
    return count;
}

long long kthInTable(long long n, long long m, long long k) {
    long long lo = 1, hi = n * m;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (atMost(n, m, mid) >= k) hi = mid;  // at least k values up to mid: the answer is mid or less
        else lo = mid + 1;
    }
    return lo;
}
`,
    bruteForce: `#include <algorithm>

long long kthInTable(long long n, long long m, long long k) {
    for (long long x = 1;; x++) {
        long long count = 0;
        for (long long i = 1; i <= n; i++) count += std::min(x / i, m);
        if (count >= k) return x;
    }
}
`,
    cases: [
      { args: "3, 3, 6", expected: "4" },
      { args: "2, 3, 4", expected: "3" },
      { args: "1, 1, 1", expected: "1" },
      { args: "4, 2, 3", expected: "2" },
      { args: "60, 70, 2500" },
      { args: "100000, 100000, 5000000000LL" },
    ],
  },
];
