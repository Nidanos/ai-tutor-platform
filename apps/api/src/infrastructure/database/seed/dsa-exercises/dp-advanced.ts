import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

// An n × n table of one-way distances (0 on the diagonal); a tree as parent[i] (parent[0] = -1), each parent at
// most `reach` places before its child; and a tree as shuffled edges on shuffled labels.
const SHAPES = String.raw`
namespace gen {
std::vector<std::vector<int>> distances(std::uint64_t seed, int n, int max) {
    std::vector<std::vector<int>> out;
    for (int i = 0; i < n; i++) {
        out.push_back(ints(seed * 1000003 + i, n, 1, max));
        out[i][i] = 0;
    }
    return out;
}
std::vector<int> parents(std::uint64_t seed, int n, int reach) {
    state = seed;
    std::vector<int> out(n, -1);
    for (int i = 1; i < n; i++) out[i] = (int)between(std::max(0, i - reach), i - 1);
    return out;
}
std::vector<std::pair<int, int>> tree(std::uint64_t seed, int n, int reach) {
    std::vector<int> label = permutation(seed, n);
    std::vector<std::pair<int, int>> out;
    for (int i = 1; i < n; i++) {
        int a = label[i] - 1, b = label[between(std::max(0, i - reach), i - 1)] - 1;
        out.push_back(next() & 1 ? std::pair{a, b} : std::pair{b, a});
    }
    for (int i = (int)out.size() - 1; i > 0; i--) std::swap(out[i], out[between(0, i)]);
    return out;
}
}  // namespace gen
`;

const shortestTour = (close: string) => `#include <algorithm>
#include <climits>
#include <vector>

long long shortestTour(const std::vector<std::vector<int>>& dist) {
    int n = dist.size();
    const long long INF = LLONG_MAX / 4;
    // best[mask][v]: the shortest route that starts at city 0, visits exactly the cities in mask, and ends at v
    std::vector<std::vector<long long>> best(1 << n, std::vector<long long>(n, INF));
    best[1][0] = 0;
    for (int mask = 1; mask < (1 << n); mask++)
        for (int v = 0; v < n; v++) {
            if (best[mask][v] == INF) continue;
            for (int w = 0; w < n; w++)
                if (!(mask >> w & 1)) best[mask | 1 << w][w] = std::min(best[mask | 1 << w][w], best[mask][v] + dist[v][w]);
        }
    long long tour = INF;
    for (int v = 0; v < n; v++) ${close}
    return tour;
}
`;

const bestParty = (step: string) => `#include <algorithm>
#include <vector>

long long bestParty(const std::vector<int>& fun, const std::vector<int>& parent) {
    int n = fun.size();
    std::vector<long long> invited(fun.begin(), fun.end()), notInvited(n, 0);  // the best for each person's team, with or without them
    for (int v = n - 1; v >= 1; v--) {  // everyone comes after their manager, so going backwards finishes each team first
        int p = parent[v];
${step}
    }
    return n ? std::max(invited[0], notInvited[0]) : 0;
}
`;

// Counts the numbers 0..N whose digit sum is S (and, when withK, which leave remainder 0 when divided by K).
const digitCounter = (withK: boolean) => `#include <string>
#include <vector>

struct DigitCounter {
    std::string digits;
    int S, K;
    std::vector<long long> memo;  // for positions no longer held back by N's own digits
    long long count(std::size_t pos, int sum, int rem, bool tight) {
        if (sum > S) return 0;
        if (pos == digits.size()) return sum == S${withK ? " && rem == 0" : ""};
        long long& m = memo[(pos * (S + 1) + sum) * K + rem];
        if (!tight && m != -1) return m;
        int top = tight ? digits[pos] - '0' : 9;
        long long total = 0;
        for (int d = 0; d <= top; d++) total += count(pos + 1, sum + d, ${withK ? "(rem * 10 + d) % K" : "0"}, tight && d == top);
        if (!tight) m = total;
        return total;
    }
};

long long countSpecial(long long N, int S, int K) {
    DigitCounter c{std::to_string(N), S, ${withK ? "K" : "1"}, {}};${withK ? "  // the remainder so far is part of the state" : "  // so far: the digit sum only, whatever the remainder"}
    c.memo.assign(c.digits.size() * (S + 1) * c.K, -1);
    return c.count(0, 0, 0, true);
}
`;

