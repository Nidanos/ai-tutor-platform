import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits } from "../dsa-exercises/harness.js";

// Graphs, part 2: weighted paths, spanning trees, components and flow.
export const weightedGraphs: ExerciseTemplate[] = [
  // ── shortest-paths ──
  predict(
    "shortest-paths",
    "What does it print? Bellman-Ford, round by round",
    `#include <array>
#include <iostream>
#include <vector>

int main() {
    const int INF = 1000000;
    std::vector<std::array<int, 3>> edges = {{2, 3, 2}, {1, 2, -3}, {0, 2, 5}, {0, 1, 4}};  // one-way {u, v, w}
    std::vector<int> dist = {0, INF, INF, INF};
    int rounds = 0;
    for (bool changed = true; changed;) {
        changed = false, rounds++;
        for (auto [u, v, w] : edges)
            if (dist[u] != INF && dist[u] + w < dist[v]) dist[v] = dist[u] + w, changed = true;
        if (!changed) break;
        for (int d : dist) std::cout << (d == INF ? std::string("-") : std::to_string(d));
        std::cout << " ";
    }
    std::cout << rounds << "\\n";
}
`,
    "045- 0417 0413 4",
  ),
  {
    skill: "shortest-paths",
    rung: 5,
    title: "The cheapest trip with few stops",
    promptMd: `Cities are numbered from 0 to n - 1, and each flight \`{u, v, w}\` goes one way from u to v for a price of w (1 to 10,000). Write \`long long cheapestWithStops(int n, const std::vector<std::array<int, 3>>& flights, int src, int dst, int k)\` that returns the cheapest way from \`src\` to \`dst\` with **at most k stops** in between (so at most k + 1 flights), or -1 if there is none. For n = 3, \`{{0, 1, 100}, {1, 2, 100}, {0, 2, 500}}\`, 0 → 2 with k = 1 that's 200; with k = 0 it's 500. Hint: Bellman-Ford's round i finds the cheapest trips of at most i flights, if each round reads only the previous round's prices. ${TASK} ${limits("up to 1,000 cities, 10,000 flights and k up to 999")}`,
    functionSignature: "long long cheapestWithStops(int n, const std::vector<std::array<int, 3>>& flights, int src, int dst, int k)",
    call: printCall("cheapestWithStops"),
    generator: GEN + GRAPH,
    starterCode: `#include <array>
#include <vector>

long long cheapestWithStops(int n, const std::vector<std::array<int, 3>>& flights, int src, int dst, int k) {
    return -1;
}
`,
    reference: `#include <array>
#include <vector>

long long cheapestWithStops(int n, const std::vector<std::array<int, 3>>& flights, int src, int dst, int k) {
    std::vector<long long> cost(n, -1);
    cost[src] = 0;
    for (int round = 0; round <= k; round++) {  // round i: the cheapest with at most i + 1 flights
        std::vector<long long> next = cost;  // read the old prices only, so one round adds one flight at most
        for (auto [u, v, w] : flights)
            if (cost[u] != -1 && (next[v] == -1 || cost[u] + w < next[v])) next[v] = cost[u] + w;
        cost = next;
    }
    return cost[dst];
}
`,
    bruteForce: `#include <array>
#include <vector>

void walk(const std::vector<std::vector<std::pair<int, int>>>& adj, int u, int dst, int flightsLeft, long long spent, long long& best) {
    if (u == dst && (best == -1 || spent < best)) best = spent;
    if (flightsLeft == 0) return;
    for (auto [v, w] : adj[u]) walk(adj, v, dst, flightsLeft - 1, spent + w, best);  // every route of up to k + 1 flights
}

long long cheapestWithStops(int n, const std::vector<std::array<int, 3>>& flights, int src, int dst, int k) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : flights) adj[u].push_back({v, w});
    long long best = -1;
    walk(adj, src, dst, k + 1, 0, best);
    return best;
}
`,
    cases: [
      { args: "3, {{0, 1, 100}, {1, 2, 100}, {0, 2, 500}}, 0, 2, 1", expected: "200" },
      { args: "3, {{0, 1, 100}, {1, 2, 100}, {0, 2, 500}}, 0, 2, 0", expected: "500" },
      { args: "4, {{0, 1, 100}, {1, 2, 100}, {2, 0, 100}, {1, 3, 600}, {2, 3, 200}}, 0, 3, 1", expected: "700" },
      { args: "3, {{0, 1, 100}, {1, 2, 100}}, 0, 2, 0", expected: "-1" },
      { args: "2, {{0, 1, 5}, {1, 0, 5}}, 1, 1, 0", expected: "0" },
      { args: "4, {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 10}}, 0, 3, 2", expected: "3" },
      { args: "50, gen::weightedEdges(778, 50, 300, 10000), 0, 49, 4" },
      { args: "1000, gen::weightedEdges(779, 1000, 10000, 10000), 0, 999, 60" },
    ],
  },

  // ── minimum-spanning-trees ──
  predict(
    "minimum-spanning-trees",
    "What does it print? Prim's algorithm on a table",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> w = {{0, 2, 0, 6, 0}, {2, 0, 3, 8, 5}, {0, 3, 0, 0, 7}, {6, 8, 0, 0, 9}, {0, 5, 7, 9, 0}};  // 0: no cable
    int n = 5, total = 0;
    std::vector<int> key(n, 1000);
    std::vector<bool> in(n, false);
    key[0] = 0;
    for (int step = 0; step < n; step++) {
        int u = -1;
        for (int v = 0; v < n; v++)
            if (!in[v] && (u < 0 || key[v] < key[u])) u = v;
        in[u] = true, total += key[u];
        std::cout << u;
        for (int v = 0; v < n; v++)
            if (w[u][v] && !in[v] && w[u][v] < key[v]) key[v] = w[u][v];
    }
    std::cout << " " << total << "\\n";
}
`,
    "01243 16",
  ),
  {
    skill: "minimum-spanning-trees",
    rung: 5,
    title: "The gentlest route's steepest road",
    promptMd: `Towns are numbered from 0 to n - 1, and each road \`{u, v, w}\` joins u and v both ways with a steepness of w. Write \`int gentlestRoute(int n, std::vector<std::array<int, 3>> roads, int s, int t)\` that returns the smallest possible value of the **steepest** road on a route from s to t (0 if s = t), or -1 if t can't be reached. For n = 4, \`{{0, 1, 5}, {1, 3, 4}, {0, 2, 3}, {2, 3, 6}}\`, s = 0 and t = 3 that's 5. Hint: add roads gentlest first, as Kruskal's algorithm does, until s and t are joined. ${TASK} ${limits("up to 100,000 towns and 300,000 roads")}`,
    functionSignature: "int gentlestRoute(int n, std::vector<std::array<int, 3>> roads, int s, int t)",
    call: printCall("gentlestRoute"),
    generator: GEN + GRAPH,
    starterCode: `#include <array>
#include <vector>

int gentlestRoute(int n, std::vector<std::array<int, 3>> roads, int s, int t) {
    return -1;
}
`,
    reference: `#include <algorithm>
#include <array>
#include <numeric>
#include <vector>

int find(std::vector<int>& parent, int x) { return parent[x] == x ? x : parent[x] = find(parent, parent[x]); }

int gentlestRoute(int n, std::vector<std::array<int, 3>> roads, int s, int t) {
    if (s == t) return 0;
    std::sort(roads.begin(), roads.end(), [](const auto& a, const auto& b) { return a[2] < b[2]; });
    std::vector<int> parent(n);
    std::iota(parent.begin(), parent.end(), 0);
    for (auto [u, v, w] : roads) {
        parent[find(parent, u)] = find(parent, v);
        if (find(parent, s) == find(parent, t)) return w;  // the road that first joins them is the answer
    }
    return -1;
}
`,
    bruteForce: `#include <algorithm>
#include <array>
#include <vector>

int gentlestRoute(int n, std::vector<std::array<int, 3>> roads, int s, int t) {
    if (s == t) return 0;
    std::vector<int> limits;
    for (auto& r : roads) limits.push_back(r[2]);
    std::sort(limits.begin(), limits.end());
    for (int limit : limits) {  // try each steepness in turn: a fresh search over the roads no steeper than it
        std::vector<std::vector<int>> adj(n);
        for (auto [u, v, w] : roads)
            if (w <= limit) adj[u].push_back(v), adj[v].push_back(u);
        std::vector<bool> seen(n, false);
        std::vector<int> stack = {s};
        seen[s] = true;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : adj[u])
                if (!seen[v]) seen[v] = true, stack.push_back(v);
        }
        if (seen[t]) return limit;
    }
    return -1;
}
`,
    cases: [
      { args: "4, {{0, 1, 5}, {1, 3, 4}, {0, 2, 3}, {2, 3, 6}}, 0, 3", expected: "5" },
      { args: "3, {{0, 1, 7}, {1, 2, 7}}, 0, 0", expected: "0" },
      { args: "3, {{0, 1, 2}, {1, 0, 9}}, 0, 2", expected: "-1" },
      { args: "2, {{0, 1, 9}, {0, 1, 3}}, 1, 0", expected: "3" },
      { args: "5, {{0, 1, 1}, {1, 2, 10}, {0, 3, 4}, {3, 4, 4}, {4, 2, 4}}, 0, 2", expected: "4" },
      { args: "200, gen::connected(780, 200, 600, 1000), 0, 199" },
      { args: "100000, gen::connected(781, 100000, 300000, 1000000000), 0, 99999" },
    ],
  },

  // ── advanced-graphs ──
  predict(
    "advanced-graphs",
    "What does it print? Kosaraju's components",
    `#include <iostream>
#include <utility>
#include <vector>

int n = 7;
std::vector<std::vector<int>> adj(n), radj(n);
std::vector<int> order, comp(n, -1);
std::vector<bool> seen(n, false);

void forward(int u) {
    seen[u] = true;
    for (int v : adj[u])
        if (!seen[v]) forward(v);
    order.push_back(u);
}

void backward(int u, int c) {
    comp[u] = c;
    for (int v : radj[u])
        if (comp[v] == -1) backward(v, c);
}

int main() {
    for (auto [a, b] : std::vector<std::pair<int, int>>{{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}, {4, 5}, {5, 3}, {6, 5}})
        adj[a].push_back(b), radj[b].push_back(a);
    for (int s = 0; s < n; s++)
        if (!seen[s]) forward(s);
    int count = 0;
    for (int i = n - 1; i >= 0; i--)
        if (comp[order[i]] == -1) backward(order[i], count++);
    for (int c : comp) std::cout << c;
    std::cout << " " << count << "\\n";
}
`,
    "1112220 3",
  ),
  {
    skill: "advanced-graphs",
    rung: 5,
    title: "The biggest circle of friends",
    promptMd: `People are numbered from 0 to n - 1, and each pair \`{a, b}\` is a one-way link: a can pass a message to b. Write \`int biggestCircle(int n, const std::vector<std::pair<int, int>>& links)\` that returns the size of the biggest group of people who can all reach each other, directly or through others (one person on their own counts as a group of 1). For n = 5 and \`{{0, 1}, {1, 2}, {2, 0}, {3, 4}}\` that's 3. ${TASK} ${limits("up to 100,000 people and 150,000 links")}`,
    functionSignature: "int biggestCircle(int n, const std::vector<std::pair<int, int>>& links)",
    call: printCall("biggestCircle"),
    generator: GEN + GRAPH,
    starterCode: `#include <utility>
#include <vector>

int biggestCircle(int n, const std::vector<std::pair<int, int>>& links) {
    return 1;
}
`,
    reference: `#include <algorithm>
#include <utility>
#include <vector>

struct Tarjan {
    std::vector<std::vector<int>> adj;
    std::vector<int> disc, low, stack;
    std::vector<bool> onStack;
    int timer = 0, biggest = 0;
    void dfs(int u) {
        disc[u] = low[u] = timer++;
        stack.push_back(u), onStack[u] = true;
        for (int v : adj[u]) {
            if (disc[v] == -1) dfs(v), low[u] = std::min(low[u], low[v]);
            else if (onStack[v]) low[u] = std::min(low[u], disc[v]);
        }
        if (low[u] != disc[u]) return;  // u is the first of its group reached: pop the whole group
        int size = 0;
        for (int v = -1; v != u; size++) v = stack.back(), stack.pop_back(), onStack[v] = false;
        biggest = std::max(biggest, size);
    }
};

int biggestCircle(int n, const std::vector<std::pair<int, int>>& links) {
    Tarjan t{std::vector<std::vector<int>>(n), std::vector<int>(n, -1), std::vector<int>(n), {}, std::vector<bool>(n, false)};
    for (auto [a, b] : links) t.adj[a].push_back(b);
    for (int s = 0; s < n; s++)
        if (t.disc[s] == -1) t.dfs(s);
    return t.biggest;
}
`,
    bruteForce: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<bool> reach(const std::vector<std::vector<int>>& adj, int s) {
    std::vector<bool> seen(adj.size(), false);
    std::vector<int> stack = {s};
    seen[s] = true;
    while (!stack.empty()) {
        int u = stack.back();
        stack.pop_back();
        for (int v : adj[u])
            if (!seen[v]) seen[v] = true, stack.push_back(v);
    }
    return seen;
}

int biggestCircle(int n, const std::vector<std::pair<int, int>>& links) {
    std::vector<std::vector<int>> adj(n), radj(n);
    for (auto [a, b] : links) adj[a].push_back(b), radj[b].push_back(a);
    int biggest = 0;
    for (int s = 0; s < n; s++) {  // s's group: everyone s reaches who also reaches s, found from scratch
        std::vector<bool> from = reach(adj, s), to = reach(radj, s);
        int size = 0;
        for (int v = 0; v < n; v++) size += from[v] && to[v];
        biggest = std::max(biggest, size);
    }
    return biggest;
}
`,
    cases: [
      { args: "5, {{0, 1}, {1, 2}, {2, 0}, {3, 4}}", expected: "3" },
      { args: "3, {}", expected: "1" },
      { args: "1, {}", expected: "1" },
      { args: "4, {{0, 1}, {1, 0}, {2, 3}, {3, 2}, {1, 2}}", expected: "2" },
      { args: "4, {{0, 1}, {1, 2}, {2, 3}, {3, 0}}", expected: "4" },
      { args: "6, {{0, 1}, {1, 0}, {2, 3}, {3, 4}, {4, 2}, {4, 5}}", expected: "3" },
      { args: "1000, gen::edges(782, 1000, 1500)" },
      { args: "100000, gen::edges(783, 100000, 150000)" },
    ],
  },

  // ── network-flow ──
  predict(
    "network-flow",
    "What does it print? Matching, with a worker moved along",
    `#include <iostream>
#include <vector>

std::vector<std::vector<int>> canDo = {{0, 1}, {0}, {1, 2}};  // the jobs each worker can do
std::vector<int> owner(3, -1), tried(3, -1);

bool assign(int w, int round) {
    for (int j : canDo[w]) {
        if (tried[j] == round) continue;
        tried[j] = round;
        if (owner[j] == -1 || assign(owner[j], round)) {
            owner[j] = w;
            return true;
        }
    }
    return false;
}

int main() {
    int matched = 0;
    for (int w = 0; w < 3; w++) matched += assign(w, w);
    for (int o : owner) std::cout << o;
    std::cout << " " << matched << "\\n";
}
`,
    "102 3",
  ),
  {
    skill: "network-flow",
    rung: 5,
    title: "Routes that share no road",
    promptMd: `Junctions are numbered from 0 to n - 1, and each pair \`{u, v}\` is a one-way road from u to v (two junctions can be joined by several roads). Write \`int separateRoutes(int n, const std::vector<std::pair<int, int>>& roads, int s, int t)\` that returns the most routes from s to t that can be driven at the same time with no road used by two of them (s ≠ t). For n = 4, \`{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {1, 2}}\`, s = 0 and t = 3 that's 2. Hint: it's a maximum flow with every road carrying 1. ${TASK} Up to 200 junctions and 2,000 roads.`,
    functionSignature: "int separateRoutes(int n, const std::vector<std::pair<int, int>>& roads, int s, int t)",
    call: printCall("separateRoutes"),
    starterCode: `#include <utility>
#include <vector>

int separateRoutes(int n, const std::vector<std::pair<int, int>>& roads, int s, int t) {
    return 0;
}
`,
    reference: `#include <queue>
#include <utility>
#include <vector>

int separateRoutes(int n, const std::vector<std::pair<int, int>>& roads, int s, int t) {
    std::vector<std::vector<int>> cap(n, std::vector<int>(n, 0));
    for (auto [u, v] : roads) cap[u][v]++;
    int flow = 0;
    while (true) {  // Edmonds-Karp: send one unit along the shortest path with room left
        std::vector<int> from(n, -1);
        from[s] = s;
        std::queue<int> q;
        q.push(s);
        while (!q.empty() && from[t] == -1) {
            int u = q.front();
            q.pop();
            for (int v = 0; v < n; v++)
                if (from[v] == -1 && cap[u][v] > 0) from[v] = u, q.push(v);
        }
        if (from[t] == -1) return flow;
        for (int v = t; v != s; v = from[v]) cap[from[v]][v]--, cap[v][from[v]]++;  // the way back lets a later route reroute this one
        flow++;
    }
}
`,
    cases: [
      { args: "4, {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {1, 2}}, 0, 3", expected: "2" },
      { args: "2, {{0, 1}, {0, 1}}, 0, 1", expected: "2" },
      { args: "3, {{0, 1}, {1, 2}}, 2, 0", expected: "0" },
      { args: "6, {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 3}, {3, 5}, {4, 5}}, 0, 5", expected: "2" },
      { args: "4, {{0, 1}, {1, 2}, {2, 3}, {0, 2}, {1, 3}}, 0, 3", expected: "2" },
      { args: "3, {{0, 1}, {0, 1}, {1, 2}, {1, 2}, {1, 2}}, 0, 2", expected: "2" },
      { args: "2, {{1, 0}, {1, 0}}, 0, 1", expected: "0" },
    ],
  },
];
