import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall } from "./harness.js";

const BEFORE = "Tasks are numbered from 0 to n - 1, and each pair `{a, b}` means task a has to be done before task b.";

export const topologicalSort: ExerciseTemplate[] = [
  predict(
    "topological-sort",
    "What does it print? Kahn's algorithm",
    `#include <iostream>
#include <queue>
#include <utility>
#include <vector>

std::vector<int> kahn(int n, const std::vector<std::pair<int, int>>& before) {
    std::vector<std::vector<int>> adj(n);
    std::vector<int> indegree(n, 0);
    for (auto [a, b] : before) adj[a].push_back(b), indegree[b]++;
    std::queue<int> q;
    for (int v = 0; v < n; v++)
        if (indegree[v] == 0) q.push(v);
    std::vector<int> order;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indegree[v] == 0) q.push(v);
    }
    return order;
}

int main() {
    for (int v : kahn(6, {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}})) std::cout << v;
    std::cout << "\\n";
    std::cout << kahn(3, {{0, 1}, {1, 2}, {2, 1}}).size() << "\\n";
}
`,
    "452031\n1",
  ),
  {
    skill: "topological-sort",
    rung: 2,
    title: "Fix the task planner",
    promptMd: `${BEFORE} \`planOrder(n, before)\` returns an order that does every task, taking the **smallest-numbered** task whenever more than one is ready, or an empty list if no order works. For n = 4 and \`{{2, 0}, {0, 1}, {3, 1}}\` that's \`2 0 3 1\`, but it gives up on plans that work. **Find the fault and fix it.** ${limits("up to 200,000 tasks and 400,000 pairs")}`,
    functionSignature: "std::vector<int> planOrder(int n, const std::vector<std::pair<int, int>>& before)",
    call: showCall("planOrder"),
    generator: GEN + GRAPH,
    starterCode: `#include <functional>
#include <queue>
#include <utility>
#include <vector>

std::vector<int> planOrder(int n, const std::vector<std::pair<int, int>>& before) {
    std::vector<std::vector<int>> adj(n);
    std::vector<int> waiting(n, 0);  // how many tasks must still be done before each one
    for (auto [a, b] : before) adj[a].push_back(b), waiting[a]++;
    std::priority_queue<int, std::vector<int>, std::greater<int>> ready;  // smallest number on top
    for (int v = 0; v < n; v++)
        if (waiting[v] == 0) ready.push(v);
    std::vector<int> order;
    while (!ready.empty()) {
        int u = ready.top();
        ready.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--waiting[v] == 0) ready.push(v);
    }
    if ((int)order.size() < n) return {};  // the rest wait on each other in a circle
    return order;
}
`,
    reference: `#include <functional>
#include <queue>
#include <utility>
#include <vector>

std::vector<int> planOrder(int n, const std::vector<std::pair<int, int>>& before) {
    std::vector<std::vector<int>> adj(n);
    std::vector<int> waiting(n, 0);  // how many tasks must still be done before each one
    for (auto [a, b] : before) adj[a].push_back(b), waiting[b]++;  // it's b that waits for a
    std::priority_queue<int, std::vector<int>, std::greater<int>> ready;  // smallest number on top
    for (int v = 0; v < n; v++)
        if (waiting[v] == 0) ready.push(v);
    std::vector<int> order;
    while (!ready.empty()) {
        int u = ready.top();
        ready.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--waiting[v] == 0) ready.push(v);
    }
    if ((int)order.size() < n) return {};  // the rest wait on each other in a circle
    return order;
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> planOrder(int n, const std::vector<std::pair<int, int>>& before) {
    std::vector<bool> done(n, false);
    std::vector<int> order;
    for (int round = 0; round < n; round++) {  // each round: one scan of the pairs, then the smallest ready task
        std::vector<bool> blocked(n, false);
        for (auto [a, b] : before)
            if (!done[a]) blocked[b] = true;
        int next = -1;
        for (int v = 0; v < n && next < 0; v++)
            if (!done[v] && !blocked[v]) next = v;
        if (next < 0) return {};
        done[next] = true;
        order.push_back(next);
    }
    return order;
}
`,
    cases: [
      { args: "4, {{2, 0}, {0, 1}, {3, 1}}", expected: "2 0 3 1" },
      { args: "3, {}", expected: "0 1 2" },
      { args: "3, {{0, 1}, {1, 2}, {2, 0}}", expected: "" },
      { args: "5, {{4, 3}, {3, 2}, {2, 1}, {1, 0}}", expected: "4 3 2 1 0" },
      { args: "5, {{1, 0}, {3, 0}, {1, 2}}", expected: "1 2 3 0 4" },
      { args: "2000, gen::dag(453, 2000, 4000, 10)" },
      { args: "2000, gen::plusBack(gen::dag(454, 2000, 4000, 10))" },
      { args: "200000, gen::dag(455, 200000, 400000, 10)" },
    ],
  },
  {
    skill: "topological-sort",
    rung: 3,
    title: "Complete the depth-first order",
    promptMd: `${BEFORE} No tasks wait on each other in a circle. \`dfsOrder(n, before)\` runs a depth-first search from task 0, 1, 2, … in turn, skipping tasks already seen and following each task's pairs in the order given. A task is finished once every task after it is, and the **reverse** of the finishing order is a valid plan. **Complete the two TODOs.** For n = 4 and \`{{0, 1}, {0, 2}, {2, 1}, {3, 2}}\` the tasks finish as 1 2 0 3, so it returns \`3 0 2 1\`. ${limits("up to 200,000 tasks and 400,000 pairs")}`,
    functionSignature: "std::vector<int> dfsOrder(int n, const std::vector<std::pair<int, int>>& before)",
    call: showCall("dfsOrder"),
    generator: GEN + GRAPH,
    starterCode: `#include <algorithm>
#include <utility>
#include <vector>

void visit(int u, const std::vector<std::vector<int>>& adj, std::vector<bool>& seen, std::vector<int>& finished) {
    seen[u] = true;
    for (int v : adj[u])
        if (!seen[v]) visit(v, adj, seen, finished);
    // TODO: u is finished now: record it
}

std::vector<int> dfsOrder(int n, const std::vector<std::pair<int, int>>& before) {
    std::vector<std::vector<int>> adj(n);
    for (auto [a, b] : before) adj[a].push_back(b);
    std::vector<bool> seen(n, false);
    std::vector<int> finished;
    for (int s = 0; s < n; s++)
        if (!seen[s]) visit(s, adj, seen, finished);
    // TODO: turn the finishing order into the plan
    return finished;
}
`,
    reference: `#include <algorithm>
#include <utility>
#include <vector>

void visit(int u, const std::vector<std::vector<int>>& adj, std::vector<bool>& seen, std::vector<int>& finished) {
    seen[u] = true;
    for (int v : adj[u])
        if (!seen[v]) visit(v, adj, seen, finished);
    finished.push_back(u);  // everything that has to come after u is already in the list
}

std::vector<int> dfsOrder(int n, const std::vector<std::pair<int, int>>& before) {
    std::vector<std::vector<int>> adj(n);
    for (auto [a, b] : before) adj[a].push_back(b);
    std::vector<bool> seen(n, false);
    std::vector<int> finished;
    for (int s = 0; s < n; s++)
        if (!seen[s]) visit(s, adj, seen, finished);
    std::reverse(finished.begin(), finished.end());
    return finished;
}
`,
    bruteForce: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<int> dfsOrder(int n, const std::vector<std::pair<int, int>>& before) {
    std::vector<bool> seen(n, false);
    std::vector<int> finished;
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        seen[s] = true;
        std::vector<std::pair<int, std::size_t>> stack = {{s, 0}};  // a task, and how far through the pairs it has looked
        while (!stack.empty()) {
            auto& [u, i] = stack.back();
            while (i < before.size() && (before[i].first != u || seen[before[i].second])) i++;  // no lists: scan every pair
            if (i == before.size()) {
                finished.push_back(u);
                stack.pop_back();
                continue;
            }
            int v = before[i].second;
            seen[v] = true;
            stack.push_back({v, 0});
        }
    }
    std::reverse(finished.begin(), finished.end());
    return finished;
}
`,
    cases: [
      { args: "4, {{0, 1}, {0, 2}, {2, 1}, {3, 2}}", expected: "3 0 2 1" },
      { args: "3, {}", expected: "2 1 0" },
      { args: "1, {}", expected: "0" },
      { args: "4, {{3, 2}, {2, 1}, {1, 0}}", expected: "3 2 1 0" },
      { args: "5, {{0, 2}, {0, 1}, {1, 2}, {4, 0}}", expected: "4 3 0 1 2" },
      { args: "2000, gen::dag(456, 2000, 4000, 10)" },
      { args: "200000, gen::dag(457, 200000, 400000, 10)" },
    ],
  },
  {
    skill: "topological-sort",
    rung: 4,
    title: "Extend the task order to finish times",
    promptMd: `Task i takes \`duration[i]\` hours. ${BEFORE.replace("0 to n - 1", "0")} No tasks wait on each other in a circle, and any number of tasks can run at the same time. \`finishTimes(duration, before)\` works out an order with Kahn's algorithm and, so far, returns that order. **Extend it** to return each task's finish time instead: a task starts at hour 0, or as soon as the last task it waits for has finished. For \`{3, 2, 4, 1}\` and \`{{0, 1}, {0, 2}, {1, 3}, {2, 3}}\` that's \`3 5 7 8\`. ${limits("up to 200,000 tasks and 400,000 pairs")}`,
    functionSignature: "std::vector<long long> finishTimes(const std::vector<int>& duration, const std::vector<std::pair<int, int>>& before)",
    call: showCall("finishTimes"),
    generator: GEN + GRAPH,
    starterCode: `#include <queue>
#include <utility>
#include <vector>

std::vector<long long> finishTimes(const std::vector<int>& duration, const std::vector<std::pair<int, int>>& before) {
    int n = duration.size();
    std::vector<std::vector<int>> adj(n);
    std::vector<int> waiting(n, 0);
    for (auto [a, b] : before) adj[a].push_back(b), waiting[b]++;
    std::queue<int> ready;
    for (int v = 0; v < n; v++)
        if (waiting[v] == 0) ready.push(v);
    std::vector<long long> order;  // so far: the order the tasks become ready in
    while (!ready.empty()) {
        int u = ready.front();
        ready.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--waiting[v] == 0) ready.push(v);
    }
    return order;
}
`,
    reference: `#include <algorithm>
#include <queue>
#include <utility>
#include <vector>

std::vector<long long> finishTimes(const std::vector<int>& duration, const std::vector<std::pair<int, int>>& before) {
    int n = duration.size();
    std::vector<std::vector<int>> adj(n);
    std::vector<int> waiting(n, 0);
    for (auto [a, b] : before) adj[a].push_back(b), waiting[b]++;
    std::queue<int> ready;
    for (int v = 0; v < n; v++)
        if (waiting[v] == 0) ready.push(v);
    std::vector<long long> start(n, 0), finish(n);
    while (!ready.empty()) {
        int u = ready.front();
        ready.pop();
        finish[u] = start[u] + duration[u];  // every task u waits for has finished by now
        for (int v : adj[u]) {
            start[v] = std::max(start[v], finish[u]);
            if (--waiting[v] == 0) ready.push(v);
        }
    }
    return finish;
}
`,
    bruteForce: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<long long> finishTimes(const std::vector<int>& duration, const std::vector<std::pair<int, int>>& before) {
    int n = duration.size();
    std::vector<long long> finish(duration.begin(), duration.end());
    for (int round = 1; round < n; round++)  // a chain has at most n tasks, so n - 1 rounds settle every time
        for (auto [a, b] : before) finish[b] = std::max(finish[b], finish[a] + duration[b]);
    return finish;
}
`,
    cases: [
      { args: "{3, 2, 4, 1}, {{0, 1}, {0, 2}, {1, 3}, {2, 3}}", expected: "3 5 7 8" },
      { args: "{5}, {}", expected: "5" },
      { args: "{}, {}", expected: "" },
      { args: "{1, 1, 1}, {{2, 1}, {1, 0}}", expected: "3 2 1" },
      { args: "{4, 1, 1}, {{1, 2}}", expected: "4 1 2" },
      { args: "{2, 3, 1, 5}, {{0, 3}, {1, 3}, {2, 3}, {0, 1}}", expected: "2 5 1 10" },
      { args: "gen::ints(458, 2000, 1, 1000), gen::dag(459, 2000, 4000, 10)" },
      { args: "gen::ints(460, 200000, 1, 1000000), gen::dag(461, 200000, 400000, 10)" },
    ],
  },
  {
    skill: "topological-sort",
    rung: 5,
    title: "The fewest terms to finish every course",
    promptMd: `Courses are numbered from 0 to n - 1, and each pair \`{a, b}\` means course a must be passed in an **earlier** term than course b. In one term you can take as many courses as you like. \`fewestTerms(n, prereqs)\` returns the fewest terms needed to pass every course, or -1 if it can't be done. For n = 4 and \`{{0, 1}, {0, 2}, {1, 3}, {2, 3}}\` that's 3. ${TASK} ${limits("up to 200,000 courses and 400,000 pairs")}`,
    functionSignature: "int fewestTerms(int n, const std::vector<std::pair<int, int>>& prereqs)",
    call: printCall("fewestTerms"),
    generator: GEN + GRAPH,
    starterCode: `#include <utility>
#include <vector>

int fewestTerms(int n, const std::vector<std::pair<int, int>>& prereqs) {
    return -1;
}
`,
    reference: `#include <utility>
#include <vector>

int fewestTerms(int n, const std::vector<std::pair<int, int>>& prereqs) {
    std::vector<std::vector<int>> adj(n);
    std::vector<int> waiting(n, 0);
    for (auto [a, b] : prereqs) adj[a].push_back(b), waiting[b]++;
    std::vector<int> term;  // the courses open this term
    for (int v = 0; v < n; v++)
        if (waiting[v] == 0) term.push_back(v);
    int terms = 0, passed = 0;
    while (!term.empty()) {  // Kahn's algorithm one level at a time
        terms++, passed += term.size();
        std::vector<int> next;
        for (int u : term)
            for (int v : adj[u])
                if (--waiting[v] == 0) next.push_back(v);
        term.swap(next);
    }
    return passed == n ? terms : -1;
}
`,
    bruteForce: `#include <utility>
#include <vector>

int fewestTerms(int n, const std::vector<std::pair<int, int>>& prereqs) {
    std::vector<bool> passed(n, false);
    int terms = 0, left = n;
    while (left > 0) {  // each term: one scan of the pairs, then take every course nothing blocks
        std::vector<bool> blocked(n, false);
        for (auto [a, b] : prereqs)
            if (!passed[a]) blocked[b] = true;
        std::vector<int> take;
        for (int v = 0; v < n; v++)
            if (!passed[v] && !blocked[v]) take.push_back(v);
        if (take.empty()) return -1;
        for (int v : take) passed[v] = true;
        left -= take.size(), terms++;
    }
    return terms;
}
`,
    cases: [
      { args: "4, {{0, 1}, {0, 2}, {1, 3}, {2, 3}}", expected: "3" },
      { args: "3, {}", expected: "1" },
      { args: "1, {}", expected: "1" },
      { args: "3, {{0, 1}, {1, 2}, {2, 0}}", expected: "-1" },
      { args: "5, {{0, 1}, {1, 2}, {3, 4}}", expected: "3" },
      { args: "4, {{0, 1}, {1, 2}, {2, 1}, {0, 3}}", expected: "-1" },
      { args: "2000, gen::dag(462, 2000, 4000, 10)" },
      { args: "2000, gen::plusBack(gen::dag(463, 2000, 4000, 10))" },
      { args: "200000, gen::dag(464, 200000, 400000, 10)" },
    ],
  },
];
