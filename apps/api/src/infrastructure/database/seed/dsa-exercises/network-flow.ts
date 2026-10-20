import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall } from "./harness.js";

const PIPES = "Junctions are numbered from 0 to n - 1, and each pipe `{u, v, c}` carries up to c units one way, from u to v; two junctions can be joined by several pipes.";

// m random (worker, job) pairs.
const CAN_DO = String.raw`
namespace gen {
std::vector<std::pair<int, int>> canDo(std::uint64_t seed, int m, int workers, int jobs) {
    state = seed;
    std::vector<std::pair<int, int>> out(m);
    for (auto& [w, j] : out) w = (int)between(0, workers - 1), j = (int)between(0, jobs - 1);
    return out;
}
}  // namespace gen
`;

// Edmonds-Karp on a capacity matrix: shortest augmenting paths by BFS. `reverse` is the residual-capacity line.
const edmondsKarp = (reverse: string) => `#include <algorithm>
#include <array>
#include <climits>
#include <queue>
#include <vector>

struct Network {
    int n;
    std::vector<std::vector<long long>> cap;  // what each pipe can still carry
    Network(int n, const std::vector<std::array<int, 3>>& pipes) : n(n), cap(n, std::vector<long long>(n, 0)) {
        for (auto [u, v, c] : pipes) cap[u][v] += c;
    }
    long long maxFlow(int source, int sink) {
        long long total = 0;
        while (true) {
            std::vector<int> from(n, -1);  // how the search reached each junction
            from[source] = source;
            std::queue<int> q;
            q.push(source);
            while (!q.empty() && from[sink] == -1) {
                int u = q.front();
                q.pop();
                for (int v = 0; v < n; v++)
                    if (from[v] == -1 && cap[u][v] > 0) from[v] = u, q.push(v);
            }
            if (from[sink] == -1) return total;  // no path has room left
            long long push = LLONG_MAX;
            for (int v = sink; v != source; v = from[v]) push = std::min(push, cap[from[v]][v]);
            for (int v = sink; v != source; v = from[v]) {
                cap[from[v]][v] -= push;
${reverse}
            }
            total += push;
        }
    }
};
`;
const RESIDUAL = "                cap[v][from[v]] += push;  // room to send it back: a later path may undo this one";

// Kuhn's algorithm: each worker in turn looks for a free job, moving earlier workers along if it must.
const KUHN = `#include <utility>
#include <vector>

struct Matching {
    std::vector<std::vector<int>> adj;  // the jobs each worker can do
    std::vector<int> owner, tried;  // each job's worker (-1: free), and the round it was last tried in
    int round = 0;
    bool assign(int w) {
        for (int j : adj[w]) {
            if (tried[j] == round) continue;
            tried[j] = round;
            if (owner[j] == -1 || assign(owner[j])) {  // free, or its worker can move to another job
                owner[j] = w;
                return true;
            }
        }
        return false;
    }
};

int maxMatching(int workers, int jobs, const std::vector<std::pair<int, int>>& canDo) {
    Matching m{std::vector<std::vector<int>>(workers), std::vector<int>(jobs, -1), std::vector<int>(jobs, 0)};
    for (auto [w, j] : canDo) m.adj[w].push_back(j);
    int matched = 0;
    for (int w = 0; w < workers; w++) m.round++, matched += m.assign(w);
    return matched;
}
`;

