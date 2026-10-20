import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall } from "./harness.js";

const ROADS = "Towns are numbered from 0 to n - 1, and each road `{u, v, w}` goes one way, from u to v, and costs w.";

const PQ = "std::priority_queue<std::pair<long long, int>, std::vector<std::pair<long long, int>>, std::greater<>>";

// Dijkstra from town 0 with the cost of road `free` set to 0 (-1: none free); the brute force's building block.
const DIJKSTRA_FROM_0 = `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

long long cheapestTo(int n, const std::vector<std::array<int, 3>>& roads, int free) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (int i = 0; i < (int)roads.size(); i++) adj[roads[i][0]].push_back({roads[i][1], i == free ? 0 : roads[i][2]});
    std::vector<long long> dist(n, -1);
    ${PQ} pq;
    dist[0] = 0;
    pq.push({0, 0});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (dist[v] == -1 || d + w < dist[v]) dist[v] = d + w, pq.push({dist[v], v});
    }
    return dist[n - 1];
}
`;

export const shortestPaths: ExerciseTemplate[] = [
  predict(
    "shortest-paths",
    "What does it print? Dijkstra's algorithm",
    `#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

int main() {
    int n = 5;
    std::vector<std::vector<std::pair<int, int>>> adj(n);  // (to, cost), one way
    auto road = [&](int u, int v, int w) { adj[u].push_back({v, w}); };
    road(0, 1, 4), road(0, 2, 1), road(2, 1, 2), road(1, 3, 1), road(2, 3, 5), road(3, 4, 3);
    std::vector<long long> dist(n, LLONG_MAX);
    ${PQ} pq;
    dist[0] = 0;
    pq.push({0, 0});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;  // an old entry, already beaten
        std::cout << u;
        for (auto [v, w] : adj[u])
            if (dist[u] + w < dist[v]) dist[v] = dist[u] + w, pq.push({dist[v], v});
    }
    std::cout << "\\n";
    for (int v = 0; v < n; v++) std::cout << dist[v] << " ";
    std::cout << "\\n";
}
`,
    "02134\n0 3 1 4 7",
  ),
  {
    skill: "shortest-paths",
    rung: 2,
    title: "Fix Dijkstra's algorithm",
    promptMd: `${ROADS} Costs run from 0 to 1,000,000. \`cheapest(n, roads, start)\` returns the cheapest total cost from \`start\` to each town, or -1 if a town can't be reached. For n = 4, \`{{0, 1, 5}, {0, 2, 1}, {2, 1, 1}, {1, 3, 2}}\` and start 0 that's \`0 2 1 4\`, but it settles some towns too early. **Find the fault and fix it.** ${limits("up to 200,000 towns and 500,000 roads")}`,
    functionSignature: "std::vector<long long> cheapest(int n, const std::vector<std::array<int, 3>>& roads, int start)",
    call: showCall("cheapest"),
    generator: GEN + GRAPH,
    starterCode: `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

std::vector<long long> cheapest(int n, const std::vector<std::array<int, 3>>& roads, int start) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : roads) adj[u].push_back({v, w});
    std::vector<long long> dist(n, -1);
    std::vector<bool> done(n, false);
    ${PQ} pq;  // (cost so far, town), cheapest on top
    dist[start] = 0, done[start] = true;
    pq.push({0, start});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        for (auto [v, w] : adj[u])
            if (!done[v]) {
                done[v] = true;
                dist[v] = d + w;
                pq.push({dist[v], v});
            }
    }
    return dist;
}
`,
    reference: `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

std::vector<long long> cheapest(int n, const std::vector<std::array<int, 3>>& roads, int start) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : roads) adj[u].push_back({v, w});
    std::vector<long long> dist(n, -1);
    ${PQ} pq;  // (cost so far, town), cheapest on top
    dist[start] = 0;
    pq.push({0, start});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;  // a cheaper way to u was found after this entry was pushed
        for (auto [v, w] : adj[u])
            if (dist[v] == -1 || d + w < dist[v]) dist[v] = d + w, pq.push({dist[v], v});  // a town's cost can still drop until it's popped
    }
    return dist;
}
`,
    bruteForce: `#include <array>
#include <vector>

std::vector<long long> cheapest(int n, const std::vector<std::array<int, 3>>& roads, int start) {
    std::vector<long long> dist(n, -1);
    dist[start] = 0;
    for (int round = 1; round < n; round++)  // Bellman-Ford: n - 1 rounds of relaxing every road
        for (auto [u, v, w] : roads)
            if (dist[u] != -1 && (dist[v] == -1 || dist[u] + w < dist[v])) dist[v] = dist[u] + w;
    return dist;
}
`,
    cases: [
      { args: "4, {{0, 1, 5}, {0, 2, 1}, {2, 1, 1}, {1, 3, 2}}, 0", expected: "0 2 1 4" },
      { args: "1, {}, 0", expected: "0" },
      { args: "3, {{0, 1, 7}, {1, 0, 7}}, 2", expected: "-1 -1 0" },
      { args: "3, {{0, 1, 2}, {1, 0, 2}, {1, 2, 0}}, 0", expected: "0 2 2" },
      { args: "5, {{0, 1, 1000000}, {1, 2, 1000000}, {2, 3, 1000000}, {3, 4, 1000000}, {0, 4, 4000001}}, 0", expected: "0 1000000 2000000 3000000 4000000" },
      { args: "1000, gen::weightedEdges(473, 1000, 3000, 1000), 0" },
      { args: "200000, gen::weightedEdges(474, 200000, 500000, 1000000), 0" },
    ],
  },
  {
    skill: "shortest-paths",
    rung: 3,
    title: "Complete the 0-1 breadth-first search",
    promptMd: `In a grid, \`.\` is open floor and \`#\` is a wall that can be knocked down. You walk from the top-left cell to the bottom-right one, a step up, down, left or right at a time, and every wall cell you pass through (the first cell included) has to be knocked down. \`fewestWalls(grid)\` returns the fewest walls to knock down. Every step costs 0 or 1, so a deque replaces Dijkstra's heap: a cell reached for free goes to the **front**, one that costs a wall to the **back**. **Complete the TODO.** ${limits("grids up to 1000 × 1000")}`,
    functionSignature: "int fewestWalls(const std::vector<std::string>& grid)",
    call: printCall("fewestWalls"),
    generator: GEN + GRAPH,
    starterCode: `#include <climits>
#include <deque>
#include <string>
#include <vector>

int fewestWalls(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<int> dist(rows * cols, INT_MAX);
    std::deque<int> cells;  // a cell (r, c) is r * cols + c
    dist[0] = grid[0][0] == '#';
    cells.push_back(0);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!cells.empty()) {
        int cell = cells.front(), r = cell / cols, c = cell % cols;
        cells.pop_front();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int next = nr * cols + nc, cost = grid[nr][nc] == '#';
            if (dist[cell] + cost >= dist[next]) continue;
            dist[next] = dist[cell] + cost;
            // TODO: put next at the front of the deque if the step was free, at the back if it cost a wall
        }
    }
    return dist.back();
}
`,
    reference: `#include <climits>
#include <deque>
#include <string>
#include <vector>

int fewestWalls(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<int> dist(rows * cols, INT_MAX);
    std::deque<int> cells;  // a cell (r, c) is r * cols + c
    dist[0] = grid[0][0] == '#';
    cells.push_back(0);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!cells.empty()) {
        int cell = cells.front(), r = cell / cols, c = cell % cols;
        cells.pop_front();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int next = nr * cols + nc, cost = grid[nr][nc] == '#';
            if (dist[cell] + cost >= dist[next]) continue;
            dist[next] = dist[cell] + cost;
            if (cost == 0) cells.push_front(next);  // the deque stays sorted by distance, like a heap that only ever holds two values
            else cells.push_back(next);
        }
    }
    return dist.back();
}
`,
    bruteForce: `#include <climits>
#include <string>
#include <vector>

int fewestWalls(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<int> dist(rows * cols, INT_MAX);
    dist[0] = grid[0][0] == '#';
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    for (int round = 1; round < rows * cols; round++)  // Bellman-Ford over the cells
        for (int cell = 0; cell < rows * cols; cell++) {
            if (dist[cell] == INT_MAX) continue;
            int r = cell / cols, c = cell % cols;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                int next = nr * cols + nc, through = dist[cell] + (grid[nr][nc] == '#');
                if (through < dist[next]) dist[next] = through;
            }
        }
    return dist.back();
}
`,
    cases: [
      { args: `{".#.", "##.", "..."}`, expected: "1" },
      { args: `{"."}`, expected: "0" },
      { args: `{"#"}`, expected: "1" },
      { args: `{".###.", "#####", ".###."}`, expected: "4" },
      { args: `{"..", ".."}`, expected: "0" },
      { args: `{".#..", ".#.#", "...#", "##.."}`, expected: "0" },
      { args: "gen::grid(475, 30, 30, 50)" },
      { args: "gen::grid(476, 30, 40, 70)" },
      { args: "gen::grid(477, 1000, 1000, 50)" },
    ],
  },
  {
    skill: "shortest-paths",
    rung: 4,
    title: "Extend Dijkstra with one free road",
    promptMd: `${ROADS} Costs run from 1 to 1,000,000. \`cheapestTrip(n, roads)\` runs Dijkstra's algorithm and returns the cheapest cost from town 0 to town n - 1, or -1 if it can't be reached. **Extend it**: you now hold one voucher that makes a single road of your choice free. Return the cheapest cost using the voucher at most once. For n = 4 and \`{{0, 1, 10}, {1, 3, 10}, {0, 2, 3}, {2, 3, 25}}\` that's 3. ${limits("up to 100,000 towns and 300,000 roads")}`,
    functionSignature: "long long cheapestTrip(int n, const std::vector<std::array<int, 3>>& roads)",
    call: printCall("cheapestTrip"),
    generator: GEN + GRAPH,
    starterCode: `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

long long cheapestTrip(int n, const std::vector<std::array<int, 3>>& roads) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : roads) adj[u].push_back({v, w});
    std::vector<long long> dist(n, -1);
    ${PQ} pq;
    dist[0] = 0;
    pq.push({0, 0});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (dist[v] == -1 || d + w < dist[v]) dist[v] = d + w, pq.push({dist[v], v});
    }
    return dist[n - 1];
}
`,
    reference: `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

long long cheapestTrip(int n, const std::vector<std::array<int, 3>>& roads) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : roads) adj[u].push_back({v, w});
    std::vector<long long> dist(2 * n, -1);  // town v before the voucher is used, and v + n after
    ${PQ} pq;
    auto reach = [&](int state, long long d) {
        if (dist[state] == -1 || d < dist[state]) dist[state] = d, pq.push({d, state});
    };
    reach(0, 0);
    while (!pq.empty()) {
        auto [d, state] = pq.top();
        pq.pop();
        if (d > dist[state]) continue;
        int u = state % n;
        bool used = state >= n;
        for (auto [v, w] : adj[u]) {
            reach(used ? v + n : v, d + w);
            if (!used) reach(v + n, d);  // spend the voucher on this road
        }
    }
    long long plain = dist[n - 1], voucher = dist[2 * n - 1];
    if (plain == -1 || (voucher != -1 && voucher < plain)) return voucher;
    return plain;
}
`,
    bruteForce: `${DIJKSTRA_FROM_0}
long long cheapestTrip(int n, const std::vector<std::array<int, 3>>& roads) {
    long long best = cheapestTo(n, roads, -1);
    for (int i = 0; i < (int)roads.size(); i++) {  // a fresh Dijkstra for each road made free
        long long cost = cheapestTo(n, roads, i);
        if (cost != -1 && (best == -1 || cost < best)) best = cost;
    }
    return best;
}
`,
    cases: [
      { args: "4, {{0, 1, 10}, {1, 3, 10}, {0, 2, 3}, {2, 3, 25}}", expected: "3" },
      { args: "1, {}", expected: "0" },
      { args: "2, {}", expected: "-1" },
      { args: "2, {{0, 1, 7}, {0, 1, 3}}", expected: "0" },
      { args: "3, {{0, 1, 5}, {1, 2, 5}, {2, 0, 1}}", expected: "5" },
      { args: "5, {{0, 1, 2}, {1, 2, 2}, {2, 4, 2}, {0, 3, 9}, {3, 4, 1}}", expected: "1" },
      { args: "300, gen::weightedEdges(478, 300, 1000, 1000)" },
      { args: "100000, gen::weightedEdges(479, 100000, 300000, 1000000)" },
    ],
  },
  {
    skill: "shortest-paths",
    rung: 5,
    title: "Answer many route questions at once",
    promptMd: `${ROADS} Costs run from 1 to 1,000,000, and two towns can be joined by several roads. There are at most 400 towns but a great many questions: each \`{a, b}\` asks for the cheapest cost from a to b, or -1 if b can't be reached from a. \`travelCosts(n, roads, questions)\` answers them in order. For n = 3, \`{{0, 1, 4}, {1, 2, 1}, {0, 2, 7}}\` and \`{{0, 2}, {2, 0}, {1, 1}}\` that's \`5 -1 0\`. ${TASK} ${limits("400 towns, 20,000 roads and 200,000 questions")}`,
    functionSignature: "std::vector<long long> travelCosts(int n, const std::vector<std::array<int, 3>>& roads, const std::vector<std::pair<int, int>>& questions)",
    call: showCall("travelCosts"),
    generator: GEN + GRAPH,
    starterCode: `#include <array>
#include <utility>
#include <vector>

std::vector<long long> travelCosts(int n, const std::vector<std::array<int, 3>>& roads, const std::vector<std::pair<int, int>>& questions) {
    return {};
}
`,
    reference: `#include <algorithm>
#include <array>
#include <utility>
#include <vector>

std::vector<long long> travelCosts(int n, const std::vector<std::array<int, 3>>& roads, const std::vector<std::pair<int, int>>& questions) {
    const long long NONE = -1;
    std::vector<std::vector<long long>> dist(n, std::vector<long long>(n, NONE));
    for (int v = 0; v < n; v++) dist[v][v] = 0;
    for (auto [u, v, w] : roads)
        if (dist[u][v] == NONE || w < dist[u][v]) dist[u][v] = w;
    for (int k = 0; k < n; k++)  // Floyd-Warshall: after round k, routes may pass through towns 0..k
        for (int i = 0; i < n; i++) {
            if (dist[i][k] == NONE) continue;
            for (int j = 0; j < n; j++)
                if (dist[k][j] != NONE && (dist[i][j] == NONE || dist[i][k] + dist[k][j] < dist[i][j])) dist[i][j] = dist[i][k] + dist[k][j];
        }
    std::vector<long long> answers;
    for (auto [a, b] : questions) answers.push_back(dist[a][b]);
    return answers;
}
`,
    bruteForce: `#include <array>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

std::vector<long long> travelCosts(int n, const std::vector<std::array<int, 3>>& roads, const std::vector<std::pair<int, int>>& questions) {
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (auto [u, v, w] : roads) adj[u].push_back({v, w});
    std::vector<long long> answers;
    for (auto [a, b] : questions) {  // a fresh Dijkstra for every question
        std::vector<long long> dist(n, -1);
        ${PQ} pq;
        dist[a] = 0;
        pq.push({0, a});
        while (!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();
            if (d > dist[u]) continue;
            for (auto [v, w] : adj[u])
                if (dist[v] == -1 || d + w < dist[v]) dist[v] = d + w, pq.push({dist[v], v});
        }
        answers.push_back(dist[b]);
    }
    return answers;
}
`,
    cases: [
      { args: "3, {{0, 1, 4}, {1, 2, 1}, {0, 2, 7}}, {{0, 2}, {2, 0}, {1, 1}}", expected: "5 -1 0" },
      { args: "1, {}, {{0, 0}}", expected: "0" },
      { args: "2, {{0, 1, 5}, {0, 1, 2}}, {{0, 1}, {1, 0}}", expected: "2 -1" },
      { args: "4, {{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {3, 0, 1}}, {{3, 2}, {0, 3}}", expected: "3 3" },
      { args: "3, {}, {}", expected: "" },
      { args: "50, gen::weightedEdges(480, 50, 300, 1000), gen::edges(481, 50, 200)" },
      { args: "400, gen::weightedEdges(482, 400, 20000, 1000000), gen::edges(483, 400, 200000)" },
    ],
  },
];
