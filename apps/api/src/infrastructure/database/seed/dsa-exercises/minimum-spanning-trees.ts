import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits } from "./harness.js";

const CABLES = "Buildings are numbered from 0 to n - 1, and each cable `{u, v, w}` would join buildings u and v (both ways) for a cost of w, from 1 to 1,000,000,000.";

const PQ = "std::priority_queue<std::pair<long long, int>, std::vector<std::pair<long long, int>>, std::greater<>>";

// n random points with coordinates from 0 to max.
const POINTS = String.raw`
namespace gen {
std::vector<std::pair<int, int>> points(std::uint64_t seed, int n, int max) {
    state = seed;
    std::vector<std::pair<int, int>> out(n);
    for (auto& [x, y] : out) x = (int)between(0, max), y = (int)between(0, max);
    return out;
}
}  // namespace gen
`;

const FIND = `int find(std::vector<int>& parent, int x) { return parent[x] == x ? x : parent[x] = find(parent, parent[x]); }
`;

// Prim's algorithm without a heap: n times, scan every building for the cheapest one to add. O(n^2).
const SLOW_PRIM = `#include <array>
#include <climits>
#include <utility>
#include <vector>

long long slowPrim(int n, const std::vector<std::array<int, 3>>& cables, std::vector<long long> key) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : cables) adj[u].push_back({v, w}), adj[v].push_back({u, w});
    std::vector<bool> inTree(n, false);
    long long total = 0;
    for (int step = 0; step < n; step++) {
        int u = -1;
        for (int v = 0; v < n; v++)
            if (!inTree[v] && (u < 0 || key[v] < key[u])) u = v;
        if (key[u] == LLONG_MAX) return -1;
        inTree[u] = true, total += key[u];
        for (auto [v, w] : adj[u])
            if (!inTree[v] && w < key[v]) key[v] = w;
    }
    return total;
}
`;

const startAt0 = (fn: string, params: string) => `${SLOW_PRIM}
long long ${fn}(${params}) {
    std::vector<long long> key(n, LLONG_MAX);
    key[0] = 0;
    return slowPrim(n, cables, key);
}
`;