// Brute forces: augmenting paths by BFS on a full matrix (source, left side, right side, sink), O(V^2) per path.
const MATRIX_MATCHING = `#include <queue>
#include <utility>
#include <vector>

int matchingByFlow(int left, int right, const std::vector<std::pair<int, int>>& pairs) {
    int n = left + right + 2, s = n - 2, t = n - 1;
    std::vector<std::vector<char>> cap(n, std::vector<char>(n, 0));
    for (int a = 0; a < left; a++) cap[s][a] = 1;
    for (int b = 0; b < right; b++) cap[left + b][t] = 1;
    for (auto [a, b] : pairs) cap[a][left + b] = 1;
    for (int flow = 0;; flow++) {
        std::vector<int> from(n, -1);
        from[s] = s;
        std::queue<int> q;
        q.push(s);
        while (!q.empty() && from[t] == -1) {
            int u = q.front();
            q.pop();
            for (int v = 0; v < n; v++)
                if (from[v] == -1 && cap[u][v]) from[v] = u, q.push(v);
        }
        if (from[t] == -1) return flow;
        for (int v = t; v != s; v = from[v]) cap[from[v]][v]--, cap[v][from[v]]++;
    }
}
`;

export const networkFlow: ExerciseTemplate[] = [
  predict(
    "network-flow",
    "What does it print? Augmenting paths",
    `#include <algorithm>
#include <climits>
#include <iostream>
#include <queue>
#include <vector>

int main() {
    int n = 4, source = 0, sink = 3;
    std::vector<std::vector<int>> cap(n, std::vector<int>(n, 0));
    cap[0][1] = 3, cap[0][2] = 2, cap[1][2] = 5, cap[1][3] = 2, cap[2][3] = 3;
    int total = 0;
    while (true) {
        std::vector<int> from(n, -1);
        from[source] = source;
        std::queue<int> q;
        q.push(source);
        while (!q.empty() && from[sink] == -1) {
            int u = q.front();
            q.pop();
            for (int v = 0; v < n; v++)
                if (from[v] == -1 && cap[u][v] > 0) from[v] = u, q.push(v);
        }
        if (from[sink] == -1) break;
        int push = INT_MAX;
        for (int v = sink; v != source; v = from[v]) push = std::min(push, cap[from[v]][v]);
        for (int v = sink; v != source; v = from[v]) cap[from[v]][v] -= push, cap[v][from[v]] += push;
        std::cout << push << " ";
        total += push;
    }
    std::cout << total << "\\n";
}
`,
    "2 2 1 5",
  ),
  {
    skill: "network-flow",
    rung: 2,
    title: "Fix the maximum flow",
    promptMd: `${PIPES} \`maxFlow(n, pipes, source, sink)\` returns the most units per second that can flow from \`source\` to \`sink\`, using Edmonds-Karp: it keeps sending flow along the shortest path that still has room. For n = 6, \`{{0, 1, 1}, {0, 2, 1}, {1, 3, 1}, {1, 4, 1}, {2, 3, 1}, {3, 5, 1}, {4, 5, 1}}\`, source 0 and sink 5 that's 2, but it stops at 1: an early path blocks the later ones. **Find the fault and fix it.** At most 100 junctions.`,
    functionSignature: "long long maxFlow(int n, const std::vector<std::array<int, 3>>& pipes, int source, int sink)",
    call: printCall("maxFlow"),
    starterCode: `${edmondsKarp("")}
long long maxFlow(int n, const std::vector<std::array<int, 3>>& pipes, int source, int sink) {
    Network net(n, pipes);
    return net.maxFlow(source, sink);
}
`,
    reference: `${edmondsKarp(RESIDUAL)}
long long maxFlow(int n, const std::vector<std::array<int, 3>>& pipes, int source, int sink) {
    Network net(n, pipes);
    return net.maxFlow(source, sink);
}
`,
    cases: [
      { args: "6, {{0, 1, 1}, {0, 2, 1}, {1, 3, 1}, {1, 4, 1}, {2, 3, 1}, {3, 5, 1}, {4, 5, 1}}, 0, 5", expected: "2" },
      { args: "2, {{0, 1, 7}, {0, 1, 5}}, 0, 1", expected: "12" },
      { args: "3, {{0, 1, 4}, {2, 1, 9}}, 0, 2", expected: "0" },
      { args: "4, {{0, 1, 3}, {0, 2, 2}, {1, 2, 5}, {1, 3, 2}, {2, 3, 3}}, 0, 3", expected: "5" },
      { args: "4, {{0, 1, 1000000000}, {1, 3, 1000000000}, {0, 2, 1000000000}, {2, 3, 1000000000}}, 0, 3", expected: "2000000000" },
      { args: "6, {{0, 1, 2}, {0, 2, 2}, {1, 3, 2}, {1, 4, 2}, {2, 3, 2}, {3, 5, 2}, {4, 5, 2}}, 0, 5", expected: "4" },
    ],
  },
  {
    skill: "network-flow",
    rung: 3,
    title: "Complete the job matching",
    promptMd: `Each pair \`{w, j}\` in \`canDo\` means worker w can do job j; workers and jobs are numbered from 0. Each worker takes at most one job and each job at most one worker. \`maxMatching(workers, jobs, canDo)\` returns the most workers that can get a job, with Kuhn's algorithm: each worker in turn tries its jobs, and a job that's taken can still be won if its worker can move to another one. **Complete the TODO** in \`assign\`. For 2 workers, 2 jobs and \`{{0, 0}, {0, 1}, {1, 0}}\` that's 2: worker 0 moves over to job 1. ${limits("up to 2,000 workers, 2,000 jobs and 10,000 pairs")}`,
    functionSignature: "int maxMatching(int workers, int jobs, const std::vector<std::pair<int, int>>& canDo)",
    call: printCall("maxMatching"),
    generator: GEN + CAN_DO,
    starterCode: KUHN.replace(
      `            if (owner[j] == -1 || assign(owner[j])) {  // free, or its worker can move to another job
                owner[j] = w;
                return true;
            }
`,
      "            // TODO: take job j if it's free, or if its worker can move to another job\n",
    ),
    reference: KUHN,
    bruteForce: `${MATRIX_MATCHING}
int maxMatching(int workers, int jobs, const std::vector<std::pair<int, int>>& canDo) { return matchingByFlow(workers, jobs, canDo); }
`,
    cases: [
      { args: "2, 2, {{0, 0}, {0, 1}, {1, 0}}", expected: "2" },
      { args: "3, 3, {{0, 0}, {0, 1}, {1, 0}, {2, 1}}", expected: "2" },
      { args: "2, 2, {}", expected: "0" },
      { args: "1, 1, {{0, 0}, {0, 0}}", expected: "1" },
      { args: "3, 3, {{0, 0}, {1, 0}, {1, 1}, {2, 1}, {2, 2}}", expected: "3" },
      { args: "4, 2, {{0, 0}, {1, 0}, {2, 0}, {3, 1}}", expected: "2" },
      { args: "150, 150, gen::canDo(503, 600, 150, 150)" },
      { args: "2000, 2000, gen::canDo(504, 10000, 2000, 2000)" },
    ],
  },
  {
    skill: "network-flow",
    rung: 4,
    title: "Extend the maximum flow to a minimum cut",
    promptMd: `${PIPES} \`sourceSide(n, pipes, source, sink)\` already runs Edmonds-Karp to find the maximum flow, but returns nothing yet. **Extend it** to return the junctions on the source's side of a minimum cut: every junction the source can still reach through pipes with room left, once the flow is at its maximum. Return them in increasing order. Cutting the pipes from that side to the other costs exactly the maximum flow, and no cut is cheaper. For n = 4, \`{{0, 1, 5}, {1, 2, 1}, {2, 3, 5}}\`, source 0 and sink 3 that's \`0 1\`. At most 100 junctions.`,
    functionSignature: "std::vector<int> sourceSide(int n, const std::vector<std::array<int, 3>>& pipes, int source, int sink)",
    call: showCall("sourceSide"),
    generator: GEN,
    starterCode: `${edmondsKarp(RESIDUAL)}
std::vector<int> sourceSide(int n, const std::vector<std::array<int, 3>>& pipes, int source, int sink) {
    Network net(n, pipes);
    net.maxFlow(source, sink);
    return {};  // so far: nothing
}
`,
    reference: `${edmondsKarp(RESIDUAL)}
std::vector<int> sourceSide(int n, const std::vector<std::array<int, 3>>& pipes, int source, int sink) {
    Network net(n, pipes);
    net.maxFlow(source, sink);
    std::vector<bool> reached(n, false);  // a search through the room the flow left behind
    std::vector<int> stack = {source};
    reached[source] = true;
    while (!stack.empty()) {
        int u = stack.back();
        stack.pop_back();
        for (int v = 0; v < n; v++)
            if (!reached[v] && net.cap[u][v] > 0) reached[v] = true, stack.push_back(v);
    }
    std::vector<int> side;
    for (int v = 0; v < n; v++)
        if (reached[v]) side.push_back(v);
    return side;
}
`,
    cases: [
      { args: "4, {{0, 1, 5}, {1, 2, 1}, {2, 3, 5}}, 0, 3", expected: "0 1" },
      { args: "4, {{0, 1, 3}, {0, 2, 2}, {1, 2, 5}, {1, 3, 2}, {2, 3, 3}}, 0, 3", expected: "0" },
      { args: "5, {{0, 1, 4}, {0, 2, 4}, {1, 3, 1}, {2, 3, 1}, {3, 4, 10}}, 0, 4", expected: "0 1 2" },
      { args: "3, {{0, 1, 2}, {1, 0, 1}}, 0, 2", expected: "0 1" },
      { args: "4, {{0, 1, 10}, {1, 3, 1}, {0, 2, 1}, {2, 3, 10}}, 0, 3", expected: "0 1" },
      { args: "4, {{0, 1, 2}, {1, 2, 2}, {2, 3, 1}, {0, 2, 1}}, 0, 3", expected: "0 1 2" },
    ],
  },
  {
    skill: "network-flow",
    rung: 5,
    title: "The fewest vans to cover every stop",
    promptMd: `A town's one-way streets never lead round in a circle. Stops are numbered from 0 to n - 1, and each pair \`{u, v}\` is a street from stop u straight to stop v. A van's route is a list of stops, each joined to the next by a street, and every stop must be on **exactly one** van's route (a route can be a single stop). \`fewestVans(n, streets)\` returns the fewest vans needed. For n = 5 and \`{{0, 2}, {1, 2}, {2, 3}, {2, 4}}\` that's 3: for example 0 → 2 → 3, then 1, then 4. ${TASK} ${limits("up to 2,000 stops and 6,000 streets")}`,
    functionSignature: "int fewestVans(int n, const std::vector<std::pair<int, int>>& streets)",
    call: printCall("fewestVans"),
    generator: GEN + GRAPH,
    starterCode: `#include <utility>
#include <vector>

int fewestVans(int n, const std::vector<std::pair<int, int>>& streets) {
    return 0;
}
`,
    reference: `${KUHN}
int fewestVans(int n, const std::vector<std::pair<int, int>>& streets) {
    // Each street used by a van joins two routes into one. Matching every stop to at most one "next" stop and
    // one "previous" stop is a matching from stops to stops, and the vans needed are n minus its size.
    return n - maxMatching(n, n, streets);
}
`,
    bruteForce: `${MATRIX_MATCHING}
int fewestVans(int n, const std::vector<std::pair<int, int>>& streets) { return n - matchingByFlow(n, n, streets); }
`,
    cases: [
      { args: "5, {{0, 2}, {1, 2}, {2, 3}, {2, 4}}", expected: "3" },
      { args: "4, {{0, 1}, {1, 2}, {2, 3}}", expected: "1" },
      { args: "4, {}", expected: "4" },
      { args: "1, {}", expected: "1" },
      { args: "4, {{0, 1}, {0, 2}, {0, 3}}", expected: "3" },
      { args: "6, {{0, 1}, {1, 2}, {3, 4}, {4, 5}, {0, 4}}", expected: "2" },
      { args: "150, gen::dag(505, 150, 400, 10)" },
      { args: "2000, gen::dag(506, 2000, 6000, 10)" },
    ],
  },
];
