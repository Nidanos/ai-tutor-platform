import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, GRAPH, limits, showCall } from "./harness.js";

const ROADS = "Roads are two-way, numbered towns run from 0 to n - 1, and no road joins a town to itself.";

// n people: everyone but the judge trusts the judge, plus extra trusts among the others, never the same pair twice.
// flaw 1: one person doesn't trust the judge; flaw 2: the judge trusts someone.
const TRUST = String.raw`
namespace gen {
std::vector<std::pair<int, int>> trust(std::uint64_t seed, int n, int extra, int flaw) {
    state = seed;
    int judge = (int)between(0, n - 1), skip = flaw == 1 ? (int)between(0, n - 1) : -1;
    if (skip == judge) skip = (judge + 1) % n;
    std::vector<std::pair<int, int>> out;
    for (int i = 0; i < n; i++)
        if (i != judge && i != skip) out.push_back({i, judge});
    for (int i = 0; i < extra; i++) {
        int a = i % n, b = (a + 1 + i / n) % n;
        if (a != judge && b != judge) out.push_back({a, b});
    }
    if (flaw == 2) out.push_back({judge, (judge + 1) % n});
    for (int i = (int)out.size() - 1; i > 0; i--) std::swap(out[i], out[between(0, i)]);
    return out;
}
}  // namespace gen
`;

