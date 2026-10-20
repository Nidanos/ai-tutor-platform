import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

// Huge values in a narrow range: base plus a number from lo to hi.
const SHIFTED = String.raw`
namespace gen {
std::vector<long long> shifted(std::uint64_t seed, int n, long long base, int lo, int hi) {
    std::vector<long long> v;
    for (int x : ints(seed, n, lo, hi)) v.push_back(base + x);
    return v;
}
}  // namespace gen
`;

const INSERTION_SORT_DISTINCT = `#include <vector>

std::vector<int> sortedDistinct(const std::vector<int>& values) {
    std::vector<int> v = values;
    for (std::size_t i = 1; i < v.size(); i++)
        for (std::size_t j = i; j > 0 && v[j - 1] > v[j]; j--) {
            int t = v[j];
            v[j] = v[j - 1];
            v[j - 1] = t;
        }
    std::vector<int> out;
    for (int x : v)
        if (out.empty() || out.back() != x) out.push_back(x);
    return out;
}
`;

export const linearTimeSorting: ExerciseTemplate[] = [
  predict(
    "linear-time-sorting",
    "What does it print? Counting sort's positions",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {3, 1, 3, 0, 2, 3};
    std::vector<int> count(4, 0);
    for (int x : v) count[x]++;
    for (int k = 1; k < 4; k++) count[k] += count[k - 1];
    for (int c : count) std::cout << c << " ";
    std::cout << "\\n";
    std::vector<int> out(v.size());
    for (int i = (int)v.size() - 1; i >= 0; i--) out[--count[v[i]]] = v[i];
    for (int x : out) std::cout << x << " ";
    std::cout << "\\n";
}
`,
    "1 2 3 6\n0 1 2 3 3 3",
  ),
  {
    skill: "linear-time-sorting",
    rung: 2,
    title: "Fix the bucket that's missing",
    promptMd: `\`bucketSort(v)\` sorts values from 0 to 1000 **inclusive**. It puts each value into a bucket by its hundreds (0–99, 100–199, …), sorts each small bucket, and joins them. It works for most lists, but goes wrong as soon as a list contains 1000. **Find the fault and fix it.**`,
    functionSignature: "std::vector<int> bucketSort(const std::vector<int>& v)",
    call: showCall("bucketSort"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> bucketSort(const std::vector<int>& v) {
    std::vector<std::vector<int>> buckets(10);
    for (int x : v) buckets[x / 100].push_back(x);
    std::vector<int> out;
    for (auto& b : buckets) {
        std::sort(b.begin(), b.end());
        out.insert(out.end(), b.begin(), b.end());
    }
    return out;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> bucketSort(const std::vector<int>& v) {
    std::vector<std::vector<int>> buckets(11);  // 0–99, …, 900–999, and 1000 on its own
    for (int x : v) buckets[x / 100].push_back(x);
    std::vector<int> out;
    for (auto& b : buckets) {
        std::sort(b.begin(), b.end());
        out.insert(out.end(), b.begin(), b.end());
    }
    return out;
}
`,
    cases: [
      { args: "{1000, 5, 999, 250}", expected: "5 250 999 1000" },
      { args: "{0, 1000}", expected: "0 1000" },
      { args: "{}", expected: "" },
      { args: "{42}", expected: "42" },
      { args: "{300, 300, 299}", expected: "299 300 300" },
    ],
  },
  {
    skill: "linear-time-sorting",
    rung: 3,
    title: "Complete the h-index by counting",
    promptMd: `A researcher's **h-index** is the largest h such that at least h of their papers have h or more citations each. For citations \`{4, 0, 7, 2, 5}\` it's 3: three papers have at least 3 citations. \`hIndex\` counts papers by citations, putting anything at n or above at n, because h can't exceed n. Then it walks h down from n, adding up how many papers have at least h citations. **Complete the check inside the loop.** ${limits("up to 1,000,000 papers with up to 10⁹ citations each")}`,
    functionSignature: "int hIndex(const std::vector<int>& citations)",
    call: printCall("hIndex"),
    generator: GEN,
    starterCode: `#include <vector>

int hIndex(const std::vector<int>& citations) {
    int n = citations.size();
    std::vector<int> papers(n + 1, 0);  // papers[c]: how many have exactly c citations, with n meaning n or more
    for (int c : citations) papers[c < n ? c : n]++;
    int atLeast = 0;  // papers with at least h citations
    for (int h = n; h > 0; h--) {
        atLeast += papers[h];
        // TODO: return h as soon as it works
    }
    return 0;
}
`,
    reference: `#include <vector>

int hIndex(const std::vector<int>& citations) {
    int n = citations.size();
    std::vector<int> papers(n + 1, 0);  // papers[c]: how many have exactly c citations, with n meaning n or more
    for (int c : citations) papers[c < n ? c : n]++;
    int atLeast = 0;  // papers with at least h citations
    for (int h = n; h > 0; h--) {
        atLeast += papers[h];
        if (atLeast >= h) return h;  // the first h from the top that works is the largest
    }
    return 0;
}
`,
    bruteForce: `#include <vector>

int hIndex(const std::vector<int>& citations) {
    int n = citations.size();
    for (int h = n; h > 0; h--) {
        int atLeast = 0;
        for (int c : citations) atLeast += c >= h;
        if (atLeast >= h) return h;
    }
    return 0;
}
`,
    cases: [
      { args: "{4, 0, 7, 2, 5}", expected: "3" },
      { args: "{0, 0}", expected: "0" },
      { args: "{100}", expected: "1" },
      { args: "{1, 1, 1}", expected: "1" },
      { args: "{5, 5, 5, 5, 5}", expected: "5" },
      { args: "{}", expected: "0" },
      { args: "gen::ints(91, 2000, 0, 100)" },
      { args: "gen::ints(92, 1000000, 0, 1000)" },
    ],
  },
  {
    skill: "linear-time-sorting",
    rung: 4,
    title: "Extend counting sort to drop repeats",
    promptMd: `\`sortedDistinct(values)\` gets values from 0 to 1,000,000. It counts how often each value appears and writes them out in order, which sorts them in linear time. **Extend it** to return each different value only once, smallest first. ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<int> sortedDistinct(const std::vector<int>& values)",
    call: showCall("sortedDistinct"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> sortedDistinct(const std::vector<int>& values) {
    const int MAX = 1000000;
    std::vector<int> count(MAX + 1, 0);
    for (int x : values) count[x]++;
    std::vector<int> out;
    for (int x = 0; x <= MAX; x++)
        for (int c = 0; c < count[x]; c++) out.push_back(x);
    return out;
}
`,
    reference: `#include <vector>

std::vector<int> sortedDistinct(const std::vector<int>& values) {
    const int MAX = 1000000;
    std::vector<int> count(MAX + 1, 0);
    for (int x : values) count[x]++;
    std::vector<int> out;
    for (int x = 0; x <= MAX; x++)
        if (count[x] > 0) out.push_back(x);  // once, however often it appeared
    return out;
}
`,
    bruteForce: INSERTION_SORT_DISTINCT,
    cases: [
      { args: "{5, 3, 5, 1, 3}", expected: "1 3 5" },
      { args: "{}", expected: "" },
      { args: "{7, 7, 7}", expected: "7" },
      { args: "{1000000, 0}", expected: "0 1000000" },
      { args: "gen::ints(93, 2000, 0, 500)" },
      { args: "gen::ints(94, 1000000, 0, 1000000)" },
    ],
  },
  {
    skill: "linear-time-sorting",
    rung: 5,
    title: "Sort huge values in a narrow range",
    promptMd: `\`sortNarrow(v)\` gets values that can be as large as 10¹⁸, but the largest is at most 1,000,000 more than the smallest. Return them sorted, smallest first. Counting works here once each value is measured from the smallest one. ${TASK} ${limits("up to 1,000,000 values")}`,
    functionSignature: "std::vector<long long> sortNarrow(const std::vector<long long>& v)",
    call: showCall("sortNarrow"),
    generator: GEN + SHIFTED,
    starterCode: `#include <vector>

std::vector<long long> sortNarrow(const std::vector<long long>& v) {
    return v;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<long long> sortNarrow(const std::vector<long long>& v) {
    if (v.empty()) return {};
    long long low = *std::min_element(v.begin(), v.end());
    long long high = *std::max_element(v.begin(), v.end());
    std::vector<int> count(high - low + 1, 0);  // at most 1,000,001 counters
    for (long long x : v) count[x - low]++;
    std::vector<long long> out;
    for (std::size_t k = 0; k < count.size(); k++)
        for (int c = 0; c < count[k]; c++) out.push_back(low + (long long)k);
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<long long> sortNarrow(const std::vector<long long>& v) {
    std::vector<long long> out = v;
    for (std::size_t i = 1; i < out.size(); i++)
        for (std::size_t j = i; j > 0 && out[j - 1] > out[j]; j--) {
            long long t = out[j];
            out[j] = out[j - 1];
            out[j - 1] = t;
        }
    return out;
}
`,
    cases: [
      { args: "{1000000000005LL, 1000000000001LL, 1000000000003LL}", expected: "1000000000001 1000000000003 1000000000005" },
      { args: "{}", expected: "" },
      { args: "{-7, -7, -9}", expected: "-9 -7 -7" },
      { args: "{999999999999000000LL, 1000000000000000000LL}", expected: "999999999999000000 1000000000000000000" },
      { args: "gen::shifted(95, 2000, 500000000000LL, 0, 1000)" },
      { args: "gen::shifted(96, 1000000, 999999999998000000LL, 0, 1000000)" },
    ],
  },
];