export const dpAdvanced: ExerciseTemplate[] = [
  predict(
    "dp-advanced",
    "What does it print? DP over subsets",
    `#include <bit>
#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> can = {{1, 1, 0}, {1, 0, 1}, {0, 1, 1}};  // can[person][task]
    int n = 3;
    std::vector<long long> ways(1 << n, 0);  // ways[mask]: ways to hand the tasks in mask to the first people
    ways[0] = 1;
    for (int mask = 0; mask < (1 << n); mask++) {
        int person = std::popcount((unsigned)mask);  // the next person to get a task
        if (person == n) continue;
        for (int t = 0; t < n; t++)
            if (!(mask >> t & 1) && can[person][t]) ways[mask | 1 << t] += ways[mask];
    }
    for (long long w : ways) std::cout << w;
    std::cout << "\\n";
}
`,
    "11110112",
  ),
  {
    skill: "dp-advanced",
    rung: 2,
    title: "Fix the travelling salesman",
    promptMd: `\`dist[a][b]\` is the length of the one-way road from city a to city b. \`shortestTour(dist)\` returns the shortest round trip that starts at city 0, visits every city once, and comes back to city 0, using DP over subsets of cities. For \`{{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}}\` that's 80, but its tours come out too short. **Find the fault and fix it.** ${limits("up to 16 cities and roads up to 1,000,000")}`,
    functionSignature: "long long shortestTour(const std::vector<std::vector<int>>& dist)",
    call: printCall("shortestTour"),
    generator: GEN + SHAPES,
    starterCode: shortestTour("tour = std::min(tour, best[(1 << n) - 1][v]);"),
    reference: shortestTour("tour = std::min(tour, best[(1 << n) - 1][v] + dist[v][0]);  // and back home"),
    bruteForce: `#include <algorithm>
#include <climits>
#include <numeric>
#include <vector>

long long shortestTour(const std::vector<std::vector<int>>& dist) {
    int n = dist.size();
    std::vector<int> order(n - 1);  // every order of the other cities
    std::iota(order.begin(), order.end(), 1);
    long long best = LLONG_MAX;
    do {
        long long length = 0;
        int at = 0;
        for (int city : order) length += dist[at][city], at = city;
        best = std::min(best, length + dist[at][0]);
    } while (std::next_permutation(order.begin(), order.end()));
    return best;
}
`,
    cases: [
      { args: "{{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}}", expected: "80" },
      { args: "{{0}}", expected: "0" },
      { args: "{{0, 5}, {5, 0}}", expected: "10" },
      { args: "{{0, 1, 9}, {9, 0, 1}, {1, 9, 0}}", expected: "3" },
      { args: "{{0, 2, 9, 10}, {1, 0, 6, 4}, {15, 7, 0, 8}, {6, 3, 12, 0}}", expected: "21" },
      { args: "gen::distances(581, 9, 1000000)" },
      { args: "gen::distances(582, 16, 1000000)" },
    ],
  },
  {
    skill: "dp-advanced",
    rung: 3,
    title: "Complete the office party",
    promptMd: `A company is a tree: person 0 is the boss, and \`parent[i]\` is person i's manager, always a smaller number (\`parent[0]\` is -1). Inviting person i adds \`fun[i]\` to a party, but no one wants to be at a party with their **direct** manager. \`bestParty(fun, parent)\` returns the most fun a party can have. For each person it keeps the best for their whole team, with them invited and without. **Complete the TODO**, which passes person v's results up to their manager p. For \`{3, 2, 1, 10, 1}\` and \`{-1, 0, 0, 1, 1}\` that's 14: people 0, 3 and 4. ${limits("up to 1,000,000 people with fun up to 1,000,000,000")}`,
    functionSignature: "long long bestParty(const std::vector<int>& fun, const std::vector<int>& parent)",
    call: printCall("bestParty"),
    generator: GEN + SHAPES,
    starterCode: bestParty("        // TODO: if p is invited, v is not; if p isn't, v's team gives whichever of its two is better"),
    reference: bestParty(`        invited[p] += notInvited[v];
        notInvited[p] += std::max(invited[v], notInvited[v]);`),
    bruteForce: `#include <algorithm>
#include <vector>

long long tryAll(const std::vector<int>& fun, const std::vector<int>& parent, std::size_t i, std::vector<bool>& in, long long sum) {
    if (i == fun.size()) return sum;
    long long best = tryAll(fun, parent, i + 1, in, sum);  // leave person i out, or invite them if their manager isn't there
    if (i == 0 || !in[parent[i]]) {
        in[i] = true;
        best = std::max(best, tryAll(fun, parent, i + 1, in, sum + fun[i]));
        in[i] = false;
    }
    return best;
}

long long bestParty(const std::vector<int>& fun, const std::vector<int>& parent) {
    std::vector<bool> in(fun.size(), false);
    return tryAll(fun, parent, 0, in, 0);
}
`,
    cases: [
      { args: "{3, 2, 1, 10, 1}, {-1, 0, 0, 1, 1}", expected: "14" },
      { args: "{5}, {-1}", expected: "5" },
      { args: "{1, 2}, {-1, 0}", expected: "2" },
      { args: "{4, 1, 1, 1}, {-1, 0, 0, 0}", expected: "4" },
      { args: "{1, 5, 5, 5}, {-1, 0, 1, 2}", expected: "10" },
      { args: "{2, 3, 4, 5, 6, 7}, {-1, 0, 0, 1, 1, 2}", expected: "20" },
      { args: "gen::ints(583, 18, 1, 1000), gen::parents(584, 18, 18)" },
      { args: "gen::ints(585, 1000000, 1, 1000000000), gen::parents(586, 1000000, 1000000)" },
      { args: "gen::ints(587, 1000000, 1, 1000000000), gen::parents(588, 1000000, 3)" },
    ],
  },
  {
    skill: "dp-advanced",
    rung: 4,
    title: "Extend the digit count with a remainder",
    promptMd: `\`countSpecial(N, S, K)\` counts numbers digit by digit: it walks N's digits from the left, and \`tight\` says whether the digits so far still equal N's, so the next digit can't go above N's. So far it counts the numbers from 0 to N whose digits add up to S. **Extend it** to count only those that are also **divisible by K**: carry the remainder of the number so far as part of the state. For N = 100, S = 1 and K = 2 that's 2 (10 and 100). N is up to 10^18, S up to 162 and K from 1 to 100; each test must finish within 2 seconds.`,
    functionSignature: "long long countSpecial(long long N, int S, int K)",
    call: printCall("countSpecial"),
    starterCode: digitCounter(false),
    reference: digitCounter(true),
    bruteForce: `long long countSpecial(long long N, int S, int K) {
    long long count = 0;
    for (long long x = 0; x <= N; x++) {  // every number up to N
        int sum = 0;
        for (long long y = x; y > 0; y /= 10) sum += y % 10;
        count += sum == S && x % K == 0;
    }
    return count;
}
`,
    cases: [
      { args: "100, 1, 2", expected: "2" },
      { args: "100, 1, 1", expected: "3" },
      { args: "20, 2, 2", expected: "2" },
      { args: "0, 0, 1", expected: "1" },
      { args: "1000000, 1, 7", expected: "0" },
      { args: "99, 9, 3", expected: "10" },
      { args: "1000, 10, 5", expected: "15" },
      { args: "1000000, 20, 7" },
      { args: "999999, 27, 13" },
      { args: "1000000000000000000, 90, 97" },
    ],
  },
  {
    skill: "dp-advanced",
    rung: 5,
    title: "Every node's total distance",
    promptMd: `A tree has n nodes, numbered from 0 to n - 1, joined by the n - 1 \`edges\`. \`distanceSums(n, edges)\` returns, for every node, the sum of its distances (in edges) to all the other nodes. For n = 6 and \`{{0, 1}, {0, 2}, {2, 3}, {2, 4}, {2, 5}}\` that's \`8 12 6 10 10 10\`. Hint: work out node 0's answer, then see how the answer changes when you move from a node to its neighbour. ${TASK} ${limits("up to 200,000 nodes")}`,
    functionSignature: "std::vector<long long> distanceSums(int n, const std::vector<std::pair<int, int>>& edges)",
    call: showCall("distanceSums"),
    generator: GEN + SHAPES,
    starterCode: `#include <utility>
#include <vector>

std::vector<long long> distanceSums(int n, const std::vector<std::pair<int, int>>& edges) {
    return {};
}
`,
    reference: `#include <utility>
#include <vector>

std::vector<long long> distanceSums(int n, const std::vector<std::pair<int, int>>& edges) {
    std::vector<std::vector<int>> adj(n);
    for (auto [a, b] : edges) adj[a].push_back(b), adj[b].push_back(a);
    std::vector<int> order, parent(n, -1);  // a search order from node 0: every parent comes before its children
    std::vector<bool> seen(n, false);
    std::vector<int> stack = {0};
    seen[0] = true;
    while (!stack.empty()) {
        int u = stack.back();
        stack.pop_back();
        order.push_back(u);
        for (int v : adj[u])
            if (!seen[v]) seen[v] = true, parent[v] = u, stack.push_back(v);
    }
    std::vector<long long> size(n, 1), below(n, 0);  // below[v]: the distances from v down to its subtree
    for (int i = n - 1; i > 0; i--) {
        int v = order[i], p = parent[v];
        size[p] += size[v];
        below[p] += below[v] + size[v];
    }
    std::vector<long long> sum(n);
    sum[0] = below[0];
    for (int i = 1; i < n; i++) {  // moving from the parent to v: v's subtree gets 1 closer, everyone else 1 further
        int v = order[i];
        sum[v] = sum[parent[v]] - size[v] + (n - size[v]);
    }
    return sum;
}
`,
    bruteForce: `#include <queue>
#include <utility>
#include <vector>

std::vector<long long> distanceSums(int n, const std::vector<std::pair<int, int>>& edges) {
    std::vector<std::vector<int>> adj(n);
    for (auto [a, b] : edges) adj[a].push_back(b), adj[b].push_back(a);
    std::vector<long long> sum(n, 0);
    for (int s = 0; s < n; s++) {  // a fresh search from every node
        std::vector<int> dist(n, -1);
        std::queue<int> q;
        dist[s] = 0;
        q.push(s);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            sum[s] += dist[u];
            for (int v : adj[u])
                if (dist[v] == -1) dist[v] = dist[u] + 1, q.push(v);
        }
    }
    return sum;
}
`,
    cases: [
      { args: "6, {{0, 1}, {0, 2}, {2, 3}, {2, 4}, {2, 5}}", expected: "8 12 6 10 10 10" },
      { args: "1, {}", expected: "0" },
      { args: "2, {{1, 0}}", expected: "1 1" },
      { args: "3, {{0, 1}, {1, 2}}", expected: "3 2 3" },
      { args: "4, {{3, 0}, {3, 1}, {3, 2}}", expected: "5 5 5 3" },
      { args: "2000, gen::tree(589, 2000, 2000)" },
      { args: "200000, gen::tree(590, 200000, 200000)" },
      { args: "200000, gen::tree(591, 200000, 3)" },
    ],
  },
];
