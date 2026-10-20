import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall } from "./harness.js";

const ROADS = "Roads are two-way, towns are numbered from 0 to n - 1, and two towns can be joined by more than one road.";

// Gates sprinkled on a grid's open cells; k diamonds in a row (2^k shortest routes end to end); a grid
// whose two corners are open.
const SHAPES = String.raw`
namespace gen {
std::vector<std::string> gates(std::vector<std::string> g, std::uint64_t seed, int permille) {
    state = seed;
    for (auto& line : g)
        for (char& cell : line)
            if (cell == '.' && between(1, 1000) <= permille) cell = 'G';
    return g;
}
std::vector<std::pair<int, int>> diamonds(int k) {
    std::vector<std::pair<int, int>> out;
    for (int a = 0; a < 3 * k; a += 3) {
        out.push_back({a, a + 1}), out.push_back({a, a + 2});
        out.push_back({a + 1, a + 3}), out.push_back({a + 2, a + 3});
    }
    return out;
}
std::vector<std::string> openCorners(std::vector<std::string> g) {
    g[0][0] = g.back().back() = '.';
    return g;
}
}  // namespace gen
`;

const DISTANCES = `#include <queue>
#include <utility>
#include <vector>

std::vector<int> distances(int n, const std::vector<std::pair<int, int>>& roads, int start) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : roads) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<int> dist(n, -1);
    std::queue<int> q;
    dist[start] = 0;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u])
            if (dist[v] == -1) {  // a town gets its distance the first time it's reached, and is queued once
                dist[v] = dist[u] + 1;
                q.push(v);
            }
    }
    return dist;
}
`;

