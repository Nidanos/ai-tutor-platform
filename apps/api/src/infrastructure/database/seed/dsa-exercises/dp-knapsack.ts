import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, yesNoCall } from "./harness.js";

// The numbers with the first raised by 1 if the total is odd; n crates {weight, volume} from 1 to the maxima.
const SHAPES = String.raw`
namespace gen {
std::vector<int> evenTotal(std::vector<int> v) {
    long long total = 0;
    for (int x : v) total += x;
    if (total % 2) v[0]++;
    return v;
}
std::vector<std::pair<int, int>> crates(std::uint64_t seed, int n, int maxWeight, int maxVolume) {
    state = seed;
    std::vector<std::pair<int, int>> out(n);
    for (auto& [w, v] : out) w = (int)between(1, maxWeight), v = (int)between(1, maxVolume);
    return out;
}
}  // namespace gen
`;

const knapsack = (loop: string) => `#include <algorithm>
#include <vector>

long long bestValue(const std::vector<int>& weight, const std::vector<int>& value, int capacity) {
    std::vector<long long> best(capacity + 1, 0);  // best[c]: the most value within weight c
    for (std::size_t i = 0; i < weight.size(); i++)
${loop}
    return best[capacity];
}
`;

const canSplit = (step: string) => `#include <numeric>
#include <vector>

bool canSplit(const std::vector<int>& nums) {
    int total = std::accumulate(nums.begin(), nums.end(), 0);
    if (total % 2 != 0) return false;
    int half = total / 2;
    std::vector<char> reach(half + 1, 0);  // reach[s]: some of the numbers so far add up to s
    reach[0] = 1;
    for (int x : nums) {
${step}
    }
    return reach[half];
}
`;

