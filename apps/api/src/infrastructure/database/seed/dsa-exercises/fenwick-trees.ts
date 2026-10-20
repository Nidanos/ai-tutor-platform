import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, RANGE_OPS, showCall } from "./harness.js";

const drive = (driver: string) => (args: string) => `gen::show(gen::${driver}(${args}));`;
const POSITIONS = "Positions run from 1 to n, and every value starts at 0.";

const LOOPS = `    void add(int i, long long x) {
        for (; i < (int)t_.size(); i += i & -i) t_[i] += x;  // every block that contains i
    }
    long long prefix(int i) const {  // a[1] + ... + a[i]
        long long s = 0;
        for (; i > 0; i -= i & -i) s += t_[i];  // jump back one block at a time
        return s;
    }`;

// {1, i, x}: add x to a[i]; {2, l, r}: the sum of a[l..r].
const FENWICK_DRIVER = String.raw`
namespace gen {
std::vector<long long> driveFenwick(int n, const std::vector<std::array<int, 3>>& ops) {
    Fenwick f(n);
    std::vector<long long> out;
    for (auto [type, a, b] : ops) {
        if (type == 1) f.add(a, b);
        else out.push_back(f.prefix(b) - f.prefix(a - 1));
    }
    return out;
}
}  // namespace gen
`;

// {1, i, x}: set a[i] to x; {2, l, r}: the sum of a[l..r].
const VALUES_DRIVER = String.raw`
namespace gen {
std::vector<long long> driveValues(int n, const std::vector<std::array<int, 3>>& ops) {
    Values values(n);
    std::vector<long long> out;
    for (auto [type, a, b] : ops) {
        if (type == 1) values.set(a, b);
        else out.push_back(values.sum(a, b));
    }
    return out;
}
}  // namespace gen
`;

// {1, l, r, x}: add x to a[l..r]; {2, i, 0, 0}: the value of a[i].
const RANGES_DRIVER = String.raw`
namespace gen {
std::vector<long long> driveRanges(int n, const std::vector<std::array<int, 4>>& ops) {
    Ranges ranges(n);
    std::vector<long long> out;
    for (auto [type, a, b, c] : ops) {
        if (type == 1) ranges.addRange(a, b, c);
        else out.push_back(ranges.valueAt(a));
    }
    return out;
}
std::vector<std::array<int, 4>> rangeAddOps(std::uint64_t seed, int count, int n) {
    state = seed;
    std::vector<std::array<int, 4>> ops(count);
    for (auto& op : ops) {
        int a = 1 + (int)between(0, n - 1), b = 1 + (int)between(0, n - 1);
        op = between(0, 1) ? std::array<int, 4>{1, std::min(a, b), std::max(a, b), (int)between(-1000, 1000)}
                           : std::array<int, 4>{2, a, 0, 0};
    }
    return ops;
}
}  // namespace gen
`;

