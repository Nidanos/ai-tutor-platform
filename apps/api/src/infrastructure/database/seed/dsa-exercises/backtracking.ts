import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, showCall, yesNoCall } from "./harness.js";

const ORDERS = "Return every ordering one after another in a single list, the orderings in increasing (dictionary) order.";

// k groups of up to `per` positive numbers, each group adding up to target, shuffled together.
const SPLITTABLE = String.raw`
namespace gen {
std::vector<int> splittable(std::uint64_t seed, int k, int per, int target) {
    state = seed;
    std::vector<int> out;
    for (int g = 0; g < k; g++) {
        std::vector<int> cuts = {0, target};
        for (int i = 1; i < per; i++) cuts.push_back((int)between(1, target - 1));
        std::sort(cuts.begin(), cuts.end());
        for (int i = 1; i <= per; i++)
            if (cuts[i] > cuts[i - 1]) out.push_back(cuts[i] - cuts[i - 1]);
    }
    for (int i = (int)out.size() - 1; i > 0; i--) std::swap(out[i], out[between(0, i)]);
    return out;
}
}  // namespace gen
`;

// skip: the line that decides whether item i can go next. unmark: the line that frees it again.
const arrange = (fn: string, param: string, skip: string, unmark: string, prepare = "") => `#include <algorithm>
#include <vector>

void arrange(const std::vector<int>& items, std::vector<bool>& used, std::vector<int>& current, std::vector<int>& out) {
    if (current.size() == items.size()) {
        out.insert(out.end(), current.begin(), current.end());
        return;
    }
    for (std::size_t i = 0; i < items.size(); i++) {
${skip}
        used[i] = true;
        current.push_back(items[i]);
        arrange(items, used, current, out);
        current.pop_back();
${unmark}
    }
}

std::vector<int> ${fn}(${param}) {
${prepare}    std::vector<bool> used(items.size(), false);
    std::vector<int> current, out;
    arrange(items, used, current, out);
    return out;
}
`;
const PLAIN_SKIP = "        if (used[i]) continue;";
const UNMARK = "        used[i] = false;  // free it for the orderings still to come";

const QUEENS = (todo: string) => `#include <vector>

struct Board {
    int n, count;
    std::vector<bool> column, diagonal, antiDiagonal;  // which ones already hold a queen
};

void place(Board& b, int row) {
    if (row == b.n) {
        b.count++;
        return;
    }
    for (int c = 0; c < b.n; c++) {
        if (b.column[c] || b.diagonal[row + c] || b.antiDiagonal[row - c + b.n - 1]) continue;
${todo}
    }
}

int queens(int n) {
    Board b{n, 0, std::vector<bool>(n), std::vector<bool>(2 * n), std::vector<bool>(2 * n)};
    place(b, 0);
    return b.count;
}
`;

