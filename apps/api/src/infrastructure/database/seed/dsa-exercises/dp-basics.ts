import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

// n rows of k costs from 1 to max.
const COSTS = String.raw`
namespace gen {
std::vector<std::vector<int>> costs(std::uint64_t seed, int n, int k, int max) {
    std::vector<std::vector<int>> out;
    for (int i = 0; i < n; i++) out.push_back(ints(seed * 1000003 + i, k, 1, max));
    return out;
}
}  // namespace gen
`;

const LINE_ROBBER = `#include <algorithm>
#include <vector>

long long robLine(const std::vector<int>& money, int from, int to) {  // houses from..to-1 in a line
    long long take = 0, skip = 0;  // the best so far with the last house robbed, and with it left alone
    for (int i = from; i < to; i++) {
        long long robbed = skip + money[i];
        skip = std::max(skip, take);
        take = robbed;
    }
    return std::max(take, skip);
}
`;

export const dpBasics: ExerciseTemplate[] = [
  predict(
    "dp-basics",
    "What does it print? Memoised stairs",
    `#include <iostream>
#include <vector>

long long calls = 0;
std::vector<long long> memo(50, -1);

long long ways(int n) {  // ways to climb n stairs, 1 or 2 at a time
    calls++;
    if (n <= 1) return 1;
    if (memo[n] != -1) return memo[n];
    return memo[n] = ways(n - 1) + ways(n - 2);
}

int main() {
    std::cout << ways(6) << " " << calls << "\\n";
    calls = 0;
    std::cout << ways(7) << " " << calls << "\\n";
}
`,
    "13 11\n21 3",
  ),
  {
    skill: "dp-basics",
    rung: 2,
    title: "Fix the fewest coins",
    promptMd: `\`fewestCoins(coins, amount)\` returns the fewest coins that add up to \`amount\`, using each coin value as often as you like, or -1 if it can't be done. \`best[a]\` is the answer for amount a, built up from 0. For \`{1, 2, 5}\` and 11 that's 3, but for amounts that can't be made it returns nonsense. **Find the fault and fix it.** ${limits("amounts up to 1,000,000 and up to 100 coin values")}`,
    functionSignature: "int fewestCoins(const std::vector<int>& coins, int amount)",
    call: printCall("fewestCoins"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <climits>
#include <vector>

int fewestCoins(const std::vector<int>& coins, int amount) {
    std::vector<int> best(amount + 1, INT_MAX);  // INT_MAX: can't be made (yet)
    best[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) best[a] = std::min(best[a], best[a - c] + 1);
    return best[amount] == INT_MAX ? -1 : best[amount];
}
`,
    reference: `#include <algorithm>
#include <climits>
#include <vector>

int fewestCoins(const std::vector<int>& coins, int amount) {
    std::vector<int> best(amount + 1, INT_MAX);  // INT_MAX: can't be made (yet)
    best[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a && best[a - c] != INT_MAX) best[a] = std::min(best[a], best[a - c] + 1);  // INT_MAX + 1 overflows
    return best[amount] == INT_MAX ? -1 : best[amount];
}
`,
    bruteForce: `#include <vector>

int fewestCoins(const std::vector<int>& coins, int amount) {
    std::vector<int> best(amount + 1, -1);
    best[0] = 0;
    for (int c : coins)
        if (c <= amount) best[c] = 1;
    for (int a = 1; a <= amount; a++)
        for (int x = 1; x < a; x++)  // split a into two smaller amounts, each made as cheaply as possible
            if (best[x] != -1 && best[a - x] != -1 && (best[a] == -1 || best[x] + best[a - x] < best[a])) best[a] = best[x] + best[a - x];
    return best[amount];
}
`,
    cases: [
      { args: "{1, 2, 5}, 11", expected: "3" },
      { args: "{2}, 3", expected: "-1" },
      { args: "{7}, 0", expected: "0" },
      { args: "{3, 7}, 20", expected: "4" },
      { args: "{5, 10, 25}, 30", expected: "2" },
      { args: "{9, 6, 1}, 12", expected: "2" },
      { args: "{4, 6}, 9", expected: "-1" },
      { args: "gen::ints(531, 20, 1, 500), 2000" },
      { args: "gen::ints(532, 100, 2, 10000), 1000000" },
    ],
  },
  {
    skill: "dp-basics",
    rung: 3,
    title: "Complete the best run",
    promptMd: `\`bestRun(a)\` returns the largest sum of a run of one or more neighbouring numbers in \`a\`, which is never empty. It works out, for each position, the best sum of a run that **ends** there. **Complete the TODO.** For \`{-2, 1, -3, 4, -1, 2, 1, -5, 4}\` that's 6, from \`4, -1, 2, 1\`. ${limits("up to 1,000,000 numbers between -1,000,000,000 and 1,000,000,000")}`,
    functionSignature: "long long bestRun(const std::vector<int>& a)",
    call: printCall("bestRun"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <climits>
#include <vector>

long long bestRun(const std::vector<int>& a) {
    long long endingHere = 0, best = LLONG_MIN;
    for (int x : a) {
        // TODO: the best run ending at x either starts at x or adds x to the best run ending just before it
        best = std::max(best, endingHere);
    }
    return best;
}
`,
    reference: `#include <algorithm>
#include <climits>
#include <vector>

long long bestRun(const std::vector<int>& a) {
    long long endingHere = 0, best = LLONG_MIN;
    for (int x : a) {
        endingHere = std::max<long long>(x, endingHere + x);  // a run ending before x only helps if its sum is positive
        best = std::max(best, endingHere);
    }
    return best;
}
`,
    bruteForce: `#include <climits>
#include <vector>

long long bestRun(const std::vector<int>& a) {
    long long best = LLONG_MIN;
    for (std::size_t i = 0; i < a.size(); i++) {  // every start, every end
        long long sum = 0;
        for (std::size_t j = i; j < a.size(); j++) {
            sum += a[j];
            if (sum > best) best = sum;
        }
    }
    return best;
}
`,
    cases: [
      { args: "{-2, 1, -3, 4, -1, 2, 1, -5, 4}", expected: "6" },
      { args: "{-3, -1, -2}", expected: "-1" },
      { args: "{5}", expected: "5" },
      { args: "{1, 2, 3}", expected: "6" },
      { args: "{2, -1, 2}", expected: "3" },
      { args: "{-1, 0, -2}", expected: "0" },
      { args: "gen::ints(533, 2000, -1000000000, 1000000000)" },
      { args: "gen::ints(534, 1000000, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "dp-basics",
    rung: 4,
    title: "Extend the house robber to a circle",
    promptMd: `A burglar can't rob two neighbouring houses. \`robCircle(money)\` uses \`robLine\`, which finds the most money from houses in a row, and so far simply returns \`robLine\` over all the houses. **Extend it**: the houses stand in a **circle**, so the first and the last are neighbours too (a single house can still be robbed). For \`{2, 3, 2}\` that's 3. ${limits("up to 1,000,000 houses holding up to 1,000,000,000 each")}`,
    functionSignature: "long long robCircle(const std::vector<int>& money)",
    call: printCall("robCircle"),
    generator: GEN,
    starterCode: `${LINE_ROBBER}
long long robCircle(const std::vector<int>& money) {
    return robLine(money, 0, money.size());
}
`,
    reference: `${LINE_ROBBER}
long long robCircle(const std::vector<int>& money) {
    int n = money.size();
    if (n == 1) return money[0];
    return std::max(robLine(money, 0, n - 1), robLine(money, 1, n));  // the first and last are never both robbed
}
`,
    bruteForce: `${LINE_ROBBER}
long long robCircle(const std::vector<int>& money) {
    int n = money.size();
    if (n == 1) return money[0];
    long long best = 0;
    for (int skip = 0; skip < n; skip++) {  // some house is left alone: cut the circle there, a fresh line each time
        std::vector<int> line;
        for (int i = 1; i < n; i++) line.push_back(money[(skip + i) % n]);
        best = std::max(best, robLine(line, 0, line.size()));
    }
    return best;
}
`,
    cases: [
      { args: "{2, 3, 2}", expected: "3" },
      { args: "{1, 2, 3, 1}", expected: "4" },
      { args: "{5}", expected: "5" },
      { args: "{}", expected: "0" },
      { args: "{2, 1, 1, 2}", expected: "3" },
      { args: "{200, 3, 140, 20, 10}", expected: "340" },
      { args: "{4, 1, 2, 7, 5, 3, 1}", expected: "14" },
      { args: "gen::ints(535, 2000, 0, 1000000000)" },
      { args: "gen::ints(536, 1000000, 0, 1000000000)" },
    ],
  },
  {
    skill: "dp-basics",
    rung: 5,
    title: "Paint the houses for the least",
    promptMd: `A row of houses must each be painted one of k colours, and no two neighbouring houses may have the same colour. \`cost[i][c]\` is what painting house i in colour c costs; every row has the same k, and k is at least 2 whenever there are two or more houses. \`cheapestPaint(cost)\` returns the lowest total cost. For \`{{17, 2, 17}, {16, 16, 5}, {14, 3, 19}}\` that's 10. ${TASK} ${limits("up to 2,000 houses and 2,000 colours")}`,
    functionSignature: "long long cheapestPaint(const std::vector<std::vector<int>>& cost)",
    call: printCall("cheapestPaint"),
    generator: GEN + COSTS,
    starterCode: `#include <vector>

long long cheapestPaint(const std::vector<std::vector<int>>& cost) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

long long cheapestPaint(const std::vector<std::vector<int>>& cost) {
    if (cost.empty()) return 0;
    int k = cost[0].size();
    std::vector<long long> prev(cost[0].begin(), cost[0].end()), cur(k);  // prev[c]: the cheapest so far, the last house in colour c
    for (std::size_t i = 1; i < cost.size(); i++) {
        int best = -1, second = -1;  // the cheapest two colours for the house before: only they matter
        for (int c = 0; c < k; c++) {
            if (best == -1 || prev[c] < prev[best]) second = best, best = c;
            else if (second == -1 || prev[c] < prev[second]) second = c;
        }
        for (int c = 0; c < k; c++) cur[c] = cost[i][c] + prev[c == best ? second : best];
        prev.swap(cur);
    }
    return *std::min_element(prev.begin(), prev.end());
}
`,
    bruteForce: `#include <algorithm>
#include <climits>
#include <vector>

long long cheapestPaint(const std::vector<std::vector<int>>& cost) {
    if (cost.empty()) return 0;
    int k = cost[0].size();
    std::vector<long long> prev(cost[0].begin(), cost[0].end());
    for (std::size_t i = 1; i < cost.size(); i++) {
        std::vector<long long> cur(k, LLONG_MAX);
        for (int c = 0; c < k; c++)
            for (int before = 0; before < k; before++)  // every colour pair: k^2 per house
                if (before != c) cur[c] = std::min(cur[c], prev[before] + cost[i][c]);
        prev = cur;
    }
    return *std::min_element(prev.begin(), prev.end());
}
`,
    cases: [
      { args: "{{17, 2, 17}, {16, 16, 5}, {14, 3, 19}}", expected: "10" },
      { args: "{{7, 6, 2}}", expected: "2" },
      { args: "{}", expected: "0" },
      { args: "{{1, 5}, {1, 5}, {1, 5}}", expected: "7" },
      { args: "{{3}}", expected: "3" },
      { args: "{{1, 2, 3}, {1, 2, 3}, {3, 3, 1}}", expected: "4" },
      { args: "gen::costs(537, 100, 100, 1000000)" },
      { args: "gen::costs(538, 2000, 2000, 1000000)" },
    ],
  },
];
