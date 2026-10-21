import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

// n meetings {start, end} with start from 0 to lastStart and length from 1 to longest;
// n fuel stations {position, litres} at sorted positions between 1 and target - 1.
const SHAPES = String.raw`
namespace gen {
std::vector<std::pair<int, int>> meetings(std::uint64_t seed, int n, int lastStart, int longest) {
    state = seed;
    std::vector<std::pair<int, int>> out(n);
    for (auto& [start, end] : out) start = (int)between(0, lastStart), end = start + (int)between(1, longest);
    return out;
}
std::vector<std::pair<int, int>> stations(std::uint64_t seed, int n, int target, int most) {
    std::vector<int> at = sortedInts(seed, n, 1, target - 1), litres = ints(seed + 1, n, 1, most);
    std::vector<std::pair<int, int>> out(n);
    for (int i = 0; i < n; i++) out[i] = {at[i], litres[i]};
    return out;
}
}  // namespace gen
`;

const MOST_MEETINGS = (byEnd: boolean) => `#include <algorithm>
#include <utility>
#include <vector>

int mostMeetings(std::vector<std::pair<int, int>> meetings) {
    std::sort(meetings.begin(), meetings.end(), [](const auto& a, const auto& b) { return ${byEnd ? "a.second < b.second; });  // the one that frees you soonest first" : "a.first < b.first; });"}
    int count = 0;
    long long freeAt = -1;
    for (auto [start, end] : meetings)
        if (start >= freeAt) count++, freeAt = end;
    return count;
}
`;

const MERGE_PILES = `#include <functional>
#include <queue>
#include <vector>

long long mergeCost(const std::vector<int>& piles, int k) {
    std::priority_queue<long long, std::vector<long long>, std::greater<long long>> heap(piles.begin(), piles.end());
    long long cost = 0;
    while (heap.size() > 1) {  // so far: always the two smallest piles
        long long a = heap.top();
        heap.pop();
        long long b = heap.top();
        heap.pop();
        cost += a + b;
        heap.push(a + b);
    }
    return cost;
}
`;

