import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

// Every value of a shuffled 1..pairs+2 twice, except the first two, which appear once; then shuffled again.
const PAIRS = String.raw`
namespace gen {
std::vector<int> pairsAndTwo(std::uint64_t seed, int pairs) {
    std::vector<int> values = permutation(seed, pairs + 2), v = {values[0], values[1]};
    for (int i = 2; i < pairs + 2; i++) v.push_back(values[i]), v.push_back(values[i]);
    for (int i = (int)v.size() - 1; i > 0; i--) std::swap(v[i], v[between(0, i)]);
    return v;
}
}  // namespace gen
`;

export const bitManipulation: ExerciseTemplate[] = [
  predict(
    "bit-manipulation",
    "What does it print? Bit tricks on 45",
    `#include <bit>
#include <iostream>

int main() {
    unsigned x = 0b101101;  // 45
    std::cout << (x & -x) << " " << (x & (x - 1)) << " " << (x >> 2) << " " << (x ^ 0b111111) << "\\n";
    std::cout << std::popcount(x) << " " << std::bit_width(x) << "\\n";
}
`,
    "1 44 11 18\n4 6",
  ),
  {
    skill: "bit-manipulation",
    rung: 2,
    title: "Fix the power-of-two check",
    promptMd: `\`isPowerOfTwo(n)\` should say whether n is 1, 2, 4, 8, … A power of two has exactly one 1 bit, so \`n & (n - 1)\` clears it and leaves 0. The function says yes for 1 but no for 2, 4 and 1024. **Find the fault and fix it.** Each test prints 1 or 0.`,
    functionSignature: "bool isPowerOfTwo(long long n)",
    call: printCall("isPowerOfTwo"),
    starterCode: `bool isPowerOfTwo(long long n) {
    return n > 0 && n & (n - 1) == 0;
}
`,
    reference: `bool isPowerOfTwo(long long n) {
    return n > 0 && (n & (n - 1)) == 0;  // == binds tighter than &, so the brackets matter
}
`,
    cases: [
      { args: "2", expected: "1" },
      { args: "1", expected: "1" },
      { args: "6", expected: "0" },
      { args: "1024", expected: "1" },
      { args: "0", expected: "0" },
      { args: "1099511627776LL", expected: "1" },
      { args: "1099511627775LL", expected: "0" },
    ],
  },
  {
    skill: "bit-manipulation",
    rung: 3,
    title: "Complete the two values without a partner",
    promptMd: `In v every value appears exactly twice, except two values that appear once. \`twoSingles(v)\` returns those two, smaller first. XOR-ing everything cancels the pairs and leaves a ^ b. Any 1 bit of a ^ b is a bit where a and b differ, so it splits all the values into two groups, with a in one and b in the other. **Complete the split**: XOR each group, and the pairs cancel inside it. ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::pair<int, int> twoSingles(const std::vector<int>& v)",
    call: (args) => `{ auto [a, b] = twoSingles(${args}); std::cout << a << " " << b << "\\n"; }`,
    generator: GEN + PAIRS,
    starterCode: `#include <utility>
#include <vector>

std::pair<int, int> twoSingles(const std::vector<int>& v) {
    int both = 0;
    for (int x : v) both ^= x;  // the pairs cancel: this is a ^ b
    int bit = both & -both;     // the lowest bit where a and b differ
    int a = 0, b = 0;
    // TODO: split the values by that bit, and XOR each group
    if (a > b) std::swap(a, b);
    return {a, b};
}
`,
    reference: `#include <utility>
#include <vector>

std::pair<int, int> twoSingles(const std::vector<int>& v) {
    int both = 0;
    for (int x : v) both ^= x;  // the pairs cancel: this is a ^ b
    int bit = both & -both;     // the lowest bit where a and b differ
    int a = 0, b = 0;
    for (int x : v) (x & bit ? a : b) ^= x;  // a pair always lands in the same group, so it cancels
    if (a > b) std::swap(a, b);
    return {a, b};
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::pair<int, int> twoSingles(const std::vector<int>& v) {
    std::vector<int> once;
    for (std::size_t i = 0; i < v.size(); i++) {
        int count = 0;
        for (int x : v) count += x == v[i];
        if (count == 1) once.push_back(v[i]);
    }
    if (once[0] > once[1]) std::swap(once[0], once[1]);
    return {once[0], once[1]};
}
`,
    cases: [
      { args: "{4, 1, 2, 1, 2, 3}", expected: "3 4" },
      { args: "{7, 9}", expected: "7 9" },
      { args: "{5, 0, 5, 6}", expected: "0 6" },
      { args: "{10, 20, 10, 30, 20, 40}", expected: "30 40" },
      { args: "gen::pairsAndTwo(261, 1000)" },
      { args: "gen::pairsAndTwo(262, 500000)" },
    ],
  },
  {
    skill: "bit-manipulation",
    rung: 4,
    title: "Extend one number's bits to all of 0..n",
    promptMd: `\`bitsUpTo(n)\` should return the total number of 1 bits in all the numbers 0, 1, …, n: 7 for n = 5 (0 + 1 + 1 + 2 + 1 + 2). So far it returns the 1 bits of n alone. n can be up to 10¹⁵, so a loop over the numbers is far too slow. **Extend it** by counting each bit position separately. Going up from 0, bit b repeats a pattern of 2^b zeros and then 2^b ones. Each test must finish within 2 seconds.`,
    functionSignature: "long long bitsUpTo(long long n)",
    call: printCall("bitsUpTo"),
    starterCode: `#include <bit>

long long bitsUpTo(long long n) {
    return std::popcount((unsigned long long)n);
}
`,
    reference: `#include <algorithm>

long long bitsUpTo(long long n) {
    long long total = 0;
    for (int b = 0; b < 62; b++) {
        long long cycle = 1LL << (b + 1), half = 1LL << b;  // half zeros, then half ones
        total += (n + 1) / cycle * half + std::max(0LL, (n + 1) % cycle - half);
    }
    return total;
}
`,
    bruteForce: `#include <bit>

long long bitsUpTo(long long n) {
    long long total = 0;
    for (long long x = 0; x <= n; x++) total += std::popcount((unsigned long long)x);
    return total;
}
`,
    cases: [
      { args: "5", expected: "7" },
      { args: "0", expected: "0" },
      { args: "1", expected: "1" },
      { args: "7", expected: "12" },
      { args: "16", expected: "33" },
      { args: "1000000" },
      { args: "1000000000000000LL" },
    ],
  },
  {
    skill: "bit-manipulation",
    rung: 5,
    title: "The best subset sum",
    promptMd: `\`bestSubsetSum(items, target)\` returns the largest sum of a subset of items that is **at most** target (the empty subset gives 0). There are at most 20 items, so every subset can be tried: masks 0 to 2ⁿ - 1, where bit i says whether item i is in. For \`{5, 9, 12}\` and 15 it's 14. ${TASK}`,
    functionSignature: "long long bestSubsetSum(const std::vector<int>& items, long long target)",
    call: printCall("bestSubsetSum"),
    starterCode: `#include <vector>

long long bestSubsetSum(const std::vector<int>& items, long long target) {
    return 0;
}
`,
    reference: `#include <vector>

long long bestSubsetSum(const std::vector<int>& items, long long target) {
    int n = items.size();
    long long best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        long long sum = 0;
        for (int i = 0; i < n; i++)
            if (mask >> i & 1) sum += items[i];
        if (sum <= target && sum > best) best = sum;
    }
    return best;
}
`,
    cases: [
      { args: "{5, 9, 12}, 15", expected: "14" },
      { args: "{}, 3", expected: "0" },
      { args: "{8}, 7", expected: "0" },
      { args: "{3, 3, 3}, 9", expected: "9" },
      { args: "{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20}, 100", expected: "100" },
      { args: "{1000000000, 1000000000, 7}, 2000000000", expected: "2000000000" },
      { args: "{13, 27, 41, 58, 66, 79, 84, 91}, 200", expected: "199" },
    ],
  },
];
