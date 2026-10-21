import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, yesNoCall } from "../dsa-exercises/harness.js";

// m rules on variables 0..n-1 that can all hold: {1, a, b} (a == b) inside a group (same value mod `groups`), {2, a, b}
// (a != b) across groups, 1 in 10 of them, so the equal rules join large groups. With flawed set, the last two rules say 0 == groups and 0 != groups, which can't both hold.
const RULES = String.raw`
namespace gen {
std::vector<std::array<int, 3>> rules(std::uint64_t seed, int n, int m, int groups, bool flawed) {
    state = seed;
    std::vector<std::array<int, 3>> out(m);
    for (auto& [type, a, b] : out) {
        type = between(1, 10) == 1 ? 2 : 1, a = (int)between(0, n - 1);
        int g = a % groups, other = type == 1 ? g : (g + (int)between(1, groups - 1)) % groups;
        b = other + groups * (int)between(0, (n - 1 - other) / groups);
    }
    if (flawed) out[m - 2] = {1, 0, groups}, out[m - 1] = {2, 0, groups};
    return out;
}
}  // namespace gen
`;

// Graphs, part 1: representations, searches, orderings and groups.
export const graphs: ExerciseTemplate[] = [
  // ── graph-basics ──
  predict(
    "graph-basics",
    "What does it print? Degrees and a two-step count",
    `#include <iostream>
#include <utility>
#include <vector>

int main() {
    int n = 4;
    std::vector<std::pair<int, int>> arcs = {{0, 1}, {0, 2}, {1, 2}, {2, 0}, {3, 2}};  // one-way
    std::vector<int> in(n, 0), out(n, 0);
    std::vector<std::vector<int>> m(n, std::vector<int>(n, 0));
    for (auto [u, v] : arcs) out[u]++, in[v]++, m[u][v] = 1;
    for (int v = 0; v < n; v++) std::cout << in[v] << out[v] << " ";
    int twoSteps = 0;
    for (int k = 0; k < n; k++) twoSteps += m[0][k] * m[k][0];
    std::cout << twoSteps << "\\n";
}
`,
    "12 11 31 01 1",
  ),
  {
    skill: "graph-basics",
    rung: 5,
    title: "Count the doubled roads",
    promptMd: `Each pair \`{u, v}\` in \`roads\` is a two-way road between towns u and v (u ≠ v), and the same two towns can be joined by several roads, listed either way round. Write \`long long doubledRoads(std::vector<std::pair<int, int>> roads)\` that counts the pairs of roads (i < j) that join the same two towns. For \`{{0, 1}, {1, 0}, {2, 3}}\` that's 1. ${TASK} ${limits("up to 200,000 roads")}`,
    functionSignature: "long long doubledRoads(std::vector<std::pair<int, int>> roads)",
    call: printCall("doubledRoads"),
    generator: GEN + GRAPH,
    starterCode: `#include <utility>
#include <vector>

long long doubledRoads(std::vector<std::pair<int, int>> roads) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <utility>
#include <vector>

long long doubledRoads(std::vector<std::pair<int, int>> roads) {
    for (auto& [u, v] : roads)
        if (u > v) std::swap(u, v);  // a two-way road: write every road the same way round
    std::sort(roads.begin(), roads.end());
    long long pairs = 0;
    for (std::size_t i = 0, j = 0; i < roads.size(); i = j) {
        while (j < roads.size() && roads[j] == roads[i]) j++;
        pairs += (long long)(j - i) * (j - i - 1) / 2;
    }
    return pairs;
}
`,
    bruteForce: `#include <utility>
#include <vector>

long long doubledRoads(std::vector<std::pair<int, int>> roads) {
    long long pairs = 0;
    for (std::size_t i = 0; i < roads.size(); i++)
        for (std::size_t j = i + 1; j < roads.size(); j++)
            pairs += roads[i] == roads[j] || (roads[i].first == roads[j].second && roads[i].second == roads[j].first);
    return pairs;
}
`,
    cases: [
      { args: "{{0, 1}, {1, 0}, {2, 3}}", expected: "1" },
      { args: "{}", expected: "0" },
      { args: "{{0, 1}, {0, 1}, {1, 0}}", expected: "3" },
      { args: "{{1, 2}, {2, 3}, {3, 1}}", expected: "0" },
      { args: "{{4, 5}, {5, 4}, {4, 5}, {5, 4}}", expected: "6" },
      { args: "gen::edges(771, 50, 2000)" },
      { args: "gen::edges(772, 1000, 200000)" },
    ],
  },

  // ── bfs ──
  predict(
    "bfs",
    "What does it print? Distances around a wall",
    `#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::vector<std::string> grid = {"..#", ".#.", "..."};
    std::vector<std::vector<int>> dist(3, std::vector<int>(3, -1));
    std::queue<std::pair<int, int>> q;
    dist[0][0] = 0;
    q.push({0, 0});
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr > 2 || nc < 0 || nc > 2 || grid[nr][nc] == '#' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }
    for (int r = 0; r < 3; r++) {
        for (int c = 0; c < 3; c++) std::cout << (grid[r][c] == '#' ? std::string("#") : std::to_string(dist[r][c]));
        std::cout << "\\n";
    }
}
`,
    "01#\n1#5\n234",
  ),
  {
    skill: "bfs",
    rung: 5,
    title: "A knight's fewest moves",
    promptMd: `A chess knight moves two squares one way and one square at right angles. On an n × n board, rows and columns numbered from 0, write \`int knightMoves(int n, int r1, int c1, int r2, int c2)\` that returns the fewest moves from (r1, c1) to (r2, c2) without leaving the board, or -1 if it can't get there. For an 8 × 8 board from (0, 0) to (7, 7) that's 6. ${TASK} ${limits("boards up to 1000 × 1000")}`,
    functionSignature: "int knightMoves(int n, int r1, int c1, int r2, int c2)",
    call: printCall("knightMoves"),
    starterCode: `int knightMoves(int n, int r1, int c1, int r2, int c2) {
    return -1;
}
`,
    reference: `#include <queue>
#include <vector>

int knightMoves(int n, int r1, int c1, int r2, int c2) {
    const int dr[] = {-2, -2, -1, -1, 1, 1, 2, 2}, dc[] = {-1, 1, -2, 2, -2, 2, -1, 1};
    std::vector<int> dist(n * n, -1);  // every move costs one, so breadth-first order is fewest-moves order
    std::queue<int> q;
    dist[r1 * n + c1] = 0;
    q.push(r1 * n + c1);
    while (!q.empty()) {
        int cell = q.front(), r = cell / n, c = cell % n;
        q.pop();
        if (r == r2 && c == c2) return dist[cell];
        for (int d = 0; d < 8; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n || dist[nr * n + nc] != -1) continue;
            dist[nr * n + nc] = dist[cell] + 1;
            q.push(nr * n + nc);
        }
    }
    return -1;
}
`,
    bruteForce: `#include <vector>

int knightMoves(int n, int r1, int c1, int r2, int c2) {
    const int dr[] = {-2, -2, -1, -1, 1, 1, 2, 2}, dc[] = {-1, 1, -2, 2, -2, 2, -1, 1};
    std::vector<int> dist(n * n, -1);
    dist[r1 * n + c1] = 0;
    for (bool changed = true; changed;) {  // one move further per round, over the whole board, until nothing improves
        changed = false;
        std::vector<int> next = dist;
        for (int cell = 0; cell < n * n; cell++) {
            if (dist[cell] == -1) continue;
            for (int d = 0; d < 8; d++) {
                int nr = cell / n + dr[d], nc = cell % n + dc[d];
                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
                int& to = next[nr * n + nc];
                if (to == -1 || dist[cell] + 1 < to) to = dist[cell] + 1, changed = true;
            }
        }
        dist = next;
    }
    return dist[r2 * n + c2];
}
`,
    cases: [
      { args: "8, 0, 0, 7, 7", expected: "6" },
      { args: "1, 0, 0, 0, 0", expected: "0" },
      { args: "3, 0, 0, 1, 1", expected: "-1" },
      { args: "8, 0, 0, 1, 2", expected: "1" },
      { args: "4, 0, 0, 3, 3", expected: "2" },
      { args: "5, 0, 0, 4, 4", expected: "4" },
      { args: "50, 0, 0, 49, 49" },
      { args: "1000, 0, 0, 999, 999" },
    ],
  },

  // ── dfs ──
  predict(
    "dfs",
    "What does it print? A stack and a recursion",
    `#include <iostream>
#include <vector>

std::vector<std::vector<int>> adj = {{1, 2}, {3}, {3}, {}};
std::vector<bool> seen(4, false);

void recurse(int u) {
    seen[u] = true;
    std::cout << u;
    for (int v : adj[u])
        if (!seen[v]) recurse(v);
}

int main() {
    std::vector<bool> done(4, false);
    std::vector<int> stack = {0};
    while (!stack.empty()) {
        int u = stack.back();
        stack.pop_back();
        if (done[u]) continue;
        done[u] = true;
        std::cout << u;
        for (int v : adj[u]) stack.push_back(v);
    }
    std::cout << " ";
    recurse(0);
    std::cout << "\\n";
}
`,
    "0231 0132",
  ),
  {
    skill: "dfs",
    rung: 5,
    title: "Count the closed islands",
    promptMd: `In a grid, \`#\` is land and \`.\` is water. An island is a group of land cells joined up, down, left or right. Write \`int closedIslands(const std::vector<std::string>& grid)\` that counts the islands that don't touch the grid's edge. For \`{"....", ".##.", "...."}\` that's 1. ${TASK} ${limits("grids up to 1000 × 1000")}`,
    functionSignature: "int closedIslands(const std::vector<std::string>& grid)",
    call: printCall("closedIslands"),
    generator: GEN + GRAPH,
    starterCode: `#include <string>
#include <vector>

int closedIslands(const std::vector<std::string>& grid) {
    return 0;
}
`,
    reference: `#include <string>
#include <vector>

int closedIslands(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = rows ? grid[0].size() : 0, count = 0;
    std::vector<bool> seen(rows * cols, false);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    for (int start = 0; start < rows * cols; start++) {
        if (grid[start / cols][start % cols] != '#' || seen[start]) continue;
        bool closed = true;
        std::vector<int> stack = {start};  // depth-first over one island
        seen[start] = true;
        while (!stack.empty()) {
            int cell = stack.back(), r = cell / cols, c = cell % cols;
            stack.pop_back();
            if (r == 0 || c == 0 || r == rows - 1 || c == cols - 1) closed = false;  // keep going: the whole island must be marked
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] != '#' || seen[nr * cols + nc]) continue;
                seen[nr * cols + nc] = true;
                stack.push_back(nr * cols + nc);
            }
        }
        count += closed;
    }
    return count;
}
`,
    bruteForce: `#include <string>
#include <vector>

int closedIslands(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = rows ? grid[0].size() : 0, count = 0;
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    for (int start = 0; start < rows * cols; start++) {  // a fresh search of its island from every land cell
        if (grid[start / cols][start % cols] != '#') continue;
        std::vector<bool> seen(rows * cols, false);
        std::vector<int> stack = {start};
        seen[start] = true;
        bool closed = true, first = true;
        while (!stack.empty()) {
            int cell = stack.back(), r = cell / cols, c = cell % cols;
            stack.pop_back();
            if (cell < start) first = false;  // count each island once, at its first cell
            if (r == 0 || c == 0 || r == rows - 1 || c == cols - 1) closed = false;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] != '#' || seen[nr * cols + nc]) continue;
                seen[nr * cols + nc] = true;
                stack.push_back(nr * cols + nc);
            }
        }
        count += closed && first;
    }
    return count;
}
`,
    cases: [
      { args: `{"....", ".##.", "...."}`, expected: "1" },
      { args: `{"##", "##"}`, expected: "0" },
      { args: `{"."}`, expected: "0" },
      { args: `{".....", ".#.#.", ".....", "..#..", "....."}`, expected: "3" },
      { args: `{"...", ".#.", ".#."}`, expected: "0" },
      { args: `{"#.#", "...", "#.#"}`, expected: "0" },
      { args: "gen::grid(773, 30, 30, 50)" },
      { args: "gen::grid(774, 1000, 1000, 55)" },
    ],
  },

  // ── topological-sort ──
  predict(
    "topological-sort",
    "What does it print? An order, then the longest chains",
    `#include <algorithm>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

int main() {
    int n = 5;
    std::vector<std::pair<int, int>> before = {{3, 1}, {3, 0}, {1, 0}, {2, 0}, {4, 2}};
    std::vector<std::vector<int>> adj(n);
    std::vector<int> indegree(n, 0), longest(n, 0);
    for (auto [a, b] : before) adj[a].push_back(b), indegree[b]++;
    std::queue<int> q;
    for (int v = 0; v < n; v++)
        if (indegree[v] == 0) q.push(v);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        std::cout << u;
        for (int v : adj[u]) {
            longest[v] = std::max(longest[v], longest[u] + 1);
            if (--indegree[v] == 0) q.push(v);
        }
    }
    std::cout << " ";
    for (int x : longest) std::cout << x;
    std::cout << "\\n";
}
`,
    "34120 21100",
  ),
  {
    skill: "topological-sort",
    rung: 5,
    title: "An alphabet from a sorted dictionary",
    promptMd: `\`words\` are sorted in the dictionary order of an unknown alphabet that uses lowercase letters. Write \`std::string alienOrder(const std::vector<std::string>& words)\` that returns an order of all the letters that appear in the words which agrees with the dictionary: when several letters could come next, take the one earliest in the ordinary alphabet. If no order works (the words contradict each other, or a word comes before its own prefix), return "". For \`{"wrt", "wrf", "er", "ett", "rftt"}\` that's "wertf". Hint: the first difference between two neighbouring words gives one "comes before" rule. ${TASK} Up to 1,000 words of up to 100 letters.`,
    functionSignature: "std::string alienOrder(const std::vector<std::string>& words)",
    call: printCall("alienOrder"),
    starterCode: `#include <string>
#include <vector>

std::string alienOrder(const std::vector<std::string>& words) {
    return "";
}
`,
    reference: `#include <functional>
#include <queue>
#include <set>
#include <string>
#include <vector>

std::string alienOrder(const std::vector<std::string>& words) {
    std::vector<bool> used(26, false);
    for (const auto& w : words)
        for (char c : w) used[c - 'a'] = true;
    std::vector<std::set<int>> after(26);
    std::vector<int> indegree(26, 0);
    for (std::size_t i = 0; i + 1 < words.size(); i++) {
        const std::string &a = words[i], &b = words[i + 1];
        std::size_t k = 0;
        while (k < a.size() && k < b.size() && a[k] == b[k]) k++;
        if (k == a.size() || k == b.size()) {
            if (a.size() > b.size()) return "";  // a word can't come after its own prefix
            continue;
        }
        if (after[a[k] - 'a'].insert(b[k] - 'a').second) indegree[b[k] - 'a']++;
    }
    std::priority_queue<int, std::vector<int>, std::greater<int>> ready;  // Kahn's algorithm, earliest letter first
    for (int c = 0; c < 26; c++)
        if (used[c] && indegree[c] == 0) ready.push(c);
    std::string order;
    while (!ready.empty()) {
        int c = ready.top();
        ready.pop();
        order += (char)('a' + c);
        for (int d : after[c])
            if (--indegree[d] == 0) ready.push(d);
    }
    int letters = 0;
    for (bool u : used) letters += u;
    return (int)order.size() == letters ? order : "";  // letters left over sit on a cycle
}
`,
    cases: [
      { args: `{"wrt", "wrf", "er", "ett", "rftt"}`, expected: "wertf" },
      { args: `{"z", "x"}`, expected: "zx" },
      { args: `{"z", "x", "z"}`, expected: "" },
      { args: `{"abc", "ab"}`, expected: "" },
      { args: `{"ba", "bc", "ac", "cab"}`, expected: "bac" },
      { args: `{"ab", "ab"}`, expected: "ab" },
      { args: `{"cb", "ca"}`, expected: "bac" },
    ],
  },

  // ── union-find ──
  predict(
    "union-find",
    "What does it print? Roads that close a loop",
    `#include <iostream>
#include <utility>
#include <vector>

std::vector<int> parent = {0, 1, 2, 3, 4};

int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }

int main() {
    std::vector<std::pair<int, int>> roads = {{0, 1}, {1, 2}, {3, 4}, {2, 0}, {4, 3}};
    for (int i = 0; i < (int)roads.size(); i++) {
        int a = find(roads[i].first), b = find(roads[i].second);
        if (a == b) std::cout << i << " ";
        else parent[a] = b;
    }
    int groups = 0;
    for (int v = 0; v < 5; v++) groups += find(v) == v;
    std::cout << groups << " ";
    for (int p : parent) std::cout << p;
    std::cout << "\\n";
}
`,
    "3 4 2 22244",
  ),
  {
    skill: "union-find",
    rung: 5,
    title: "Can all the rules hold?",
    promptMd: `Variables are numbered from 0 to n - 1. Each rule is \`{1, a, b}\`, meaning a and b are equal, or \`{2, a, b}\`, meaning they are different. Write \`bool rulesHold(int n, const std::vector<std::array<int, 3>>& rules)\` that says whether values can be chosen so that every rule holds. For n = 3 and \`{{1, 0, 1}, {1, 1, 2}, {2, 0, 2}}\` the answer is no. Hint: join the equal pairs first, then check each "different" rule. ${TASK} ${limits("up to 200,000 variables and 200,000 rules")}`,
    functionSignature: "bool rulesHold(int n, const std::vector<std::array<int, 3>>& rules)",
    call: yesNoCall("rulesHold"),
    generator: GEN + RULES,
    starterCode: `#include <array>
#include <vector>

bool rulesHold(int n, const std::vector<std::array<int, 3>>& rules) {
    return true;
}
`,
    reference: `#include <array>
#include <numeric>
#include <vector>

int find(std::vector<int>& parent, int x) { return parent[x] == x ? x : parent[x] = find(parent, parent[x]); }

bool rulesHold(int n, const std::vector<std::array<int, 3>>& rules) {
    std::vector<int> parent(n);
    std::iota(parent.begin(), parent.end(), 0);
    for (auto [type, a, b] : rules)
        if (type == 1) parent[find(parent, a)] = find(parent, b);
    for (auto [type, a, b] : rules)  // only once every equality is in can a "different" rule be judged
        if (type == 2 && find(parent, a) == find(parent, b)) return false;
    return true;
}
`,
    bruteForce: `#include <array>
#include <vector>

bool rulesHold(int n, const std::vector<std::array<int, 3>>& rules) {
    std::vector<std::vector<int>> equal(n);
    for (auto [type, a, b] : rules)
        if (type == 1) equal[a].push_back(b), equal[b].push_back(a);
    for (auto [type, a, b] : rules) {  // a fresh search from a for every "different" rule
        if (type != 2) continue;
        std::vector<bool> seen(n, false);
        std::vector<int> stack = {a};
        seen[a] = true;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : equal[u])
                if (!seen[v]) seen[v] = true, stack.push_back(v);
        }
        if (seen[b]) return false;
    }
    return true;
}
`,
    cases: [
      { args: "3, {{1, 0, 1}, {1, 1, 2}, {2, 0, 2}}", expected: "no" },
      { args: "2, {{1, 0, 1}, {2, 1, 0}}", expected: "no" },
      { args: "3, {{1, 0, 1}, {2, 1, 2}}", expected: "yes" },
      { args: "1, {{2, 0, 0}, {1, 0, 0}}", expected: "no" },
      { args: "4, {}", expected: "yes" },
      { args: "4, {{1, 0, 1}, {1, 2, 3}, {2, 0, 3}}", expected: "yes" },
      { args: "2000, gen::rules(775, 2000, 2000, 50, false)" },
      { args: "2000, gen::rules(776, 2000, 2000, 50, true)" },
      { args: "200000, gen::rules(777, 200000, 200000, 2, false)" },
    ],
  },
];
