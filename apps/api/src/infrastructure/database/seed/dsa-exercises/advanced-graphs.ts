import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall } from "./harness.js";

const ROADS = "Towns are numbered from 0 to n - 1, roads are two-way, and two towns can be joined by more than one road.";
const LINKS = "People are numbered from 0 to n - 1, and each pair `{a, b}` is a one-way link: whatever a hears, b hears next.";

const BRIDGES = `#include <algorithm>
#include <utility>
#include <vector>

struct Bridges {
    std::vector<std::vector<std::pair<int, int>>> adj;  // (neighbour, road number)
    std::vector<int> disc, low, found;
    int timer = 0;
    void dfs(int u, int viaRoad) {
        disc[u] = low[u] = timer++;
        for (auto [v, road] : adj[u]) {
            if (road == viaRoad) continue;  // not straight back along the road we came by
            if (disc[v] == -1) {
                dfs(v, road);
                low[u] = std::min(low[u], low[v]);
                if (low[v] >= disc[u]) found.push_back(road);
            } else low[u] = std::min(low[u], disc[v]);
        }
    }
};

std::vector<int> bridges(int n, const std::vector<std::pair<int, int>>& roads) {
    Bridges b{std::vector<std::vector<std::pair<int, int>>>(n), std::vector<int>(n, -1), std::vector<int>(n), {}};
    for (int i = 0; i < (int)roads.size(); i++) b.adj[roads[i].first].push_back({roads[i].second, i}), b.adj[roads[i].second].push_back({roads[i].first, i});
    for (int s = 0; s < n; s++)
        if (b.disc[s] == -1) b.dfs(s, -1);
    std::sort(b.found.begin(), b.found.end());
    return b.found;
}
`;

const CUT_POINTS = `#include <algorithm>
#include <utility>
#include <vector>

struct CutPoints {
    std::vector<std::vector<int>> adj;
    std::vector<int> disc, low;
    std::vector<bool> isCut;
    int timer = 0;
    void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        int children = 0;  // children in the search tree
        for (int v : adj[u]) {
            if (v == parent) continue;
            if (disc[v] == -1) {
                children++;
                dfs(v, u);
                low[u] = std::min(low[u], low[v]);
                if (parent != -1 && low[v] >= disc[u]) isCut[u] = true;  // v's subtree can't get above u without u
            } else low[u] = std::min(low[u], disc[v]);
        }
        // TODO: the search's starting town has nothing above it: say when it is a cut point
    }
};

std::vector<int> cutPoints(int n, const std::vector<std::pair<int, int>>& roads) {
    CutPoints c{std::vector<std::vector<int>>(n), std::vector<int>(n, -1), std::vector<int>(n), std::vector<bool>(n, false)};
    for (auto [u, v] : roads) c.adj[u].push_back(v), c.adj[v].push_back(u);
    for (int s = 0; s < n; s++)
        if (c.disc[s] == -1) c.dfs(s, -1);
    std::vector<int> out;
    for (int v = 0; v < n; v++)
        if (c.isCut[v]) out.push_back(v);
    return out;
}
`;

// Kosaraju's algorithm: finishing order on the links, then searches on the reversed links in reverse finishing order.
const KOSARAJU = `#include <utility>
#include <vector>

struct Components {
    std::vector<std::vector<int>> adj, radj;
    std::vector<int> order, comp;
    std::vector<bool> seen;
    int count = 0;
    void forward(int u) {
        seen[u] = true;
        for (int v : adj[u])
            if (!seen[v]) forward(v);
        order.push_back(u);
    }
    void backward(int u) {
        comp[u] = count;
        for (int v : radj[u])
            if (comp[v] == -1) backward(v);
    }
    Components(int n, const std::vector<std::pair<int, int>>& links) : adj(n), radj(n), comp(n, -1), seen(n, false) {
        for (auto [a, b] : links) adj[a].push_back(b), radj[b].push_back(a);
        for (int s = 0; s < n; s++)
            if (!seen[s]) forward(s);
        for (int i = n - 1; i >= 0; i--)
            if (comp[order[i]] == -1) backward(order[i]), count++;
    }
};
`;