export const graphBasics: ExerciseTemplate[] = [
  predict(
    "graph-basics",
    "What does it print? A list and a matrix",
    `#include <iostream>
#include <utility>
#include <vector>

int main() {
    int n = 5;
    std::vector<std::pair<int, int>> roads = {{0, 1}, {0, 2}, {1, 2}, {3, 1}, {2, 4}};
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : roads) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    std::vector<std::vector<int>> matrix(n, std::vector<int>(n, 0));
    for (auto [u, v] : roads) matrix[u][v] = 1;  // one-way: only u to v
    for (int v = 0; v < n; v++) std::cout << adj[v].size();
    std::cout << " ";
    for (int x : adj[1]) std::cout << x;
    std::cout << " " << matrix[1][3] << matrix[3][1] << "\\n";
}
`,
    "23311 023 01",
  ),
  {
    skill: "graph-basics",
    rung: 2,
    title: "Fix the degree count",
    promptMd: `\`degrees(n, roads)\` returns how many roads touch each town. ${ROADS} Two towns can be joined by more than one road, and each one counts. For n = 4 and \`{{0, 1}, {1, 2}, {1, 3}}\` that's \`1 3 1 1\`, but the function gets it wrong. **Find the fault and fix it.** ${limits("up to 200,000 towns and 1,000,000 roads")}`,
    functionSignature: "std::vector<int> degrees(int n, const std::vector<std::pair<int, int>>& roads)",
    call: showCall("degrees"),
    generator: GEN + GRAPH,
    starterCode: `#include <utility>
#include <vector>

std::vector<int> degrees(int n, const std::vector<std::pair<int, int>>& roads) {
    std::vector<int> degree(n, 0);
    for (auto [u, v] : roads) degree[u]++;
    return degree;
}
`,
    reference: `#include <utility>
#include <vector>

std::vector<int> degrees(int n, const std::vector<std::pair<int, int>>& roads) {
    std::vector<int> degree(n, 0);
    for (auto [u, v] : roads) degree[u]++, degree[v]++;  // a two-way road touches both of its towns
    return degree;
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> degrees(int n, const std::vector<std::pair<int, int>>& roads) {
    std::vector<int> degree(n, 0);
    for (int town = 0; town < n; town++)
        for (auto [u, v] : roads) degree[town] += (u == town) + (v == town);
    return degree;
}
`,
    cases: [
      { args: "4, {{0, 1}, {1, 2}, {1, 3}}", expected: "1 3 1 1" },
      { args: "3, {}", expected: "0 0 0" },
      { args: "1, {}", expected: "0" },
      { args: "3, {{0, 1}, {0, 1}}", expected: "2 2 0" },
      { args: "5, {{4, 3}, {3, 2}, {2, 4}}", expected: "0 0 2 2 2" },
      { args: "2000, gen::edges(411, 2000, 2000)" },
      { args: "200000, gen::edges(412, 200000, 1000000)" },
    ],
  },
  {
    skill: "graph-basics",
    rung: 3,
    title: "Complete the road lookup",
    promptMd: `\`hasRoad(n, roads, questions)\` answers, for each question \`{a, b}\`, 1 if a road joins towns a and b and 0 if not. ${ROADS} It keeps each town's neighbours in a sorted list and looks the other town up with \`std::binary_search\`. **Complete the part that builds the lists.** ${limits("up to 1,000,000 roads and 1,000,000 questions")}`,
    functionSignature: "std::vector<int> hasRoad(int n, const std::vector<std::pair<int, int>>& roads, const std::vector<std::pair<int, int>>& questions)",
    call: showCall("hasRoad"),
    generator: GEN + GRAPH,
    starterCode: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<int> hasRoad(int n, const std::vector<std::pair<int, int>>& roads, const std::vector<std::pair<int, int>>& questions) {
    std::vector<std::vector<int>> adj(n);
    // TODO: add each road to both towns' lists, then sort every list
    std::vector<int> answers;
    for (auto [a, b] : questions) answers.push_back(std::binary_search(adj[a].begin(), adj[a].end(), b));
    return answers;
}
`,
    reference: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<int> hasRoad(int n, const std::vector<std::pair<int, int>>& roads, const std::vector<std::pair<int, int>>& questions) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : roads) adj[u].push_back(v), adj[v].push_back(u);
    for (auto& list : adj) std::sort(list.begin(), list.end());  // binary_search needs sorted lists
    std::vector<int> answers;
    for (auto [a, b] : questions) answers.push_back(std::binary_search(adj[a].begin(), adj[a].end(), b));
    return answers;
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> hasRoad(int n, const std::vector<std::pair<int, int>>& roads, const std::vector<std::pair<int, int>>& questions) {
    std::vector<int> answers;
    for (auto [a, b] : questions) {
        int found = 0;
        for (auto [u, v] : roads) found |= (u == a && v == b) || (u == b && v == a);
        answers.push_back(found);
    }
    return answers;
}
`,
    cases: [
      { args: "4, {{0, 1}, {1, 2}, {3, 1}}, {{1, 0}, {0, 2}, {1, 3}, {2, 2}}", expected: "1 0 1 0" },
      { args: "3, {}, {{0, 1}, {2, 1}}", expected: "0 0" },
      { args: "2, {{0, 1}, {1, 0}}, {{0, 1}, {1, 0}}", expected: "1 1" },
      { args: "5, {{0, 4}, {2, 3}}, {}", expected: "" },
      { args: "100, gen::edges(413, 100, 2000), gen::edges(414, 100, 2000)" },
      { args: "1000, gen::edges(415, 1000, 1000000), gen::edges(416, 1000, 1000000)" },
    ],
  },
  {
    skill: "graph-basics",
    rung: 4,
    title: "Extend a person's friends to friends of friends",
    promptMd: `\`friendsOfFriends(n, friendships, person)\` builds an adjacency list and, so far, returns the person's friends. Friendships go both ways, people are numbered from 0 to n - 1, and nobody is their own friend. **Extend it** to return the people exactly two steps away instead: friends of a friend who aren't the person and aren't already a friend. Return them in increasing order, each once. For \`{{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 2}, {4, 5}}\` and person 0 that's \`2 5\`. ${limits("up to 200,000 people and 1,000,000 friendships")}`,
    functionSignature: "std::vector<int> friendsOfFriends(int n, const std::vector<std::pair<int, int>>& friendships, int person)",
    call: showCall("friendsOfFriends"),
    generator: GEN + GRAPH,
    starterCode: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<int> friendsOfFriends(int n, const std::vector<std::pair<int, int>>& friendships, int person) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : friendships) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<int> out = adj[person];  // so far: the person's friends
    std::sort(out.begin(), out.end());
    out.erase(std::unique(out.begin(), out.end()), out.end());
    return out;
}
`,
    reference: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<int> friendsOfFriends(int n, const std::vector<std::pair<int, int>>& friendships, int person) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : friendships) adj[u].push_back(v), adj[v].push_back(u);
    std::vector<bool> near(n, false);  // the person, their friends, and everyone already listed
    near[person] = true;
    for (int f : adj[person]) near[f] = true;
    std::vector<int> out;
    for (int f : adj[person])
        for (int g : adj[f])
            if (!near[g]) near[g] = true, out.push_back(g);
    std::sort(out.begin(), out.end());
    return out;
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> friendsOfFriends(int n, const std::vector<std::pair<int, int>>& friendships, int person) {
    std::vector<bool> isFriend(n, false);
    for (auto [u, v] : friendships) {
        if (u == person) isFriend[v] = true;
        if (v == person) isFriend[u] = true;
    }
    std::vector<int> out;
    for (int w = 0; w < n; w++) {
        if (w == person || isFriend[w]) continue;
        bool twoSteps = false;
        for (auto [u, v] : friendships) twoSteps |= (u == w && isFriend[v]) || (v == w && isFriend[u]);
        if (twoSteps) out.push_back(w);
    }
    return out;
}
`,
    cases: [
      { args: "6, {{0, 1}, {1, 2}, {2, 3}, {0, 4}, {4, 2}, {4, 5}}, 0", expected: "2 5" },
      { args: "3, {}, 1", expected: "" },
      { args: "4, {{0, 1}, {1, 2}, {2, 0}, {2, 3}}, 0", expected: "3" },
      { args: "5, {{0, 1}, {1, 2}, {1, 2}, {2, 3}}, 3", expected: "1" },
      { args: "4, {{0, 1}, {2, 3}}, 0", expected: "" },
      { args: "2000, gen::edges(417, 2000, 4000), 7" },
      { args: "200000, gen::edges(418, 200000, 1000000), 12345" },
    ],
  },
  {
    skill: "graph-basics",
    rung: 5,
    title: "Find the town judge",
    promptMd: `In a town of n people, numbered from 0 to n - 1, each pair \`{a, b}\` in \`trust\` means a trusts b. Nobody trusts themselves, and no pair appears twice. The town judge, if there is one, trusts nobody, and everybody else trusts the judge. \`findJudge(n, trust)\` returns the judge's number, or -1 if there is no judge. For n = 3 and \`{{0, 2}, {1, 2}}\` that's 2. ${TASK} ${limits("up to 200,000 people and 500,000 trusts")}`,
    functionSignature: "int findJudge(int n, const std::vector<std::pair<int, int>>& trust)",
    call: printCall("findJudge"),
    generator: GEN + TRUST,
    starterCode: `#include <utility>
#include <vector>

int findJudge(int n, const std::vector<std::pair<int, int>>& trust) {
    return -1;
}
`,
    reference: `#include <utility>
#include <vector>

int findJudge(int n, const std::vector<std::pair<int, int>>& trust) {
    std::vector<int> trusts(n, 0), trustedBy(n, 0);  // out-degree and in-degree
    for (auto [a, b] : trust) trusts[a]++, trustedBy[b]++;
    for (int i = 0; i < n; i++)
        if (trusts[i] == 0 && trustedBy[i] == n - 1) return i;
    return -1;
}
`,
    bruteForce: `#include <utility>
#include <vector>

int findJudge(int n, const std::vector<std::pair<int, int>>& trust) {
    for (int c = 0; c < n; c++) {
        int trustedBy = 0;
        bool trustsSomeone = false;
        for (auto [a, b] : trust) trustedBy += b == c, trustsSomeone |= a == c;
        if (!trustsSomeone && trustedBy == n - 1) return c;
    }
    return -1;
}
`,
    cases: [
      { args: "3, {{0, 2}, {1, 2}}", expected: "2" },
      { args: "1, {}", expected: "0" },
      { args: "2, {}", expected: "-1" },
      { args: "3, {{0, 2}, {1, 2}, {2, 0}}", expected: "-1" },
      { args: "4, {{0, 3}, {1, 3}, {2, 3}, {0, 1}}", expected: "3" },
      { args: "4, {{0, 1}, {2, 1}, {3, 0}}", expected: "-1" },
      { args: "2000, gen::trust(419, 2000, 3000, 0)" },
      { args: "2000, gen::trust(420, 2000, 3000, 1)" },
      { args: "200000, gen::trust(421, 200000, 300000, 2)" },
      { args: "200000, gen::trust(422, 200000, 300000, 0)" },
    ],
  },
];
