import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

export const hashing: ExerciseTemplate[] = [
  predict(
    "hashing",
    "What does it print? Keys in chained buckets",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> buckets(5);
    for (int key : {12, 7, 22, 5, 17, 30, 2}) buckets[key % 5].push_back(key);
    for (const auto& b : buckets) std::cout << b.size() << " ";
    std::cout << "\\n";
    for (int key : buckets[2]) std::cout << key << " ";
    std::cout << "\\n";
}
`,
    "2 0 5 0 0\n12 7 22 17 2",
  ),
  {
    skill: "hashing",
    rung: 2,
    title: "Fix the first repeat",
    promptMd: `\`firstRepeat(v)\` reads v from the left and returns the first value it meets **for the second time**, or -1 if no value repeats. For \`{3, 1, 4, 1, 5, 3}\` it should return 1, but it always returns the first value of the list. **Find the fault and fix it.** ${limits("up to 1,000,000 values")}`,
    functionSignature: "int firstRepeat(const std::vector<int>& v)",
    call: printCall("firstRepeat"),
    generator: GEN,
    starterCode: `#include <unordered_set>
#include <vector>

int firstRepeat(const std::vector<int>& v) {
    std::unordered_set<int> seen;
    for (int x : v) {
        seen.insert(x);
        if (seen.count(x)) return x;
    }
    return -1;
}
`,
    reference: `#include <unordered_set>
#include <vector>

int firstRepeat(const std::vector<int>& v) {
    std::unordered_set<int> seen;
    for (int x : v) {
        if (seen.count(x)) return x;  // check before inserting, or every value looks repeated
        seen.insert(x);
    }
    return -1;
}
`,
    bruteForce: `#include <vector>

int firstRepeat(const std::vector<int>& v) {
    for (std::size_t j = 0; j < v.size(); j++)
        for (std::size_t i = 0; i < j; i++)
            if (v[i] == v[j]) return v[j];
    return -1;
}
`,
    cases: [
      { args: "{3, 1, 4, 1, 5, 3}", expected: "1" },
      { args: "{1, 2, 3}", expected: "-1" },
      { args: "{}", expected: "-1" },
      { args: "{7, 7}", expected: "7" },
      { args: "{2, 5, 5, 2}", expected: "5" },
      { args: "gen::permutation(219, 2000)" },
      { args: "gen::permutation(220, 1000000)" },
    ],
  },
  {
    skill: "hashing",
    rung: 3,
    title: "Complete the longest run of consecutive numbers",
    promptMd: `\`longestRun(v)\` returns the length of the longest run of consecutive whole numbers among the values, in any order. For \`{10, 5, 12, 3, 11, 4, 13}\` it's 4 (10, 11, 12, 13). It puts the values in a hash set and counts upwards from each one. That gives the right answer, but counting from **every** value of a long run is O(n²). **Complete the condition** so it only counts from a value that starts a run. ${limits("up to 1,000,000 values")}`,
    functionSignature: "int longestRun(const std::vector<int>& v)",
    call: printCall("longestRun"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <unordered_set>
#include <vector>

int longestRun(const std::vector<int>& v) {
    std::unordered_set<int> values(v.begin(), v.end());
    int best = 0;
    for (int x : values) {
        if (true) {  // TODO: only count from x when x starts a run
            int length = 1;
            while (values.count(x + length)) length++;
            best = std::max(best, length);
        }
    }
    return best;
}
`,
    reference: `#include <algorithm>
#include <unordered_set>
#include <vector>

int longestRun(const std::vector<int>& v) {
    std::unordered_set<int> values(v.begin(), v.end());
    int best = 0;
    for (int x : values) {
        if (!values.count(x - 1)) {  // x starts a run: each run is counted once, so O(n) in all
            int length = 1;
            while (values.count(x + length)) length++;
            best = std::max(best, length);
        }
    }
    return best;
}
`,
    bruteForce: `#include <algorithm>
#include <unordered_set>
#include <vector>

int longestRun(const std::vector<int>& v) {
    std::unordered_set<int> values(v.begin(), v.end());
    int best = 0;
    for (int x : values) {
        int length = 1;
        while (values.count(x + length)) length++;
        best = std::max(best, length);
    }
    return best;
}
`,
    cases: [
      { args: "{10, 5, 12, 3, 11, 4, 13}", expected: "4" },
      { args: "{}", expected: "0" },
      { args: "{7}", expected: "1" },
      { args: "{1, 1, 2}", expected: "2" },
      { args: "{-2, -1, 0, 5}", expected: "3" },
      { args: "gen::ints(221, 2000, 1, 3000)" },
      { args: "gen::permutation(222, 1000000)" },
    ],
  },
  {
    skill: "hashing",
    rung: 4,
    title: "Extend the duplicate check to counting equal pairs",
    promptMd: `\`equalPairs(v)\` should return how many pairs of positions i < j have \`v[i] == v[j]\`. For \`{1, 2, 1, 3, 1, 2}\` that's 4: three pairs of 1s and one pair of 2s. So far it counts how often each value appears and only returns 1 if some value appears twice, or 0. **Extend it to count the pairs** from those counts. ${limits("up to 1,000,000 values")}`,
    functionSignature: "long long equalPairs(const std::vector<int>& v)",
    call: printCall("equalPairs"),
    generator: GEN,
    starterCode: `#include <unordered_map>
#include <vector>

long long equalPairs(const std::vector<int>& v) {
    std::unordered_map<int, long long> count;
    for (int x : v) count[x]++;
    for (const auto& [value, c] : count)
        if (c >= 2) return 1;
    return 0;
}
`,
    reference: `#include <unordered_map>
#include <vector>

long long equalPairs(const std::vector<int>& v) {
    std::unordered_map<int, long long> count;
    for (int x : v) count[x]++;
    long long pairs = 0;
    for (const auto& [value, c] : count) pairs += c * (c - 1) / 2;  // c copies make c(c-1)/2 pairs
    return pairs;
}
`,
    bruteForce: `#include <vector>

long long equalPairs(const std::vector<int>& v) {
    long long pairs = 0;
    for (std::size_t i = 0; i < v.size(); i++)
        for (std::size_t j = i + 1; j < v.size(); j++) pairs += v[i] == v[j];
    return pairs;
}
`,
    cases: [
      { args: "{1, 2, 1, 3, 1, 2}", expected: "4" },
      { args: "{}", expected: "0" },
      { args: "{5, 6}", expected: "0" },
      { args: "{9, 9}", expected: "1" },
      { args: "{4, 4, 4, 4}", expected: "6" },
      { args: "gen::ints(223, 2000, 1, 100)" },
      { args: "gen::ints(224, 1000000, 1, 1000)" },
    ],
  },
  {
    skill: "hashing",
    rung: 5,
    title: "Count the pairs with a given sum",
    promptMd: `\`pairsWithSum(v, target)\` returns how many pairs of positions i < j have \`v[i] + v[j] == target\`. The list is in no particular order and may repeat values. For \`{1, 5, 3, 3, 7}\` and 6 it's 2: 1 + 5 and 3 + 3. ${TASK} ${limits("up to 1,000,000 values from -10⁹ to 10⁹")}`,
    functionSignature: "long long pairsWithSum(const std::vector<int>& v, long long target)",
    call: printCall("pairsWithSum"),
    generator: GEN,
    starterCode: `#include <vector>

long long pairsWithSum(const std::vector<int>& v, long long target) {
    return 0;
}
`,
    reference: `#include <unordered_map>
#include <vector>

long long pairsWithSum(const std::vector<int>& v, long long target) {
    std::unordered_map<long long, long long> seen;  // value -> how often it appeared to the left
    long long pairs = 0;
    for (int x : v) {
        auto it = seen.find(target - x);
        if (it != seen.end()) pairs += it->second;  // x pairs with every earlier partner
        seen[x]++;
    }
    return pairs;
}
`,
    bruteForce: `#include <vector>

long long pairsWithSum(const std::vector<int>& v, long long target) {
    long long pairs = 0;
    for (std::size_t i = 0; i < v.size(); i++)
        for (std::size_t j = i + 1; j < v.size(); j++) pairs += (long long)v[i] + v[j] == target;
    return pairs;
}
`,
    cases: [
      { args: "{1, 5, 3, 3, 7}, 6", expected: "2" },
      { args: "{2, 2, 2}, 4", expected: "3" },
      { args: "{}, 0", expected: "0" },
      { args: "{-1, 1, 0}, 0", expected: "1" },
      { args: "{1000000000, 1000000000}, 2000000000", expected: "1" },
      { args: "gen::ints(225, 2000, -1000, 1000), 0" },
      { args: "gen::ints(226, 1000000, -1000000, 1000000), 12345" },
    ],
  },
];
