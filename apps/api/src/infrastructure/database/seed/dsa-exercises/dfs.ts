import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall, yesNoCall } from "./harness.js";

// Random edges between even and odd vertices only.
const SHAPES = String.raw`
namespace gen {
std::vector<std::pair<int, int>> bipartite(std::uint64_t seed, int n, int m) {
    state = seed;
    std::vector<std::pair<int, int>> out(m);
    for (auto& [u, v] : out) u = 2 * (int)between(0, (n - 1) / 2), v = 2 * (int)between(0, n / 2 - 1) + 1;
    return out;
}
}  // namespace gen
`;

const TWO_SIDES = `#include <utility>
#include <vector>

std::vector<int> twoSides(int n, const std::vector<std::pair<int, int>>& rivals) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : rivals) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<int> side(n, -1);
    for (int s = 0; s < n; s++) {
        if (side[s] != -1) continue;
        side[s] = 0;  // the smallest-numbered person of each group
        std::vector<int> stack = {s};
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : adj[u])
                if (side[v] == -1) side[v] = 1 - side[u], stack.push_back(v);
        }
    }
    return side;
}
`;

export const dfs: ExerciseTemplate[] = [
  predict(
    "dfs",
    "What does it print? Visiting and finishing",
    `#include <iostream>
#include <vector>

std::vector<std::vector<int>> adj = {{3, 1}, {2}, {0}, {4, 2}, {}};  // one-way edges
std::vector<bool> seen(adj.size(), false);
std::vector<int> finished;

void dfs(int u) {
    seen[u] = true;
    std::cout << u;
    for (int v : adj[u])
        if (!seen[v]) dfs(v);
    finished.push_back(u);
}

int main() {
    dfs(0);
    std::cout << "\\n";
    for (int u : finished) std::cout << u;
    std::cout << "\\n";
}
`,
    "03421\n42310",
  ),
  {
    skill: "dfs",
    rung: 2,
    title: "Fix the group count",
    promptMd: `\`countGroups(n, links)\` returns how many separate groups n computers form: two computers are in the same group if links join them, directly or through other computers. Links work both ways, and computers are numbered from 0 to n - 1. For n = 5 and \`{{1, 0}, {2, 1}, {4, 3}}\` that's 2, but it counts too many. **Find the fault and fix it.** ${limits("up to 200,000 computers and links")}`,
    functionSignature: "int countGroups(int n, const std::vector<std::pair<int, int>>& links)",
    call: printCall("countGroups"),
    generator: GEN + GRAPH,
    starterCode: `#include <utility>
#include <vector>

int countGroups(int n, const std::vector<std::pair<int, int>>& links) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : links) adj[u].push_back(v);
    std::vector<bool> seen(n, false);
    int groups = 0;
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        groups++;
        std::vector<int> stack = {s};  // depth-first, with a stack of its own
        seen[s] = true;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : adj[u])
                if (!seen[v]) seen[v] = true, stack.push_back(v);
        }
    }
    return groups;
}
`,
    reference: `#include <utility>
#include <vector>

int countGroups(int n, const std::vector<std::pair<int, int>>& links) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : links) adj[u].push_back(v), adj[v].push_back(u);  // a two-way link goes in both lists
    std::vector<bool> seen(n, false);
    int groups = 0;
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        groups++;
        std::vector<int> stack = {s};  // depth-first, with a stack of its own
        seen[s] = true;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : adj[u])
                if (!seen[v]) seen[v] = true, stack.push_back(v);
        }
    }
    return groups;
}
`,
    bruteForce: `#include <utility>
#include <vector>

int countGroups(int n, const std::vector<std::pair<int, int>>& links) {
    std::vector<int> label(n);
    for (int i = 0; i < n; i++) label[i] = i;
    for (auto [u, v] : links) {  // a link merges two groups: relabel every member of one
        int keep = label[u], drop = label[v];
        if (keep == drop) continue;
        for (int& l : label)
            if (l == drop) l = keep;
    }
    int groups = 0;
    for (int i = 0; i < n; i++) groups += label[i] == i;
    return groups;
}
`,
    cases: [
      { args: "5, {{1, 0}, {2, 1}, {4, 3}}", expected: "2" },
      { args: "3, {}", expected: "3" },
      { args: "1, {}", expected: "1" },
      { args: "4, {{0, 1}, {1, 0}, {2, 3}, {3, 2}}", expected: "2" },
      { args: "6, {{0, 5}, {5, 1}, {1, 0}, {2, 4}}", expected: "3" },
      { args: "2000, gen::edges(441, 2000, 1000)" },
      { args: "2000, gen::edges(442, 2000, 2000)" },
      { args: "200000, gen::edges(443, 200000, 200000)" },
    ],
  },
  {
    skill: "dfs",
    rung: 3,
    title: "Complete the cycle check",
    promptMd: `Each pair \`{a, b}\` in \`deps\` means task a has to wait for task b; tasks are numbered from 0 to n - 1. \`hasCycle(n, deps)\` says whether some tasks wait on each other in a circle, so that none of them can ever start. Its depth-first search colours each task: 0 not visited yet, 1 on the current path, 2 finished. **Complete the loop over a task's neighbours** in \`reachesCycle\`. ${limits("up to 200,000 tasks and 400,000 dependencies")}`,
    functionSignature: "bool hasCycle(int n, const std::vector<std::pair<int, int>>& deps)",
    call: yesNoCall("hasCycle"),
    generator: GEN + GRAPH + SHAPES,
    starterCode: `#include <utility>
#include <vector>

// colour: 0 not visited yet, 1 on the current path, 2 finished
bool reachesCycle(int u, const std::vector<std::vector<int>>& adj, std::vector<int>& colour) {
    colour[u] = 1;
    for (int v : adj[u]) {
        // TODO: a neighbour on the current path closes a cycle; an unvisited one is searched the same way
    }
    colour[u] = 2;
    return false;
}

bool hasCycle(int n, const std::vector<std::pair<int, int>>& deps) {
    std::vector<std::vector<int>> adj(n);
    for (auto [a, b] : deps) adj[a].push_back(b);
    std::vector<int> colour(n, 0);
    for (int s = 0; s < n; s++)
        if (colour[s] == 0 && reachesCycle(s, adj, colour)) return true;
    return false;
}
`,
    reference: `#include <utility>
#include <vector>

// colour: 0 not visited yet, 1 on the current path, 2 finished
bool reachesCycle(int u, const std::vector<std::vector<int>>& adj, std::vector<int>& colour) {
    colour[u] = 1;
    for (int v : adj[u]) {
        if (colour[v] == 1) return true;  // back to a task still waiting on this path: a circle
        if (colour[v] == 0 && reachesCycle(v, adj, colour)) return true;
    }
    colour[u] = 2;  // a finished task leads to no cycle, so it's never searched again
    return false;
}

bool hasCycle(int n, const std::vector<std::pair<int, int>>& deps) {
    std::vector<std::vector<int>> adj(n);
    for (auto [a, b] : deps) adj[a].push_back(b);
    std::vector<int> colour(n, 0);
    for (int s = 0; s < n; s++)
        if (colour[s] == 0 && reachesCycle(s, adj, colour)) return true;
    return false;
}
`,
    bruteForce: `#include <utility>
#include <vector>

bool hasCycle(int n, const std::vector<std::pair<int, int>>& deps) {
    std::vector<std::vector<int>> adj(n);
    for (auto [a, b] : deps) adj[a].push_back(b);
    for (int s = 0; s < n; s++) {  // can s get back to itself?
        std::vector<bool> seen(n, false);
        std::vector<int> stack(adj[s].begin(), adj[s].end());
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            if (u == s) return true;
            if (seen[u]) continue;
            seen[u] = true;
            for (int v : adj[u]) stack.push_back(v);
        }
    }
    return false;
}
`,
    cases: [
      { args: "3, {{0, 1}, {1, 2}, {2, 0}}", expected: "yes" },
      { args: "3, {{0, 1}, {1, 2}, {0, 2}}", expected: "no" },
      { args: "1, {}", expected: "no" },
      { args: "1, {{0, 0}}", expected: "yes" },
      { args: "2, {{0, 1}, {1, 0}}", expected: "yes" },
      { args: "4, {{0, 1}, {0, 2}, {1, 3}, {2, 3}}", expected: "no" },
      { args: "5, {{0, 1}, {2, 3}, {3, 4}, {4, 2}}", expected: "yes" },
      { args: "2000, gen::dag(444, 2000, 4000, 10)" },
      { args: "2000, gen::plusBack(gen::dag(445, 2000, 4000, 10))" },
      { args: "200000, gen::dag(446, 200000, 400000, 10)" },
    ],
  },
  {
    skill: "dfs",
    rung: 4,
    title: "Extend the two-team split to spot when it can't work",
    promptMd: `People numbered from 0 to n - 1 must be split into two teams so that no two rivals are on the same team; each pair in \`rivals\` is two rivals. \`twoSides(n, rivals)\` gives each person a side, 0 or 1: the smallest-numbered person of each connected group goes on side 0, which fixes everyone else in that group. But it never checks that the split works. **Extend it** to return an empty list when no split is possible. For n = 4 and \`{{0, 1}, {1, 2}, {2, 3}}\` it returns \`0 1 0 1\`; for n = 3 and \`{{0, 1}, {1, 2}, {2, 0}}\` it must return nothing. ${limits("up to 200,000 people and 300,000 rival pairs")}`,
    functionSignature: "std::vector<int> twoSides(int n, const std::vector<std::pair<int, int>>& rivals)",
    call: showCall("twoSides"),
    generator: GEN + GRAPH + SHAPES,
    starterCode: TWO_SIDES,
    reference: TWO_SIDES.replace(
      "                if (side[v] == -1) side[v] = 1 - side[u], stack.push_back(v);",
      `                if (side[v] == -1) side[v] = 1 - side[u], stack.push_back(v);
                else if (side[v] == side[u]) return {};  // two rivals forced onto the same side`,
    ),
    bruteForce: `#include <queue>
#include <utility>
#include <vector>

std::vector<int> twoSides(int n, const std::vector<std::pair<int, int>>& rivals) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : rivals) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<int> side(n);
    for (int s = 0; s < n; s++) {  // a fresh search from each person: their side is how far the group's smallest member is, odd or even
        std::vector<int> dist(n, -1);
        std::queue<int> q;
        dist[s] = 0;
        q.push(s);
        int smallest = s;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            if (u < smallest) smallest = u;
            for (int v : adj[u])
                if (dist[v] == -1) dist[v] = dist[u] + 1, q.push(v);
        }
        side[s] = dist[smallest] % 2;
    }
    for (auto [u, v] : rivals)
        if (side[u] == side[v]) return {};
    return side;
}
`,
    cases: [
      { args: "4, {{0, 1}, {1, 2}, {2, 3}}", expected: "0 1 0 1" },
      { args: "3, {{0, 1}, {1, 2}, {2, 0}}", expected: "" },
      { args: "3, {}", expected: "0 0 0" },
      { args: "5, {{3, 4}, {4, 1}}", expected: "0 0 0 0 1" },
      { args: "6, {{0, 1}, {2, 3}, {3, 4}, {4, 5}, {5, 2}}", expected: "0 1 0 1 0 1" },
      { args: "5, {{0, 1}, {1, 2}, {2, 3}, {3, 4}, {4, 0}}", expected: "" },
      { args: "2, {{0, 1}, {1, 0}}", expected: "0 1" },
      { args: "2000, gen::bipartite(447, 2000, 2000)" },
      { args: "2000, gen::edges(448, 2000, 2000)" },
      { args: "200000, gen::bipartite(449, 200000, 300000)" },
    ],
  },
  {
    skill: "dfs",
    rung: 5,
    title: "The biggest island after filling one cell",
    promptMd: `In a grid, \`#\` is land and \`.\` is water. An island is a group of land cells joined up, down, left or right. You may turn **at most one** water cell into land. \`biggestIsland(grid)\` returns the size of the largest island you can end up with. For \`{"#.", ".#"}\` that's 3. ${TASK} ${limits("grids up to 1000 × 1000")}`,
    functionSignature: "int biggestIsland(const std::vector<std::string>& grid)",
    call: printCall("biggestIsland"),
    generator: GEN + GRAPH,
    starterCode: `#include <string>
#include <vector>

int biggestIsland(const std::vector<std::string>& grid) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <string>
#include <vector>

int biggestIsland(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    std::vector<int> island(rows * cols, -1), size;  // each land cell's island number, and each island's size
    for (int start = 0; start < rows * cols; start++) {
        if (grid[start / cols][start % cols] != '#' || island[start] != -1) continue;
        int id = size.size();
        size.push_back(0);
        std::vector<int> stack = {start};
        island[start] = id;
        while (!stack.empty()) {
            int cell = stack.back(), r = cell / cols, c = cell % cols;
            stack.pop_back();
            size[id]++;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] != '#' || island[nr * cols + nc] != -1) continue;
                island[nr * cols + nc] = id;
                stack.push_back(nr * cols + nc);
            }
        }
    }
    int best = size.empty() ? 0 : *std::max_element(size.begin(), size.end());
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] != '.') continue;
            std::vector<int> joined;  // the different islands this water cell touches
            int total = 1;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] != '#') continue;
                int id = island[nr * cols + nc];
                if (std::find(joined.begin(), joined.end(), id) == joined.end()) joined.push_back(id), total += size[id];
            }
            best = std::max(best, total);
        }
    return best;
}
`,
    bruteForce: `#include <algorithm>
#include <string>
#include <vector>

int largest(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size(), best = 0;
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    std::vector<bool> seen(rows * cols, false);
    for (int start = 0; start < rows * cols; start++) {
        if (grid[start / cols][start % cols] != '#' || seen[start]) continue;
        int count = 0;
        std::vector<int> stack = {start};
        seen[start] = true;
        while (!stack.empty()) {
            int cell = stack.back(), r = cell / cols, c = cell % cols;
            stack.pop_back();
            count++;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] != '#' || seen[nr * cols + nc]) continue;
                seen[nr * cols + nc] = true;
                stack.push_back(nr * cols + nc);
            }
        }
        best = std::max(best, count);
    }
    return best;
}

int biggestIsland(const std::vector<std::string>& grid) {
    int best = largest(grid);
    std::vector<std::string> g = grid;
    for (auto& line : g)
        for (char& cell : line)  // fill each water cell in turn
            if (cell == '.') {
                cell = '#';
                best = std::max(best, largest(g));
                cell = '.';
            }
    return best;
}
`,
    cases: [
      { args: `{"#.", ".#"}`, expected: "3" },
      { args: `{"##", "##"}`, expected: "4" },
      { args: `{".."}`, expected: "1" },
      { args: `{"#"}`, expected: "1" },
      { args: `{"#.#", "...", "#.#"}`, expected: "3" },
      { args: `{"##.##", "#...#", "##.##"}`, expected: "11" },
      { args: "gen::grid(450, 30, 30, 50)" },
      { args: "gen::grid(451, 30, 40, 40)" },
      { args: "gen::grid(452, 1000, 1000, 50)" },
    ],
  },
];
