import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall } from "./harness.js";

const LINKS = "Computers are numbered from 0 to n - 1, and a link joins two computers both ways.";

// count random operations on 0..n-1: {1, a, b} to link and {2, a, b} to ask; k random cells of a grid.
const SHAPES = String.raw`
namespace gen {
std::vector<std::array<int, 3>> linkOps(std::uint64_t seed, int count, int n) {
    state = seed;
    std::vector<std::array<int, 3>> ops(count);
    for (auto& op : ops) op = {(int)between(1, 2), (int)between(0, n - 1), (int)between(0, n - 1)};
    return ops;
}
std::vector<std::pair<int, int>> cells(std::uint64_t seed, int k, int rows, int cols) {
    state = seed;
    std::vector<std::pair<int, int>> out(k);
    for (auto& [r, c] : out) r = (int)between(0, rows - 1), c = (int)between(0, cols - 1);
    return out;
}
}  // namespace gen
`;

const GROUPS_HEAD = `#include <numeric>
#include <utility>
#include <vector>

struct Groups {
    std::vector<int> parent, size;
    int count;
    Groups(int n) : parent(n), size(n, 1), count(n) { std::iota(parent.begin(), parent.end(), 0); }
    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }  // path compression
`;

const UNITE = `    void unite(int a, int b) {
        a = find(a), b = find(b);
        if (a == b) return;
        if (size[a] < size[b]) std::swap(a, b);  // the smaller group goes under the larger
        parent[b] = a;
        size[a] += size[b];
        count--;
    }
};
`;

const GROUPS_AFTER_EACH = `
std::vector<int> groupsAfterEach(int n, const std::vector<std::pair<int, int>>& links) {
    Groups g(n);
    std::vector<int> out;
    for (auto [a, b] : links) {
        g.unite(a, b);
        out.push_back(g.count);
    }
    return out;
}
`;

// Brute forces: every computer carries a group label, and a link relabels a whole group.
const LABELS = `#include <algorithm>
#include <utility>
#include <vector>

void relabel(std::vector<int>& label, int a, int b) {
    int keep = label[a], drop = label[b];
    if (keep != drop) std::replace(label.begin(), label.end(), drop, keep);
}
`;