export const backtracking: ExerciseTemplate[] = [
  predict(
    "backtracking",
    "What does it print? Take it or leave it",
    `#include <iostream>
#include <vector>

void build(std::size_t i, const std::vector<int>& items, std::vector<int>& chosen) {
    if (i == items.size()) {
        if (chosen.empty()) std::cout << "-";
        for (int x : chosen) std::cout << x;
        std::cout << " ";
        return;
    }
    chosen.push_back(items[i]);  // take items[i]
    build(i + 1, items, chosen);
    chosen.pop_back();  // and leave it
    build(i + 1, items, chosen);
}

int main() {
    std::vector<int> chosen;
    build(0, {1, 2, 3}, chosen);
    std::cout << "\\n";
}
`,
    "123 12 13 1 23 2 3 -",
  ),
  {
    skill: "backtracking",
    rung: 2,
    title: "Fix the orderings",
    promptMd: `\`allOrders(items)\` returns every ordering (permutation) of \`items\`, which are all different and given in increasing order. ${ORDERS} For \`{1, 2, 3}\` that's \`1 2 3 1 3 2 2 1 3 2 3 1 3 1 2 3 2 1\`, but it stops after the first ordering. **Find the fault and fix it.** Up to 9 items; each test must finish within 2 seconds.`,
    functionSignature: "std::vector<int> allOrders(const std::vector<int>& items)",
    call: showCall("allOrders"),
    generator: GEN,
    starterCode: arrange("allOrders", "const std::vector<int>& items", PLAIN_SKIP, ""),
    reference: arrange("allOrders", "const std::vector<int>& items", PLAIN_SKIP, UNMARK),
    bruteForce: `#include <vector>

std::vector<int> allOrders(const std::vector<int>& items) {
    int n = items.size();
    std::vector<int> out, pick(n, 0);
    while (true) {  // every list of n positions, counted like an odometer: keep those that use each position once
        int seen = 0;
        bool distinct = true;
        for (int i : pick) distinct &= !(seen >> i & 1), seen |= 1 << i;
        if (distinct)
            for (int i : pick) out.push_back(items[i]);
        int at = n - 1;
        while (at >= 0 && pick[at] == n - 1) pick[at--] = 0;
        if (at < 0) return out;
        pick[at]++;
    }
}
`,
    cases: [
      { args: "{1, 2, 3}", expected: "1 2 3 1 3 2 2 1 3 2 3 1 3 1 2 3 2 1" },
      { args: "{}", expected: "" },
      { args: "{5}", expected: "5" },
      { args: "{1, 9}", expected: "1 9 9 1" },
      { args: "{3, 7, 8}", expected: "3 7 8 3 8 7 7 3 8 7 8 3 8 3 7 8 7 3" },
      { args: "{1, 2, 3, 4, 5, 6, 7, 8}" },
      { args: "{1, 2, 3, 4, 5, 6, 7, 8, 9}" },
    ],
  },
  {
    skill: "backtracking",
    rung: 3,
    title: "Complete the n queens",
    promptMd: `\`queens(n)\` counts the ways to put n queens on an n × n chessboard so that no two attack each other: no two share a row, a column or a diagonal. It places one queen per row, skipping columns and diagonals already under attack. **Complete the TODO**: place the queen, place the rest, then take it back. For n = 4 that's 2. Up to n = 12; each test must finish within 2 seconds.`,
    functionSignature: "int queens(int n)",
    call: printCall("queens"),
    starterCode: QUEENS("        // TODO: put a queen at (row, c), place the queens on the rows below, then take it back"),
    reference: QUEENS(`        b.column[c] = b.diagonal[row + c] = b.antiDiagonal[row - c + b.n - 1] = true;
        place(b, row + 1);
        b.column[c] = b.diagonal[row + c] = b.antiDiagonal[row - c + b.n - 1] = false;  // undo, to try the next column`),
    bruteForce: `#include <algorithm>
#include <cstdlib>
#include <numeric>
#include <vector>

int queens(int n) {
    std::vector<int> col(n);  // col[r]: the column of row r's queen; every arrangement of columns is tried
    std::iota(col.begin(), col.end(), 0);
    int count = 0;
    do {
        bool safe = true;
        for (int a = 0; a < n; a++)
            for (int b = a + 1; b < n; b++) safe &= std::abs(col[a] - col[b]) != b - a;
        count += safe;
    } while (std::next_permutation(col.begin(), col.end()));
    return count;
}
`,
    cases: [
      { args: "4", expected: "2" },
      { args: "1", expected: "1" },
      { args: "2", expected: "0" },
      { args: "3", expected: "0" },
      { args: "5", expected: "10" },
      { args: "6", expected: "4" },
      { args: "8" },
      { args: "12" },
    ],
  },
  {
    skill: "backtracking",
    rung: 4,
    title: "Extend the orderings to repeated items",
    promptMd: `\`distinctOrders(items)\` lists orderings by backtracking, but it assumes the items are all different and already in increasing order. **Extend it** so items can repeat and come in any order: return each **different** ordering once. ${ORDERS} For \`{1, 1, 2}\` that's \`1 1 2 1 2 1 2 1 1\`. Hint: sort first, and use equal items only from left to right. Up to 11 items; each test must finish within 2 seconds.`,
    functionSignature: "std::vector<int> distinctOrders(std::vector<int> items)",
    call: showCall("distinctOrders"),
    generator: GEN,
    starterCode: arrange("distinctOrders", "std::vector<int> items", PLAIN_SKIP, UNMARK),
    reference: arrange(
      "distinctOrders",
      "std::vector<int> items",
      "        if (used[i] || (i > 0 && items[i] == items[i - 1] && !used[i - 1])) continue;  // an equal item to its left must go first",
      UNMARK,
      "    std::sort(items.begin(), items.end());\n",
    ),
    bruteForce: `#include <algorithm>
#include <numeric>
#include <set>
#include <vector>

std::vector<int> distinctOrders(std::vector<int> items) {
    std::vector<int> pos(items.size());
    std::iota(pos.begin(), pos.end(), 0);
    std::set<std::vector<int>> orders;  // every ordering of the positions; the set drops the repeats and sorts
    do {
        std::vector<int> order;
        for (int p : pos) order.push_back(items[p]);
        orders.insert(order);
    } while (std::next_permutation(pos.begin(), pos.end()));
    std::vector<int> out;
    for (const auto& order : orders) out.insert(out.end(), order.begin(), order.end());
    return out;
}
`,
    cases: [
      { args: "{1, 1, 2}", expected: "1 1 2 1 2 1 2 1 1" },
      { args: "{2, 2}", expected: "2 2" },
      { args: "{}", expected: "" },
      { args: "{3, 1, 3}", expected: "1 3 3 3 1 3 3 3 1" },
      { args: "{2, 1}", expected: "1 2 2 1" },
      { args: "{4, 4, 4}", expected: "4 4 4" },
      { args: "{3, 1, 2, 3, 2, 1, 4, 5}" },
      { args: "{5, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2}" },
    ],
  },
  {
    skill: "backtracking",
    rung: 5,
    title: "Split into k groups of the same total",
    promptMd: `\`splitEvenly(items, k)\` says whether the positive numbers in \`items\` can be split into k groups that all add up to the same total; every number goes into exactly one group. For \`{4, 3, 2, 3, 5, 2, 1}\` and k = 4 the answer is yes: 5, 1 + 4, 2 + 3 and 2 + 3. ${TASK} Up to 16 numbers and k up to 8; each test must finish within 2 seconds.`,
    functionSignature: "bool splitEvenly(std::vector<int> items, int k)",
    call: yesNoCall("splitEvenly"),
    generator: GEN + SPLITTABLE,
    starterCode: `#include <vector>

bool splitEvenly(std::vector<int> items, int k) {
    return false;
}
`,
    reference: `#include <algorithm>
#include <functional>
#include <numeric>
#include <vector>

bool fill(const std::vector<int>& items, std::size_t i, std::vector<int>& load, int target) {
    if (i == items.size()) return true;
    for (std::size_t g = 0; g < load.size(); g++) {
        if (load[g] + items[i] > target) continue;  // prune: this group would overflow
        load[g] += items[i];
        if (fill(items, i + 1, load, target)) return true;
        load[g] -= items[i];
        if (load[g] == 0) break;  // every other empty group would fail the same way
    }
    return false;
}

bool splitEvenly(std::vector<int> items, int k) {
    long long total = std::accumulate(items.begin(), items.end(), 0LL);
    if (total % k != 0) return false;
    std::sort(items.begin(), items.end(), std::greater<int>());  // big numbers first: dead ends show up sooner
    std::vector<int> load(k, 0);
    return fill(items, 0, load, total / k);
}
`,
    bruteForce: `#include <numeric>
#include <vector>

bool splitEvenly(std::vector<int> items, int k) {
    int n = items.size();
    long long total = std::accumulate(items.begin(), items.end(), 0LL);
    if (total % k != 0) return false;
    std::vector<int> group(n, 0);
    bool found = false;
    while (true) {  // every one of the k^n ways to give each number a group
        std::vector<long long> load(k, 0);
        for (int i = 0; i < n; i++) load[group[i]] += items[i];
        bool even = true;
        for (long long l : load) even &= l == total / k;
        found |= even;
        int at = n - 1;
        while (at >= 0 && group[at] == k - 1) group[at--] = 0;
        if (at < 0) return found;
        group[at]++;
    }
}
`,
    cases: [
      { args: "{4, 3, 2, 3, 5, 2, 1}, 4", expected: "yes" },
      { args: "{1, 2, 3, 4}, 3", expected: "no" },
      { args: "{2, 2, 2, 2, 3, 4, 5}, 4", expected: "no" },
      { args: "{5}, 1", expected: "yes" },
      { args: "{1, 1, 1, 1}, 2", expected: "yes" },
      { args: "{10, 10, 10, 7, 7, 7, 7, 7, 7, 6, 6, 6}, 3", expected: "yes" },
      { args: "gen::splittable(521, 3, 3, 100), 3" },
      { args: "gen::ints(522, 10, 1, 30), 3" },
      { args: "gen::splittable(523, 4, 4, 1000), 4" },
    ],
  },
];
