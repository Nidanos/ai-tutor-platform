import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

// 1 1 2 2 3 3 …: every value repeats right away, so the earliest unique value is always the newest.
const DOUBLED = String.raw`
namespace gen {
std::vector<int> doubled(int n) {
    std::vector<int> v(n);
    for (int i = 0; i < n; i++) v[i] = i / 2 + 1;
    return v;
}
}  // namespace gen
`;

export const queues: ExerciseTemplate[] = [
  predict(
    "queues",
    "What does it print? A deque and a queue",
    `#include <deque>
#include <iostream>
#include <queue>

int main() {
    std::deque<int> d;
    d.push_back(1);
    d.push_back(2);
    d.push_front(0);
    d.push_front(-1);
    d.pop_back();
    std::cout << d.front() << " " << d.back() << " " << d.size() << "\\n";
    std::queue<int> q;
    for (int x : {3, 6, 9}) q.push(x);
    q.push(q.front() + q.back());
    q.pop();
    std::cout << q.front() << " " << q.back() << " " << q.size() << "\\n";
}
`,
    "-1 1 3\n6 12 3",
  ),
  {
    skill: "queues",
    rung: 2,
    title: "Fix the running sum of the last k",
    promptMd: `\`lastKSums(v, k)\` returns, after each new value, the sum of the last k values seen, or of all of them while there are fewer than k. For \`{1, 2, 3, 4, 5}\` and k = 3 that's \`1 3 6 9 12\`. It keeps the window in a queue, but every sum after the k-th comes out too big. **Find the fault and fix it.** ${limits("up to 1,000,000 values, and k up to the list's size")}`,
    functionSignature: "std::vector<long long> lastKSums(const std::vector<int>& v, int k)",
    call: showCall("lastKSums"),
    generator: GEN,
    starterCode: `#include <queue>
#include <vector>

std::vector<long long> lastKSums(const std::vector<int>& v, int k) {
    std::queue<int> window;
    long long sum = 0;
    std::vector<long long> out;
    for (int x : v) {
        window.push(x);
        sum += x;
        out.push_back(sum);
    }
    return out;
}
`,
    reference: `#include <queue>
#include <vector>

std::vector<long long> lastKSums(const std::vector<int>& v, int k) {
    std::queue<int> window;
    long long sum = 0;
    std::vector<long long> out;
    for (int x : v) {
        window.push(x);
        sum += x;
        if ((int)window.size() > k) {  // the oldest value leaves the window
            sum -= window.front();
            window.pop();
        }
        out.push_back(sum);
    }
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<long long> lastKSums(const std::vector<int>& v, int k) {
    std::vector<long long> out;
    for (int i = 0; i < (int)v.size(); i++) {
        long long sum = 0;
        for (int j = i; j >= 0 && j > i - k; j--) sum += v[j];
        out.push_back(sum);
    }
    return out;
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5}, 3", expected: "1 3 6 9 12" },
      { args: "{5}, 1", expected: "5" },
      { args: "{}, 2", expected: "" },
      { args: "{2, 2, 2}, 1", expected: "2 2 2" },
      { args: "{1, -1, 1, -1}, 2", expected: "1 0 0 0" },
      { args: "gen::ints(301, 2000, -1000000000, 1000000000), 500" },
      { args: "gen::ints(302, 1000000, -1000000000, 1000000000), 500000" },
    ],
  },
  {
    skill: "queues",
    rung: 3,
    title: "Complete the counting-out circle",
    promptMd: `n people, numbered 1 to n, stand in a circle. Counting from the first, every k-th person leaves, and counting goes on from the next one. \`leavingOrder(n, k)\` returns the order in which they leave: for 5 people and k = 2 that's \`2 4 1 5 3\`. The circle is a queue, with the person at the front about to be counted. **Complete the loop's body.**`,
    functionSignature: "std::vector<int> leavingOrder(int n, int k)",
    call: showCall("leavingOrder"),
    generator: GEN,
    starterCode: `#include <queue>
#include <vector>

std::vector<int> leavingOrder(int n, int k) {
    std::queue<int> circle;
    for (int i = 1; i <= n; i++) circle.push(i);
    std::vector<int> order;
    while (!circle.empty()) {
        // TODO: move k - 1 people from the front to the back, then the next one leaves
    }
    return order;
}
`,
    reference: `#include <queue>
#include <vector>

std::vector<int> leavingOrder(int n, int k) {
    std::queue<int> circle;
    for (int i = 1; i <= n; i++) circle.push(i);
    std::vector<int> order;
    while (!circle.empty()) {
        for (int i = 0; i < k - 1; i++) {  // counted, but not out: to the back of the circle
            circle.push(circle.front());
            circle.pop();
        }
        order.push_back(circle.front());
        circle.pop();
    }
    return order;
}
`,
    cases: [
      { args: "5, 2", expected: "2 4 1 5 3" },
      { args: "1, 3", expected: "1" },
      { args: "4, 1", expected: "1 2 3 4" },
      { args: "6, 3", expected: "3 6 4 2 5 1" },
      { args: "3, 5", expected: "2 3 1" },
    ],
  },
  {
    skill: "queues",
    rung: 4,
    title: "Extend the stream to its first unique value",
    promptMd: `\`firstUnique(stream)\` returns, after each arriving value, the **earliest value that has arrived exactly once so far**, or -1 if there's none. For \`{2, 3, 2, 4, 3}\` that's \`2 2 3 3 4\`. So far it counts arrivals and keeps every value in a queue in arrival order, but it always answers the queue's front. **Extend it**: before answering, drop from the front every value that has arrived more than once. A dropped value can never be the answer again. ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> firstUnique(const std::vector<int>& stream)",
    call: showCall("firstUnique"),
    generator: GEN + DOUBLED,
    starterCode: `#include <queue>
#include <unordered_map>
#include <vector>

std::vector<int> firstUnique(const std::vector<int>& stream) {
    std::queue<int> waiting;            // values in arrival order
    std::unordered_map<int, int> seen;  // how often each value has arrived
    std::vector<int> out;
    for (int x : stream) {
        seen[x]++;
        waiting.push(x);
        out.push_back(waiting.front());
    }
    return out;
}
`,
    reference: `#include <queue>
#include <unordered_map>
#include <vector>

std::vector<int> firstUnique(const std::vector<int>& stream) {
    std::queue<int> waiting;            // values in arrival order
    std::unordered_map<int, int> seen;  // how often each value has arrived
    std::vector<int> out;
    for (int x : stream) {
        seen[x]++;
        waiting.push(x);
        while (!waiting.empty() && seen[waiting.front()] > 1) waiting.pop();  // repeated: never the answer again
        out.push_back(waiting.empty() ? -1 : waiting.front());
    }
    return out;
}
`,
    bruteForce: `#include <unordered_map>
#include <vector>

std::vector<int> firstUnique(const std::vector<int>& stream) {
    std::unordered_map<int, int> seen;
    std::vector<int> out;
    for (std::size_t i = 0; i < stream.size(); i++) {
        seen[stream[i]]++;
        int answer = -1;
        for (std::size_t j = 0; j <= i && answer == -1; j++)
            if (seen[stream[j]] == 1) answer = stream[j];
        out.push_back(answer);
    }
    return out;
}
`,
    cases: [
      { args: "{2, 3, 2, 4, 3}", expected: "2 2 3 3 4" },
      { args: "{1, 1}", expected: "1 -1" },
      { args: "{}", expected: "" },
      { args: "{5}", expected: "5" },
      { args: "{7, 8, 7, 8, 9}", expected: "7 7 8 -1 9" },
      { args: "gen::ints(303, 2000, 1, 500)" },
      { args: "gen::doubled(3000)" },
      { args: "gen::doubled(1000000)" },
    ],
  },
  {
    skill: "queues",
    rung: 5,
    title: "The first negative in every window",
    promptMd: `\`firstNegatives(v, k)\` returns, for every window of k neighbouring values from left to right, the window's first negative value, or 0 if it has none (1 ≤ k ≤ the list's size, or the list is empty). For \`{-8, 2, 3, -6, 10}\` and k = 2 it's \`-8 0 -6 -6\`. Hint: keep the positions of the negatives in a queue and drop those that have left the window. ${TASK} ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> firstNegatives(const std::vector<int>& v, int k)",
    call: showCall("firstNegatives"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> firstNegatives(const std::vector<int>& v, int k) {
    return {};
}
`,
    reference: `#include <queue>
#include <vector>

std::vector<int> firstNegatives(const std::vector<int>& v, int k) {
    std::queue<int> negatives;  // positions of negative values, left to right
    std::vector<int> out;
    for (int i = 0; i < (int)v.size(); i++) {
        if (v[i] < 0) negatives.push(i);
        if (i < k - 1) continue;  // the first window isn't full yet
        while (!negatives.empty() && negatives.front() <= i - k) negatives.pop();  // left the window
        out.push_back(negatives.empty() ? 0 : v[negatives.front()]);
    }
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<int> firstNegatives(const std::vector<int>& v, int k) {
    std::vector<int> out;
    for (int start = 0; start + k <= (int)v.size(); start++) {
        int first = 0;
        for (int i = start; i < start + k && first == 0; i++)
            if (v[i] < 0) first = v[i];
        out.push_back(first);
    }
    return out;
}
`,
    cases: [
      { args: "{-8, 2, 3, -6, 10}, 2", expected: "-8 0 -6 -6" },
      { args: "{1, 2, 3}, 3", expected: "0" },
      { args: "{-1}, 1", expected: "-1" },
      { args: "{4, -2, -3, 5}, 1", expected: "0 -2 -3 0" },
      { args: "{}, 3", expected: "" },
      { args: "gen::ints(305, 2000, -100, 100), 300" },
      { args: "gen::ints(306, 1000000, -5, 1000000), 500000" },
    ],
  },
];