export const bfs: ExerciseTemplate[] = [
  predict(
    "bfs",
    "What does it print? Level by level",
    `#include <iostream>
#include <queue>
#include <vector>

int main() {
    std::vector<std::vector<int>> adj = {{2, 1}, {3}, {4, 3}, {5}, {}, {}, {0}};  // one-way edges
    std::vector<int> dist(adj.size(), -1);
    std::queue<int> q;
    dist[0] = 0;
    q.push(0);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        std::cout << u;
        for (int v : adj[u])
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
    }
    std::cout << "\\n";
    for (int d : dist) std::cout << d << " ";
    std::cout << "\\n";
}
`,
    "021435\n0 1 1 2 2 3 -1",
  ),
  {
    skill: "bfs",
    rung: 2,
    title: "Fix the fewest-roads distances",
    promptMd: `\`distances(n, roads, start)\` returns, for each town, the fewest roads needed to get there from \`start\`, or -1 if it can't be reached. ${ROADS} For n = 5, \`{{0, 1}, {0, 2}, {1, 2}, {2, 3}}\` and start 0 that's \`0 1 1 2 -1\`, but some distances come out too big. **Find the fault and fix it.** ${limits("up to 200,000 towns and 1,000,000 roads")}`,
    functionSignature: "std::vector<int> distances(int n, const std::vector<std::pair<int, int>>& roads, int start)",
    call: showCall("distances"),
    generator: GEN + GRAPH,
    starterCode: `#include <queue>
#include <utility>
#include <vector>

std::vector<int> distances(int n, const std::vector<std::pair<int, int>>& roads, int start) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : roads) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<int> dist(n, -1);
    std::vector<bool> done(n, false);
    std::queue<int> q;
    dist[start] = 0;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        done[u] = true;
        for (int v : adj[u])
            if (!done[v]) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
    }
    return dist;
}
`,
    reference: DISTANCES,
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> distances(int n, const std::vector<std::pair<int, int>>& roads, int start) {
    std::vector<int> dist(n, -1);
    dist[start] = 0;
    for (int round = 1; round < n; round++)  // n - 1 rounds of relaxing every road, as Bellman-Ford does
        for (auto [u, v] : roads)
            for (auto [a, b] : {std::pair{u, v}, std::pair{v, u}})
                if (dist[a] != -1 && (dist[b] == -1 || dist[a] + 1 < dist[b])) dist[b] = dist[a] + 1;
    return dist;
}
`,
    cases: [
      { args: "5, {{0, 1}, {0, 2}, {1, 2}, {2, 3}}, 0", expected: "0 1 1 2 -1" },
      { args: "1, {}, 0", expected: "0" },
      { args: "3, {}, 1", expected: "-1 0 -1" },
      { args: "4, {{0, 1}, {1, 2}, {2, 3}, {3, 0}}, 2", expected: "2 1 0 1" },
      { args: "6, {{5, 4}, {4, 3}, {0, 1}}, 5", expected: "-1 -1 -1 2 1 0" },
      { args: "2000, gen::edges(423, 2000, 4000), 0" },
      { args: "200000, gen::edges(424, 200000, 1000000), 0" },
    ],
  },
  {
    skill: "bfs",
    rung: 3,
    title: "Complete the nearest-gate search",
    promptMd: `In a grid, \`#\` is a wall, \`G\` is a gate and \`.\` is open floor. \`nearestGate(grid)\` returns, for every cell row by row, the fewest steps (up, down, left or right, never into a wall) to the nearest gate: 0 on a gate, and -1 on a wall or a cell that can't reach any gate. It starts a breadth-first search from **every gate at once**. **Complete the step** that moves from a cell to its neighbours. ${limits("grids up to 1000 × 1000 with thousands of gates")}`,
    functionSignature: "std::vector<int> nearestGate(const std::vector<std::string>& grid)",
    call: showCall("nearestGate"),
    generator: GEN + GRAPH + SHAPES,
    starterCode: `#include <queue>
#include <string>
#include <vector>

std::vector<int> nearestGate(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = rows ? grid[0].size() : 0;
    std::vector<int> dist(rows * cols, -1);
    std::queue<int> q;  // a cell (r, c) is r * cols + c
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (grid[r][c] == 'G') dist[r * cols + c] = 0, q.push(r * cols + c);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!q.empty()) {
        int cell = q.front(), r = cell / cols, c = cell % cols;
        q.pop();
        // TODO: each of the 4 neighbours that is inside the grid, isn't a wall and has no distance yet
        // gets one more than this cell's distance, and joins the queue
    }
    return dist;
}
`,
    reference: `#include <queue>
#include <string>
#include <vector>

std::vector<int> nearestGate(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = rows ? grid[0].size() : 0;
    std::vector<int> dist(rows * cols, -1);
    std::queue<int> q;  // a cell (r, c) is r * cols + c
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (grid[r][c] == 'G') dist[r * cols + c] = 0, q.push(r * cols + c);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!q.empty()) {
        int cell = q.front(), r = cell / cols, c = cell % cols;
        q.pop();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] == '#' || dist[nr * cols + nc] != -1) continue;
            dist[nr * cols + nc] = dist[cell] + 1;
            q.push(nr * cols + nc);
        }
    }
    return dist;
}
`,
    bruteForce: `#include <queue>
#include <string>
#include <vector>

std::vector<int> nearestGate(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = rows ? grid[0].size() : 0;
    std::vector<int> best(rows * cols, -1);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    for (int g = 0; g < rows * cols; g++) {  // a separate search from each gate
        if (grid[g / cols][g % cols] != 'G') continue;
        std::vector<int> dist(rows * cols, -1);
        std::queue<int> q;
        dist[g] = 0;
        q.push(g);
        while (!q.empty()) {
            int cell = q.front(), r = cell / cols, c = cell % cols;
            q.pop();
            if (best[cell] == -1 || dist[cell] < best[cell]) best[cell] = dist[cell];
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] == '#' || dist[nr * cols + nc] != -1) continue;
                dist[nr * cols + nc] = dist[cell] + 1;
                q.push(nr * cols + nc);
            }
        }
    }
    return best;
}
`,
    cases: [
      { args: `{"G.#", "..#", "#.G"}`, expected: "0 1 -1 1 2 -1 -1 1 0" },
      { args: `{"...", ".#.", "..."}`, expected: "-1 -1 -1 -1 -1 -1 -1 -1 -1" },
      { args: `{"G"}`, expected: "0" },
      { args: `{"G.#."}`, expected: "0 1 -1 -1" },
      { args: `{".G..G"}`, expected: "1 0 1 1 0" },
      { args: "{}", expected: "" },
      { args: "gen::gates(gen::grid(425, 40, 50, 25), 426, 10)" },
      { args: "gen::gates(gen::grid(427, 1000, 1000, 25), 428, 10)" },
    ],
  },
  {
    skill: "bfs",
    rung: 4,
    title: "Extend the distances to count the shortest routes",
    promptMd: `\`shortestRoutes(n, roads, start)\` runs a breadth-first search from \`start\` and, so far, returns each town's distance. ${ROADS} **Extend it** to return, for each town, how many different shortest routes lead there from \`start\`, modulo 1,000,000,007: 1 for \`start\` itself and 0 for a town that can't be reached. Two routes are different if they use a different road at some step. For n = 5, \`{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}}\` and start 0 that's \`1 1 1 2 2\`. ${limits("up to 200,000 towns and 1,000,000 roads")}`,
    functionSignature: "std::vector<long long> shortestRoutes(int n, const std::vector<std::pair<int, int>>& roads, int start)",
    call: showCall("shortestRoutes"),
    generator: GEN + GRAPH + SHAPES,
    starterCode: `#include <queue>
#include <utility>
#include <vector>

std::vector<long long> shortestRoutes(int n, const std::vector<std::pair<int, int>>& roads, int start) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : roads) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<int> dist(n, -1);
    std::queue<int> q;
    dist[start] = 0;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u])
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
    }
    return {dist.begin(), dist.end()};  // so far: the distances
}
`,
    reference: `#include <queue>
#include <utility>
#include <vector>

std::vector<long long> shortestRoutes(int n, const std::vector<std::pair<int, int>>& roads, int start) {
    const long long MOD = 1000000007;
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : roads) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<int> dist(n, -1);
    std::vector<long long> ways(n, 0);
    std::queue<int> q;
    dist[start] = 0, ways[start] = 1;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
            // u leaves the queue only after every town one step closer than it, so ways[u] is final here
            if (dist[v] == dist[u] + 1) ways[v] = (ways[v] + ways[u]) % MOD;
        }
    }
    return ways;
}
`,
    bruteForce: `#include <algorithm>
#include <numeric>
#include <utility>
#include <vector>

std::vector<long long> shortestRoutes(int n, const std::vector<std::pair<int, int>>& roads, int start) {
    const long long MOD = 1000000007;
    std::vector<int> dist(n, -1);
    dist[start] = 0;
    for (bool changed = true; changed;) {  // relax every road until no distance changes
        changed = false;
        for (auto [u, v] : roads)
            for (auto [a, b] : {std::pair{u, v}, std::pair{v, u}})
                if (dist[a] != -1 && (dist[b] == -1 || dist[a] + 1 < dist[b])) dist[b] = dist[a] + 1, changed = true;
    }
    std::vector<int> order(n);
    std::iota(order.begin(), order.end(), 0);
    std::sort(order.begin(), order.end(), [&](int a, int b) { return dist[a] < dist[b]; });
    std::vector<long long> ways(n, 0);
    ways[start] = 1;
    for (int v : order) {  // closest first; each town scans every road for the ones arriving one step later
        if (dist[v] <= 0) continue;
        for (auto [a, b] : roads) {
            if (b == v && dist[a] == dist[v] - 1) ways[v] = (ways[v] + ways[a]) % MOD;
            if (a == v && dist[b] == dist[v] - 1) ways[v] = (ways[v] + ways[b]) % MOD;
        }
    }
    return ways;
}
`,
    cases: [
      { args: "5, {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}}, 0", expected: "1 1 1 2 2" },
      { args: "3, {{0, 1}, {0, 1}, {1, 2}}, 0", expected: "1 2 2" },
      { args: "4, {}, 2", expected: "0 0 1 0" },
      { args: "1, {}, 0", expected: "1" },
      { args: "4, {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {0, 3}}, 0", expected: "1 1 1 1" },
      { args: "301, gen::diamonds(100), 0" },
      { args: "2000, gen::edges(429, 2000, 4000), 0" },
      { args: "200000, gen::edges(430, 200000, 1000000), 0" },
    ],
  },
  {
    skill: "bfs",
    rung: 5,
    title: "The shortest way out, breaking at most one wall",
    promptMd: `In a grid, \`.\` is open floor and \`#\` is a wall; the top-left and bottom-right cells are always open. You start top-left and must reach bottom-right, one step up, down, left or right at a time, and you may walk through **at most one** wall on the way. \`shortestEscape(grid)\` returns the fewest steps, or -1 if it can't be done. For \`{".#.", ".#.", ".#."}\` that's 4. ${TASK} ${limits("grids up to 1000 × 1000")}`,
    functionSignature: "int shortestEscape(const std::vector<std::string>& grid)",
    call: printCall("shortestEscape"),
    generator: GEN + GRAPH + SHAPES,
    starterCode: `#include <string>
#include <vector>

int shortestEscape(const std::vector<std::string>& grid) {
    return -1;
}
`,
    reference: `#include <queue>
#include <string>
#include <vector>

int shortestEscape(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size(), cells = rows * cols;
    // A state is a cell plus whether a wall has been broken: (broken ? cells : 0) + r * cols + c.
    std::vector<int> dist(2 * cells, -1);
    std::queue<int> q;
    dist[0] = 0;
    q.push(0);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!q.empty()) {
        int state = q.front(), broken = state / cells, r = state % cells / cols, c = state % cols;
        q.pop();
        if (r == rows - 1 && c == cols - 1) return dist[state];
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int nb = broken + (grid[nr][nc] == '#');
            if (nb > 1) continue;
            int next = nb * cells + nr * cols + nc;
            if (dist[next] == -1) dist[next] = dist[state] + 1, q.push(next);
        }
    }
    return -1;
}
`,
    bruteForce: `#include <queue>
#include <string>
#include <vector>

int walk(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<int> dist(rows * cols, -1);
    std::queue<int> q;
    dist[0] = 0;
    q.push(0);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!q.empty()) {
        int cell = q.front(), r = cell / cols, c = cell % cols;
        q.pop();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] == '#' || dist[nr * cols + nc] != -1) continue;
            dist[nr * cols + nc] = dist[cell] + 1;
            q.push(nr * cols + nc);
        }
    }
    return dist.back();
}

int shortestEscape(const std::vector<std::string>& grid) {
    int best = walk(grid);
    std::vector<std::string> g = grid;
    for (auto& line : g)
        for (char& cell : line)  // knock down each wall in turn
            if (cell == '#') {
                cell = '.';
                int steps = walk(g);
                if (steps != -1 && (best == -1 || steps < best)) best = steps;
                cell = '#';
            }
    return best;
}
`,
    cases: [
      { args: `{".#.", ".#.", ".#."}`, expected: "4" },
      { args: `{"."}`, expected: "0" },
      { args: `{".#", "#."}`, expected: "2" },
      { args: `{".##", "###", "##."}`, expected: "-1" },
      { args: `{"....", "###.", "....", ".###", "...."}`, expected: "7" },
      { args: `{"...", "...", "..."}`, expected: "4" },
      { args: "gen::openCorners(gen::grid(431, 30, 30, 30))" },
      { args: "gen::openCorners(gen::grid(436, 30, 30, 30))" },
      { args: "gen::openCorners(gen::grid(435, 30, 40, 35))" },
      { args: "gen::openCorners(gen::grid(433, 1000, 1000, 30))" },
    ],
  },
];
