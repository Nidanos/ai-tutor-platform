import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, MATRIX, TEXT, yesNoCall } from "../dsa-exercises/harness.js";

// n jobs {deadline, profit} with deadlines from n/2 to n; n digits from lo to hi.
const SHAPES = String.raw`
namespace gen {
std::vector<std::pair<int, int>> jobs(std::uint64_t seed, int n) {
    state = seed;
    std::vector<std::pair<int, int>> out(n);
    for (auto& [deadline, profit] : out) deadline = (int)between(n / 2, n), profit = (int)between(1, 1000000000);
    return out;
}
std::string digits(std::uint64_t seed, int n, int lo, int hi) {
    state = seed;
    std::string s(n, '0');
    for (char& c : s) c = (char)('0' + between(lo, hi));
    return s;
}
}  // namespace gen
`;

// Algorithm design (greedy, backtracking, dynamic programming) and the course's last skill, problem solving.
export const algorithmDesign: ExerciseTemplate[] = [
  // ── greedy ──
  predict(
    "greedy",
    "What does it print? Greedy change",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> coins = {25, 10, 1};
    int amount = 30, used = 0;
    for (int c : coins)
        while (amount >= c) {
            amount -= c, used++;
            std::cout << c << " ";
        }
    std::cout << "| " << used << "\\n";
}
`,
    "25 1 1 1 1 1 | 6",
  ),
  {
    skill: "greedy",
    rung: 5,
    title: "Schedule the most profitable jobs",
    promptMd: `Each job \`{deadline, profit}\` takes one time slot; slots are numbered 1, 2, 3, …, and a job earns its profit only if it runs in a slot no later than its deadline. One job per slot. Write \`long long bestSchedule(const std::vector<std::pair<int, int>>& jobs)\` that returns the most profit possible. For \`{{2, 100}, {1, 19}, {2, 27}, {1, 25}, {3, 15}}\` that's 142 (100, 27 and 15). Hint: take jobs from the most profitable down, each in the latest free slot it can use. ${TASK} ${limits("up to 200,000 jobs with deadlines up to 200,000")}`,
    functionSignature: "long long bestSchedule(const std::vector<std::pair<int, int>>& jobs)",
    call: printCall("bestSchedule"),
    generator: GEN + SHAPES,
    starterCode: `#include <utility>
#include <vector>

long long bestSchedule(const std::vector<std::pair<int, int>>& jobs) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <set>
#include <utility>
#include <vector>

long long bestSchedule(const std::vector<std::pair<int, int>>& jobs) {
    std::vector<std::pair<int, int>> byProfit = jobs;
    std::sort(byProfit.begin(), byProfit.end(), [](const auto& a, const auto& b) { return a.second > b.second; });
    std::set<int> free;  // the free slots: a set finds the latest one before a deadline in O(log n)
    for (std::size_t s = 1; s <= jobs.size(); s++) free.insert(s);
    long long total = 0;
    for (auto [deadline, profit] : byProfit) {
        auto it = free.upper_bound(deadline);
        if (it == free.begin()) continue;  // no free slot early enough: skip the job
        free.erase(std::prev(it));
        total += profit;
    }
    return total;
}
`,
    bruteForce: `#include <algorithm>
#include <utility>
#include <vector>

long long bestSchedule(const std::vector<std::pair<int, int>>& jobs) {
    std::vector<std::pair<int, int>> byProfit = jobs;
    std::sort(byProfit.begin(), byProfit.end(), [](const auto& a, const auto& b) { return a.second > b.second; });
    std::vector<bool> taken(jobs.size() + 1, false);
    long long total = 0;
    for (auto [deadline, profit] : byProfit)
        for (int s = std::min<int>(deadline, jobs.size()); s >= 1; s--)  // walk back slot by slot to a free one
            if (!taken[s]) {
                taken[s] = true, total += profit;
                break;
            }
    return total;
}
`,
    cases: [
      { args: "{{2, 100}, {1, 19}, {2, 27}, {1, 25}, {3, 15}}", expected: "142" },
      { args: "{}", expected: "0" },
      { args: "{{1, 5}, {1, 7}}", expected: "7" },
      { args: "{{3, 1}, {3, 2}, {3, 3}}", expected: "6" },
      { args: "{{1, 10}, {2, 10}, {2, 10}}", expected: "20" },
      { args: "{{2, 5}, {2, 6}, {1, 7}}", expected: "13" },
      { args: "gen::jobs(791, 2000)" },
      { args: "gen::jobs(792, 200000)" },
    ],
  },

  // ── backtracking ──
  predict(
    "backtracking",
    "What does it print? Ways to add up to 4",
    `#include <iostream>
#include <vector>

void combo(int start, int left, std::vector<int>& chosen) {
    if (left == 0) {
        for (int c : chosen) std::cout << c;
        std::cout << " ";
        return;
    }
    for (int c = start; c <= left; c++) {
        chosen.push_back(c);
        combo(c, left - c, chosen);
        chosen.pop_back();
    }
}

int main() {
    std::vector<int> chosen;
    combo(1, 4, chosen);
    std::cout << "\\n";
}
`,
    "1111 112 13 22 4",
  ),
  {
    skill: "backtracking",
    rung: 5,
    title: "Find a word in a letter grid",
    promptMd: `Write \`bool hasWord(const std::vector<std::string>& grid, const std::string& word)\` that says whether \`word\` can be traced in the grid by moving up, down, left or right from letter to letter, without using any cell twice. For \`{"ABCE", "SFCS", "ADEE"}\` the word "ABCCED" is there, but "ABCB" isn't. Hint: from each matching start, try each neighbour, and undo a cell's "used" mark when its path fails. ${TASK} Grids up to 6 × 6 and words up to 12 letters.`,
    functionSignature: "bool hasWord(const std::vector<std::string>& grid, const std::string& word)",
    call: yesNoCall("hasWord"),
    starterCode: `#include <string>
#include <vector>

bool hasWord(const std::vector<std::string>& grid, const std::string& word) {
    return false;
}
`,
    reference: `#include <string>
#include <vector>

bool trace(std::vector<std::string>& g, const std::string& word, std::size_t i, int r, int c) {
    if (i == word.size()) return true;
    if (r < 0 || c < 0 || r >= (int)g.size() || c >= (int)g[0].size() || g[r][c] != word[i]) return false;
    char kept = g[r][c];
    g[r][c] = '#';  // used on this path
    bool found = trace(g, word, i + 1, r + 1, c) || trace(g, word, i + 1, r - 1, c) || trace(g, word, i + 1, r, c + 1) || trace(g, word, i + 1, r, c - 1);
    g[r][c] = kept;  // undo, so other paths can use it
    return found;
}

bool hasWord(const std::vector<std::string>& grid, const std::string& word) {
    std::vector<std::string> g = grid;
    for (int r = 0; r < (int)g.size(); r++)
        for (int c = 0; c < (int)g[0].size(); c++)
            if (trace(g, word, 0, r, c)) return true;
    return false;
}
`,
    cases: [
      { args: `{"ABCE", "SFCS", "ADEE"}, "ABCCED"`, expected: "yes" },
      { args: `{"ABCE", "SFCS", "ADEE"}, "SEE"`, expected: "yes" },
      { args: `{"ABCE", "SFCS", "ADEE"}, "ABCB"`, expected: "no" },
      { args: `{"a"}, "a"`, expected: "yes" },
      { args: `{"ab", "cd"}, "abdc"`, expected: "yes" },
      { args: `{"aa"}, "aaa"`, expected: "no" },
      { args: `{"aaaaaa", "aaaaaa", "aaaaaa", "aaaaaa", "aaaaaa", "aaaaab"}, "aaaaaaaaaaab"`, expected: "yes" },
      { args: `{"aaaaaa", "aaaaaa", "aaaaaa", "aaaaaa", "aaaaaa", "aaaaaa"}, "aaaaaaaaaaab"`, expected: "no" },
    ],
  },

  // ── dp-basics ──
  predict(
    "dp-basics",
    "What does it print? The cheapest way up",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> cost = {10, 15, 20, 5, 10};  // the price of stepping off each stair
    std::vector<int> dp(cost.size() + 1, 0);  // dp[i]: the cheapest way to stand on stair i; stairs 0 and 1 are free
    for (std::size_t i = 2; i <= cost.size(); i++) dp[i] = std::min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2]);
    for (int x : dp) std::cout << x << " ";
    std::cout << "\\n";
}
`,
    "0 0 10 15 20 20",
  ),
  {
    skill: "dp-basics",
    rung: 5,
    title: "Count the ways to decode",
    promptMd: `A message of letters was encoded as numbers: A is 1, B is 2, …, Z is 26, all written together. Write \`long long decodeWays(const std::string& s)\` that counts the ways the non-empty digit string \`s\` can be decoded, modulo 1,000,000,007. A piece can't start with 0, so "06" can't be read as 6. For "226" that's 3: BZ, VF and BBF. ${TASK} ${limits("strings up to 1,000,000 digits")}`,
    functionSignature: "long long decodeWays(const std::string& s)",
    call: printCall("decodeWays"),
    generator: GEN + SHAPES,
    starterCode: `#include <string>

long long decodeWays(const std::string& s) {
    return 0;
}
`,
    reference: `#include <string>

long long decodeWays(const std::string& s) {
    const long long MOD = 1000000007;
    long long twoBack = 1, oneBack = s[0] != '0';  // the ways to decode the first i - 2 and i - 1 digits
    for (std::size_t i = 1; i < s.size(); i++) {
        long long now = 0;
        if (s[i] != '0') now = oneBack;  // the last digit on its own
        int pair = (s[i - 1] - '0') * 10 + (s[i] - '0');
        if (s[i - 1] != '0' && pair <= 26) now = (now + twoBack) % MOD;  // the last two digits together
        twoBack = oneBack, oneBack = now;
    }
    return oneBack;
}
`,
    bruteForce: `#include <string>

long long ways(const std::string& s, std::size_t i) {  // every split tried afresh, nothing remembered
    if (i == s.size()) return 1;
    if (s[i] == '0') return 0;
    long long total = ways(s, i + 1);
    if (i + 1 < s.size() && (s[i] - '0') * 10 + (s[i + 1] - '0') <= 26) total += ways(s, i + 2);
    return total % 1000000007;
}

long long decodeWays(const std::string& s) { return ways(s, 0); }
`,
    cases: [
      { args: `"226"`, expected: "3" },
      { args: `"12"`, expected: "2" },
      { args: `"06"`, expected: "0" },
      { args: `"0"`, expected: "0" },
      { args: `"10"`, expected: "1" },
      { args: `"11106"`, expected: "2" },
      { args: `"27"`, expected: "1" },
      { args: "gen::digits(793, 25, 1, 2)" },
      { args: "gen::digits(794, 1000000, 1, 2)" },
    ],
  },

  // ── dp-sequences ──
  predict(
    "dp-sequences",
    "What does it print? Rises ending at each number",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {3, 1, 4, 1, 5, 9, 2, 6};
    std::vector<int> len(a.size(), 1);
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = 0; j < i; j++)
            if (a[j] < a[i]) len[i] = std::max(len[i], len[j] + 1);
    for (int x : len) std::cout << x;
    std::cout << "\\n";
}
`,
    "11213424",
  ),
  {
    skill: "dp-sequences",
    rung: 5,
    title: "The longest common subsequence",
    promptMd: `A subsequence keeps some letters of a string in their order, not necessarily side by side. Write \`int lcsLength(const std::string& a, const std::string& b)\` that returns the length of the longest string that is a subsequence of both. For "abcde" and "ace" that's 3. Mind the memory: two strings of 5,000 letters make 25 million table cells, but each row only needs the one before it. ${TASK} ${limits("strings up to 5,000 letters")}`,
    functionSignature: "int lcsLength(const std::string& a, const std::string& b)",
    call: printCall("lcsLength"),
    generator: GEN + TEXT,
    starterCode: `#include <string>

int lcsLength(const std::string& a, const std::string& b) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <string>
#include <vector>

int lcsLength(const std::string& a, const std::string& b) {
    std::vector<int> prev(b.size() + 1, 0), cur(b.size() + 1, 0);  // rows i - 1 and i of the usual table
    for (std::size_t i = 1; i <= a.size(); i++) {
        for (std::size_t j = 1; j <= b.size(); j++)
            cur[j] = a[i - 1] == b[j - 1] ? prev[j - 1] + 1 : std::max(prev[j], cur[j - 1]);
        prev.swap(cur);
    }
    return prev[b.size()];
}
`,
    bruteForce: `#include <algorithm>
#include <string>

int longest(const std::string& a, const std::string& b, std::size_t i, std::size_t j) {  // every choice tried, nothing remembered
    if (i == a.size() || j == b.size()) return 0;
    if (a[i] == b[j]) return 1 + longest(a, b, i + 1, j + 1);
    return std::max(longest(a, b, i + 1, j), longest(a, b, i, j + 1));
}

int lcsLength(const std::string& a, const std::string& b) { return longest(a, b, 0, 0); }
`,
    cases: [
      { args: `"abcde", "ace"`, expected: "3" },
      { args: `"abc", "def"`, expected: "0" },
      { args: `"", "abc"`, expected: "0" },
      { args: `"abc", "abc"`, expected: "3" },
      { args: `"abcba", "abcbcba"`, expected: "5" },
      { args: `"aaaa", "aa"`, expected: "2" },
      { args: "gen::text(795, 12, 3), gen::text(796, 12, 3)" },
      { args: "gen::text(797, 5000, 4), gen::text(798, 5000, 4)" },
    ],
  },

  // ── dp-knapsack ──
  predict(
    "dp-knapsack",
    "What does it print? The sums some items can make",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> items = {3, 5, 6};
    std::vector<bool> can(12, false);
    can[0] = true;
    for (int x : items)
        for (int s = 11; s >= x; s--)
            if (can[s - x]) can[s] = true;
    for (int s = 0; s < 12; s++)
        if (can[s]) std::cout << s << " ";
    std::cout << "\\n";
}
`,
    "0 3 5 6 8 9 11",
  ),
  {
    skill: "dp-knapsack",
    rung: 5,
    title: "Count the subsets with a given sum",
    promptMd: `Write \`long long countSubsets(const std::vector<int>& nums, int target)\` that counts the subsets of \`nums\` (chosen by position, so equal numbers count separately) whose sum is exactly \`target\`, modulo 1,000,000,007. The numbers are between 1 and 1,000, and 0 ≤ target ≤ 100,000. For \`{1, 1, 1, 1, 1}\` and 3 that's 10. ${TASK} ${limits("up to 100 numbers")}`,
    functionSignature: "long long countSubsets(const std::vector<int>& nums, int target)",
    call: printCall("countSubsets"),
    generator: GEN,
    starterCode: `#include <vector>

long long countSubsets(const std::vector<int>& nums, int target) {
    return 0;
}
`,
    reference: `#include <vector>

long long countSubsets(const std::vector<int>& nums, int target) {
    const long long MOD = 1000000007;
    std::vector<long long> ways(target + 1, 0);  // ways[s]: subsets of the numbers so far that add up to s
    ways[0] = 1;
    for (int x : nums)
        for (int s = target; s >= x; s--) ways[s] = (ways[s] + ways[s - x]) % MOD;  // downwards: each number used once
    return ways[target];
}
`,
    bruteForce: `#include <vector>

long long tryAll(const std::vector<int>& nums, std::size_t i, long long left) {
    if (i == nums.size()) return left == 0;
    return (tryAll(nums, i + 1, left) + tryAll(nums, i + 1, left - nums[i])) % 1000000007;  // leave it, or take it
}

long long countSubsets(const std::vector<int>& nums, int target) { return tryAll(nums, 0, target); }
`,
    cases: [
      { args: "{1, 1, 1, 1, 1}, 3", expected: "10" },
      { args: "{}, 0", expected: "1" },
      { args: "{2, 4, 6}, 6", expected: "2" },
      { args: "{5}, 3", expected: "0" },
      { args: "{3, 3, 3}, 6", expected: "3" },
      { args: "{7, 1}, 0", expected: "1" },
      { args: "gen::ints(799, 20, 1, 1000), 5000" },
      { args: "gen::ints(800, 100, 1, 1000), 25000" },
    ],
  },

  // ── dp-grids-intervals ──
  predict(
    "dp-grids-intervals",
    "What does it print? The longest palindromic subsequence",
    `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::string s = "bbab";
    int n = s.size();
    std::vector<std::vector<int>> lps(n, std::vector<int>(n, 0));  // lps[i][j]: the longest for s[i..j]
    for (int i = n - 1; i >= 0; i--) {
        lps[i][i] = 1;
        for (int j = i + 1; j < n; j++)
            lps[i][j] = s[i] == s[j] ? lps[i + 1][j - 1] + 2 : std::max(lps[i + 1][j], lps[i][j - 1]);
    }
    for (int x : lps[0]) std::cout << x;
    std::cout << " " << lps[0][n - 1] << "\\n";
}
`,
    "1223 3",
  ),
  {
    skill: "dp-grids-intervals",
    rung: 5,
    title: "Cut a stick for the least",
    promptMd: `A stick of length \`length\` must be cut at every position in \`cuts\` (all different, strictly between 0 and length), in any order. Each cut costs the length of the piece being cut. Write \`long long cutCost(int length, std::vector<int> cuts)\` that returns the lowest total cost. For length 7 and \`{1, 3, 4, 5}\` that's 16. Hint: for the piece between two neighbouring marks, try each cut inside it as the first one. ${TASK} ${limits("up to 100 cuts on a stick up to 1,000,000 long")}`,
    functionSignature: "long long cutCost(int length, std::vector<int> cuts)",
    call: printCall("cutCost"),
    generator: GEN,
    starterCode: `#include <vector>

long long cutCost(int length, std::vector<int> cuts) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <climits>
#include <vector>

long long cutCost(int length, std::vector<int> cuts) {
    cuts.push_back(0), cuts.push_back(length);
    std::sort(cuts.begin(), cuts.end());
    int m = cuts.size();
    std::vector<std::vector<long long>> cost(m, std::vector<long long>(m, 0));  // cost[i][j]: every cut strictly between marks i and j
    for (int gap = 2; gap < m; gap++)
        for (int i = 0; i + gap < m; i++) {
            int j = i + gap;
            cost[i][j] = LLONG_MAX;
            for (int k = i + 1; k < j; k++) cost[i][j] = std::min(cost[i][j], cost[i][k] + cost[k][j]);
            cost[i][j] += cuts[j] - cuts[i];  // the first cut in this piece costs the whole piece
        }
    return cost[0][m - 1];
}
`,
    bruteForce: `#include <algorithm>
#include <climits>
#include <vector>

long long cheapest(const std::vector<int>& marks, int i, int j) {  // every choice of first cut, nothing remembered
    if (j - i < 2) return 0;
    long long best = LLONG_MAX;
    for (int k = i + 1; k < j; k++) best = std::min(best, cheapest(marks, i, k) + cheapest(marks, k, j));
    return best + marks[j] - marks[i];
}

long long cutCost(int length, std::vector<int> cuts) {
    cuts.push_back(0), cuts.push_back(length);
    std::sort(cuts.begin(), cuts.end());
    return cheapest(cuts, 0, cuts.size() - 1);
}
`,
    cases: [
      { args: "7, {1, 3, 4, 5}", expected: "16" },
      { args: "9, {5, 6, 1, 4, 2}", expected: "22" },
      { args: "5, {}", expected: "0" },
      { args: "10, {5}", expected: "10" },
      { args: "4, {1, 2, 3}", expected: "8" },
      { args: "1000000, {1, 999999}", expected: "1999999" },
      { args: "1000000, gen::sortedInts(801, 11, 1, 999999)" },
      { args: "1000000, gen::sortedInts(802, 100, 1, 999999)" },
    ],
  },

  // ── dp-advanced ──
  predict(
    "dp-advanced",
    "What does it print? Counting independent sets in a tree",
    `#include <iostream>
#include <vector>

std::vector<std::vector<int>> kids = {{1, 2}, {3}, {}, {}};
std::vector<long long> with(4), without(4);  // the sets in v's subtree that hold v, and those that don't

void go(int v) {
    with[v] = without[v] = 1;
    for (int c : kids[v]) {
        go(c);
        with[v] *= without[c];
        without[v] *= with[c] + without[c];
    }
}

int main() {
    go(0);
    for (int v = 0; v < 4; v++) std::cout << with[v] << without[v] << " ";
    std::cout << with[0] + without[0] << "\\n";
}
`,
    "26 12 11 11 8",
  ),
  {
    skill: "dp-advanced",
    rung: 5,
    title: "Assign the tasks for the least",
    promptMd: `n people must each take exactly one of n tasks, and \`cost[p][t]\` is what person p charges for task t. Write \`long long cheapestAssignment(const std::vector<std::vector<int>>& cost)\` that returns the lowest total cost. For \`{{9, 2, 7, 8}, {6, 4, 3, 7}, {5, 8, 1, 8}, {7, 6, 9, 4}}\` that's 13 (2 + 6 + 1 + 4). Hint: with people taking tasks in order, the state is just the set of tasks already taken, a bitmask. ${TASK} ${limits("up to 18 people")}`,
    functionSignature: "long long cheapestAssignment(const std::vector<std::vector<int>>& cost)",
    call: printCall("cheapestAssignment"),
    generator: GEN + MATRIX,
    starterCode: `#include <vector>

long long cheapestAssignment(const std::vector<std::vector<int>>& cost) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <bit>
#include <climits>
#include <vector>

long long cheapestAssignment(const std::vector<std::vector<int>>& cost) {
    int n = cost.size();
    std::vector<long long> best(1 << n, LLONG_MAX);  // best[mask]: the first popcount(mask) people took the tasks in mask
    best[0] = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (best[mask] == LLONG_MAX) continue;
        int person = std::popcount((unsigned)mask);
        if (person == n) continue;
        for (int t = 0; t < n; t++)
            if (!(mask >> t & 1)) best[mask | 1 << t] = std::min(best[mask | 1 << t], best[mask] + cost[person][t]);
    }
    return best[(1 << n) - 1];
}
`,
    bruteForce: `#include <algorithm>
#include <climits>
#include <numeric>
#include <vector>

long long cheapestAssignment(const std::vector<std::vector<int>>& cost) {
    int n = cost.size();
    std::vector<int> task(n);  // every way to hand out the tasks
    std::iota(task.begin(), task.end(), 0);
    long long best = LLONG_MAX;
    do {
        long long total = 0;
        for (int p = 0; p < n; p++) total += cost[p][task[p]];
        best = std::min(best, total);
    } while (std::next_permutation(task.begin(), task.end()));
    return best;
}
`,
    cases: [
      { args: "{{9, 2, 7, 8}, {6, 4, 3, 7}, {5, 8, 1, 8}, {7, 6, 9, 4}}", expected: "13" },
      { args: "{{5}}", expected: "5" },
      { args: "{}", expected: "0" },
      { args: "{{1, 2}, {2, 1}}", expected: "2" },
      { args: "{{1, 2}, {3, 10}}", expected: "5" },
      { args: "{{4, 1, 3}, {2, 0, 5}, {3, 2, 2}}", expected: "5" },
      { args: "gen::matrix(803, 8, 8, 1, 1000000)" },
      { args: "gen::matrix(804, 18, 18, 1, 1000000)" },
    ],
  },

  // ── problem-solving ──
  predict(
    "problem-solving",
    "What does it print? Prefix sums, then a binary search",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {2, 1, 3, 2, 4};
    std::vector<int> pre = {0};
    for (int x : a) pre.push_back(pre.back() + x);
    for (int q : {5, 6, 13}) std::cout << std::lower_bound(pre.begin(), pre.end(), q) - pre.begin() << " ";
    std::cout << "\\n";
}
`,
    "3 3 6",
  ),
  {
    skill: "problem-solving",
    rung: 5,
    title: "The k-th smallest pair distance",
    promptMd: `The distance of a pair of positions i < j is \`|a[i] - a[j]|\`. Write \`int kthDistance(std::vector<int> a, long long k)\` that returns the k-th smallest distance among all pairs (k = 1 is the smallest; equal distances count separately). For \`{1, 3, 1}\` and k = 1 that's 0. Read the limits first: there can be 5 billion pairs, far too many to list. ${TASK} ${limits("up to 100,000 numbers between 0 and 1,000,000,000")}`,
    functionSignature: "int kthDistance(std::vector<int> a, long long k)",
    call: printCall("kthDistance"),
    generator: GEN,
    starterCode: `#include <vector>

int kthDistance(std::vector<int> a, long long k) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

int kthDistance(std::vector<int> a, long long k) {
    std::sort(a.begin(), a.end());
    auto pairsWithin = [&](long long d) {  // pairs at distance <= d, by two pointers on the sorted values
        long long count = 0;
        for (std::size_t lo = 0, hi = 0; hi < a.size(); hi++) {
            while ((long long)a[hi] - a[lo] > d) lo++;
            count += hi - lo;
        }
        return count;
    };
    long long lo = 0, hi = a.back() - a.front();
    while (lo < hi) {  // binary search on the answer: the smallest d with at least k pairs within it
        long long mid = (lo + hi) / 2;
        if (pairsWithin(mid) >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
`,
    bruteForce: `#include <algorithm>
#include <cstdlib>
#include <vector>

int kthDistance(std::vector<int> a, long long k) {
    long long lo = 0, hi = 1000000000;
    while (lo < hi) {  // the same search, but counting every pair each time
        long long mid = (lo + hi) / 2, count = 0;
        for (std::size_t i = 0; i < a.size(); i++)
            for (std::size_t j = i + 1; j < a.size(); j++) count += std::llabs((long long)a[i] - a[j]) <= mid;
        if (count >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
`,
    cases: [
      { args: "{1, 3, 1}, 1", expected: "0" },
      { args: "{1, 1, 1}, 2", expected: "0" },
      { args: "{1, 6, 1}, 3", expected: "5" },
      { args: "{1, 3, 1}, 3", expected: "2" },
      { args: "{10, 20}, 1", expected: "10" },
      { args: "{1, 2, 4, 8}, 4", expected: "4" },
      { args: "gen::ints(805, 2000, 0, 1000000), 1000000" },
      { args: "gen::ints(806, 100000, 0, 1000000000), 2500000000" },
    ],
  },
];