export const greedy: ExerciseTemplate[] = [
  predict(
    "greedy",
    "What does it print? The earliest finish first",
    `#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<std::pair<int, int>> talks = {{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9}, {6, 10}, {8, 11}};  // (start, end)
    std::sort(talks.begin(), talks.end(), [](auto a, auto b) { return a.second < b.second; });
    int freeAt = 0, count = 0;
    for (auto [start, end] : talks)
        if (start >= freeAt) {
            std::cout << start << "-" << end << " ";
            freeAt = end;
            count++;
        }
    std::cout << count << "\\n";
}
`,
    "1-4 5-7 8-11 3",
  ),
  {
    skill: "greedy",
    rung: 2,
    title: "Fix the meeting planner",
    promptMd: `Each meeting is \`{start, end}\`, and you can go to a meeting if it starts no earlier than the previous one you went to ends. \`mostMeetings(meetings)\` returns the most meetings you can go to, choosing greedily. For \`{{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9}, {6, 10}, {8, 11}}\` that's 3, but it picks the wrong meetings first. **Find the fault and fix it.** ${limits("up to 200,000 meetings")}`,
    functionSignature: "int mostMeetings(std::vector<std::pair<int, int>> meetings)",
    call: printCall("mostMeetings"),
    generator: GEN + SHAPES,
    starterCode: MOST_MEETINGS(false),
    reference: MOST_MEETINGS(true),
    bruteForce: `#include <algorithm>
#include <utility>
#include <vector>

int mostMeetings(std::vector<std::pair<int, int>> meetings) {
    std::sort(meetings.begin(), meetings.end(), [](const auto& a, const auto& b) { return a.second < b.second; });
    int n = meetings.size();
    std::vector<int> best(n + 1, 0);  // best[i]: the most meetings among the first i
    for (int i = 0; i < n; i++) {
        int take = 1;
        for (int j = 0; j < i; j++)  // every earlier meeting that ends in time could come before it
            if (meetings[j].second <= meetings[i].first) take = std::max(take, best[j + 1] + 1);
        best[i + 1] = std::max(best[i], take);
    }
    return best[n];
}
`,
    cases: [
      { args: "{{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9}, {6, 10}, {8, 11}}", expected: "3" },
      { args: "{}", expected: "0" },
      { args: "{{1, 2}, {2, 3}}", expected: "2" },
      { args: "{{0, 10}, {1, 2}, {3, 4}, {5, 6}}", expected: "3" },
      { args: "{{5, 6}, {5, 6}, {5, 6}}", expected: "1" },
      { args: "gen::meetings(511, 2000, 100000, 1000)" },
      { args: "gen::meetings(512, 200000, 100000000, 10000)" },
    ],
  },
  {
    skill: "greedy",
    rung: 3,
    title: "Complete the fewest jumps",
    promptMd: `You stand on square 0 of a row, and from square i you can jump to any square from i + 1 to i + \`jump[i]\`. \`fewestJumps(jump)\` returns the fewest jumps to reach the last square, or -1 if it can't be reached. It never tries jumps one by one: \`reachNow\` is the farthest square reachable with \`jumps\` jumps, and \`reachNext\` the farthest with one more. **Complete the TODO**: when i reaches the end of the current window, one more jump is needed. For \`{2, 3, 1, 1, 4}\` that's 2. ${limits("up to 1,000,000 squares")}`,
    functionSignature: "int fewestJumps(const std::vector<int>& jump)",
    call: printCall("fewestJumps"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

int fewestJumps(const std::vector<int>& jump) {
    int n = jump.size(), jumps = 0;
    long long reachNow = 0, reachNext = 0;
    for (int i = 0; i < n - 1; i++) {
        if (i > reachNow) return -1;  // stuck before square i
        reachNext = std::max(reachNext, (long long)i + jump[i]);
        // TODO: at the end of the current window, take a jump: the next window ends at reachNext
    }
    return n - 1 <= reachNow ? jumps : -1;
}
`,
    reference: `#include <algorithm>
#include <vector>

int fewestJumps(const std::vector<int>& jump) {
    int n = jump.size(), jumps = 0;
    long long reachNow = 0, reachNext = 0;
    for (int i = 0; i < n - 1; i++) {
        if (i > reachNow) return -1;  // stuck before square i
        reachNext = std::max(reachNext, (long long)i + jump[i]);
        if (i == reachNow) jumps++, reachNow = reachNext;  // every square this window reaches has been tried
    }
    return n - 1 <= reachNow ? jumps : -1;
}
`,
    bruteForce: `#include <vector>

int fewestJumps(const std::vector<int>& jump) {
    int n = jump.size();
    std::vector<int> fewest(n, -1);
    fewest[0] = 0;
    for (int i = 0; i < n; i++) {  // try every jump from every square
        if (fewest[i] == -1) continue;
        for (long long to = i + 1; to <= i + (long long)jump[i] && to < n; to++)
            if (fewest[to] == -1 || fewest[i] + 1 < fewest[to]) fewest[to] = fewest[i] + 1;
    }
    return fewest[n - 1];
}
`,
    cases: [
      { args: "{2, 3, 1, 1, 4}", expected: "2" },
      { args: "{0}", expected: "0" },
      { args: "{1, 0, 5}", expected: "-1" },
      { args: "{3, 2, 1, 0, 4}", expected: "-1" },
      { args: "{1, 1, 1, 1}", expected: "3" },
      { args: "{5, 0, 0, 0, 0, 0}", expected: "1" },
      { args: "{2, 0, 2, 0, 1}", expected: "2" },
      { args: "gen::ints(513, 2000, 0, 50)" },
      { args: "gen::ints(514, 1000000, 1, 100)" },
      { args: "gen::ints(515, 1000000, 0, 1000000)" },
    ],
  },
  {
    skill: "greedy",
    rung: 4,
    title: "Extend pile merging to k piles at a time",
    promptMd: `Merging piles of stones costs the total size of the piles merged, and the new pile can be merged again later. \`mergeCost(piles, k)\` returns the lowest total cost to end with one pile, but so far it merges **two** piles at a time, always the two smallest. **Extend it** so each merge combines from 2 up to k piles. Hint: the k smallest is the right greedy choice once enough piles of size 0 are added that every merge can take exactly k. For \`{1, 2, 3, 4}\` and k = 3 that's 13: add a 0, merge 0, 1, 2 (cost 3), then 3, 3, 4 (cost 10). ${limits("up to 200,000 piles of up to 1,000,000,000 stones, and k up to 200,000")}`,
    functionSignature: "long long mergeCost(const std::vector<int>& piles, int k)",
    call: printCall("mergeCost"),
    generator: GEN,
    starterCode: MERGE_PILES,
    reference: `#include <functional>
#include <queue>
#include <vector>

long long mergeCost(const std::vector<int>& piles, int k) {
    std::priority_queue<long long, std::vector<long long>, std::greater<long long>> heap(piles.begin(), piles.end());
    while (heap.size() > 1 && (heap.size() - 1) % (k - 1) != 0) heap.push(0);  // each merge of k removes k - 1 piles
    long long cost = 0;
    while (heap.size() > 1) {
        long long merged = 0;
        for (int i = 0; i < k; i++) merged += heap.top(), heap.pop();
        cost += merged;
        heap.push(merged);
    }
    return cost;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

long long mergeCost(const std::vector<int>& piles, int k) {
    std::vector<long long> left(piles.begin(), piles.end());
    while (left.size() > 1 && (left.size() - 1) % (k - 1) != 0) left.push_back(0);
    long long cost = 0;
    while (left.size() > 1) {  // no heap: k times, scan every pile for the smallest and take it out
        long long merged = 0;
        for (int t = 0; t < k; t++) {
            auto smallest = std::min_element(left.begin(), left.end());
            merged += *smallest;
            *smallest = left.back();
            left.pop_back();
        }
        cost += merged;
        left.push_back(merged);
    }
    return cost;
}
`,
    cases: [
      { args: "{1, 2, 3, 4}, 3", expected: "13" },
      { args: "{1, 2, 3, 4, 5}, 3", expected: "21" },
      { args: "{1, 2, 3, 4, 5}, 2", expected: "33" },
      { args: "{7}, 2", expected: "0" },
      { args: "{}, 2", expected: "0" },
      { args: "{4, 4, 4, 4}, 4", expected: "16" },
      { args: "{1, 1, 1, 1, 1, 1}, 5", expected: "8" },
      { args: "gen::ints(516, 2000, 1, 1000000000), 3" },
      { args: "gen::ints(520, 2000, 1, 1000000000), 7" },
      { args: "gen::ints(517, 200000, 1, 1000000000), 3" },
    ],
  },
  {
    skill: "greedy",
    rung: 5,
    title: "The fewest stops for fuel",
    promptMd: `A car drives along a road to a town \`target\` km away, using 1 litre a km, and starts with \`fuel\` litres. Each station \`{position, litres}\` is that far along the road and can fill the car with that many litres; stations are in order of position, all before the town, and the tank has no limit. \`fewestStops(target, fuel, stations)\` returns the fewest stops needed to reach the town, or -1 if it can't be reached. For 100, 10 and \`{{10, 60}, {20, 30}, {30, 30}, {60, 40}}\` that's 2. ${TASK} ${limits("up to 200,000 stations and a target up to 1,000,000,000")}`,
    functionSignature: "int fewestStops(int target, int fuel, const std::vector<std::pair<int, int>>& stations)",
    call: printCall("fewestStops"),
    generator: GEN + SHAPES,
    starterCode: `#include <utility>
#include <vector>

int fewestStops(int target, int fuel, const std::vector<std::pair<int, int>>& stations) {
    return -1;
}
`,
    reference: `#include <queue>
#include <utility>
#include <vector>

int fewestStops(int target, int fuel, const std::vector<std::pair<int, int>>& stations) {
    std::priority_queue<int> passed;  // the stations driven past: stop at the biggest only when the fuel runs out
    long long reach = fuel;
    int stops = 0;
    std::size_t next = 0;
    while (reach < target) {
        while (next < stations.size() && stations[next].first <= reach) passed.push(stations[next++].second);
        if (passed.empty()) return -1;
        reach += passed.top(), passed.pop(), stops++;
    }
    return stops;
}
`,
    bruteForce: `#include <utility>
#include <vector>

int fewestStops(int target, int fuel, const std::vector<std::pair<int, int>>& stations) {
    int n = stations.size();
    std::vector<long long> farthest(n + 1, -1);  // farthest[k]: how far the car gets with k stops
    farthest[0] = fuel;
    for (int i = 0; i < n; i++)
        for (int k = i; k >= 0; k--)
            if (farthest[k] >= stations[i].first && farthest[k] + stations[i].second > farthest[k + 1]) farthest[k + 1] = farthest[k] + stations[i].second;
    for (int k = 0; k <= n; k++)
        if (farthest[k] >= target) return k;
    return -1;
}
`,
    cases: [
      { args: "100, 10, {{10, 60}, {20, 30}, {30, 30}, {60, 40}}", expected: "2" },
      { args: "1, 1, {}", expected: "0" },
      { args: "100, 1, {{10, 100}, {20, 100}}", expected: "-1" },
      { args: "100, 50, {{25, 25}, {50, 50}}", expected: "1" },
      { args: "1000, 299, {{13, 21}, {26, 115}, {100, 47}, {225, 99}, {299, 141}, {444, 198}, {608, 190}, {636, 157}, {647, 255}, {841, 123}}", expected: "4" },
      { args: "100, 100, {{50, 10}, {60, 10}}", expected: "0" },
      { args: "1000000, 1000, gen::stations(518, 2000, 1000000, 2000)" },
      { args: "1000000000, 10000, gen::stations(519, 200000, 1000000000, 20000)" },
    ],
  },
];
