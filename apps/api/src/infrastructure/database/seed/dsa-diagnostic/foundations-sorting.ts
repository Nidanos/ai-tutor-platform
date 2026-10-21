// Placement-test items for the DSA course (ADR-0012): per skill, one predict-the-output program and one code
// task, different from the skill's practice exercises. Code tasks that are about speed carry generated tests
// (ADR-0020). Verified in the sandbox before they are asked; frozen: to correct one, add a copy with `variant: 1`.
import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "../dsa-exercises/harness.js";

// Different even numbers 2, 4, ..., 2n in increasing order, rotated by a random amount.
const ROTATED = String.raw`
namespace gen {
std::vector<int> rotated(std::uint64_t seed, int n) {
    state = seed;
    int k = (int)between(0, n - 1);
    std::vector<int> out(n);
    for (int i = 0; i < n; i++) out[i] = 2 * ((i + k) % n + 1);
    return out;
}
}  // namespace gen
`;

export const foundationsSorting: ExerciseTemplate[] = [
  // ── complexity ──
  predict(
    "complexity",
    "What does it print? Counting the steps",
    `#include <iostream>

int main() {
    int n = 16, steps = 0;
    for (int i = 1; i < n; i *= 2)
        for (int j = 0; j < i; j++) steps++;
    std::cout << steps << " ";
    steps = 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j += 4) steps++;
    std::cout << steps << "\\n";
}
`,
    "15 40",
  ),
  {
    skill: "complexity",
    rung: 5,
    title: "Add up every pair's distance",
    promptMd: `Write \`long long pairDistances(std::vector<int> a)\` that returns the sum of \`|a[i] - a[j]|\` over all pairs of positions i < j. For \`{1, 4, 2}\` that's 3 + 1 + 2 = 6. The numbers are between -1,000,000 and 1,000,000. ${TASK} ${limits("up to 200,000 numbers")}`,
    functionSignature: "long long pairDistances(std::vector<int> a)",
    call: printCall("pairDistances"),
    generator: GEN,
    starterCode: `#include <vector>

long long pairDistances(std::vector<int> a) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

long long pairDistances(std::vector<int> a) {
    std::sort(a.begin(), a.end());  // sorted, a[i] is the larger of each pair with the i values before it
    long long total = 0, before = 0;
    for (std::size_t i = 0; i < a.size(); i++) {
        total += (long long)a[i] * i - before;
        before += a[i];
    }
    return total;
}
`,
    bruteForce: `#include <cstdlib>
#include <vector>

long long pairDistances(std::vector<int> a) {
    long long total = 0;
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++) total += std::abs(a[i] - a[j]);
    return total;
}
`,
    cases: [
      { args: "{1, 4, 2}", expected: "6" },
      { args: "{}", expected: "0" },
      { args: "{5}", expected: "0" },
      { args: "{3, 3}", expected: "0" },
      { args: "{-2, 5}", expected: "7" },
      { args: "{10, 0, 5, 5}", expected: "30" },
      { args: "gen::ints(701, 2000, -1000000, 1000000)" },
      { args: "gen::ints(702, 200000, -1000000, 1000000)" },
    ],
  },

  // ── recursion ──
  predict(
    "recursion",
    "What does it print? Before and after the call",
    `#include <iostream>

void show(int n) {
    if (n == 0) return;
    std::cout << n % 10;
    show(n / 10);
    std::cout << n % 10;
}

int count(int n) { return n < 3 ? 1 : count(n - 1) + count(n - 3); }

int main() {
    show(123);
    std::cout << " " << count(6) << "\\n";
}
`,
    "321123 6",
  ),
  {
    skill: "recursion",
    rung: 5,
    title: "Weigh a nested list by depth",
    promptMd: `A nested list is written like \`[1,[4,[6]]]\`: whole numbers and lists, separated by commas, with no spaces. Each number counts **times its depth**, where the outermost list is depth 1. Write \`long long depthSum(const std::string& s)\` that returns the total. For \`[1,[4,[6]]]\` that's 1·1 + 4·2 + 6·3 = 27. A list inside a list is the same problem again, one level deeper. ${TASK} Lists up to 10,000 characters.`,
    functionSignature: "long long depthSum(const std::string& s)",
    call: printCall("depthSum"),
    starterCode: `#include <string>

long long depthSum(const std::string& s) {
    return 0;
}
`,
    reference: `#include <cctype>
#include <string>

long long sumList(const std::string& s, std::size_t& i, int depth) {  // s[i] is the list's '['; leaves i after its ']'
    long long total = 0;
    i++;
    while (s[i] != ']') {
        if (s[i] == ',') i++;
        else if (s[i] == '[') total += sumList(s, i, depth + 1);
        else {
            int sign = 1;
            long long value = 0;
            if (s[i] == '-') sign = -1, i++;
            while (isdigit((unsigned char)s[i])) value = value * 10 + (s[i++] - '0');
            total += sign * value * depth;
        }
    }
    i++;
    return total;
}

long long depthSum(const std::string& s) {
    std::size_t i = 0;
    return sumList(s, i, 1);
}
`,
    cases: [
      { args: `"[1,[4,[6]]]"`, expected: "27" },
      { args: `"[]"`, expected: "0" },
      { args: `"[[1,1],2,[1,1]]"`, expected: "10" },
      { args: `"[5]"`, expected: "5" },
      { args: `"[[[]]]"`, expected: "0" },
      { args: `"[-3,[2]]"`, expected: "1" },
      { args: `"[10,[20],[[30]]]"`, expected: "140" },
      { args: `"[[[[[[[[[[7]]]]]]]]]]"`, expected: "70" },
    ],
  },

  // ── binary-search ──
  predict(
    "binary-search",
    "What does it print? Bounds and halving",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {2, 4, 4, 4, 7, 9};
    auto lo = std::lower_bound(a.begin(), a.end(), 4) - a.begin();
    auto hi = std::upper_bound(a.begin(), a.end(), 4) - a.begin();
    auto miss = std::lower_bound(a.begin(), a.end(), 8) - a.begin();
    std::cout << lo << hi << miss << "\\n";
    int left = 0, right = 5, steps = 0;
    while (left < right) {
        int mid = (left + right) / 2;
        steps++;
        if (a[mid] < 9) left = mid + 1;
        else right = mid;
    }
    std::cout << left << " " << steps << "\\n";
}
`,
    "145\n5 2",
  ),
  {
    skill: "binary-search",
    rung: 5,
    title: "Search a rotated sorted list",
    promptMd: `\`a\` holds different numbers that were sorted in increasing order and then **rotated**: some first part was moved to the end, as in \`{4, 5, 6, 7, 0, 1, 2}\`. Write \`std::vector<int> findRotated(const std::vector<int>& a, const std::vector<int>& queries)\` that returns, for each query, its position in \`a\`, or -1 if it isn't there. For that list and \`{0, 3, 7, 4}\` that's \`4 -1 3 0\`. Hint: at every step of a binary search, at least one half is in sorted order. ${TASK} ${limits("up to 200,000 numbers and 200,000 queries")}`,
    functionSignature: "std::vector<int> findRotated(const std::vector<int>& a, const std::vector<int>& queries)",
    call: showCall("findRotated"),
    generator: GEN + ROTATED,
    starterCode: `#include <vector>

std::vector<int> findRotated(const std::vector<int>& a, const std::vector<int>& queries) {
    return {};
}
`,
    reference: `#include <vector>

std::vector<int> findRotated(const std::vector<int>& a, const std::vector<int>& queries) {
    std::vector<int> out;
    for (int q : queries) {
        int lo = 0, hi = (int)a.size() - 1, at = -1;
        while (lo <= hi && at < 0) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == q) at = mid;
            else if (a[lo] <= a[mid]) {  // the left half is sorted: is q inside its range?
                if (a[lo] <= q && q < a[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {  // otherwise the right half is
                if (a[mid] < q && q <= a[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        out.push_back(at);
    }
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<int> findRotated(const std::vector<int>& a, const std::vector<int>& queries) {
    std::vector<int> out;
    for (int q : queries) {
        int at = -1;
        for (int i = 0; i < (int)a.size(); i++)
            if (a[i] == q) at = i;
        out.push_back(at);
    }
    return out;
}
`,
    cases: [
      { args: "{4, 5, 6, 7, 0, 1, 2}, {0, 3, 7, 4}", expected: "4 -1 3 0" },
      { args: "{1}, {1, 0}", expected: "0 -1" },
      { args: "{}, {5}", expected: "-1" },
      { args: "{3, 1}, {1, 3, 2}", expected: "1 0 -1" },
      { args: "{1, 2, 3}, {3}", expected: "2" },
      { args: "gen::rotated(703, 2000), gen::ints(704, 2000, 1, 4001)" },
      { args: "gen::rotated(705, 200000), gen::ints(706, 200000, 1, 400001)" },
    ],
  },

  // ── elementary-sorts ──
  predict(
    "elementary-sorts",
    "What does it print? Insertion sort, pass by pass",
    `#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<int> a = {5, 2, 4, 1};
    int swaps = 0;
    for (std::size_t i = 1; i < a.size(); i++) {
        for (std::size_t j = i; j > 0 && a[j - 1] > a[j]; j--) {
            std::swap(a[j - 1], a[j]);
            swaps++;
        }
        for (int x : a) std::cout << x;
        std::cout << " ";
    }
    std::cout << swaps << "\\n";
}
`,
    "2541 2451 1245 5",
  ),
  {
    skill: "elementary-sorts",
    rung: 5,
    title: "Count selection sort's swaps",
    promptMd: `Selection sort goes through positions 0, 1, 2, … in turn. At position i it finds the smallest value from i to the end (the **first** one, if there are several), and swaps it into position i, unless it's already there. Write \`int selectionSwaps(std::vector<int> a)\` that returns how many swaps selection sort makes on \`a\`. For \`{3, 1, 2}\` that's 2. ${TASK} Up to 1,000 numbers.`,
    functionSignature: "int selectionSwaps(std::vector<int> a)",
    call: printCall("selectionSwaps"),
    starterCode: `#include <vector>

int selectionSwaps(std::vector<int> a) {
    return 0;
}
`,
    reference: `#include <utility>
#include <vector>

int selectionSwaps(std::vector<int> a) {
    int swaps = 0;
    for (std::size_t i = 0; i < a.size(); i++) {
        std::size_t smallest = i;
        for (std::size_t j = i + 1; j < a.size(); j++)
            if (a[j] < a[smallest]) smallest = j;  // strictly smaller: the first of equal values stays chosen
        if (smallest != i) std::swap(a[i], a[smallest]), swaps++;
    }
    return swaps;
}
`,
    cases: [
      { args: "{3, 1, 2}", expected: "2" },
      { args: "{1, 2, 3}", expected: "0" },
      { args: "{}", expected: "0" },
      { args: "{2, 2, 1}", expected: "1" },
      { args: "{4, 3, 2, 1}", expected: "2" },
      { args: "{5, 1, 4, 2, 3}", expected: "4" },
    ],
  },

  // ── merge-sort ──
  predict(
    "merge-sort",
    "What does it print? One merge, counting what jumps ahead",
    `#include <iostream>
#include <vector>

std::vector<int> merge(const std::vector<int>& a, const std::vector<int>& b, int& jumps) {
    std::vector<int> out;
    std::size_t i = 0, j = 0;
    while (i < a.size() || j < b.size()) {
        if (j == b.size() || (i < a.size() && a[i] <= b[j])) out.push_back(a[i++]);
        else {
            jumps += a.size() - i;  // b[j] goes before everything left in a
            out.push_back(b[j++]);
        }
    }
    return out;
}

int main() {
    int jumps = 0;
    for (int x : merge({1, 4, 6}, {2, 4, 7}, jumps)) std::cout << x;
    std::cout << " " << jumps << "\\n";
}
`,
    "124467 3",
  ),
  {
    skill: "merge-sort",
    rung: 5,
    title: "Count the big drops",
    promptMd: `Write \`long long bigDrops(std::vector<int> a)\` that counts the pairs of positions i < j with \`a[i] > 2 · a[j]\`. The numbers are between -1,000,000,000 and 1,000,000,000. For \`{1, 3, 2, 3, 1}\` that's 2: each 3 with the last 1. Hint: count the pairs between the two halves while merge sort has them both sorted. ${TASK} ${limits("up to 200,000 numbers")}`,
    functionSignature: "long long bigDrops(std::vector<int> a)",
    call: printCall("bigDrops"),
    generator: GEN,
    starterCode: `#include <vector>

long long bigDrops(std::vector<int> a) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

long long sortCount(std::vector<int>& a, std::vector<int>& tmp, int lo, int hi) {  // sorts a[lo, hi) and counts its pairs
    if (hi - lo < 2) return 0;
    int mid = (lo + hi) / 2;
    long long count = sortCount(a, tmp, lo, mid) + sortCount(a, tmp, mid, hi);
    for (int i = lo, j = mid; i < mid; i++) {  // both halves sorted: j only moves forward as a[i] grows
        while (j < hi && a[i] > 2LL * a[j]) j++;
        count += j - mid;
    }
    std::merge(a.begin() + lo, a.begin() + mid, a.begin() + mid, a.begin() + hi, tmp.begin() + lo);
    std::copy(tmp.begin() + lo, tmp.begin() + hi, a.begin() + lo);
    return count;
}

long long bigDrops(std::vector<int> a) {
    std::vector<int> tmp(a.size());
    return sortCount(a, tmp, 0, a.size());
}
`,
    bruteForce: `#include <vector>

long long bigDrops(std::vector<int> a) {
    long long count = 0;
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++) count += a[i] > 2LL * a[j];
    return count;
}
`,
    cases: [
      { args: "{1, 3, 2, 3, 1}", expected: "2" },
      { args: "{2, 4, 3, 5, 1}", expected: "3" },
      { args: "{}", expected: "0" },
      { args: "{5, 2}", expected: "1" },
      { args: "{-5, -3}", expected: "1" },
      { args: "{3, 1, 1}", expected: "2" },
      { args: "gen::ints(707, 2000, -1000000000, 1000000000)" },
      { args: "gen::ints(708, 200000, -1000000000, 1000000000)" },
    ],
  },

  // ── quick-sort ──
  predict(
    "quick-sort",
    "What does it print? One partition",
    `#include <iostream>
#include <utility>
#include <vector>

int partition(std::vector<int>& a, int lo, int hi) {
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot) std::swap(a[i++], a[j]);
    std::swap(a[i], a[hi]);
    return i;
}

int main() {
    std::vector<int> a = {7, 2, 9, 4, 3, 8, 5};
    int p = partition(a, 0, 6);
    for (int x : a) std::cout << x;
    std::cout << " " << p << "\\n";
}
`,
    "2435987 3",
  ),
  {
    skill: "quick-sort",
    rung: 5,
    title: "The k-th smallest",
    promptMd: `Write \`int kthSmallest(std::vector<int> a, int k)\` that returns the k-th smallest value of \`a\` (k = 1 is the smallest; equal values count separately). For \`{7, 2, 9, 4, 3}\` and k = 2 that's 3. Partitioning around a pivot, then carrying on into one side only, finds it in linear time on average. ${TASK} ${limits("up to 1,000,000 numbers")}`,
    functionSignature: "int kthSmallest(std::vector<int> a, int k)",
    call: printCall("kthSmallest"),
    generator: GEN,
    starterCode: `#include <vector>

int kthSmallest(std::vector<int> a, int k) {
    return 0;
}
`,
    reference: `#include <utility>
#include <vector>

int kthSmallest(std::vector<int> a, int k) {
    int lo = 0, hi = a.size() - 1, want = k - 1;
    unsigned seed = 12345;
    while (true) {  // quickselect: partition, then keep only the side that holds position want
        seed = seed * 1103515245 + 12345;
        std::swap(a[lo + seed % (hi - lo + 1)], a[hi]);  // a random pivot, so sorted input stays fast
        int pivot = a[hi], i = lo;
        for (int j = lo; j < hi; j++)
            if (a[j] < pivot) std::swap(a[i++], a[j]);
        std::swap(a[i], a[hi]);
        if (i == want) return a[i];
        if (i < want) lo = i + 1;
        else hi = i - 1;
    }
}
`,
    bruteForce: `#include <vector>

int kthSmallest(std::vector<int> a, int k) {
    int value = 0;
    for (int round = 0; round < k; round++) {  // take out the smallest, k times
        std::size_t smallest = 0;
        for (std::size_t i = 1; i < a.size(); i++)
            if (a[i] < a[smallest]) smallest = i;
        value = a[smallest];
        a[smallest] = a.back();
        a.pop_back();
    }
    return value;
}
`,
    cases: [
      { args: "{7, 2, 9, 4, 3}, 2", expected: "3" },
      { args: "{5}, 1", expected: "5" },
      { args: "{3, 1, 2}, 3", expected: "3" },
      { args: "{4, 4, 4, 1}, 3", expected: "4" },
      { args: "{-2, 8, -9, 0}, 1", expected: "-9" },
      { args: "gen::ints(709, 2000, 1, 1000000), 1000" },
      { args: "gen::ints(710, 1000000, 1, 1000000000), 500000" },
    ],
  },

  // ── linear-time-sorting ──
  predict(
    "linear-time-sorting",
    "What does it print? Counting sort's positions",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {3, 1, 3, 0, 2, 1};
    std::vector<int> count(4, 0);
    for (int x : a) count[x]++;
    for (int v = 1; v < 4; v++) count[v] += count[v - 1];
    for (int c : count) std::cout << c;
    std::cout << " ";
    std::vector<int> from(a.size());  // from[p]: which position of a lands at p
    for (int i = (int)a.size() - 1; i >= 0; i--) from[--count[a[i]]] = i;
    for (int i : from) std::cout << i;
    std::cout << "\\n";
}
`,
    "1346 315402",
  ),
  {
    skill: "linear-time-sorting",
    rung: 5,
    title: "Sort by the last digit",
    promptMd: `Write \`std::vector<int> byLastDigit(const std::vector<int>& a)\` that returns the numbers sorted by their **last digit** only, keeping numbers with the same last digit in their original order. The numbers are between 0 and 1,000,000,000. For \`{23, 41, 13, 50, 7, 31}\` that's \`50 41 31 23 13 7\`. ${TASK} ${limits("up to 1,000,000 numbers")}`,
    functionSignature: "std::vector<int> byLastDigit(const std::vector<int>& a)",
    call: showCall("byLastDigit"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> byLastDigit(const std::vector<int>& a) {
    return a;
}
`,
    reference: `#include <vector>

std::vector<int> byLastDigit(const std::vector<int>& a) {
    std::vector<int> start(11, 0);  // counting sort on 10 keys: start[d] is where digit d's block begins
    for (int x : a) start[x % 10 + 1]++;
    for (int d = 1; d <= 10; d++) start[d] += start[d - 1];
    std::vector<int> out(a.size());
    for (int x : a) out[start[x % 10]++] = x;  // left to right, so equal digits keep their order
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<int> byLastDigit(const std::vector<int>& a) {
    std::vector<int> out = a;
    for (std::size_t i = 1; i < out.size(); i++)  // insertion sort on the last digit: stable, but slow
        for (std::size_t j = i; j > 0 && out[j - 1] % 10 > out[j] % 10; j--) {
            int t = out[j];
            out[j] = out[j - 1];
            out[j - 1] = t;
        }
    return out;
}
`,
    cases: [
      { args: "{23, 41, 13, 50, 7, 31}", expected: "50 41 31 23 13 7" },
      { args: "{}", expected: "" },
      { args: "{5}", expected: "5" },
      { args: "{10, 20, 30}", expected: "10 20 30" },
      { args: "{19, 9, 99, 0}", expected: "0 19 9 99" },
      { args: "gen::ints(711, 2000, 0, 1000000000)" },
      { args: "gen::ints(712, 1000000, 0, 1000000000)" },
    ],
  },

  // ── binary-search-on-answer ──
  predict(
    "binary-search-on-answer",
    "What does it print? Searching for the smallest capacity",
    `#include <iostream>
#include <vector>

bool fits(const std::vector<int>& w, int cap, int days) {
    int used = 1, load = 0;
    for (int x : w) {
        if (load + x > cap) used++, load = 0;
        load += x;
    }
    return used <= days;
}

int main() {
    std::vector<int> w = {3, 2, 2, 4, 1, 4};
    int lo = 4, hi = 16;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        std::cout << mid << " ";
        if (fits(w, mid, 3)) hi = mid;
        else lo = mid + 1;
    }
    std::cout << lo << "\\n";
}
`,
    "10 7 5 6 6",
  ),
  {
    skill: "binary-search-on-answer",
    rung: 5,
    title: "The slowest speed that finishes in time",
    promptMd: `Piles of \`piles[i]\` sweets must all be eaten within \`hours\` hours. Eating at speed s, you take one pile each hour and eat up to s sweets from it; a pile with sweets left takes more hours. Write \`long long minSpeed(const std::vector<int>& piles, long long hours)\` that returns the smallest speed that finishes in time. There is at least one pile, and \`hours\` is at least the number of piles. For \`{3, 6, 7, 11}\` and 8 hours that's 4. ${TASK} ${limits("up to 100,000 piles of up to 1,000,000,000 sweets")}`,
    functionSignature: "long long minSpeed(const std::vector<int>& piles, long long hours)",
    call: printCall("minSpeed"),
    generator: GEN,
    starterCode: `#include <vector>

long long minSpeed(const std::vector<int>& piles, long long hours) {
    return 0;
}
`,
    reference: `#include <vector>

long long minSpeed(const std::vector<int>& piles, long long hours) {
    auto finishes = [&](long long speed) {
        long long needed = 0;
        for (int p : piles) needed += (p + speed - 1) / speed;
        return needed <= hours;
    };
    long long lo = 1, hi = 1000000000;  // any speed above the biggest pile is no faster
    while (lo < hi) {  // the smallest speed that finishes: a faster one always finishes too
        long long mid = (lo + hi) / 2;
        if (finishes(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
`,
    bruteForce: `#include <vector>

long long minSpeed(const std::vector<int>& piles, long long hours) {
    for (long long speed = 1;; speed++) {  // try every speed in turn
        long long needed = 0;
        for (int p : piles) needed += (p + speed - 1) / speed;
        if (needed <= hours) return speed;
    }
}
`,
    cases: [
      { args: "{3, 6, 7, 11}, 8", expected: "4" },
      { args: "{30, 11, 23, 4, 20}, 5", expected: "30" },
      { args: "{30, 11, 23, 4, 20}, 6", expected: "23" },
      { args: "{1}, 1", expected: "1" },
      { args: "{9, 9, 9}, 4", expected: "9" },
      { args: "{5, 5}, 10", expected: "1" },
      { args: "gen::ints(713, 2000, 1, 1000), 3000" },
      { args: "gen::ints(714, 100000, 1, 1000000000), 200000" },
    ],
  },
];
