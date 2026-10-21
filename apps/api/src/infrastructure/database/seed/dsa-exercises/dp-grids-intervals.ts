import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, MATRIX } from "./harness.js";

const minPathSum = (firstColumn: string) => `#include <algorithm>
#include <vector>

long long minPathSum(const std::vector<std::vector<int>>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<long long>> best(rows, std::vector<long long>(cols));  // best[r][c]: the cheapest path to (r, c)
    best[0][0] = grid[0][0];
    for (int c = 1; c < cols; c++) best[0][c] = best[0][c - 1] + grid[0][c];
    for (int r = 1; r < rows; r++) ${firstColumn}
    for (int r = 1; r < rows; r++)
        for (int c = 1; c < cols; c++) best[r][c] = std::min(best[r - 1][c], best[r][c - 1]) + grid[r][c];
    return best[rows - 1][cols - 1];
}
`;

const chainCost = (split: string) => `#include <algorithm>
#include <climits>
#include <vector>

long long chainCost(const std::vector<int>& dims) {
    int n = dims.size() - 1;  // matrix i is dims[i] × dims[i + 1]
    std::vector<std::vector<long long>> cost(n, std::vector<long long>(n, 0));  // cost[i][j]: multiplying matrices i..j
    for (int len = 2; len <= n; len++)
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            cost[i][j] = LLONG_MAX;
${split}
        }
    return cost[0][n - 1];
}
`;

// The cheapest way to merge piles[from..from+n-1] (indices taken round the circle) into one, O(n^3).
const MERGE_LINE = `#include <algorithm>
#include <climits>
#include <vector>

long long mergeLine(const std::vector<int>& piles, int from) {
    int n = piles.size();
    std::vector<long long> prefix(n + 1, 0);
    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + piles[(from + i) % n];
    std::vector<std::vector<long long>> cost(n, std::vector<long long>(n, 0));  // cost[i][j]: piles i..j into one
    for (int len = 2; len <= n; len++)
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            cost[i][j] = LLONG_MAX;
            for (int k = i; k < j; k++) cost[i][j] = std::min(cost[i][j], cost[i][k] + cost[k + 1][j]);
            cost[i][j] += prefix[j + 1] - prefix[i];  // the last merge costs everything in i..j
        }
    return n ? cost[0][n - 1] : 0;
}
`;