export const dpKnapsack: ExerciseTemplate[] = [
  predict(
    "dp-knapsack",
    "What does it print? A knapsack row by row",
    `#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<std::pair<int, int>> items = {{1, 1}, {3, 4}, {4, 5}};  // (weight, value)
    int capacity = 7;
    std::vector<int> best(capacity + 1, 0);  // best[c]: the most value within weight c
    for (auto [w, v] : items) {
        for (int c = capacity; c >= w; c--) best[c] = std::max(best[c], best[c - w] + v);
        for (int x : best) std::cout << x;
        std::cout << "\\n";
    }
}
`,
    "01111111\n01145555\n01145669",
  ),
  {
    skill: "dp-knapsack",
    rung: 2,
    title: "Fix the 0/1 knapsack",
    promptMd: `Item i weighs \`weight[i]\` and is worth \`value[i]\`, and each item can be packed **at most once**. \`bestValue(weight, value, capacity)\` returns the most value that fits within the weight capacity. For \`{1, 2, 3}\`, \`{6, 10, 12}\` and 5 that's 22, but for \`{2}\`, \`{3}\` and 4 it says 6, as if the item could be packed twice. **Find the fault and fix it.** ${limits("up to 100 items and a capacity up to 1,000,000")}`,
    functionSignature: "long long bestValue(const std::vector<int>& weight, const std::vector<int>& value, int capacity)",
    call: printCall("bestValue"),
    generator: GEN,
    starterCode: knapsack("        for (int c = weight[i]; c <= capacity; c++) best[c] = std::max(best[c], best[c - weight[i]] + value[i]);"),
    reference: knapsack(
      "        for (int c = capacity; c >= weight[i]; c--) best[c] = std::max(best[c], best[c - weight[i]] + value[i]);  // downwards: best[c - w] doesn't include item i yet",
    ),
    bruteForce: `#include <algorithm>
#include <vector>

long long tryAll(const std::vector<int>& weight, const std::vector<int>& value, std::size_t i, long long room) {
    if (i == weight.size()) return 0;
    long long best = tryAll(weight, value, i + 1, room);  // leave item i, or take it if it fits
    if (weight[i] <= room) best = std::max(best, value[i] + tryAll(weight, value, i + 1, room - weight[i]));
    return best;
}

long long bestValue(const std::vector<int>& weight, const std::vector<int>& value, int capacity) { return tryAll(weight, value, 0, capacity); }
`,
    cases: [
      { args: "{1, 2, 3}, {6, 10, 12}, 5", expected: "22" },
      { args: "{2}, {3}, 4", expected: "3" },
      { args: "{1, 3, 4}, {1, 4, 5}, 7", expected: "9" },
      { args: "{}, {}, 10", expected: "0" },
      { args: "{5}, {10}, 4", expected: "0" },
      { args: "{3, 3, 3}, {5, 5, 5}, 8", expected: "10" },
      { args: "gen::ints(551, 20, 1, 1000), gen::ints(552, 20, 1, 1000000), 5000" },
      { args: "gen::ints(553, 100, 1, 20000), gen::ints(554, 100, 1, 1000000000), 1000000" },
    ],
  },
  {
    skill: "dp-knapsack",
    rung: 3,
    title: "Complete the equal split",
    promptMd: `\`canSplit(nums)\` says whether the positive numbers in \`nums\` can be split into two groups with the same total. That's the same as asking whether some of them add up to half the total, and \`reach[s]\` records which sums some of the numbers seen so far can make. **Complete the TODO** that adds number x. For \`{1, 5, 11, 5}\` the answer is yes: 11 and 1 + 5 + 5. ${limits("up to 200 numbers up to 1,000")}`,
    functionSignature: "bool canSplit(const std::vector<int>& nums)",
    call: yesNoCall("canSplit"),
    generator: GEN + SHAPES,
    starterCode: canSplit("        // TODO: every sum reachable without x is also reachable plus x; go downwards so x is used once"),
    reference: canSplit(`        for (int s = half; s >= x; s--)
            if (reach[s - x]) reach[s] = 1;`),
    bruteForce: `#include <numeric>
#include <vector>

void tryAll(const std::vector<int>& nums, std::size_t i, long long sum, long long half, bool& found) {
    if (i == nums.size()) {
        found |= sum == half;  // every one of the 2^n groupings is checked
        return;
    }
    tryAll(nums, i + 1, sum + nums[i], half, found);
    tryAll(nums, i + 1, sum, half, found);
}

bool canSplit(const std::vector<int>& nums) {
    long long total = std::accumulate(nums.begin(), nums.end(), 0LL);
    bool found = false;
    if (total % 2 == 0) tryAll(nums, 0, 0, total / 2, found);
    return found;
}
`,
    cases: [
      { args: "{1, 5, 11, 5}", expected: "yes" },
      { args: "{1, 2, 3, 5}", expected: "no" },
      { args: "{2, 2}", expected: "yes" },
      { args: "{7}", expected: "no" },
      { args: "{3, 1, 1, 2, 2, 1}", expected: "yes" },
      { args: "{100, 1, 1, 1}", expected: "no" },
      { args: "{1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10}", expected: "yes" },
      { args: "gen::evenTotal(gen::ints(555, 20, 1, 1000))" },
      { args: "gen::evenTotal(gen::ints(556, 200, 1, 1000))" },
    ],
  },
  {
    skill: "dp-knapsack",
    rung: 4,
    title: "Extend the coin count to limited coins",
    promptMd: `\`countWays(coin, limit, amount)\` counts the ways to pay \`amount\` exactly, modulo 1,000,000,007. A way is how many of each coin kind you use, so order doesn't matter, and every kind counts separately even if two have the same value. So far it lets you use each kind as often as you like. **Extend it** so kind i can be used at most \`limit[i]\` times. For \`{1, 2, 5}\`, \`{1, 1, 1}\` and 5 that's 1 (just the 5). Hint: the new count for amount a adds up the old counts at a, a - c, a - 2c, … for at most limit + 1 terms, a sliding window of a running sum. ${limits("up to 50 coin kinds with values up to 100 and limits up to 1,000, and an amount up to 100,000")}`,
    functionSignature: "long long countWays(const std::vector<int>& coin, const std::vector<int>& limit, int amount)",
    call: printCall("countWays"),
    generator: GEN,
    starterCode: `#include <vector>

long long countWays(const std::vector<int>& coin, const std::vector<int>& limit, int amount) {
    const long long MOD = 1000000007;
    std::vector<long long> ways(amount + 1, 0);  // ways[a]: the ways to pay a with the kinds so far
    ways[0] = 1;
    for (int c : coin)
        for (int a = c; a <= amount; a++) ways[a] = (ways[a] + ways[a - c]) % MOD;  // so far: as many as you like
    return ways[amount];
}
`,
    reference: `#include <vector>

long long countWays(const std::vector<int>& coin, const std::vector<int>& limit, int amount) {
    const long long MOD = 1000000007;
    std::vector<long long> ways(amount + 1, 0), sum(amount + 1);  // ways[a]: the ways to pay a with the kinds so far
    ways[0] = 1;
    for (std::size_t i = 0; i < coin.size(); i++) {
        long long c = coin[i], span = (limit[i] + 1LL) * c;
        for (int a = 0; a <= amount; a++) sum[a] = (ways[a] + (a >= c ? sum[a - c] : 0)) % MOD;  // ways[a] + ways[a - c] + ...
        for (int a = 0; a <= amount; a++) ways[a] = (sum[a] - (a >= span ? sum[a - span] : 0) + MOD) % MOD;  // keep limit + 1 terms
    }
    return ways[amount];
}
`,
    bruteForce: `#include <vector>

long long countWays(const std::vector<int>& coin, const std::vector<int>& limit, int amount) {
    const long long MOD = 1000000007;
    std::vector<long long> ways(amount + 1, 0);
    ways[0] = 1;
    for (std::size_t i = 0; i < coin.size(); i++) {
        std::vector<long long> next(amount + 1, 0);
        for (int a = 0; a <= amount; a++)
            for (long long t = 0; t <= limit[i] && t * coin[i] <= a; t++)  // use this kind t times
                next[a] = (next[a] + ways[a - t * coin[i]]) % MOD;
        ways = next;
    }
    return ways[amount];
}
`,
    cases: [
      { args: "{1, 2, 5}, {1, 1, 1}, 5", expected: "1" },
      { args: "{1, 2, 5}, {5, 5, 5}, 5", expected: "4" },
      { args: "{2}, {10}, 3", expected: "0" },
      { args: "{3}, {2}, 9", expected: "0" },
      { args: "{3}, {3}, 9", expected: "1" },
      { args: "{1, 2}, {2, 1}, 3", expected: "1" },
      { args: "{}, {}, 0", expected: "1" },
      { args: "{5, 10}, {3, 1}, 20", expected: "1" },
      { args: "gen::ints(557, 10, 1, 100), gen::ints(558, 10, 1, 100), 1000" },
      { args: "gen::ints(559, 50, 1, 100), gen::ints(560, 50, 1, 1000), 100000" },
    ],
  },
  {
    skill: "dp-knapsack",
    rung: 5,
    title: "Load the most crates",
    promptMd: `Each crate is \`{weight, volume}\`, and a truck can carry at most \`maxWeight\` in weight and \`maxVolume\` in volume at once. \`mostCrates(crates, maxWeight, maxVolume)\` returns the most crates the truck can carry. For \`{{1, 1}, {2, 3}, {3, 2}, {4, 4}}\`, 5 and 5 that's 2. ${TASK} ${limits("up to 500 crates, with both limits up to 200")}`,
    functionSignature: "int mostCrates(const std::vector<std::pair<int, int>>& crates, int maxWeight, int maxVolume)",
    call: printCall("mostCrates"),
    generator: GEN + SHAPES,
    starterCode: `#include <utility>
#include <vector>

int mostCrates(const std::vector<std::pair<int, int>>& crates, int maxWeight, int maxVolume) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <utility>
#include <vector>

int mostCrates(const std::vector<std::pair<int, int>>& crates, int maxWeight, int maxVolume) {
    // best[a][b]: the most crates within weight a and volume b; a knapsack with two capacities
    std::vector<std::vector<int>> best(maxWeight + 1, std::vector<int>(maxVolume + 1, 0));
    for (auto [w, v] : crates)
        for (int a = maxWeight; a >= w; a--)
            for (int b = maxVolume; b >= v; b--) best[a][b] = std::max(best[a][b], best[a - w][b - v] + 1);
    return best[maxWeight][maxVolume];
}
`,
    bruteForce: `#include <algorithm>
#include <utility>
#include <vector>

int tryAll(const std::vector<std::pair<int, int>>& crates, std::size_t i, int weight, int volume) {
    if (i == crates.size()) return 0;
    int best = tryAll(crates, i + 1, weight, volume);  // leave crate i, or load it if it fits
    if (crates[i].first <= weight && crates[i].second <= volume) best = std::max(best, 1 + tryAll(crates, i + 1, weight - crates[i].first, volume - crates[i].second));
    return best;
}

int mostCrates(const std::vector<std::pair<int, int>>& crates, int maxWeight, int maxVolume) { return tryAll(crates, 0, maxWeight, maxVolume); }
`,
    cases: [
      { args: "{{1, 1}, {2, 3}, {3, 2}, {4, 4}}, 5, 5", expected: "2" },
      { args: "{}, 10, 10", expected: "0" },
      { args: "{{5, 5}, {6, 1}}, 5, 5", expected: "1" },
      { args: "{{1, 2}, {1, 2}, {1, 2}}, 3, 5", expected: "2" },
      { args: "{{0, 3}, {2, 0}, {1, 1}}, 2, 3", expected: "2" },
      { args: "{{1, 1}, {1, 1}, {1, 1}, {1, 1}}, 4, 4", expected: "4" },
      { args: "gen::crates(561, 18, 30, 30), 100, 100" },
      { args: "gen::crates(562, 500, 20, 20), 200, 200" },
    ],
  },
];