// Brute forces: plain searches from every vertex, O(n (n + m)).
const REACH = `#include <utility>
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
`;

// Counts the groups (people who all reach each other), the groups no link comes into from outside (sources),
// and those no link leaves (sinks): each group is counted at its smallest-numbered person.
const GROUP_ENDS = `#include <array>
${REACH}
std::array<int, 3> groupsSourcesSinks(int n, const std::vector<std::pair<int, int>>& links) {
    std::vector<std::vector<int>> adj(n), radj(n);
    for (auto [a, b] : links) adj[a].push_back(b), radj[b].push_back(a);
    int groups = 0, sources = 0, sinks = 0;
    for (int s = 0; s < n; s++) {
        std::vector<bool> from = reach(adj, s), to = reach(radj, s);
        bool smallest = true, source = true, sink = true;
        for (int v = 0; v < n; v++) {
            if (from[v] && to[v] && v < s) smallest = false;
            if (to[v] && !from[v]) source = false;  // someone outside the group reaches it
            if (from[v] && !to[v]) sink = false;
        }
        if (smallest) groups++, sources += source, sinks += sink;
    }
    return {groups, sources, sinks};
}
`;

export const advancedGraphs: ExerciseTemplate[] = [
  predict(
    "advanced-graphs",
    "What does it print? Discovery times and low links",
    `#include <algorithm>
#include <iostream>
#include <vector>

std::vector<std::vector<int>> adj = {{1, 2}, {0, 2}, {0, 1, 3}, {2, 4}, {3}};  // two-way roads
std::vector<int> disc(5, -1), low(5);
int timer = 0;

void dfs(int u, int parent) {
    disc[u] = low[u] = timer++;
    for (int v : adj[u]) {
        if (v == parent) continue;
        if (disc[v] == -1) {
            dfs(v, u);
            low[u] = std::min(low[u], low[v]);
            if (low[v] > disc[u]) std::cout << u << "-" << v << " ";
        } else low[u] = std::min(low[u], disc[v]);
    }
}

int main() {
    dfs(0, -1);
    std::cout << "\\n";
    for (int x : low) std::cout << x;
    std::cout << "\\n";
}
`,
    "3-4 2-3\n00034",
  ),
  {
    skill: "advanced-graphs",
    rung: 2,
    title: "Fix the bridge finder",
    promptMd: `${ROADS} A road is a bridge if closing it leaves two towns that could reach each other unable to. \`bridges(n, roads)\` returns the positions of the bridges in \`roads\`, in increasing order, using discovery times and low links. For n = 5 and \`{{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}}\` that's \`3 4\`, but it also reports roads that lie on a loop. **Find the fault and fix it.** ${limits("up to 100,000 towns and 150,000 roads")}`,
    functionSignature: "std::vector<int> bridges(int n, const std::vector<std::pair<int, int>>& roads)",
    call: showCall("bridges"),
    generator: GEN + GRAPH,
    starterCode: BRIDGES,
    reference: BRIDGES.replace(
      "if (low[v] >= disc[u]) found.push_back(road);",
      "if (low[v] > disc[u]) found.push_back(road);  // nothing below v gets back to u or above: only this road joins them",
    ),
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> bridges(int n, const std::vector<std::pair<int, int>>& roads) {
    std::vector<int> out;
    for (int skip = 0; skip < (int)roads.size(); skip++) {  // close each road in turn: are its ends still joined?
        std::vector<std::vector<int>> adj(n);
        for (int i = 0; i < (int)roads.size(); i++)
            if (i != skip) adj[roads[i].first].push_back(roads[i].second), adj[roads[i].second].push_back(roads[i].first);
        std::vector<bool> seen(n, false);
        std::vector<int> stack = {roads[skip].first};
        seen[roads[skip].first] = true;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : adj[u])
                if (!seen[v]) seen[v] = true, stack.push_back(v);
        }
        if (!seen[roads[skip].second]) out.push_back(skip);
    }
    return out;
}
`,
    cases: [
      { args: "5, {{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}}", expected: "3 4" },
      { args: "2, {{0, 1}, {0, 1}}", expected: "" },
      { args: "3, {}", expected: "" },
      { args: "4, {{0, 1}, {2, 3}}", expected: "0 1" },
      { args: "4, {{0, 1}, {1, 2}, {2, 3}, {3, 0}}", expected: "" },
      { args: "6, {{0, 1}, {1, 2}, {2, 0}, {3, 4}, {4, 5}, {5, 3}, {2, 3}}", expected: "6" },
      { args: "1000, gen::edges(495, 1000, 1500)" },
      { args: "100000, gen::edges(496, 100000, 150000)" },
    ],
  },
  {
    skill: "advanced-graphs",
    rung: 3,
    title: "Complete the cut-point finder",
    promptMd: `${ROADS} A town is a cut point if closing it (and its roads) leaves some of the other towns unable to reach each other. \`cutPoints(n, roads)\` returns them in increasing order. Inside the search, a town u is a cut point when some child v has \`low[v] >= disc[u]\`, but that rule is wrong for the town each search **starts** from. **Complete the TODO** with the rule for that town. For n = 3 and \`{{0, 1}, {0, 2}}\` that's \`0\`. ${limits("up to 100,000 towns and 150,000 roads")}`,
    functionSignature: "std::vector<int> cutPoints(int n, const std::vector<std::pair<int, int>>& roads)",
    call: showCall("cutPoints"),
    generator: GEN + GRAPH,
    starterCode: CUT_POINTS,
    reference: CUT_POINTS.replace(
      "        // TODO: the search's starting town has nothing above it: say when it is a cut point\n",
      "        if (parent == -1 && children > 1) isCut[u] = true;  // its subtrees meet only through it\n",
    ),
    bruteForce: `${REACH}
int groups(const std::vector<std::vector<int>>& adj, int closed) {
    int n = adj.size(), count = 0;
    std::vector<bool> seen(n, false);
    if (closed >= 0) seen[closed] = true;
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        count++;
        std::vector<int> stack = {s};
        seen[s] = true;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (int v : adj[u])
                if (!seen[v]) seen[v] = true, stack.push_back(v);
        }
    }
    return count;
}

std::vector<int> cutPoints(int n, const std::vector<std::pair<int, int>>& roads) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : roads) adj[u].push_back(v), adj[v].push_back(u);
    int before = groups(adj, -1);
    std::vector<int> out;
    for (int v = 0; v < n; v++)  // close each town in turn: do the others split into more groups?
        if (groups(adj, v) > before) out.push_back(v);
    return out;
}
`,
    cases: [
      { args: "3, {{0, 1}, {0, 2}}", expected: "0" },
      { args: "5, {{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}}", expected: "2 3" },
      { args: "4, {{0, 1}, {1, 2}, {2, 3}, {3, 0}}", expected: "" },
      { args: "1, {}", expected: "" },
      { args: "5, {{1, 2}, {2, 3}, {3, 4}}", expected: "2 3" },
      { args: "4, {{0, 1}, {0, 1}, {1, 2}, {1, 3}}", expected: "1" },
      { args: "1000, gen::edges(497, 1000, 1500)" },
      { args: "100000, gen::edges(498, 100000, 150000)" },
    ],
  },
  {
    skill: "advanced-graphs",
    rung: 4,
    title: "Extend the group count to the fewest people to tell",
    promptMd: `${LINKS} A group is a largest set of people who all reach each other. \`fewestToTell(n, links)\` finds the groups with Kosaraju's algorithm and, so far, returns how many there are. **Extend it** to return the fewest people you must tell a message directly so that everyone hears it. Hint: that's the number of groups no link comes into from outside. For n = 5 and \`{{0, 1}, {1, 2}, {2, 0}, {3, 2}, {4, 3}}\` there are 3 groups, but telling person 4 is enough, so the answer is 1. ${limits("up to 100,000 people and 150,000 links")}`,
    functionSignature: "int fewestToTell(int n, const std::vector<std::pair<int, int>>& links)",
    call: printCall("fewestToTell"),
    generator: GEN + GRAPH,
    starterCode: `${KOSARAJU}
int fewestToTell(int n, const std::vector<std::pair<int, int>>& links) {
    Components c(n, links);
    return c.count;  // so far: how many groups
}
`,
    reference: `${KOSARAJU}
int fewestToTell(int n, const std::vector<std::pair<int, int>>& links) {
    Components c(n, links);
    std::vector<bool> heardFromOutside(c.count, false);
    for (auto [a, b] : links)
        if (c.comp[a] != c.comp[b]) heardFromOutside[c.comp[b]] = true;
    int tell = 0;
    for (bool heard : heardFromOutside) tell += !heard;  // one person in each group nobody else reaches
    return tell;
}
`,
    bruteForce: `${GROUP_ENDS}
int fewestToTell(int n, const std::vector<std::pair<int, int>>& links) { return groupsSourcesSinks(n, links)[1]; }
`,
    cases: [
      { args: "5, {{0, 1}, {1, 2}, {2, 0}, {3, 2}, {4, 3}}", expected: "1" },
      { args: "3, {}", expected: "3" },
      { args: "1, {}", expected: "1" },
      { args: "4, {{0, 1}, {2, 3}}", expected: "2" },
      { args: "4, {{0, 1}, {1, 0}, {2, 3}, {3, 2}, {0, 2}}", expected: "1" },
      { args: "3, {{0, 1}, {1, 2}, {2, 0}}", expected: "1" },
      { args: "1000, gen::edges(499, 1000, 1500)" },
      { args: "100000, gen::edges(500, 100000, 150000)" },
    ],
  },
  {
    skill: "advanced-graphs",
    rung: 5,
    title: "The fewest new links so everyone reaches everyone",
    promptMd: `${LINKS} \`linksToAdd(n, links)\` returns the fewest new one-way links to add so that every person can reach every other person. For n = 3 and \`{{0, 1}, {1, 2}}\` that's 1 (a link from 2 back to 0). ${TASK} ${limits("up to 100,000 people and 200,000 links")}`,
    functionSignature: "int linksToAdd(int n, const std::vector<std::pair<int, int>>& links)",
    call: printCall("linksToAdd"),
    generator: GEN + GRAPH,
    starterCode: `#include <utility>
#include <vector>

int linksToAdd(int n, const std::vector<std::pair<int, int>>& links) {
    return 0;
}
`,
    reference: `#include <algorithm>
${KOSARAJU}
int linksToAdd(int n, const std::vector<std::pair<int, int>>& links) {
    Components c(n, links);
    if (c.count == 1) return 0;
    std::vector<bool> linkIn(c.count, false), linkOut(c.count, false);
    for (auto [a, b] : links)
        if (c.comp[a] != c.comp[b]) linkOut[c.comp[a]] = true, linkIn[c.comp[b]] = true;
    int sources = 0, sinks = 0;
    for (int g = 0; g < c.count; g++) sources += !linkIn[g], sinks += !linkOut[g];
    return std::max(sources, sinks);  // each new link can serve one group nothing reaches and one that reaches nothing
}
`,
    bruteForce: `#include <algorithm>
${GROUP_ENDS}
int linksToAdd(int n, const std::vector<std::pair<int, int>>& links) {
    auto [groups, sources, sinks] = groupsSourcesSinks(n, links);
    return groups == 1 ? 0 : std::max(sources, sinks);
}
`,
    cases: [
      { args: "3, {{0, 1}, {1, 2}}", expected: "1" },
      { args: "3, {{0, 1}, {1, 2}, {2, 0}}", expected: "0" },
      { args: "1, {}", expected: "0" },
      { args: "3, {}", expected: "3" },
      { args: "4, {{0, 1}, {0, 2}, {0, 3}}", expected: "3" },
      { args: "5, {{0, 1}, {1, 0}, {2, 3}, {3, 4}, {4, 2}, {1, 2}}", expected: "1" },
      { args: "1000, gen::edges(501, 1000, 2000)" },
      { args: "100000, gen::edges(502, 100000, 200000)" },
    ],
  },
];
