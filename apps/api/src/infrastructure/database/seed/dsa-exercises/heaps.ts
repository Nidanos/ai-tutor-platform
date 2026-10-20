import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

// k sorted lists of the same length; and tasks (arrival, duration) that pile up faster than they're done.
const SHAPES = String.raw`
namespace gen {
std::vector<std::vector<int>> sortedLists(std::uint64_t seed, int k, int len, int lo, int hi) {
    std::vector<std::vector<int>> lists;
    for (int i = 0; i < k; i++) lists.push_back(sortedInts(seed * 1000003 + i, len, lo, hi));
    return lists;
}
std::vector<std::pair<int, int>> tasks(std::uint64_t seed, int n, int lastArrival, int longest) {
    state = seed;
    std::vector<std::pair<int, int>> out(n);
    for (auto& [arrival, duration] : out) arrival = (int)between(0, lastArrival), duration = (int)between(1, longest);
    return out;
}
}  // namespace gen
`;

const SEQUENTIAL_MERGE = `#include <vector>

std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists) {
    std::vector<int> all;
    for (const auto& list : lists) {  // merge the lists one after another
        std::vector<int> merged;
        std::size_t i = 0, j = 0;
        while (i < all.size() || j < list.size())
            merged.push_back(j == list.size() || (i < all.size() && all[i] <= list[j]) ? all[i++] : list[j++]);
        all.swap(merged);
    }
    return all;
}
`;