export const minimumSpanningTrees: ExerciseTemplate[] = [
  predict(
    "minimum-spanning-trees",
    "What does it print? Kruskal's algorithm",
    `#include <algorithm>
#include <array>
#include <iostream>
#include <vector>

std::vector<int> parent = {0, 1, 2, 3, 4};

int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }

int main() {
    std::vector<std::array<int, 3>> edges = {{4, 0, 1}, {1, 1, 2}, {3, 0, 2}, {2, 2, 3}, {5, 1, 3}, {1, 3, 4}, {6, 0, 4}};  // {cost, u, v}
    std::sort(edges.begin(), edges.end());
    int total = 0;
    for (auto [w, u, v] : edges) {
        int a = find(u), b = find(v);
        if (a == b) continue;
        parent[a] = b;
        total += w;
        std::cout << u << v << " ";
    }
    std::cout << total << "\\n";
}
`,
    "12 34 23 02 7",
  ),
  {
    skill: "minimum-spanning-trees",
    rung: 2,
    title: "Fix Kruskal's algorithm",
    promptMd: `${CABLES} \`cheapestNetwork(n, cables)\` returns the lowest total cost of cables that joins every building, directly or through others, or -1 if no choice of cables does. For n = 4 and \`{{0, 1, 1}, {1, 2, 2}, {2, 3, 1}, {0, 3, 5}, {0, 2, 3}}\` that's 4, but it comes out far too high. **Find the fault and fix it.** ${limits("up to 200,000 buildings and 500,000 cables")}`,
    functionSignature: "long long cheapestNetwork(int n, std::vector<std::array<int, 3>> cables)",
    call: printCall("cheapestNetwork"),
    generator: GEN + GRAPH,
    starterCode: `#include <algorithm>
#include <array>
#include <numeric>
#include <vector>

${FIND}
long long cheapestNetwork(int n, std::vector<std::array<int, 3>> cables) {
    std::sort(cables.begin(), cables.end(), [](const auto& a, const auto& b) { return a[2] > b[2]; });
    std::vector<int> parent(n);
    std::iota(parent.begin(), parent.end(), 0);
    long long total = 0;
    int joined = 1;
    for (auto [u, v, w] : cables) {
        int a = find(parent, u), b = find(parent, v);
        if (a == b) continue;  // already joined: this cable would close a loop
        parent[a] = b;
        total += w, joined++;
    }
    return joined == n ? total : -1;
}
`,
    reference: `#include <algorithm>
#include <array>
#include <numeric>
#include <vector>

${FIND}
long long cheapestNetwork(int n, std::vector<std::array<int, 3>> cables) {
    std::sort(cables.begin(), cables.end(), [](const auto& a, const auto& b) { return a[2] < b[2]; });  // cheapest first
    std::vector<int> parent(n);
    std::iota(parent.begin(), parent.end(), 0);
    long long total = 0;
    int joined = 1;
    for (auto [u, v, w] : cables) {
        int a = find(parent, u), b = find(parent, v);
        if (a == b) continue;  // already joined: this cable would close a loop
        parent[a] = b;
        total += w, joined++;
    }
    return joined == n ? total : -1;
}
`,
    bruteForce: startAt0("cheapestNetwork", "int n, std::vector<std::array<int, 3>> cables"),
    cases: [
      { args: "4, {{0, 1, 1}, {1, 2, 2}, {2, 3, 1}, {0, 3, 5}, {0, 2, 3}}", expected: "4" },
      { args: "1, {}", expected: "0" },
      { args: "3, {{0, 1, 4}, {0, 1, 2}}", expected: "-1" },
      { args: "3, {{0, 1, 4}, {0, 1, 2}, {1, 2, 3}}", expected: "5" },
      { args: "5, {{0, 1, 1000000000}, {1, 2, 1000000000}, {2, 3, 1000000000}, {3, 4, 1000000000}}", expected: "4000000000" },
      { args: "2000, gen::connected(486, 2000, 6000, 1000000000)" },
      { args: "2000, gen::weightedEdges(487, 2000, 6000, 1000)" },
      { args: "200000, gen::connected(488, 200000, 500000, 1000000000)" },
    ],
  },
  {
    skill: "minimum-spanning-trees",
    rung: 3,
    title: "Complete Prim's algorithm",
    promptMd: `${CABLES} \`primCost(n, cables)\` returns the lowest total cost of cables that joins every building, or -1 if no choice of cables does. It grows one tree from building 0: a min-heap holds cables leaving the tree, and the cheapest one that reaches a new building adds that building. **Complete the TODO**, after a building joins the tree. ${limits("up to 200,000 buildings and 500,000 cables")}`,
    functionSignature: "long long primCost(int n, const std::vector<std::array<int, 3>>& cables)",
    call: printCall("primCost"),
    generator: GEN + GRAPH,
    starterCode: `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

long long primCost(int n, const std::vector<std::array<int, 3>>& cables) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : cables) adj[u].push_back({v, w}), adj[v].push_back({u, w});
    std::vector<bool> inTree(n, false);
    ${PQ} pq;  // (cable cost, building it reaches)
    pq.push({0, 0});
    long long total = 0;
    int added = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top();
        pq.pop();
        if (inTree[u]) continue;  // reached more cheaply already
        inTree[u] = true, total += w, added++;
        // TODO: offer every cable from u to a building not in the tree yet
    }
    return added == n ? total : -1;
}
`,
    reference: `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

long long primCost(int n, const std::vector<std::array<int, 3>>& cables) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : cables) adj[u].push_back({v, w}), adj[v].push_back({u, w});
    std::vector<bool> inTree(n, false);
    ${PQ} pq;  // (cable cost, building it reaches)
    pq.push({0, 0});
    long long total = 0;
    int added = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top();
        pq.pop();
        if (inTree[u]) continue;  // reached more cheaply already
        inTree[u] = true, total += w, added++;
        for (auto [v, cost] : adj[u])
            if (!inTree[v]) pq.push({cost, v});
    }
    return added == n ? total : -1;
}
`,
    bruteForce: startAt0("primCost", "int n, const std::vector<std::array<int, 3>>& cables"),
    cases: [
      { args: "4, {{0, 1, 1}, {1, 2, 2}, {2, 3, 1}, {0, 3, 5}, {0, 2, 3}}", expected: "4" },
      { args: "1, {}", expected: "0" },
      { args: "2, {}", expected: "-1" },
      { args: "3, {{2, 1, 7}, {1, 0, 2}, {0, 2, 6}}", expected: "8" },
      { args: "4, {{0, 1, 3}, {2, 3, 1}}", expected: "-1" },
      { args: "2000, gen::connected(489, 2000, 6000, 1000000000)" },
      { args: "200000, gen::connected(490, 200000, 500000, 1000000000)" },
    ],
  },
  {
    skill: "minimum-spanning-trees",
    rung: 4,
    title: "Extend the network with power stations",
    promptMd: `Every town needs power. Building a power station in town i costs \`station[i]\`; a cable \`{u, v, w}\` joins towns u and v for a cost of w; and a town has power if it has a station or cables join it to a town that does. Towns are numbered from 0, and every cost runs from 1 to 1,000,000. \`powerAll(station, cables)\` runs Kruskal's algorithm and, so far, returns the cheapest cable network joining every town, or -1. **Extend it** to return the cheapest total cost of stations and cables that powers every town. For \`{5, 4, 6}\` and \`{{0, 1, 1}, {1, 2, 3}}\` that's 8. Hint: a station is a cable to one extra, imaginary town. ${limits("up to 200,000 towns and 500,000 cables")}`,
    functionSignature: "long long powerAll(const std::vector<int>& station, std::vector<std::array<int, 3>> cables)",
    call: printCall("powerAll"),
    generator: GEN + GRAPH,
    starterCode: `#include <algorithm>
#include <array>
#include <numeric>
#include <vector>

${FIND}
long long powerAll(const std::vector<int>& station, std::vector<std::array<int, 3>> cables) {
    int n = station.size();
    std::sort(cables.begin(), cables.end(), [](const auto& a, const auto& b) { return a[2] < b[2]; });
    std::vector<int> parent(n);
    std::iota(parent.begin(), parent.end(), 0);
    long long total = 0;
    int joined = 1;
    for (auto [u, v, w] : cables) {
        int a = find(parent, u), b = find(parent, v);
        if (a == b) continue;
        parent[a] = b;
        total += w, joined++;
    }
    return joined == n ? total : -1;
}
`,
    reference: `#include <algorithm>
#include <array>
#include <numeric>
#include <vector>

${FIND}
long long powerAll(const std::vector<int>& station, std::vector<std::array<int, 3>> cables) {
    int n = station.size();
    for (int i = 0; i < n; i++) cables.push_back({n, i, station[i]});  // town n is the imaginary power plant
    std::sort(cables.begin(), cables.end(), [](const auto& a, const auto& b) { return a[2] < b[2]; });
    std::vector<int> parent(n + 1);
    std::iota(parent.begin(), parent.end(), 0);
    long long total = 0;
    for (auto [u, v, w] : cables) {
        int a = find(parent, u), b = find(parent, v);
        if (a == b) continue;
        parent[a] = b;
        total += w;
    }
    return total;  // every town has a cable to the plant, so all n + 1 always end up joined
}
`,
    bruteForce: `${SLOW_PRIM}
long long powerAll(const std::vector<int>& station, std::vector<std::array<int, 3>> cables) {
    std::vector<long long> key(station.begin(), station.end());  // the plant is already in the tree
    return slowPrim(station.size(), cables, key);
}
`,
    cases: [
      { args: "{5, 4, 6}, {{0, 1, 1}, {1, 2, 3}}", expected: "8" },
      { args: "{7}, {}", expected: "7" },
      { args: "{1, 1, 1}, {{0, 1, 5}, {1, 2, 5}}", expected: "3" },
      { args: "{10, 10}, {{0, 1, 1}, {0, 1, 3}}", expected: "11" },
      { args: "{3, 100, 100, 100}, {{0, 1, 2}, {1, 2, 2}, {2, 3, 2}, {0, 3, 50}}", expected: "9" },
      { args: "{2, 9, 2}, {{0, 1, 8}, {1, 2, 3}}", expected: "7" },
      { args: "gen::ints(491, 2000, 1, 1000000), gen::weightedEdges(492, 2000, 6000, 1000000)" },
      { args: "gen::ints(493, 200000, 1, 1000000), gen::weightedEdges(494, 200000, 500000, 1000000)" },
    ],
  },
  {
    skill: "minimum-spanning-trees",
    rung: 5,
    title: "Join every point at the lowest cost",
    promptMd: `Points on a grid have whole-number coordinates. Joining two points costs their Manhattan distance, \`|x1 - x2| + |y1 - y2|\`. \`connectPoints(points)\` returns the lowest total cost to join all the points, directly or through others; any two points can be joined. For \`{{0, 0}, {2, 2}, {3, 10}, {5, 2}, {7, 0}}\` that's 20. ${TASK} ${limits("up to 5,000 points with coordinates up to 1,000,000")}`,
    functionSignature: "long long connectPoints(const std::vector<std::pair<int, int>>& points)",
    call: printCall("connectPoints"),
    generator: GEN + POINTS,
    starterCode: `#include <utility>
#include <vector>

long long connectPoints(const std::vector<std::pair<int, int>>& points) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <climits>
#include <cstdlib>
#include <utility>
#include <vector>

long long connectPoints(const std::vector<std::pair<int, int>>& points) {
    int n = points.size();
    auto cost = [&](int a, int b) { return (long long)std::abs(points[a].first - points[b].first) + std::abs(points[a].second - points[b].second); };
    // Every pair can be joined, so the graph is dense: Prim's algorithm with a plain array, O(n^2), beats a heap here.
    std::vector<long long> key(n, LLONG_MAX);
    std::vector<bool> inTree(n, false);
    if (n > 0) key[0] = 0;
    long long total = 0;
    for (int step = 0; step < n; step++) {
        int u = -1;
        for (int v = 0; v < n; v++)
            if (!inTree[v] && (u < 0 || key[v] < key[u])) u = v;
        inTree[u] = true, total += key[u];
        for (int v = 0; v < n; v++)
            if (!inTree[v]) key[v] = std::min(key[v], cost(u, v));
    }
    return total;
}
`,
    bruteForce: `#include <climits>
#include <cstdlib>
#include <utility>
#include <vector>

long long connectPoints(const std::vector<std::pair<int, int>>& points) {
    int n = points.size();
    auto cost = [&](int a, int b) { return (long long)std::abs(points[a].first - points[b].first) + std::abs(points[a].second - points[b].second); };
    std::vector<bool> inTree(n, false);
    if (n > 0) inTree[0] = true;
    long long total = 0;
    for (int added = 1; added < n; added++) {  // each time, try every pair across the tree's edge
        long long best = LLONG_MAX;
        int pick = -1;
        for (int a = 0; a < n; a++)
            if (inTree[a])
                for (int b = 0; b < n; b++)
                    if (!inTree[b] && cost(a, b) < best) best = cost(a, b), pick = b;
        inTree[pick] = true, total += best;
    }
    return total;
}
`,
    cases: [
      { args: "{{0, 0}, {2, 2}, {3, 10}, {5, 2}, {7, 0}}", expected: "20" },
      { args: "{{3, 12}, {-2, 5}, {-4, 1}}", expected: "18" },
      { args: "{{0, 0}}", expected: "0" },
      { args: "{}", expected: "0" },
      { args: "{{1, 1}, {1, 1}, {1, 1}}", expected: "0" },
      { args: "{{0, 0}, {1000000, 1000000}, {0, 1000000}, {1000000, 0}}", expected: "3000000" },
      { args: "gen::points(484, 300, 1000000)" },
      { args: "gen::points(485, 5000, 1000000)" },
    ],
  },
];