export const unionFind: ExerciseTemplate[] = [
  predict(
    "union-find",
    "What does it print? Union by size, path compression",
    `#include <iostream>
#include <utility>
#include <vector>

std::vector<int> parent = {0, 1, 2, 3, 4, 5}, groupSize(6, 1);

int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }

void unite(int a, int b) {
    a = find(a), b = find(b);
    if (a == b) return;
    if (groupSize[a] < groupSize[b]) std::swap(a, b);
    parent[b] = a;
    groupSize[a] += groupSize[b];
}

int main() {
    unite(0, 1);
    unite(2, 3);
    unite(1, 3);
    unite(4, 5);
    std::cout << parent[3] << " ";
    for (int i = 0; i < 6; i++) std::cout << find(i);
    std::cout << " " << parent[3] << "\\n";
    unite(5, 0);
    std::cout << find(5) << " " << groupSize[find(4)] << "\\n";
}
`,
    "2 000044 0\n0 6",
  ),
  {
    skill: "union-find",
    rung: 2,
    title: "Fix the merge",
    promptMd: `${LINKS} Each operation is \`{1, a, b}\`, add a link between a and b, or \`{2, a, b}\`, ask whether a and b are connected yet, directly or through others. \`connected(n, ops)\` answers each question with 1 or 0, using disjoint set union. For n = 3 and \`{{1, 0, 1}, {1, 2, 1}, {2, 0, 2}, {2, 0, 1}}\` that's \`1 1\`, but some links get lost. **Find the fault and fix it.** ${limits("up to 200,000 computers and operations")}`,
    functionSignature: "std::vector<int> connected(int n, const std::vector<std::array<int, 3>>& ops)",
    call: showCall("connected"),
    generator: GEN + SHAPES,
    starterCode: `#include <array>
${GROUPS_HEAD}    void unite(int a, int b) {
        if (find(a) == find(b)) return;
        if (size[a] < size[b]) std::swap(a, b);  // the smaller group goes under the larger
        parent[b] = a;
        size[a] += size[b];
        count--;
    }
};

std::vector<int> connected(int n, const std::vector<std::array<int, 3>>& ops) {
    Groups g(n);
    std::vector<int> answers;
    for (auto [type, a, b] : ops) {
        if (type == 1) g.unite(a, b);
        else answers.push_back(g.find(a) == g.find(b));
    }
    return answers;
}
`,
    reference: `#include <array>
${GROUPS_HEAD}    void unite(int a, int b) {
        a = find(a), b = find(b);  // link the roots, never the computers themselves
        if (a == b) return;
        if (size[a] < size[b]) std::swap(a, b);  // the smaller group goes under the larger
        parent[b] = a;
        size[a] += size[b];
        count--;
    }
};

std::vector<int> connected(int n, const std::vector<std::array<int, 3>>& ops) {
    Groups g(n);
    std::vector<int> answers;
    for (auto [type, a, b] : ops) {
        if (type == 1) g.unite(a, b);
        else answers.push_back(g.find(a) == g.find(b));
    }
    return answers;
}
`,
    bruteForce: `#include <array>
#include <numeric>
${LABELS}
std::vector<int> connected(int n, const std::vector<std::array<int, 3>>& ops) {
    std::vector<int> label(n), answers;
    std::iota(label.begin(), label.end(), 0);
    for (auto [type, a, b] : ops) {
        if (type == 1) relabel(label, a, b);
        else answers.push_back(label[a] == label[b]);
    }
    return answers;
}
`,
    cases: [
      { args: "3, {{1, 0, 1}, {1, 2, 1}, {2, 0, 2}, {2, 0, 1}}", expected: "1 1" },
      { args: "2, {{2, 0, 1}, {1, 0, 1}, {2, 1, 0}}", expected: "0 1" },
      { args: "1, {{2, 0, 0}}", expected: "1" },
      { args: "5, {{1, 0, 1}, {1, 3, 4}, {2, 1, 3}, {1, 1, 4}, {2, 0, 3}, {2, 2, 4}}", expected: "0 1 0" },
      { args: "4, {}", expected: "" },
      { args: "2000, gen::linkOps(465, 2000, 2000)" },
      { args: "200000, gen::linkOps(466, 200000, 200000)" },
    ],
  },
  {
    skill: "union-find",
    rung: 3,
    title: "Complete the merge that counts groups",
    promptMd: `${LINKS} Links arrive one at a time, and \`groupsAfterEach(n, links)\` returns how many separate groups there are after each one. It keeps a disjoint set union with \`find\` already written. **Complete \`unite\`**: join the two groups, the smaller one under the larger, and keep \`count\` up to date. For n = 4 and \`{{0, 1}, {2, 3}, {1, 0}, {3, 0}}\` that's \`3 2 2 1\`. ${limits("up to 200,000 computers and links")}`,
    functionSignature: "std::vector<int> groupsAfterEach(int n, const std::vector<std::pair<int, int>>& links)",
    call: showCall("groupsAfterEach"),
    generator: GEN + GRAPH,
    starterCode: `${GROUPS_HEAD}    void unite(int a, int b) {
        // TODO: join the groups of a and b, the smaller under the larger, and keep count up to date
    }
};
${GROUPS_AFTER_EACH}`,
    reference: GROUPS_HEAD + UNITE + GROUPS_AFTER_EACH,
    bruteForce: `#include <numeric>
${LABELS}
std::vector<int> groupsAfterEach(int n, const std::vector<std::pair<int, int>>& links) {
    std::vector<int> label(n), out;
    std::iota(label.begin(), label.end(), 0);
    int groups = n;
    for (auto [a, b] : links) {
        groups -= label[a] != label[b];
        relabel(label, a, b);
        out.push_back(groups);
    }
    return out;
}
`,
    cases: [
      { args: "4, {{0, 1}, {2, 3}, {1, 0}, {3, 0}}", expected: "3 2 2 1" },
      { args: "3, {}", expected: "" },
      { args: "1, {{0, 0}}", expected: "1" },
      { args: "5, {{4, 3}, {3, 2}, {2, 4}, {0, 1}, {1, 4}}", expected: "4 3 3 2 1" },
      { args: "6, {{0, 1}, {2, 3}, {4, 5}, {1, 3}, {5, 2}}", expected: "5 4 3 2 1" },
      { args: "2000, gen::edges(467, 2000, 2000)" },
      { args: "200000, gen::edges(468, 200000, 200000)" },
    ],
  },
  {
    skill: "union-find",
    rung: 4,
    title: "Extend the group count to the largest group",
    promptMd: `${LINKS} Links arrive one at a time, and \`afterEach(n, links)\` keeps a disjoint set union that, so far, reports how many separate groups there are after each link. **Extend it** to report instead how many computers the **largest** group has after each link. For n = 5 and \`{{0, 1}, {2, 3}, {3, 4}, {1, 0}}\` that's \`2 2 3 3\`. ${limits("up to 200,000 computers and links")}`,
    functionSignature: "std::vector<int> afterEach(int n, const std::vector<std::pair<int, int>>& links)",
    call: showCall("afterEach"),
    generator: GEN + GRAPH,
    starterCode: (GROUPS_HEAD + UNITE + GROUPS_AFTER_EACH).replace("groupsAfterEach", "afterEach"),
    reference: (GROUPS_HEAD + UNITE + GROUPS_AFTER_EACH)
      .replace("groupsAfterEach", "afterEach")
      .replace("    int count;\n", "    int count, largest = 1;\n")
      .replace("        count--;\n", "        count--;\n        if (size[a] > largest) largest = size[a];  // only a group that just grew can be a new largest\n")
      .replace("out.push_back(g.count)", "out.push_back(g.largest)"),
    bruteForce: `#include <numeric>
${LABELS}
std::vector<int> afterEach(int n, const std::vector<std::pair<int, int>>& links) {
    std::vector<int> label(n), out;
    std::iota(label.begin(), label.end(), 0);
    for (auto [a, b] : links) {
        relabel(label, a, b);
        std::vector<int> members(n, 0);  // count every group again
        for (int l : label) members[l]++;
        out.push_back(*std::max_element(members.begin(), members.end()));
    }
    return out;
}
`,
    cases: [
      { args: "5, {{0, 1}, {2, 3}, {3, 4}, {1, 0}}", expected: "2 2 3 3" },
      { args: "2, {}", expected: "" },
      { args: "1, {{0, 0}}", expected: "1" },
      { args: "6, {{0, 1}, {2, 3}, {1, 2}, {4, 5}, {5, 0}}", expected: "2 2 4 4 6" },
      { args: "4, {{3, 3}, {1, 2}}", expected: "1 2" },
      { args: "2000, gen::edges(469, 2000, 2000)" },
      { args: "200000, gen::edges(470, 200000, 200000)" },
    ],
  },
  {
    skill: "union-find",
    rung: 5,
    title: "Islands as the land rises",
    promptMd: `A rows × cols map starts as all water. Each pair \`{r, c}\` in \`land\` turns that cell into land, one after another; a cell can come up more than once, and land stays land. An island is a group of land cells joined up, down, left or right. \`islandsAfterEach(rows, cols, land)\` returns how many islands there are after each cell turns. For a 3 × 3 map and \`{{0, 0}, {0, 1}, {1, 2}, {2, 1}, {1, 1}}\` that's \`1 1 2 3 1\`. ${TASK} ${limits("maps up to 1000 × 1000 and 200,000 cells")}`,
    functionSignature: "std::vector<int> islandsAfterEach(int rows, int cols, const std::vector<std::pair<int, int>>& land)",
    call: showCall("islandsAfterEach"),
    generator: GEN + SHAPES,
    starterCode: `#include <utility>
#include <vector>

std::vector<int> islandsAfterEach(int rows, int cols, const std::vector<std::pair<int, int>>& land) {
    return {};
}
`,
    reference: `${GROUPS_HEAD}${UNITE}
std::vector<int> islandsAfterEach(int rows, int cols, const std::vector<std::pair<int, int>>& land) {
    Groups g(rows * cols);
    std::vector<bool> isLand(rows * cols, false);
    int islands = 0;
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    std::vector<int> out;
    for (auto [r, c] : land) {
        int cell = r * cols + c;
        if (!isLand[cell]) {
            isLand[cell] = true;
            islands++;  // a new island of one cell, until it joins its neighbours
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || !isLand[nr * cols + nc]) continue;
                if (g.find(cell) != g.find(nr * cols + nc)) g.unite(cell, nr * cols + nc), islands--;
            }
        }
        out.push_back(islands);
    }
    return out;
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> islandsAfterEach(int rows, int cols, const std::vector<std::pair<int, int>>& land) {
    std::vector<bool> isLand(rows * cols, false);
    const int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
    std::vector<int> out;
    for (auto [r, c] : land) {
        isLand[r * cols + c] = true;
        std::vector<bool> seen(rows * cols, false);  // count the islands again from scratch
        int islands = 0;
        for (int start = 0; start < rows * cols; start++) {
            if (!isLand[start] || seen[start]) continue;
            islands++;
            std::vector<int> stack = {start};
            seen[start] = true;
            while (!stack.empty()) {
                int cell = stack.back(), cr = cell / cols, cc = cell % cols;
                stack.pop_back();
                for (int d = 0; d < 4; d++) {
                    int nr = cr + dr[d], nc = cc + dc[d];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || !isLand[nr * cols + nc] || seen[nr * cols + nc]) continue;
                    seen[nr * cols + nc] = true;
                    stack.push_back(nr * cols + nc);
                }
            }
        }
        out.push_back(islands);
    }
    return out;
}
`,
    cases: [
      { args: "3, 3, {{0, 0}, {0, 1}, {1, 2}, {2, 1}, {1, 1}}", expected: "1 1 2 3 1" },
      { args: "1, 1, {{0, 0}, {0, 0}}", expected: "1 1" },
      { args: "2, 2, {}", expected: "" },
      { args: "2, 2, {{0, 0}, {1, 1}, {0, 1}, {1, 0}}", expected: "1 2 1 1" },
      { args: "1, 5, {{0, 0}, {0, 2}, {0, 4}, {0, 1}, {0, 3}}", expected: "1 2 3 2 1" },
      { args: "40, 40, gen::cells(471, 800, 40, 40)" },
      { args: "1000, 1000, gen::cells(472, 200000, 1000, 1000)" },
    ],
  },
];