export const fenwickTrees: ExerciseTemplate[] = [
  predict(
    "fenwick-trees",
    "What does it print? A Fenwick tree's cells",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {3, 1, 4, 1, 5, 9, 2, 6};  // a[1..8]
    std::vector<int> t(9, 0);
    for (int pos = 1; pos <= 8; pos++)
        for (int i = pos; i <= 8; i += i & -i) t[i] += a[pos - 1];
    for (int i = 1; i <= 8; i++) std::cout << t[i] << " ";
    int sum = 0;
    for (int i = 7; i > 0; i -= i & -i) sum += t[i];
    std::cout << "\\n" << sum << "\\n";
}
`,
    "3 4 4 9 5 14 2 31\n25",
  ),
  {
    skill: "fenwick-trees",
    rung: 2,
    title: "Fix the prefix sum's walk",
    promptMd: `\`Fenwick\` keeps sums of blocks of a list a[1..n]: \`add(i, x)\` adds x to a[i], and \`prefix(i)\` should return a[1] + … + a[i]. \`prefix\` walks **upwards** through the cells, the way \`add\` does, so it reads the wrong blocks. **Find the fault and fix it.** ${POSITIONS} Each test runs adds and range sums, prefix(r) - prefix(l - 1), and prints the sums. ${limits("up to 1,000,000 positions and operations")}`,
    functionSignature: "class Fenwick { public: explicit Fenwick(int n); void add(int i, long long x); long long prefix(int i) const; };",
    call: drive("driveFenwick"),
    generator: GEN + FENWICK_DRIVER + RANGE_OPS,
    starterCode: `#include <vector>

class Fenwick {
public:
    explicit Fenwick(int n) : t_(n + 1, 0) {}
    void add(int i, long long x) {
        for (; i < (int)t_.size(); i += i & -i) t_[i] += x;
    }
    long long prefix(int i) const {
        long long s = 0;
        for (; i > 0 && i < (int)t_.size(); i += i & -i) s += t_[i];
        return s;
    }

private:
    std::vector<long long> t_;  // t_[i]: the sum of the (i & -i) values ending at position i
};
`,
    reference: `#include <vector>

class Fenwick {
public:
    explicit Fenwick(int n) : t_(n + 1, 0) {}
${LOOPS}

private:
    std::vector<long long> t_;  // t_[i]: the sum of the (i & -i) values ending at position i
};
`,
    bruteForce: `#include <vector>

class Fenwick {
public:
    explicit Fenwick(int n) : a_(n + 1, 0) {}
    void add(int i, long long x) { a_[i] += x; }
    long long prefix(int i) const {
        long long s = 0;
        for (int k = 1; k <= i; k++) s += a_[k];
        return s;
    }

private:
    std::vector<long long> a_;
};
`,
    cases: [
      { args: "5, {{1, 2, 7}, {1, 4, 3}, {2, 1, 4}, {2, 3, 5}, {1, 2, -2}, {2, 2, 2}}", expected: "10 3 5" },
      { args: "1, {{2, 1, 1}}", expected: "0" },
      { args: "3, {}", expected: "" },
      { args: "8, {{1, 8, 5}, {1, 1, 1}, {2, 1, 8}, {2, 2, 7}}", expected: "6 0" },
      { args: "2000, gen::rangeOps(391, 2000, 2000, 1, -1000000000, 1000000000)" },
      { args: "1000000, gen::rangeOps(392, 1000000, 1000000, 1, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "fenwick-trees",
    rung: 3,
    title: "Complete setting a value",
    promptMd: `\`Values\` keeps a list a[1..n] in a Fenwick tree, and \`sum(l, r)\` returns a[l] + … + a[r]. The tree can only **add** to a position, so \`set(i, x)\`, which should make a[i] equal x, has to add the difference between x and a[i]'s current value. It keeps a plain copy of the values, \`a_\`, for exactly that. **Complete \`set\`.** ${POSITIONS} Each test runs sets and sums, and prints the sums. ${limits("up to 1,000,000 positions and operations")}`,
    functionSignature: "class Values { public: explicit Values(int n); void set(int i, long long x); long long sum(int l, int r) const; };",
    call: drive("driveValues"),
    generator: GEN + VALUES_DRIVER + RANGE_OPS,
    starterCode: `#include <vector>

class Values {
public:
    explicit Values(int n) : a_(n + 1, 0), t_(n + 1, 0) {}
    void set(int i, long long x) {
        // TODO: make a[i] equal x, through add, and keep a_ up to date
    }
    long long sum(int l, int r) const { return prefix(r) - prefix(l - 1); }

private:
    std::vector<long long> a_, t_;  // the plain values, and the Fenwick tree's cells
${LOOPS}
};
`,
    reference: `#include <vector>

class Values {
public:
    explicit Values(int n) : a_(n + 1, 0), t_(n + 1, 0) {}
    void set(int i, long long x) {
        add(i, x - a_[i]);  // the tree only adds: add the change
        a_[i] = x;
    }
    long long sum(int l, int r) const { return prefix(r) - prefix(l - 1); }

private:
    std::vector<long long> a_, t_;  // the plain values, and the Fenwick tree's cells
${LOOPS}
};
`,
    bruteForce: `#include <vector>

class Values {
public:
    explicit Values(int n) : a_(n + 1, 0) {}
    void set(int i, long long x) { a_[i] = x; }
    long long sum(int l, int r) const {
        long long s = 0;
        for (int k = l; k <= r; k++) s += a_[k];
        return s;
    }

private:
    std::vector<long long> a_;
};
`,
    cases: [
      { args: "5, {{1, 2, 7}, {1, 2, 4}, {2, 1, 5}, {1, 5, 1}, {2, 2, 5}, {2, 3, 4}}", expected: "4 5 0" },
      { args: "3, {{2, 1, 3}}", expected: "0" },
      { args: "2, {{1, 1, -5}, {1, 1, -5}, {2, 1, 2}}", expected: "-5" },
      { args: "2000, gen::rangeOps(393, 2000, 2000, 1, -1000000000, 1000000000)" },
      { args: "1000000, gen::rangeOps(394, 1000000, 1000000, 1, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "fenwick-trees",
    rung: 4,
    title: "Extend to adding over a whole range",
    promptMd: `\`Ranges\` should support \`addRange(l, r, x)\`, which adds x to every value from a[l] to a[r], and \`valueAt(i)\`, which returns a[i]. So far addRange only adds x at position l. **Extend it** with a difference array kept in the Fenwick tree: add x at l and -x just after r. Then a[i] is the prefix sum up to i. ${POSITIONS} Each test runs range adds and lookups, and prints the values looked up. ${limits("up to 1,000,000 positions and operations")}`,
    functionSignature: "class Ranges { public: explicit Ranges(int n); void addRange(int l, int r, long long x); long long valueAt(int i) const; };",
    call: drive("driveRanges"),
    generator: GEN + RANGES_DRIVER,
    starterCode: `#include <vector>

class Ranges {
public:
    explicit Ranges(int n) : t_(n + 2, 0) {}
    void addRange(int l, int r, long long x) { add(l, x); add(l + 1, -x); }  // so far: position l only
    long long valueAt(int i) const { return prefix(i); }

private:
    std::vector<long long> t_;  // a Fenwick tree over the differences a[i] - a[i - 1]
${LOOPS}
};
`,
    reference: `#include <vector>

class Ranges {
public:
    explicit Ranges(int n) : t_(n + 2, 0) {}
    void addRange(int l, int r, long long x) { add(l, x), add(r + 1, -x); }  // the difference rises at l and falls after r
    long long valueAt(int i) const { return prefix(i); }

private:
    std::vector<long long> t_;  // a Fenwick tree over the differences a[i] - a[i - 1]
${LOOPS}
};
`,
    bruteForce: `#include <vector>

class Ranges {
public:
    explicit Ranges(int n) : a_(n + 1, 0) {}
    void addRange(int l, int r, long long x) {
        for (int k = l; k <= r; k++) a_[k] += x;
    }
    long long valueAt(int i) const { return a_[i]; }

private:
    std::vector<long long> a_;
};
`,
    cases: [
      { args: "5, {{1, 2, 4, 10}, {2, 1, 0, 0}, {2, 3, 0, 0}, {1, 1, 5, 1}, {2, 4, 0, 0}, {2, 5, 0, 0}}", expected: "0 10 11 1" },
      { args: "1, {{2, 1, 0, 0}}", expected: "0" },
      { args: "3, {{1, 3, 3, -4}, {2, 3, 0, 0}, {2, 2, 0, 0}}", expected: "-4 0" },
      { args: "2000, gen::rangeAddOps(395, 2000, 2000)" },
      { args: "1000000, gen::rangeAddOps(396, 1000000, 1000000)" },
    ],
  },
  {
    skill: "fenwick-trees",
    rung: 5,
    title: "Distinct values in each range",
    promptMd: `\`distinctInRanges(v, queries)\` returns, for each query (l, r) with positions from 0, how many **different** values appear in v[l..r]. For \`{1, 2, 1, 3, 2}\` and (1, 4) it's 3. Hint: answer the queries offline, sorted by r. Walk through v, and keep a 1 in a Fenwick tree only at the **last** position seen of each value. Then the count for (l, r) is the sum over l..r once the walk reaches r. ${TASK} ${limits("up to 200,000 values and 200,000 queries")}`,
    functionSignature: "std::vector<int> distinctInRanges(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries)",
    call: showCall("distinctInRanges"),
    generator: GEN,
    starterCode: `#include <utility>
#include <vector>

std::vector<int> distinctInRanges(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries) {
    return std::vector<int>(queries.size(), 0);
}
`,
    reference: `#include <algorithm>
#include <numeric>
#include <unordered_map>
#include <utility>
#include <vector>

std::vector<int> distinctInRanges(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries) {
    int n = v.size();
    std::vector<int> t(n + 1, 0);  // a Fenwick tree over positions 1..n
    auto add = [&](int i, int x) { for (; i <= n; i += i & -i) t[i] += x; };
    auto prefix = [&](int i) { int s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; };
    std::vector<int> order(queries.size());
    std::iota(order.begin(), order.end(), 0);
    std::sort(order.begin(), order.end(), [&](int a, int b) { return queries[a].second < queries[b].second; });
    std::unordered_map<int, int> last;  // value -> its last position so far
    std::vector<int> answers(queries.size());
    std::size_t next = 0;
    for (int i = 0; i < n; i++) {
        auto it = last.find(v[i]);
        if (it != last.end()) add(it->second + 1, -1);  // only the newest copy of each value counts
        add(i + 1, 1);
        last[v[i]] = i;
        for (; next < order.size() && queries[order[next]].second == i; next++)
            answers[order[next]] = prefix(i + 1) - prefix(queries[order[next]].first);
    }
    return answers;
}
`,
    bruteForce: `#include <unordered_set>
#include <utility>
#include <vector>

std::vector<int> distinctInRanges(const std::vector<int>& v, const std::vector<std::pair<int, int>>& queries) {
    std::vector<int> answers;
    for (auto [l, r] : queries) {
        std::unordered_set<int> seen(v.begin() + l, v.begin() + r + 1);
        answers.push_back(seen.size());
    }
    return answers;
}
`,
    cases: [
      { args: "{1, 2, 1, 3, 2}, {{0, 2}, {1, 4}, {2, 2}, {0, 4}}", expected: "2 3 1 3" },
      { args: "{5}, {{0, 0}}", expected: "1" },
      { args: "{7, 7, 7}, {{0, 2}, {1, 2}}", expected: "1 1" },
      { args: "{}, {}", expected: "" },
      { args: "gen::ints(397, 2000, 1, 300), gen::ranges(398, 2000, 2000)" },
      { args: "gen::ints(399, 200000, 1, 1000000), gen::ranges(400, 200000, 200000)" },
    ],
  },
];