export const heaps: ExerciseTemplate[] = [
  predict(
    "heaps",
    "What does it print? A priority queue of pairs",
    `#include <iostream>
#include <queue>
#include <utility>
#include <vector>

int main() {
    std::vector<std::pair<int, char>> items = {{2, 'a'}, {5, 'b'}, {2, 'c'}, {9, 'd'}, {5, 'a'}};
    std::priority_queue<std::pair<int, char>> q(items.begin(), items.end());
    std::cout << q.size() << " ";
    while (!q.empty()) {
        std::cout << q.top().second;
        q.pop();
    }
    std::cout << "\\n";
}
`,
    "5 dbaca",
  ),
  {
    skill: "heaps",
    rung: 2,
    title: "Fix the order of service",
    promptMd: `\`serveOrder(priority)\` returns the order in which tasks are served: the **smallest** priority number first, and on a tie the smaller task number first. Tasks are numbered from 0. For \`{5, 1, 4, 1}\` that's \`1 3 2 0\`. It puts (priority, task) pairs in a \`std::priority_queue\`, but the order comes out backwards. **Find the fault and fix it.** ${limits("up to 1,000,000 tasks")}`,
    functionSignature: "std::vector<int> serveOrder(const std::vector<int>& priority)",
    call: showCall("serveOrder"),
    generator: GEN,
    starterCode: `#include <queue>
#include <utility>
#include <vector>

std::vector<int> serveOrder(const std::vector<int>& priority) {
    std::priority_queue<std::pair<int, int>> waiting;  // (priority, task)
    for (int i = 0; i < (int)priority.size(); i++) waiting.push({priority[i], i});
    std::vector<int> order;
    while (!waiting.empty()) {
        order.push_back(waiting.top().second);
        waiting.pop();
    }
    return order;
}
`,
    reference: `#include <functional>
#include <queue>
#include <utility>
#include <vector>

std::vector<int> serveOrder(const std::vector<int>& priority) {
    // std::priority_queue puts the largest on top; std::greater turns it into a min-heap.
    std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<>> waiting;  // (priority, task)
    for (int i = 0; i < (int)priority.size(); i++) waiting.push({priority[i], i});
    std::vector<int> order;
    while (!waiting.empty()) {
        order.push_back(waiting.top().second);
        waiting.pop();
    }
    return order;
}
`,
    bruteForce: `#include <vector>

std::vector<int> serveOrder(const std::vector<int>& priority) {
    std::vector<bool> served(priority.size(), false);
    std::vector<int> order;
    for (std::size_t round = 0; round < priority.size(); round++) {
        int best = -1;
        for (int i = 0; i < (int)priority.size(); i++)
            if (!served[i] && (best < 0 || priority[i] < priority[best])) best = i;
        served[best] = true;
        order.push_back(best);
    }
    return order;
}
`,
    cases: [
      { args: "{5, 1, 4, 1}", expected: "1 3 2 0" },
      { args: "{}", expected: "" },
      { args: "{7}", expected: "0" },
      { args: "{2, 2, 2}", expected: "0 1 2" },
      { args: "{9, -3, 0}", expected: "1 2 0" },
      { args: "gen::ints(371, 2000, 1, 50)" },
      { args: "gen::ints(372, 1000000, 1, 1000000000)" },
    ],
  },
  {
    skill: "heaps",
    rung: 3,
    title: "Complete the k-way merge",
    promptMd: `\`mergeAll(lists)\` merges sorted lists into one sorted list. A min-heap holds the smallest unused value of each list, together with which list it came from and its position there, and the heap's top is the next value overall. **Complete the step** after taking the top: its list's next value takes its place. ${limits("up to 20,000 lists and 1,000,000 values in all")}`,
    functionSignature: "std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists)",
    call: showCall("mergeAll"),
    generator: GEN + SHAPES,
    starterCode: `#include <array>
#include <functional>
#include <queue>
#include <vector>

std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists) {
    using Entry = std::array<int, 3>;  // (value, which list, position in that list)
    std::priority_queue<Entry, std::vector<Entry>, std::greater<>> heap;
    for (int i = 0; i < (int)lists.size(); i++)
        if (!lists[i].empty()) heap.push({lists[i][0], i, 0});
    std::vector<int> out;
    while (!heap.empty()) {
        auto [value, list, pos] = heap.top();
        heap.pop();
        out.push_back(value);
        // TODO: push the next value of the same list, if there is one
    }
    return out;
}
`,
    reference: `#include <array>
#include <functional>
#include <queue>
#include <vector>

std::vector<int> mergeAll(const std::vector<std::vector<int>>& lists) {
    using Entry = std::array<int, 3>;  // (value, which list, position in that list)
    std::priority_queue<Entry, std::vector<Entry>, std::greater<>> heap;
    for (int i = 0; i < (int)lists.size(); i++)
        if (!lists[i].empty()) heap.push({lists[i][0], i, 0});
    std::vector<int> out;
    while (!heap.empty()) {
        auto [value, list, pos] = heap.top();
        heap.pop();
        out.push_back(value);
        if (pos + 1 < (int)lists[list].size()) heap.push({lists[list][pos + 1], list, pos + 1});  // its list's next value
    }
    return out;
}
`,
    bruteForce: SEQUENTIAL_MERGE,
    cases: [
      { args: "{{1, 5, 9}, {2, 6}, {3, 4, 10}}", expected: "1 2 3 4 5 6 9 10" },
      { args: "{}", expected: "" },
      { args: "{{}, {7}}", expected: "7" },
      { args: "{{1, 1}, {1}, {0, 2}}", expected: "0 1 1 1 2" },
      { args: "gen::sortedLists(373, 50, 40, 1, 1000000)" },
      { args: "gen::sortedLists(374, 20000, 50, 1, 1000000000)" },
    ],
  },
  {
    skill: "heaps",
    rung: 4,
    title: "Extend the top k to every moment of a stream",
    promptMd: `\`kthLargestSoFar(stream, k)\` keeps the k largest values seen in a min-heap, with the smallest of them on top. So far it returns those k values at the end. **Extend it** to return, **after each value arrives**, the k-th largest value seen so far, or -1 while fewer than k have arrived. For \`{4, 5, 8, 2, 3}\` and k = 3 that's \`-1 -1 4 4 4\`. ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> kthLargestSoFar(const std::vector<int>& stream, int k)",
    call: showCall("kthLargestSoFar"),
    generator: GEN,
    starterCode: `#include <functional>
#include <queue>
#include <vector>

std::vector<int> kthLargestSoFar(const std::vector<int>& stream, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> best;  // the k largest so far, smallest on top
    for (int x : stream) {
        best.push(x);
        if ((int)best.size() > k) best.pop();
    }
    std::vector<int> out;
    while (!best.empty()) {
        out.push_back(best.top());
        best.pop();
    }
    return out;
}
`,
    reference: `#include <functional>
#include <queue>
#include <vector>

std::vector<int> kthLargestSoFar(const std::vector<int>& stream, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> best;  // the k largest so far, smallest on top
    std::vector<int> out;
    for (int x : stream) {
        best.push(x);
        if ((int)best.size() > k) best.pop();
        out.push_back((int)best.size() == k ? best.top() : -1);  // the smallest of the k largest is the k-th largest
    }
    return out;
}
`,
    bruteForce: `#include <algorithm>
#include <functional>
#include <vector>

std::vector<int> kthLargestSoFar(const std::vector<int>& stream, int k) {
    std::vector<int> seen, out;
    for (int x : stream) {
        seen.push_back(x);
        std::vector<int> sorted = seen;
        std::sort(sorted.begin(), sorted.end(), std::greater<int>());
        out.push_back((int)sorted.size() >= k ? sorted[k - 1] : -1);
    }
    return out;
}
`,
    cases: [
      { args: "{4, 5, 8, 2, 3}, 3", expected: "-1 -1 4 4 4" },
      { args: "{1, 2, 3}, 1", expected: "1 2 3" },
      { args: "{}, 2", expected: "" },
      { args: "{5, 5, 5}, 2", expected: "-1 5 5" },
      { args: "{10, 1, 9, 2, 8}, 2", expected: "-1 1 9 9 9" },
      { args: "gen::ints(375, 2000, 1, 1000000), 50" },
      { args: "gen::ints(376, 1000000, 1, 1000000000), 1000" },
    ],
  },
  {
    skill: "heaps",
    rung: 5,
    title: "A processor that runs the shortest task first",
    promptMd: `Tasks arrive at a single processor as (arrival time, duration) pairs, numbered from 0 in the order given. Whenever it's free, the processor starts the arrived task with the **shortest duration**, breaking ties by the smaller task number, and runs it to the end. If nothing has arrived, it waits for the next arrival. \`taskOrder(tasks)\` returns the task numbers in the order they run. For \`{{0, 5}, {1, 2}, {1, 1}, {7, 3}}\` that's \`0 2 1 3\`. ${TASK} ${limits("up to 200,000 tasks")}`,
    functionSignature: "std::vector<int> taskOrder(const std::vector<std::pair<int, int>>& tasks)",
    call: showCall("taskOrder"),
    generator: GEN + SHAPES,
    starterCode: `#include <utility>
#include <vector>

std::vector<int> taskOrder(const std::vector<std::pair<int, int>>& tasks) {
    return {};
}
`,
    reference: `#include <algorithm>
#include <functional>
#include <numeric>
#include <queue>
#include <utility>
#include <vector>

std::vector<int> taskOrder(const std::vector<std::pair<int, int>>& tasks) {
    int n = tasks.size();
    std::vector<int> byArrival(n);
    std::iota(byArrival.begin(), byArrival.end(), 0);
    std::sort(byArrival.begin(), byArrival.end(), [&](int a, int b) { return tasks[a].first < tasks[b].first; });
    std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<>> ready;  // (duration, task)
    std::vector<int> order;
    long long time = 0;
    for (int next = 0; (int)order.size() < n;) {
        if (ready.empty() && time < tasks[byArrival[next]].first) time = tasks[byArrival[next]].first;  // idle until one arrives
        while (next < n && tasks[byArrival[next]].first <= time) ready.push({tasks[byArrival[next]].second, byArrival[next]}), next++;
        auto [duration, task] = ready.top();
        ready.pop();
        order.push_back(task);
        time += duration;
    }
    return order;
}
`,
    bruteForce: `#include <utility>
#include <vector>

std::vector<int> taskOrder(const std::vector<std::pair<int, int>>& tasks) {
    int n = tasks.size();
    std::vector<bool> done(n, false);
    std::vector<int> order;
    long long time = 0;
    while ((int)order.size() < n) {
        int best = -1, earliest = -1;
        for (int i = 0; i < n; i++) {
            if (done[i]) continue;
            if (earliest < 0 || tasks[i].first < tasks[earliest].first) earliest = i;
            if (tasks[i].first <= time && (best < 0 || tasks[i].second < tasks[best].second)) best = i;
        }
        if (best < 0) {  // nothing has arrived: wait for the earliest
            time = tasks[earliest].first;
            continue;
        }
        done[best] = true;
        order.push_back(best);
        time += tasks[best].second;
    }
    return order;
}
`,
    cases: [
      { args: "{{0, 5}, {1, 2}, {1, 1}, {7, 3}}", expected: "0 2 1 3" },
      { args: "{}", expected: "" },
      { args: "{{5, 1}}", expected: "0" },
      { args: "{{0, 3}, {0, 3}, {0, 1}}", expected: "2 0 1" },
      { args: "{{3, 2}, {1, 4}}", expected: "1 0" },
      { args: "gen::tasks(377, 2000, 10000, 100)" },
      { args: "gen::tasks(378, 200000, 1000000, 1000)" },
    ],
  },
];
