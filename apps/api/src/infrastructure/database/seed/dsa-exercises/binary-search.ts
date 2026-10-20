import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

export const binarySearch: ExerciseTemplate[] = [
  predict(
    "binary-search",
    "What does it print? Where binary search looks",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {3, 8, 15, 21, 30, 42, 57};
    int target = 42, lo = 0, hi = (int)v.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        std::cout << mid << " ";
        if (v[mid] == target) break;
        if (v[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    std::cout << "\\n" << std::lower_bound(v.begin(), v.end(), 20) - v.begin() << "\\n";
}
`,
    "3 5\n3",
  ),
  {
    skill: "binary-search",
    rung: 2,
    title: "Fix binary search on a descending list",
    promptMd: `\`findDescending(v, x)\` searches a list sorted from **largest to smallest**, with no repeated values, and returns the index of x, or -1 if it isn't there. For \`{50, 40, 30, 20, 10}\` and 40 it should return 1, but it returns -1. **Find the fault and fix it.**`,
    functionSignature: "int findDescending(const std::vector<int>& v, int x)",
    call: printCall("findDescending"),
    starterCode: `#include <vector>

int findDescending(const std::vector<int>& v, int x) {
    int lo = 0, hi = (int)v.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (v[mid] == x) return mid;
        if (v[mid] < x) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
`,
    reference: `#include <vector>

int findDescending(const std::vector<int>& v, int x) {
    int lo = 0, hi = (int)v.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (v[mid] == x) return mid;
        if (v[mid] < x) hi = mid - 1;  // descending: bigger values are to the left
        else lo = mid + 1;
    }
    return -1;
}
`,
    cases: [
      { args: "{50, 40, 30, 20, 10}, 40", expected: "1" },
      { args: "{50, 40, 30, 20, 10}, 10", expected: "4" },
      { args: "{50, 40, 30, 20, 10}, 50", expected: "0" },
      { args: "{50, 40, 30, 20, 10}, 35", expected: "-1" },
      { args: "{7}, 7", expected: "0" },
      { args: "{}, 3", expected: "-1" },
    ],
  },
  {
    skill: "binary-search",
    rung: 3,
    title: "Count each query with two bounds",
    promptMd: `\`countEach(sorted, queries)\` returns, for each query, how many times it appears in the sorted list. \`std::lower_bound\` already finds the first value **not less** than the query. **Complete the line** that finds the first value **greater** than it; the count is the distance between the two. ${limits("up to 500,000 values and 500,000 queries")}`,
    functionSignature: "std::vector<int> countEach(const std::vector<int>& sorted, const std::vector<int>& queries)",
    call: showCall("countEach"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> countEach(const std::vector<int>& sorted, const std::vector<int>& queries) {
    std::vector<int> counts;
    for (int q : queries) {
        auto first = std::lower_bound(sorted.begin(), sorted.end(), q);  // the first value >= q
        auto last = first;  // TODO: the first value > q
        counts.push_back(int(last - first));
    }
    return counts;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> countEach(const std::vector<int>& sorted, const std::vector<int>& queries) {
    std::vector<int> counts;
    for (int q : queries) {
        auto first = std::lower_bound(sorted.begin(), sorted.end(), q);  // the first value >= q
        auto last = std::upper_bound(first, sorted.end(), q);            // the first value > q
        counts.push_back(int(last - first));
    }
    return counts;
}
`,
    bruteForce: `#include <vector>

std::vector<int> countEach(const std::vector<int>& sorted, const std::vector<int>& queries) {
    std::vector<int> counts;
    for (int q : queries) {
        int c = 0;
        for (int x : sorted) c += x == q;
        counts.push_back(c);
    }
    return counts;
}
`,
    cases: [
      { args: "{1, 2, 2, 2, 5, 7, 7}, {2, 7, 3, 1}", expected: "3 2 0 1" },
      { args: "{}, {4}", expected: "0" },
      { args: "{5, 5, 5}, {5, 4, 6}", expected: "3 0 0" },
      { args: "gen::sortedInts(11, 2000, 1, 100), gen::ints(12, 2000, 1, 100)" },
      { args: "gen::sortedInts(13, 500000, 1, 1000000), gen::ints(14, 500000, 1, 1000000)" },
    ],
  },
  {
    skill: "binary-search",
    rung: 4,
    title: "Extend membership to the closest value",
    promptMd: `\`closestValues(sorted, queries)\` gets a sorted, non-empty list. So far it only returns 1 for each query that's in the list and 0 for each that isn't. **Extend it** to return, for each query, the list's value closest to it, taking the smaller value on a tie. For \`{2, 5, 9, 14}\` and the query 7, that's 5. ${limits("up to 500,000 values and 500,000 queries")}`,
    functionSignature: "std::vector<int> closestValues(const std::vector<int>& sorted, const std::vector<int>& queries)",
    call: showCall("closestValues"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> closestValues(const std::vector<int>& sorted, const std::vector<int>& queries) {
    std::vector<int> answers;
    for (int q : queries) answers.push_back(std::binary_search(sorted.begin(), sorted.end(), q));
    return answers;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> closestValues(const std::vector<int>& sorted, const std::vector<int>& queries) {
    std::vector<int> answers;
    for (int q : queries) {
        auto it = std::lower_bound(sorted.begin(), sorted.end(), q);  // the first value >= q
        if (it == sorted.end()) answers.push_back(sorted.back());
        else if (it == sorted.begin() || *it - q < q - *(it - 1)) answers.push_back(*it);
        else answers.push_back(*(it - 1));  // the value just below is as close or closer
    }
    return answers;
}
`,
    bruteForce: `#include <vector>

std::vector<int> closestValues(const std::vector<int>& sorted, const std::vector<int>& queries) {
    std::vector<int> answers;
    for (int q : queries) {
        int best = sorted[0];
        for (int x : sorted) {
            long long d = (long long)x - q, bestD = (long long)best - q;
            if (d * d < bestD * bestD || (d * d == bestD * bestD && x < best)) best = x;
        }
        answers.push_back(best);
    }
    return answers;
}
`,
    cases: [
      { args: "{2, 5, 9, 14}, {6, 7, 1, 20, 9, 12}", expected: "5 5 2 14 9 14" },
      { args: "{7}, {1, 100}", expected: "7 7" },
      { args: "{1, 3}, {2}", expected: "1" },
      { args: "gen::sortedInts(21, 2000, 1, 1000000), gen::ints(22, 2000, 1, 1000000)" },
      { args: "gen::sortedInts(23, 500000, 1, 1000000000), gen::ints(24, 500000, 1, 1000000000)" },
    ],
  },
  {
    skill: "binary-search",
    rung: 5,
    title: "How many are at most each query?",
    promptMd: `\`countAtMost(values, queries)\` returns, for each query, how many of the values are **at most** that query. The values are in no particular order. For values \`{5, 1, 9, 3, 7}\` and queries \`{4, 9, 0, 5}\` the answer is \`2 5 0 3\`. ${TASK} ${limits("up to 500,000 values and 500,000 queries")}`,
    functionSignature: "std::vector<int> countAtMost(std::vector<int> values, const std::vector<int>& queries)",
    call: showCall("countAtMost"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> countAtMost(std::vector<int> values, const std::vector<int>& queries) {
    return {};
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> countAtMost(std::vector<int> values, const std::vector<int>& queries) {
    std::sort(values.begin(), values.end());  // once, so every query is a binary search
    std::vector<int> answers;
    for (int q : queries) answers.push_back(int(std::upper_bound(values.begin(), values.end(), q) - values.begin()));
    return answers;
}
`,
    bruteForce: `#include <vector>

std::vector<int> countAtMost(std::vector<int> values, const std::vector<int>& queries) {
    std::vector<int> answers;
    for (int q : queries) {
        int c = 0;
        for (int x : values) c += x <= q;
        answers.push_back(c);
    }
    return answers;
}
`,
    cases: [
      { args: "{5, 1, 9, 3, 7}, {4, 9, 0, 5}", expected: "2 5 0 3" },
      { args: "{}, {3}", expected: "0" },
      { args: "{2, 2, 2}, {2, 1}", expected: "3 0" },
      { args: "gen::ints(15, 2000, 1, 1000), gen::ints(16, 2000, 1, 1000)" },
      { args: "gen::ints(17, 500000, 1, 1000000000), gen::ints(18, 500000, 1, 1000000000)" },
    ],
  },
];
