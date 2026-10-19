// Hand-written practice for cpp-basics skills 16–20 (lambdas to bitwise operators), same rules as
// cpp-templates.ts. Each exercise uses only its own skill and the skills before it in the graph:
// lambdas come before loops, maps and algorithms before strings, and bitwise operators need only
// operators, so those exercises have no if or loop.
import { BOX, type ExerciseTemplate, predict, printCall, solve, TASK } from "./cpp-templates.js";

const printVector = (expr: string) => `{ for (int x : ${expr}) std::cout << x << ' '; std::cout << "\\n"; }`;

export const templatesSkills16to20: ExerciseTemplate[] = [
  // ── Skill 16: Lambdas ────────────────────────────────────────────────────────
  predict(
    "lambdas",
    "What does it print? Mutable lambdas and init-capture",
    `#include <iostream>

int main() {
    auto add = [](int a, int b) { return a + b; };
    int base = 10;
    auto plusBase = [base](int x) { return x + base; };
    base = 100;
    int calls = 0;
    auto squareCounted = [&calls](int x) { calls++; return x * x; };
    std::cout << add(2, 3) << " " << plusBase(1) << "\\n";
    std::cout << squareCounted(3) + squareCounted(4) << " " << calls << "\\n";
    auto next = [n = 0]() mutable { return ++n; };
    next();
    std::cout << next() << "\\n";
}
`,
    "5 11\n25 2\n2",
  ),
  {
    skill: "lambdas",
    rung: 2,
    title: "Fix the distance lambda",
    promptMd: `\`closestTo(target, a, b)\` should return whichever of \`a\` and \`b\` is nearer to \`target\` (\`a\` on a tie), using the lambda \`distance\`. For target 10 it picks 7 over 12. **Find the fault and fix it.** The tests print what it returns.`,
    functionSignature: "int closestTo(int target, int a, int b)",
    call: printCall("closestTo"),
    starterCode: `int closestTo(int target, int a, int b) {
    auto distance = [target](int x) { return x - target; };
    if (distance(a) <= distance(b)) return a;
    return b;
}
`,
    reference: `int closestTo(int target, int a, int b) {
    auto distance = [target](int x) { return x > target ? x - target : target - x; };
    if (distance(a) <= distance(b)) return a;
    return b;
}
`,
    cases: [
      { args: "10, 7, 12", expected: "12" },
      { args: "0, 5, -5", expected: "5" },
      { args: "10, 11, 20", expected: "11" },
      { args: "3, 3, 4", expected: "3" },
      { args: "-10, -14, -7", expected: "-7" },
    ],
  },
  {
    skill: "lambdas",
    rung: 3,
    title: "Complete the clamp lambda",
    promptMd: `\`sumOfClamped(low, high, a, b, c)\` should move each of \`a\`, \`b\` and \`c\` into the range from \`low\` to \`high\` (a number below \`low\` becomes \`low\`, one above \`high\` becomes \`high\`) and return their sum. Complete the lambda \`clamp\`. The tests print what it returns.`,
    functionSignature: "int sumOfClamped(int low, int high, int a, int b, int c)",
    call: printCall("sumOfClamped"),
    starterCode: `int sumOfClamped(int low, int high, int a, int b, int c) {
    auto clamp = [low, high](int x) {
        // TODO: return x moved into the range [low, high]
        return x;
    };
    return clamp(a) + clamp(b) + clamp(c);
}
`,
    reference: `int sumOfClamped(int low, int high, int a, int b, int c) {
    auto clamp = [low, high](int x) {
        if (x < low) return low;
        if (x > high) return high;
        return x;
    };
    return clamp(a) + clamp(b) + clamp(c);
}
`,
    cases: [
      { args: "0, 10, -5, 5, 20", expected: "15" },
      { args: "1, 3, 1, 2, 3", expected: "6" },
      { args: "-2, 2, -9, 1, 4", expected: "1" },
      { args: "5, 5, 1, 9, 5", expected: "15" },
    ],
  },
  {
    skill: "lambdas",
    rung: 4,
    title: "Extend the even counter with a limit",
    promptMd: `\`countEvenAbove(a, b, c, limit)\` counts how many of \`a\`, \`b\` and \`c\` are even, using a lambda, but ignores \`limit\` so far. **Extend it** to count only the even numbers that are also greater than \`limit\`. The tests print what it returns.`,
    functionSignature: "int countEvenAbove(int a, int b, int c, int limit)",
    call: printCall("countEvenAbove"),
    starterCode: `int countEvenAbove(int a, int b, int c, int limit) {
    auto counts = [](int x) { return x % 2 == 0; };
    return counts(a) + counts(b) + counts(c);
}
`,
    reference: `int countEvenAbove(int a, int b, int c, int limit) {
    auto counts = [limit](int x) { return x % 2 == 0 && x > limit; };
    return counts(a) + counts(b) + counts(c);
}
`,
    cases: [
      { args: "2, 4, 7, 3", expected: "1" },
      { args: "1, 3, 5, 0", expected: "0" },
      { args: "10, 12, 14, 11", expected: "2" },
      { args: "-2, 0, 2, -5", expected: "3" },
      { args: "6, 8, 9, 6", expected: "1" },
    ],
  },
  {
    skill: "lambdas",
    rung: 5,
    title: "Build a counter maker",
    promptMd: `Write \`auto makeCounter(int start, int step)\` that returns a lambda. Each time the lambda is called it returns the next number of the sequence \`start\`, \`start + step\`, \`start + 2 × step\`, …\n\nExample: \`auto next = makeCounter(5, 2);\` then three calls to \`next()\` return 5, 7 and 9. The tests make a counter and print three calls.\n\n${TASK}`,
    functionSignature: "auto makeCounter(int start, int step)",
    call: (args) => `{ auto next = makeCounter(${args}); std::cout << next() << ' ' << next() << ' ' << next() << "\\n"; }`,
    starterCode: `auto makeCounter(int start, int step) {
    return []() { return 0; };
}
`,
    reference: `auto makeCounter(int start, int step) {
    return [value = start, step]() mutable {
        int current = value;
        value += step;
        return current;
    };
}
`,
    cases: [
      { args: "5, 2", expected: "5 7 9" },
      { args: "0, -3", expected: "0 -3 -6" },
      { args: "10, 0", expected: "10 10 10" },
    ],
  },

  // ── Skill 17: Stack, queue and priority queue ────────────────────────────────
  predict(
    "container-adaptors",
    "What does it print? Highest-first and lowest-first",
    `#include <functional>
#include <iostream>
#include <queue>
#include <vector>

int main() {
    std::priority_queue<int> high;
    std::priority_queue<int, std::vector<int>, std::greater<int>> low;
    std::vector<int> v = {4, 9, 1, 7};
    for (int i = 0; i < 4; i++) {
        high.push(v[i]);
        low.push(v[i]);
    }
    std::cout << high.top() << " " << low.top() << "\\n";
    high.pop();
    low.pop();
    std::cout << high.top() << " " << low.top() << " " << high.size() << "\\n";
}
`,
    "9 1\n7 4 3",
  ),
  {
    skill: "container-adaptors",
    rung: 2,
    title: "Fix the queue elimination order",
    promptMd: `People numbered 1 to \`n\` stand in a queue. Again and again, the person at the front moves to the back, then the new front person leaves, until one is left. \`lastStanding(n)\` should return that person: for 5 it's 3. It returns the wrong person. **Find the fault and fix it.** The tests print what it returns.`,
    functionSignature: "int lastStanding(int n)",
    call: printCall("lastStanding"),
    starterCode: `#include <queue>

int lastStanding(int n) {
    std::queue<int> q;
    for (int i = 1; i <= n; i++) q.push(i);
    while (q.size() > 1) {
        q.pop();             // the next one leaves
        q.push(q.front());   // the front moves to the back
        q.pop();
    }
    return q.front();
}
`,
    reference: `#include <queue>

int lastStanding(int n) {
    std::queue<int> q;
    for (int i = 1; i <= n; i++) q.push(i);
    while (q.size() > 1) {
        q.push(q.front());   // the front moves to the back
        q.pop();
        q.pop();             // the next one leaves
    }
    return q.front();
}
`,
    cases: [
      { args: "5", expected: "3" },
      { args: "1", expected: "1" },
      { args: "2", expected: "1" },
      { args: "6", expected: "5" },
      { args: "8", expected: "1" },
    ],
  },
  {
    skill: "container-adaptors",
    rung: 3,
    title: "Complete the top-k with a priority queue",
    promptMd: `\`topK(v, k)\` should return the \`k\` largest numbers of \`v\`, largest first, or all of them if \`v\` has fewer than \`k\`. Every number is already in a \`std::priority_queue\`; complete the missing part. The tests print the returned numbers separated by spaces.`,
    functionSignature: "std::vector<int> topK(std::vector<int> v, int k)",
    call: (args) => `{ auto run = [](std::vector<int> v, int k) ${printVector("topK(v, k)")}; run(${args}); }`,
    starterCode: `#include <queue>
#include <vector>

std::vector<int> topK(std::vector<int> v, int k) {
    std::priority_queue<int> pq;
    for (int i = 0; i < (int)v.size(); i++) pq.push(v[i]);
    std::vector<int> result;
    // TODO: take the k largest from pq (fewer if pq runs out)
    return result;
}
`,
    reference: `#include <queue>
#include <vector>

std::vector<int> topK(std::vector<int> v, int k) {
    std::priority_queue<int> pq;
    for (int i = 0; i < (int)v.size(); i++) pq.push(v[i]);
    std::vector<int> result;
    while (k > 0 && !pq.empty()) {
        result.push_back(pq.top());
        pq.pop();
        k--;
    }
    return result;
}
`,
    cases: [
      { args: "{5, 1, 9, 3, 7}, 3", expected: "9 7 5" },
      { args: "{2, 2, 1}, 2", expected: "2 2" },
      { args: "{4}, 3", expected: "4" },
      { args: "{}, 2", expected: "" },
      { args: "{-1, -5}, 1", expected: "-1" },
    ],
  },
  {
    skill: "container-adaptors",
    rung: 4,
    title: "Extend the call counter to a time window",
    promptMd: `\`recentCounts(times, window)\` receives call times in increasing order and, for each call, returns how many calls have happened so far. **Extend it** to count only recent calls: an earlier call at time \`c\` still counts at time \`t\` when \`t - c\` is less than \`window\`. Use the queue to drop calls that are too old. The tests print the returned counts separated by spaces.`,
    functionSignature: "std::vector<int> recentCounts(std::vector<int> times, int window)",
    call: (args) => `{ auto run = [](std::vector<int> times, int window) ${printVector("recentCounts(times, window)")}; run(${args}); }`,
    starterCode: `#include <queue>
#include <vector>

std::vector<int> recentCounts(std::vector<int> times, int window) {
    std::queue<int> q;
    std::vector<int> counts;
    for (int i = 0; i < (int)times.size(); i++) {
        q.push(times[i]);
        counts.push_back(q.size());
    }
    return counts;
}
`,
    reference: `#include <queue>
#include <vector>

std::vector<int> recentCounts(std::vector<int> times, int window) {
    std::queue<int> q;
    std::vector<int> counts;
    for (int i = 0; i < (int)times.size(); i++) {
        q.push(times[i]);
        while (times[i] - q.front() >= window) q.pop();
        counts.push_back(q.size());
    }
    return counts;
}
`,
    cases: [
      { args: "{1, 100, 3001, 3002}, 3000", expected: "1 2 2 3" },
      { args: "{5}, 10", expected: "1" },
      { args: "{1, 2, 3}, 1", expected: "1 1 1" },
      { args: "{}, 5", expected: "" },
      { args: "{10, 15, 20, 25}, 10", expected: "1 2 2 2" },
    ],
  },
  {
    skill: "container-adaptors",
    rung: 5,
    title: "Next greater number with a stack",
    promptMd: `Write \`std::vector<int> nextGreater(std::vector<int> v)\`. For each number, find the first number to its right that is strictly greater, or -1 if there is none. Use a \`std::stack\` of positions still waiting for their answer, so each number is pushed and popped once.\n\nExample: \`nextGreater({4, 5, 2, 25})\` returns \`{5, 25, 25, -1}\`. The tests print the returned numbers separated by spaces.\n\n${TASK}`,
    functionSignature: "std::vector<int> nextGreater(std::vector<int> v)",
    call: (args) => printVector(`nextGreater(${args})`),
    starterCode: `#include <stack>
#include <vector>

std::vector<int> nextGreater(std::vector<int> v) {
    return {};
}
`,
    reference: `#include <stack>
#include <vector>

std::vector<int> nextGreater(std::vector<int> v) {
    std::vector<int> result(v.size(), -1);
    std::stack<int> waiting; // positions still looking for a greater number
    for (int i = 0; i < (int)v.size(); i++) {
        while (!waiting.empty() && v[waiting.top()] < v[i]) {
            result[waiting.top()] = v[i];
            waiting.pop();
        }
        waiting.push(i);
    }
    return result;
}
`,
    cases: [
      { args: "{2, 1, 3}", expected: "3 3 -1" },
      { args: "{4, 5, 2, 25}", expected: "5 25 25 -1" },
      { args: "{}", expected: "" },
      { args: "{5, 4, 3}", expected: "-1 -1 -1" },
      { args: "{1, 1}", expected: "-1 -1" },
      { args: "{3, 8, 4, 1, 9}", expected: "8 9 9 9 -1" },
    ],
  },

  // ── Skill 18: Maps and sets ──────────────────────────────────────────────────
  predict(
    "associative-containers",
    "What does it print? operator[] creates entries",
    `#include <iostream>
#include <map>
#include <set>

int main() {
    std::set<int> s = {5, 1, 5, 3, 1};
    std::cout << s.size() << " " << *s.begin() << " " << s.count(3) << "\\n";
    std::map<int, int> stock;
    stock[7] += 2;
    stock[7] += 3;
    stock[2];
    std::cout << stock.size() << " " << stock[7] << " " << stock.count(9) << "\\n";
    auto it = stock.find(2);
    std::cout << it->first << " " << it->second << "\\n";
}
`,
    "3 1 1\n2 5 0\n2 0",
  ),
  {
    skill: "associative-containers",
    rung: 2,
    title: "Fix the counts that never go past 1",
    promptMd: `\`countEach(v)\` should return a map from each number of \`v\` to how many times it appears. Every count comes out as 1. **Find the fault and fix it.** The tests print each entry as \`number:count\`, smallest number first.`,
    functionSignature: "std::map<int, int> countEach(std::vector<int> v)",
    call: (args) => `{ for (auto entry : countEach(${args})) std::cout << entry.first << ':' << entry.second << ' '; std::cout << "\\n"; }`,
    starterCode: `#include <map>
#include <vector>

std::map<int, int> countEach(std::vector<int> v) {
    std::map<int, int> counts;
    for (int i = 0; i < (int)v.size(); i++)
        counts.insert({v[i], 1});
    return counts;
}
`,
    reference: `#include <map>
#include <vector>

std::map<int, int> countEach(std::vector<int> v) {
    std::map<int, int> counts;
    for (int i = 0; i < (int)v.size(); i++)
        counts[v[i]]++;
    return counts;
}
`,
    cases: [
      { args: "{3, 1, 3, 3}", expected: "1:1 3:3" },
      { args: "{}", expected: "" },
      { args: "{7}", expected: "7:1" },
      { args: "{2, 2, 5, 2}", expected: "2:3 5:1" },
    ],
  },
  {
    skill: "associative-containers",
    rung: 3,
    title: "Complete the first repeated number",
    promptMd: `\`firstRepeat(v)\` should return the first number of \`v\` that has already appeared earlier in \`v\`, or -1 if no number repeats. For \`{4, 2, 7, 2, 4}\` that's 2: its second copy comes before the second 4. Fill in the body of the loop using the set. The tests print what it returns.`,
    functionSignature: "int firstRepeat(std::vector<int> v)",
    call: printCall("firstRepeat"),
    starterCode: `#include <set>
#include <vector>

int firstRepeat(std::vector<int> v) {
    std::set<int> seen;
    for (int i = 0; i < (int)v.size(); i++) {
        // TODO: if v[i] is already in seen, return it; otherwise remember it
    }
    return -1;
}
`,
    reference: `#include <set>
#include <vector>

int firstRepeat(std::vector<int> v) {
    std::set<int> seen;
    for (int i = 0; i < (int)v.size(); i++) {
        if (seen.count(v[i])) return v[i];
        seen.insert(v[i]);
    }
    return -1;
}
`,
    cases: [
      { args: "{4, 2, 7, 2, 4}", expected: "2" },
      { args: "{1, 2, 3}", expected: "-1" },
      { args: "{}", expected: "-1" },
      { args: "{9, 9}", expected: "9" },
      { args: "{5, 1, 1, 5}", expected: "1" },
    ],
  },
  {
    skill: "associative-containers",
    rung: 4,
    title: "Extend the distinct list to drop common numbers",
    promptMd: `\`uniqueSorted(v)\` returns the distinct numbers of \`v\`, smallest first. **Extend it** to also leave out every number that appears more than twice in \`v\`: \`{3, 1, 3, 3, 2}\` gives \`{1, 2}\`. The tests print the returned numbers separated by spaces.`,
    functionSignature: "std::vector<int> uniqueSorted(std::vector<int> v)",
    call: (args) => printVector(`uniqueSorted(${args})`),
    starterCode: `#include <set>
#include <vector>

std::vector<int> uniqueSorted(std::vector<int> v) {
    std::set<int> distinct;
    for (int i = 0; i < (int)v.size(); i++) distinct.insert(v[i]);
    return std::vector<int>(distinct.begin(), distinct.end());
}
`,
    reference: `#include <map>
#include <vector>

std::vector<int> uniqueSorted(std::vector<int> v) {
    std::map<int, int> counts;
    for (int i = 0; i < (int)v.size(); i++) counts[v[i]]++;
    std::vector<int> result;
    for (auto it = counts.begin(); it != counts.end(); ++it)
        if (it->second <= 2) result.push_back(it->first);
    return result;
}
`,
    cases: [
      { args: "{3, 1, 3, 3, 2}", expected: "1 2" },
      { args: "{5, 5}", expected: "5" },
      { args: "{}", expected: "" },
      { args: "{4, 4, 4, 4, 1}", expected: "1" },
      { args: "{2, 1}", expected: "1 2" },
    ],
  },
  {
    skill: "associative-containers",
    rung: 5,
    title: "Two numbers that add up to a target",
    promptMd: `Write \`std::pair<int, int> twoSum(std::vector<int> v, int target)\`. Return the positions \`{i, j}\`, with \`i < j\`, of two numbers that add up to \`target\`. If several pairs work, pick the one with the smallest \`j\`, and for that \`j\` the smallest \`i\`. If none works, return \`{-1, -1}\`. Walk \`v\` once, keeping a map from each number to where it first appeared.\n\nExample: \`twoSum({2, 7, 11, 15}, 9)\` returns \`{0, 1}\`. The tests print \`i j\`.\n\n${TASK}`,
    functionSignature: "std::pair<int, int> twoSum(std::vector<int> v, int target)",
    call: (args) =>
      `{ auto run = [](std::vector<int> v, int target) { std::pair<int, int> p = twoSum(v, target); std::cout << p.first << ' ' << p.second << "\\n"; }; run(${args}); }`,
    starterCode: `#include <utility>
#include <vector>

std::pair<int, int> twoSum(std::vector<int> v, int target) {
    return {-1, -1};
}
`,
    reference: `#include <unordered_map>
#include <utility>
#include <vector>

std::pair<int, int> twoSum(std::vector<int> v, int target) {
    std::unordered_map<int, int> firstIndex;
    for (int j = 0; j < (int)v.size(); j++) {
        auto it = firstIndex.find(target - v[j]);
        if (it != firstIndex.end()) return {it->second, j};
        if (firstIndex.count(v[j]) == 0) firstIndex[v[j]] = j;
    }
    return {-1, -1};
}
`,
    cases: [
      { args: "{2, 7, 11, 15}, 9", expected: "0 1" },
      { args: "{3, 3}, 6", expected: "0 1" },
      { args: "{1, 2, 3}, 7", expected: "-1 -1" },
      { args: "{}, 0", expected: "-1 -1" },
      { args: "{5, 0, 0, 5}, 0", expected: "1 2" },
      { args: "{1, 4, 4, 2}, 6", expected: "1 3" },
    ],
  },

  // ── Skill 19: STL algorithms ─────────────────────────────────────────────────
  predict(
    "stl-algorithms",
    "What does it print? find, count and reverse",
    `#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<int> v = {4, 8, 1, 8, 3};
    std::cout << std::count(v.begin(), v.end(), 8) << " " << *std::min_element(v.begin(), v.end()) << "\\n";
    auto it = std::find(v.begin(), v.end(), 8);
    std::cout << (it - v.begin()) << "\\n";
    std::reverse(v.begin(), v.end());
    std::cout << v[0] << " " << std::accumulate(v.begin(), v.end(), 0) << "\\n";
    std::cout << std::max(3, 7) << " " << (std::find(v.begin(), v.end(), 9) == v.end()) << "\\n";
}
`,
    "2 1\n1\n3 24\n7 1",
  ),
  {
    skill: "stl-algorithms",
    rung: 2,
    title: "Fix the sort's tie-break",
    promptMd: `\`byLastDigit(v)\` should sort non-negative numbers by their last digit, smallest digit first, and numbers with the same last digit from smallest to largest: \`{21, 11, 5, 15}\` becomes \`{11, 21, 5, 15}\`. Ties come out in the wrong order. **Find the fault and fix it.** The tests print the returned numbers separated by spaces.`,
    functionSignature: "std::vector<int> byLastDigit(std::vector<int> v)",
    call: (args) => printVector(`byLastDigit(${args})`),
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> byLastDigit(std::vector<int> v) {
    std::sort(v.begin(), v.end(), [](int a, int b) {
        if (a % 10 != b % 10) return a % 10 < b % 10;
        return a > b;
    });
    return v;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> byLastDigit(std::vector<int> v) {
    std::sort(v.begin(), v.end(), [](int a, int b) {
        if (a % 10 != b % 10) return a % 10 < b % 10;
        return a < b;
    });
    return v;
}
`,
    cases: [
      { args: "{21, 11, 5, 15}", expected: "11 21 5 15" },
      { args: "{3}", expected: "3" },
      { args: "{}", expected: "" },
      { args: "{40, 12, 30}", expected: "30 40 12" },
      { args: "{19, 9, 29}", expected: "9 19 29" },
    ],
  },
  {
    skill: "stl-algorithms",
    rung: 3,
    title: "Complete the erase-remove",
    promptMd: `\`withoutNegatives(v)\` should return \`v\` without its negative numbers, keeping the rest in order. Complete it with \`std::remove_if\` and a lambda, then erase the leftover tail. The tests print the returned numbers separated by spaces.`,
    functionSignature: "std::vector<int> withoutNegatives(std::vector<int> v)",
    call: (args) => printVector(`withoutNegatives(${args})`),
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> withoutNegatives(std::vector<int> v) {
    // TODO: move the negative numbers out with std::remove_if and a lambda, then erase what's left at the end
    return v;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> withoutNegatives(std::vector<int> v) {
    v.erase(std::remove_if(v.begin(), v.end(), [](int x) { return x < 0; }), v.end());
    return v;
}
`,
    cases: [
      { args: "{3, -1, 4, -5, 0}", expected: "3 4 0" },
      { args: "{}", expected: "" },
      { args: "{-2}", expected: "" },
      { args: "{1, 2}", expected: "1 2" },
      { args: "{-1, -1, 7}", expected: "7" },
    ],
  },
  {
    skill: "stl-algorithms",
    rung: 4,
    title: "Extend the median to even lengths",
    promptMd: `\`median(v)\` sorts \`v\` and returns its middle number, which is right when \`v\` has an odd length. **Extend it** so that for an even length it returns the average of the two middle numbers, with decimals: \`{4, 1, 3, 2}\` gives 2.5. \`v\` is never empty. The tests print what it returns.`,
    functionSignature: "double median(std::vector<int> v)",
    call: printCall("median"),
    starterCode: `#include <algorithm>
#include <vector>

double median(std::vector<int> v) {
    std::sort(v.begin(), v.end());
    return v[v.size() / 2];
}
`,
    reference: `#include <algorithm>
#include <vector>

double median(std::vector<int> v) {
    std::sort(v.begin(), v.end());
    int n = v.size();
    if (n % 2 == 1) return v[n / 2];
    return (v[n / 2 - 1] + v[n / 2]) / 2.0;
}
`,
    cases: [
      { args: "{5, 1, 3}", expected: "3" },
      { args: "{4, 1, 3, 2}", expected: "2.5" },
      { args: "{7}", expected: "7" },
      { args: "{10, 20}", expected: "15" },
      { args: "{-3, -1, -2, -4}", expected: "-2.5" },
    ],
  },
  {
    skill: "stl-algorithms",
    rung: 5,
    title: "Rank students by marks",
    promptMd: `Write \`std::vector<int> ranking(std::vector<int> marks)\`. Student \`i\` scored \`marks[i]\`. Return the student numbers ordered from the highest mark to the lowest; students with equal marks keep the smaller number first. Use \`std::sort\` with a lambda.\n\nExample: \`ranking({50, 90, 70})\` returns \`{1, 2, 0}\`. The tests print the returned numbers separated by spaces.\n\n${TASK}`,
    functionSignature: "std::vector<int> ranking(std::vector<int> marks)",
    call: (args) => printVector(`ranking(${args})`),
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> ranking(std::vector<int> marks) {
    return {};
}
`,
    reference: `#include <algorithm>
#include <numeric>
#include <vector>

std::vector<int> ranking(std::vector<int> marks) {
    std::vector<int> order(marks.size());
    std::iota(order.begin(), order.end(), 0);
    std::sort(order.begin(), order.end(), [marks](int a, int b) {
        if (marks[a] != marks[b]) return marks[a] > marks[b];
        return a < b;
    });
    return order;
}
`,
    cases: [
      { args: "{50, 90, 70}", expected: "1 2 0" },
      { args: "{80, 80, 60}", expected: "0 1 2" },
      { args: "{}", expected: "" },
      { args: "{10}", expected: "0" },
      { args: "{5, 9, 9, 1}", expected: "1 2 0 3" },
    ],
  },

  // ── Skill 20: Bitwise operators ──────────────────────────────────────────────
  predict(
    "bitwise-operators",
    "What does it print? Setting and clearing flags",
    `#include <iostream>

int main() {
    unsigned int flags = 0;
    flags |= 1u << 3;
    flags |= 1u << 0;
    std::cout << flags << "\\n";
    flags &= ~(1u << 0);
    std::cout << flags << " " << ((flags >> 3) & 1u) << "\\n";
    unsigned int x = 0b1011;
    std::cout << (x ^ 0b1111) << " " << (x & (x - 1)) << "\\n";
}
`,
    "9\n8 1\n4 10",
  ),
  {
    skill: "bitwise-operators",
    rung: 2,
    title: "Fix the bit test",
    promptMd: `\`solve(n, k)\` should print 1 if bit \`k\` of \`n\` is set (bit 0 is the rightmost) and 0 otherwise. For 5 (binary 101) and k = 1 it prints 1, but that bit is 0. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve(int n, int k)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n, int k) {
    std::cout << (n & 1 << k != 0) << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int n, int k) {
    std::cout << ((n >> k) & 1) << "\\n";
}
`,
    cases: [
      { args: "5, 0", expected: "1" },
      { args: "5, 1", expected: "0" },
      { args: "8, 3", expected: "1" },
      { args: "6, 2", expected: "1" },
      { args: "6, 0", expected: "0" },
    ],
  },
  {
    skill: "bitwise-operators",
    rung: 3,
    title: "Complete set, clear and toggle",
    promptMd: `\`solve(n, k)\` should print three numbers: \`n\` with bit \`k\` turned on, \`n\` with bit \`k\` turned off, and \`n\` with bit \`k\` flipped. The first is done; complete the other two. ${BOX}`,
    functionSignature: "void solve(int n, int k)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n, int k) {
    int set = n | (1 << k);
    int cleared = n;  // TODO: n with bit k turned off
    int toggled = n;  // TODO: n with bit k flipped
    std::cout << set << " " << cleared << " " << toggled << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int n, int k) {
    int set = n | (1 << k);
    int cleared = n & ~(1 << k);
    int toggled = n ^ (1 << k);
    std::cout << set << " " << cleared << " " << toggled << "\\n";
}
`,
    cases: [
      { args: "5, 1", expected: "7 5 7" },
      { args: "5, 0", expected: "5 4 4" },
      { args: "0, 3", expected: "8 0 8" },
      { args: "15, 2", expected: "15 11 11" },
    ],
  },
  {
    skill: "bitwise-operators",
    rung: 4,
    title: "Extend: is it a power of two?",
    promptMd: `\`solve(n)\` prints 1 if \`n\` is odd and 0 otherwise, using its lowest bit. **Extend it** to print, on the same line after a space, 1 if \`n\` is a power of two (1, 2, 4, 8, …) and 0 otherwise. Hint: a power of two has exactly one bit set, and \`n & (n - 1)\` clears the lowest set bit. ${BOX}`,
    functionSignature: "void solve(int n)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n) {
    std::cout << (n & 1) << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int n) {
    std::cout << (n & 1) << " " << (n > 0 && (n & (n - 1)) == 0) << "\\n";
}
`,
    cases: [
      { args: "8", expected: "0 1" },
      { args: "6", expected: "0 0" },
      { args: "1", expected: "1 1" },
      { args: "0", expected: "0 0" },
      { args: "7", expected: "1 0" },
      { args: "1024", expected: "0 1" },
    ],
  },
  {
    skill: "bitwise-operators",
    rung: 5,
    title: "Pack an RGB colour",
    promptMd: `\`solve(r, g, b)\` receives the red, green and blue parts of a colour, each 0–255. Pack them into one number with red in bits 16–23, green in bits 8–15 and blue in bits 0–7, and print it. Then print, after a space, the same colour packed with red and blue swapped. Use shifts and \`|\`.\n\nExample: for 255, 0, 0 print \`16711680 255\`. ${BOX}`,
    functionSignature: "void solve(int r, int g, int b)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int r, int g, int b) {
}
`,
    reference: `#include <iostream>

void solve(int r, int g, int b) {
    int packed = (r << 16) | (g << 8) | b;
    int swapped = (b << 16) | (g << 8) | r;
    std::cout << packed << " " << swapped << "\\n";
}
`,
    cases: [
      { args: "255, 0, 0", expected: "16711680 255" },
      { args: "0, 128, 255", expected: "33023 16744448" },
      { args: "1, 2, 3", expected: "66051 197121" },
      { args: "0, 0, 0", expected: "0 0" },
    ],
  },
];
