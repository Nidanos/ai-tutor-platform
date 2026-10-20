import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

export const prefixSums: ExerciseTemplate[] = [
  predict(
    "prefix-sums",
    "What does it print? Reading sums off a prefix array",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {2, -1, 3, 5, -2};
    std::vector<int> prefix(v.size() + 1, 0);
    for (std::size_t i = 0; i < v.size(); i++) prefix[i + 1] = prefix[i] + v[i];
    for (int p : prefix) std::cout << p << " ";
    std::cout << "\\n" << prefix[4] - prefix[1] << " " << prefix[5] - prefix[2] << "\\n";
}
`,
    "0 2 1 4 9 7\n7 6",
  ),
  {
    skill: "prefix-sums",
    rung: 2,
    title: "Fix the range sums",
    promptMd: `\`rangeSums(v, queries)\` answers each query (l, r) with the sum of \`v[l]\` to \`v[r]\`, **both included**, using prefix sums. For \`{4, -2, 7, 1, 3}\` and the query (0, 2) it should give 9, but every answer is off. **Find the fault and fix it.** ${limits("up to 500,000 values and 500,000 queries")}`,
    functionSignature: "std::vector<long long> rangeSums(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries)",
    call: showCall("rangeSums"),
    generator: GEN,
    starterCode: `#include <utility>
#include <vector>

std::vector<long long> rangeSums(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries) {
    std::vector<long long> prefix(v.size() + 1, 0);  // prefix[i]: the sum of the first i values
    for (std::size_t i = 0; i < v.size(); i++) prefix[i + 1] = prefix[i] + v[i];
    std::vector<long long> sums;
    for (auto [l, r] : queries) sums.push_back(prefix[r] - prefix[l]);
    return sums;
}
`,
    reference: `#include <utility>
#include <vector>

std::vector<long long> rangeSums(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries) {
    std::vector<long long> prefix(v.size() + 1, 0);  // prefix[i]: the sum of the first i values
    for (std::size_t i = 0; i < v.size(); i++) prefix[i + 1] = prefix[i] + v[i];
    std::vector<long long> sums;
    for (auto [l, r] : queries) sums.push_back(prefix[r + 1] - prefix[l]);  // the first r + 1 values minus the first l
    return sums;
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::vector<long long> rangeSums(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries) {
    std::vector<long long> sums;
    for (auto [l, r] : queries) {
        long long s = 0;
        for (int i = l; i <= r; i++) s += v[i];
        sums.push_back(s);
    }
    return sums;
}
`,
    cases: [
      { args: "{4, -2, 7, 1, 3}, {{0, 2}, {1, 1}, {3, 4}, {0, 4}}", expected: "9 -2 4 13" },
      { args: "{5}, {{0, 0}}", expected: "5" },
      { args: "{1, 2, 3}, {}", expected: "" },
      { args: "{1000000000, 1000000000, 1000000000}, {{0, 2}}", expected: "3000000000" },
      { args: "gen::ints(201, 2000, -1000000000, 1000000000), gen::ranges(202, 2000, 2000)" },
      { args: "gen::ints(203, 500000, -1000000000, 1000000000), gen::ranges(204, 500000, 500000)" },
    ],
  },
  {
    skill: "prefix-sums",
    rung: 3,
    title: "Complete the balance point",
    promptMd: `\`balancePoint(v)\` returns the first position i where the values **before** it add up to the same as the values **after** it, or -1 if there's none. For \`{2, 3, -1, 8, 4}\` it's 3: 2 + 3 - 1 = 4 on the left, 4 on the right. The function knows the total and keeps the sum before i as it goes. **Complete the check**, without adding up the right side again. ${limits("up to 1,000,000 values")}`,
    functionSignature: "int balancePoint(const std::vector<int>& v)",
    call: printCall("balancePoint"),
    generator: GEN,
    starterCode: `#include <vector>

int balancePoint(const std::vector<int>& v) {
    long long total = 0;
    for (int x : v) total += x;
    long long before = 0;  // the sum of v[0..i-1]
    for (int i = 0; i < (int)v.size(); i++) {
        // TODO: return i if the two sides balance
        before += v[i];
    }
    return -1;
}
`,
    reference: `#include <vector>

int balancePoint(const std::vector<int>& v) {
    long long total = 0;
    for (int x : v) total += x;
    long long before = 0;  // the sum of v[0..i-1]
    for (int i = 0; i < (int)v.size(); i++) {
        if (before == total - before - v[i]) return i;  // after = total - before - v[i]
        before += v[i];
    }
    return -1;
}
`,
    bruteForce: `#include <vector>

int balancePoint(const std::vector<int>& v) {
    for (int i = 0; i < (int)v.size(); i++) {
        long long left = 0, right = 0;
        for (int j = 0; j < i; j++) left += v[j];
        for (int j = i + 1; j < (int)v.size(); j++) right += v[j];
        if (left == right) return i;
    }
    return -1;
}
`,
    cases: [
      { args: "{2, 3, -1, 8, 4}", expected: "3" },
      { args: "{1, 2, 3}", expected: "-1" },
      { args: "{5}", expected: "0" },
      { args: "{0, 0}", expected: "0" },
      { args: "{-3, 1, 2, 10, 0}", expected: "3" },
      { args: "gen::ints(205, 2000, 1, 1000)" },
      { args: "gen::ints(206, 1000000, 1, 1000)" },
    ],
  },
  {
    skill: "prefix-sums",
    rung: 4,
    title: "Extend coverage to weights and a threshold",
    promptMd: `\`coveredAtLeast(n, intervals, k)\` gets intervals \`{l, r, w}\` over the positions 0 to n - 1: each adds w to every position from l to r. It should return how many positions end up with a total of **at least k**. So far it uses a difference array to count positions covered by **any** interval, ignoring w and k. **Extend it.** ${limits("up to 1,000,000 positions and 1,000,000 intervals")}`,
    functionSignature: "int coveredAtLeast(int n, const std::vector<std::array<int, 3>>& intervals, long long k)",
    call: printCall("coveredAtLeast"),
    generator: GEN,
    starterCode: `#include <array>
#include <vector>

int coveredAtLeast(int n, const std::vector<std::array<int, 3>>& intervals, long long k) {
    std::vector<int> diff(n + 1, 0);  // +1 where an interval starts, -1 just after it ends
    for (const auto& iv : intervals) {
        diff[iv[0]]++;
        diff[iv[1] + 1]--;
    }
    int count = 0, depth = 0;
    for (int i = 0; i < n; i++) {
        depth += diff[i];
        if (depth >= 1) count++;
    }
    return count;
}
`,
    reference: `#include <array>
#include <vector>

int coveredAtLeast(int n, const std::vector<std::array<int, 3>>& intervals, long long k) {
    std::vector<long long> diff(n + 1, 0);  // +w where an interval starts, -w just after it ends
    for (const auto& iv : intervals) {
        diff[iv[0]] += iv[2];
        diff[iv[1] + 1] -= iv[2];
    }
    int count = 0;
    long long total = 0;
    for (int i = 0; i < n; i++) {
        total += diff[i];
        if (total >= k) count++;
    }
    return count;
}
`,
    bruteForce: `#include <array>
#include <vector>

int coveredAtLeast(int n, const std::vector<std::array<int, 3>>& intervals, long long k) {
    std::vector<long long> total(n, 0);
    for (const auto& iv : intervals)
        for (int i = iv[0]; i <= iv[1]; i++) total[i] += iv[2];
    int count = 0;
    for (long long t : total) count += t >= k;
    return count;
}
`,
    cases: [
      { args: "10, {{0, 4, 2}, {3, 6, 1}, {5, 9, 3}}, 3", expected: "7" },
      { args: "5, {}, 1", expected: "0" },
      { args: "5, {{0, 4, 1}}, 1", expected: "5" },
      { args: "4, {{1, 2, 5}, {2, 3, 5}}, 10", expected: "1" },
      { args: "3, {{0, 2, 1}}, 0", expected: "3" },
      { args: "2000, gen::weighted(207, 2000, 2000, 10), 20" },
      { args: "1000000, gen::weighted(208, 1000000, 1000000, 1000), 160000000" },
    ],
  },
  {
    skill: "prefix-sums",
    rung: 5,
    title: "The longest stretch with equal 0s and 1s",
    promptMd: `\`longestBalanced(bits)\` gets a list of 0s and 1s and returns the length of the longest stretch of neighbouring values with as many 0s as 1s, or 0 if there's none. For \`{0, 1, 1, 0, 1, 1, 1}\` it's 4. Hint: count each 1 as +1 and each 0 as -1; a balanced stretch then adds up to 0. ${TASK} ${limits("up to 1,000,000 values")}`,
    functionSignature: "int longestBalanced(const std::vector<int>& bits)",
    call: printCall("longestBalanced"),
    generator: GEN,
    starterCode: `#include <vector>

int longestBalanced(const std::vector<int>& bits) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

// Two equal running sums enclose a stretch that adds up to 0, so remember where each sum first appeared.
int longestBalanced(const std::vector<int>& bits) {
    int n = bits.size(), sum = 0, best = 0;
    std::vector<int> first(2 * n + 1, -2);  // first[s + n]: where the running sum s first appeared; -2 not yet
    first[n] = -1;                          // the sum 0, before any value
    for (int i = 0; i < n; i++) {
        sum += bits[i] == 1 ? 1 : -1;
        if (first[sum + n] == -2) first[sum + n] = i;
        else best = std::max(best, i - first[sum + n]);
    }
    return best;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

int longestBalanced(const std::vector<int>& bits) {
    int best = 0;
    for (std::size_t i = 0; i < bits.size(); i++) {
        int sum = 0;
        for (std::size_t j = i; j < bits.size(); j++) {
            sum += bits[j] == 1 ? 1 : -1;
            if (sum == 0) best = std::max(best, int(j - i + 1));
        }
    }
    return best;
}
`,
    cases: [
      { args: "{0, 1, 1, 0, 1, 1, 1}", expected: "4" },
      { args: "{1, 1, 1}", expected: "0" },
      { args: "{}", expected: "0" },
      { args: "{0, 1}", expected: "2" },
      { args: "{1, 0, 1, 0, 1, 0}", expected: "6" },
      { args: "gen::ints(209, 2000, 0, 1)" },
      { args: "gen::ints(210, 1000000, 0, 1)" },
    ],
  },
];
