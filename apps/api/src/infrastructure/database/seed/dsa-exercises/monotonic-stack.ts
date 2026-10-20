import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

// Values in falling order, the worst case for scanning ahead or behind; and a random string of digits.
const SHAPES = String.raw`
namespace gen {
std::vector<int> falling(std::uint64_t seed, int n, int lo, int hi) {
    std::vector<int> v = sortedInts(seed, n, lo, hi);
    std::reverse(v.begin(), v.end());
    return v;
}
std::string digits(std::uint64_t seed, int n) {
    state = seed;
    std::string s;
    for (int i = 0; i < n; i++) s += char('0' + between(i == 0 ? 1 : 0, 9));
    return s;
}
}  // namespace gen
`;

const NEXT_GREATER = `#include <stack>
#include <vector>

std::vector<int> nextGreater(const std::vector<int>& v) {
    int n = v.size();
    std::vector<int> next(n, -1);
    std::stack<int> waiting;  // positions still looking for a greater value; their values fall upwards
    for (int i = 0; i < n; i++) {
        while (!waiting.empty() && v[waiting.top()] < v[i]) {
            next[waiting.top()] = v[i];
            waiting.pop();
        }
        waiting.push(i);
    }
    return next;
}
`;

export const monotonicStack: ExerciseTemplate[] = [
  predict(
    "monotonic-stack",
    "What does it print? Next greater values",
    `#include <iostream>
#include <stack>
#include <vector>

int main() {
    std::vector<int> v = {2, 7, 3, 5, 4, 6, 8};
    std::vector<int> next(v.size(), -1);
    std::stack<int> waiting;  // positions still looking for a greater value
    for (int i = 0; i < (int)v.size(); i++) {
        while (!waiting.empty() && v[waiting.top()] < v[i]) {
            next[waiting.top()] = v[i];
            waiting.pop();
        }
        waiting.push(i);
    }
    for (int x : next) std::cout << x << " ";
    std::cout << "\\n" << waiting.size() << "\\n";
}
`,
    "7 8 5 6 6 8 -1\n1",
  ),
  {
    skill: "monotonic-stack",
    rung: 2,
    title: "Fix next greater for equal values",
    promptMd: `\`nextGreater(v)\` returns, for each position, the first value to its right that is **strictly greater**, or -1 if there's none. For \`{3, 3, 5}\` that's \`5 5 -1\`, but it returns \`3 5 -1\`: an equal value is taken as greater. **Find the fault and fix it.** ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> nextGreater(const std::vector<int>& v)",
    call: showCall("nextGreater"),
    generator: GEN + SHAPES,
    starterCode: NEXT_GREATER.replace("v[waiting.top()] < v[i]", "v[waiting.top()] <= v[i]"),
    reference: NEXT_GREATER,
    bruteForce: `#include <vector>

std::vector<int> nextGreater(const std::vector<int>& v) {
    std::vector<int> next(v.size(), -1);
    for (std::size_t i = 0; i < v.size(); i++)
        for (std::size_t j = i + 1; j < v.size() && next[i] == -1; j++)
            if (v[j] > v[i]) next[i] = v[j];
    return next;
}
`,
    cases: [
      { args: "{3, 3, 5}", expected: "5 5 -1" },
      { args: "{1, 2}", expected: "2 -1" },
      { args: "{5, 4, 3}", expected: "-1 -1 -1" },
      { args: "{}", expected: "" },
      { args: "{2, 2, 2}", expected: "-1 -1 -1" },
      { args: "{4, 1, 4, 6}", expected: "6 4 6 -1" },
      { args: "gen::ints(321, 2000, 1, 100)" },
      { args: "gen::falling(322, 1000000, 1, 1000000000)" },
    ],
  },
  {
    skill: "monotonic-stack",
    rung: 3,
    title: "Complete the previous smaller value",
    promptMd: `\`previousSmaller(v)\` returns, for each position, the nearest value to its **left** that is strictly smaller, or -1 if there's none. For \`{4, 5, 2, 10, 8}\` that's \`-1 4 -1 2 2\`. The stack holds the values that could still be someone's answer, rising from bottom to top. **Complete the condition** that drops the ones that can't be the answer for x, nor for anyone after it. ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> previousSmaller(const std::vector<int>& v)",
    call: showCall("previousSmaller"),
    generator: GEN + SHAPES,
    starterCode: `#include <stack>
#include <vector>

std::vector<int> previousSmaller(const std::vector<int>& v) {
    std::vector<int> out;
    std::stack<int> candidates;  // rising from bottom to top
    for (int x : v) {
        while (!candidates.empty() && false) candidates.pop();  // TODO: which tops can't be x's answer?
        out.push_back(candidates.empty() ? -1 : candidates.top());
        candidates.push(x);
    }
    return out;
}
`,
    reference: `#include <stack>
#include <vector>

std::vector<int> previousSmaller(const std::vector<int>& v) {
    std::vector<int> out;
    std::stack<int> candidates;  // rising from bottom to top
    for (int x : v) {
        while (!candidates.empty() && candidates.top() >= x) candidates.pop();  // x is nearer and no bigger: they're done
        out.push_back(candidates.empty() ? -1 : candidates.top());
        candidates.push(x);
    }
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<int> previousSmaller(const std::vector<int>& v) {
    std::vector<int> out;
    for (int i = 0; i < (int)v.size(); i++) {
        int answer = -1;
        for (int j = i - 1; j >= 0 && answer == -1; j--)
            if (v[j] < v[i]) answer = v[j];
        out.push_back(answer);
    }
    return out;
}
`,
    cases: [
      { args: "{4, 5, 2, 10, 8}", expected: "-1 4 -1 2 2" },
      { args: "{1, 1}", expected: "-1 -1" },
      { args: "{3, 1, 2}", expected: "-1 -1 1" },
      { args: "{}", expected: "" },
      { args: "{5, 6, 7}", expected: "-1 5 6" },
      { args: "gen::ints(323, 2000, 1, 100)" },
      { args: "gen::falling(324, 1000000, 1, 1000000000)" },
    ],
  },
  {
    skill: "monotonic-stack",
    rung: 4,
    title: "Extend next greater to a circle",
    promptMd: `\`nextGreater(v)\` returns each position's first strictly greater value to its right, or -1. **Extend it** to a **circular** list, where after the last value the search continues from the first: for \`{3, 8, 4, 1}\` the answer becomes \`8 -1 8 3\`. Hint: walk the list twice, but only fill in answers, never push, on the second lap. ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> nextGreater(const std::vector<int>& v)",
    call: showCall("nextGreater"),
    generator: GEN + SHAPES,
    starterCode: NEXT_GREATER,
    reference: `#include <stack>
#include <vector>

std::vector<int> nextGreater(const std::vector<int>& v) {
    int n = v.size();
    std::vector<int> next(n, -1);
    std::stack<int> waiting;  // positions still looking for a greater value; their values fall upwards
    for (int i = 0; i < 2 * n; i++) {  // the second lap lets the last values see the first ones
        while (!waiting.empty() && v[waiting.top()] < v[i % n]) {
            next[waiting.top()] = v[i % n];
            waiting.pop();
        }
        if (i < n) waiting.push(i);
    }
    return next;
}
`,
    bruteForce: `#include <vector>

std::vector<int> nextGreater(const std::vector<int>& v) {
    int n = v.size();
    std::vector<int> next(n, -1);
    for (int i = 0; i < n; i++)
        for (int step = 1; step < n && next[i] == -1; step++)
            if (v[(i + step) % n] > v[i]) next[i] = v[(i + step) % n];
    return next;
}
`,
    cases: [
      { args: "{3, 8, 4, 1}", expected: "8 -1 8 3" },
      { args: "{5}", expected: "-1" },
      { args: "{2, 2}", expected: "-1 -1" },
      { args: "{}", expected: "" },
      { args: "{1, 5, 3, 6, 2}", expected: "5 6 6 -1 5" },
      { args: "gen::ints(325, 2000, 1, 100)" },
      { args: "gen::falling(326, 1000000, 1, 1000000000)" },
    ],
  },
  {
    skill: "monotonic-stack",
    rung: 5,
    title: "Remove k digits for the smallest number",
    promptMd: `\`removeDigits(num, k)\` deletes exactly k digits from the number written in \`num\` (0 ≤ k ≤ its length) so the number left is as small as possible. It returns that number without leading zeros, or \`0\` if nothing is left. For \`"4325043"\` and k = 3 it's \`2043\`. Hint: a digit followed by a smaller one is worth deleting, and a stack of kept digits finds all of them in one pass. ${TASK} ${limits("numbers of up to 1,000,000 digits")} Each test prints the number, or its length and a checksum when it's long.`,
    functionSignature: "std::string removeDigits(const std::string& num, int k)",
    call: (args) => `gen::showText(removeDigits(${args}));`,
    generator: GEN + SHAPES,
    starterCode: `#include <string>

std::string removeDigits(const std::string& num, int k) {
    return num;
}
`,
    reference: `#include <algorithm>
#include <string>

std::string removeDigits(const std::string& num, int k) {
    std::string kept;  // a stack of digits that never falls from bottom to top
    for (char d : num) {
        while (k > 0 && !kept.empty() && kept.back() > d) kept.pop_back(), k--;  // a bigger digit before a smaller one
        kept.push_back(d);
    }
    kept.resize(kept.size() - std::min<std::size_t>(k, kept.size()));  // any deletions left come off the end
    std::size_t start = kept.find_first_not_of('0');
    return start == std::string::npos ? "0" : kept.substr(start);
}
`,
    bruteForce: `#include <string>

std::string removeDigits(const std::string& num, int k) {
    std::string s = num;
    for (int t = 0; t < k && !s.empty(); t++) {
        std::size_t i = 0;
        while (i + 1 < s.size() && s[i] <= s[i + 1]) i++;  // the first digit bigger than the next, or the last
        s.erase(i, 1);
    }
    std::size_t start = s.find_first_not_of('0');
    return start == std::string::npos ? "0" : s.substr(start);
}
`,
    cases: [
      { args: `"4325043", 3`, expected: "2043" },
      { args: `"30200", 1`, expected: "200" },
      { args: `"9", 1`, expected: "0" },
      { args: `"12345", 2`, expected: "123" },
      { args: `"100", 1`, expected: "0" },
      { args: `"5", 0`, expected: "5" },
      { args: "gen::digits(327, 2000), 700" },
      { args: "gen::digits(328, 1000000), 500000" },
    ],
  },
];