export const dpGridsIntervals: ExerciseTemplate[] = [
  predict(
    "dp-grids-intervals",
    "What does it print? Paths around a rock",
    `#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> grid = {"....", ".#..", "...."};  // # is a rock; moves go right or down
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<long long>> paths(rows, std::vector<long long>(cols, 0));
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '#') paths[r][c] = 0;
            else if (r == 0 && c == 0) paths[r][c] = 1;
            else paths[r][c] = (r > 0 ? paths[r - 1][c] : 0) + (c > 0 ? paths[r][c - 1] : 0);
            std::cout << paths[r][c];
        }
        std::cout << "\\n";
    }
}
`,
    "1111\n1012\n1124",
  ),
  {
    skill: "dp-grids-intervals",
    rung: 2,
    title: "Fix the cheapest path",
    promptMd: `\`minPathSum(grid)\` returns the smallest total of the numbers along a path from the top-left cell to the bottom-right one, moving only right or down; the grid has at least one cell. For \`{{1, 3, 1}, {1, 5, 1}, {4, 2, 1}}\` that's 7, but some grids come out too cheap. **Find the fault and fix it.** ${limits("grids up to 2000 × 2000 of numbers up to 1,000,000,000")}`,
    functionSignature: "long long minPathSum(const std::vector<std::vector<int>>& grid)",
    call: printCall("minPathSum"),
    generator: GEN + MATRIX,
    starterCode: minPathSum("best[r][0] = grid[r][0];"),
    reference: minPathSum("best[r][0] = best[r - 1][0] + grid[r][0];  // the first column is reached only from above"),
    bruteForce: `#include <algorithm>
#include <climits>
#include <vector>

long long minPathSum(const std::vector<std::vector<int>>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<long long>> best(rows, std::vector<long long>(cols, LLONG_MAX));
    best[0][0] = grid[0][0];
    for (int round = 0; round < rows + cols; round++)  // relax every cell again and again, Bellman-Ford style
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (r > 0 && best[r - 1][c] != LLONG_MAX) best[r][c] = std::min(best[r][c], best[r - 1][c] + grid[r][c]);
                if (c > 0 && best[r][c - 1] != LLONG_MAX) best[r][c] = std::min(best[r][c], best[r][c - 1] + grid[r][c]);
            }
    return best[rows - 1][cols - 1];
}
`,
    cases: [
      { args: "{{1, 3, 1}, {1, 5, 1}, {4, 2, 1}}", expected: "7" },
      { args: "{{5}}", expected: "5" },
      { args: "{{1, 2, 3}, {4, 5, 6}}", expected: "12" },
      { args: "{{1}, {2}, {3}}", expected: "6" },
      { args: "{{0, 0}, {0, 0}}", expected: "0" },
      { args: "{{1000000000, 1000000000}, {1000000000, 1000000000}}", expected: "3000000000" },
      { args: "gen::matrix(571, 50, 50, 0, 1000000000)" },
      { args: "gen::matrix(572, 2000, 2000, 0, 1000000000)" },
    ],
  },
  {
    skill: "dp-grids-intervals",
    rung: 3,
    title: "Complete the matrix chain",
    promptMd: `Multiplying an a × b matrix by a b × c one takes a·b·c multiplications. Matrix i is \`dims[i]\` × \`dims[i + 1]\`, and \`chainCost(dims)\` returns the fewest multiplications to multiply all of them, choosing where the brackets go. \`cost[i][j]\` is the answer for matrices i to j, filled shortest ranges first. **Complete the TODO.** For \`{10, 30, 5, 60}\` that's 4500: (A × B) × C. ${limits("up to 500 matrices with sides up to 100")}`,
    functionSignature: "long long chainCost(const std::vector<int>& dims)",
    call: printCall("chainCost"),
    generator: GEN,
    starterCode: chainCost("            // TODO: try every split k (i <= k < j): matrices i..k, then k+1..j, then the two results"),
    reference: chainCost(`            for (int k = i; k < j; k++)  // the last multiplication joins i..k and k+1..j
                cost[i][j] = std::min(cost[i][j], cost[i][k] + cost[k + 1][j] + (long long)dims[i] * dims[k + 1] * dims[j + 1]);`),
    bruteForce: `#include <algorithm>
#include <climits>
#include <vector>

long long cheapest(const std::vector<int>& dims, int i, int j) {  // every bracketing, nothing remembered
    if (i == j) return 0;
    long long best = LLONG_MAX;
    for (int k = i; k < j; k++) best = std::min(best, cheapest(dims, i, k) + cheapest(dims, k + 1, j) + (long long)dims[i] * dims[k + 1] * dims[j + 1]);
    return best;
}

long long chainCost(const std::vector<int>& dims) { return cheapest(dims, 0, dims.size() - 2); }
`,
    cases: [
      { args: "{10, 30, 5, 60}", expected: "4500" },
      { args: "{40, 20, 30, 10, 30}", expected: "26000" },
      { args: "{10, 20}", expected: "0" },
      { args: "{5, 10, 3}", expected: "150" },
      { args: "{1, 2, 3, 4, 3}", expected: "30" },
      { args: "gen::ints(573, 13, 1, 100)" },
      { args: "gen::ints(574, 501, 1, 100)" },
    ],
  },
  {
    skill: "dp-grids-intervals",
    rung: 4,
    title: "Extend pile merging to a circle",
    promptMd: `Merging two **neighbouring** piles of stones costs their total, and the merged pile stays in their place. \`mergeCircle(piles)\` returns the lowest total cost to end with one pile, but so far it treats the piles as a row. **Extend it**: the piles stand in a **circle**, so the last pile is also next to the first. For \`{4, 5, 9, 4}\` a row costs 44, but the circle can do it for 43. Hint: lay the circle out twice in a row, and look at every stretch of n piles. ${limits("up to 400 piles of up to 1,000,000 stones")}`,
    functionSignature: "long long mergeCircle(const std::vector<int>& piles)",
    call: printCall("mergeCircle"),
    generator: GEN,
    starterCode: `${MERGE_LINE}
long long mergeCircle(const std::vector<int>& piles) {
    return mergeLine(piles, 0);  // so far: the piles in a row
}
`,
    reference: `#include <algorithm>
#include <climits>
#include <vector>

long long mergeCircle(const std::vector<int>& piles) {
    int n = piles.size();
    if (n == 0) return 0;
    std::vector<long long> prefix(2 * n + 1, 0);  // the circle laid out twice: every stretch of n piles is a range
    for (int i = 0; i < 2 * n; i++) prefix[i + 1] = prefix[i] + piles[i % n];
    std::vector<std::vector<long long>> cost(2 * n, std::vector<long long>(2 * n, 0));
    for (int len = 2; len <= n; len++)
        for (int i = 0; i + len - 1 < 2 * n; i++) {
            int j = i + len - 1;
            cost[i][j] = LLONG_MAX;
            for (int k = i; k < j; k++) cost[i][j] = std::min(cost[i][j], cost[i][k] + cost[k + 1][j]);
            cost[i][j] += prefix[j + 1] - prefix[i];
        }
    long long best = LLONG_MAX;
    for (int i = 0; i < n; i++) best = std::min(best, cost[i][i + n - 1]);  // the last merge happens at some gap: cut there
    return best;
}
`,
    bruteForce: `${MERGE_LINE}
long long mergeCircle(const std::vector<int>& piles) {
    long long best = mergeLine(piles, 0);
    for (int from = 1; from < (int)piles.size(); from++) best = std::min(best, mergeLine(piles, from));  // a fresh row for every place to cut
    return best;
}
`,
    cases: [
      { args: "{4, 5, 9, 4}", expected: "43" },
      { args: "{1}", expected: "0" },
      { args: "{3, 3}", expected: "6" },
      { args: "{1, 2, 3}", expected: "9" },
      { args: "{}", expected: "0" },
      { args: "{6, 1, 1, 6}", expected: "24" },
      { args: "gen::ints(575, 30, 1, 1000000)" },
      { args: "gen::ints(576, 400, 1, 1000000)" },
    ],
  },
  {
    skill: "dp-grids-intervals",
    rung: 5,
    title: "Burst the balloons for the most coins",
    promptMd: `Balloons in a row carry numbers. Bursting a balloon earns the product of its number and its two current neighbours' numbers; a missing neighbour (past either end) counts as 1, and once a balloon bursts its two neighbours become next to each other. \`burstAll(balloons)\` returns the most coins you can earn by bursting them all in the best order. For \`{3, 1, 5, 8}\` that's 167: burst 1, 5, 3, then 8. Hint: think about which balloon in a range bursts **last**. ${TASK} ${limits("up to 300 balloons with numbers up to 100")}`,
    functionSignature: "long long burstAll(const std::vector<int>& balloons)",
    call: printCall("burstAll"),
    generator: GEN,
    starterCode: `#include <vector>

long long burstAll(const std::vector<int>& balloons) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

long long burstAll(const std::vector<int>& balloons) {
    std::vector<long long> v = {1};  // a 1 at each end stands for the missing neighbours
    v.insert(v.end(), balloons.begin(), balloons.end());
    v.push_back(1);
    int m = v.size();
    std::vector<std::vector<long long>> best(m, std::vector<long long>(m, 0));  // best[l][r]: everything strictly between l and r
    for (int gap = 2; gap < m; gap++)
        for (int l = 0; l + gap < m; l++) {
            int r = l + gap;
            for (int k = l + 1; k < r; k++)  // k bursts last, when only l and r are still beside it
                best[l][r] = std::max(best[l][r], best[l][k] + best[k][r] + v[l] * v[k] * v[r]);
        }
    return best[0][m - 1];
}
`,
    bruteForce: `#include <algorithm>
#include <numeric>
#include <vector>

long long burstAll(const std::vector<int>& balloons) {
    int n = balloons.size();
    std::vector<int> order(n);
    std::iota(order.begin(), order.end(), 0);
    long long best = 0;
    do {  // every order of bursting
        std::vector<bool> gone(n, false);
        long long coins = 0;
        for (int i : order) {
            long long left = 1, right = 1;
            for (int j = i - 1; j >= 0; j--)
                if (!gone[j]) {
                    left = balloons[j];
                    break;
                }
            for (int j = i + 1; j < n; j++)
                if (!gone[j]) {
                    right = balloons[j];
                    break;
                }
            coins += left * balloons[i] * right;
            gone[i] = true;
        }
        best = std::max(best, coins);
    } while (std::next_permutation(order.begin(), order.end()));
    return best;
}
`,
    cases: [
      { args: "{3, 1, 5, 8}", expected: "167" },
      { args: "{1, 5}", expected: "10" },
      { args: "{}", expected: "0" },
      { args: "{7}", expected: "7" },
      { args: "{1, 1, 1}", expected: "3" },
      { args: "{2, 3}", expected: "9" },
      { args: "gen::ints(577, 8, 1, 100)" },
      { args: "gen::ints(578, 300, 1, 100)" },
    ],
  },
];
