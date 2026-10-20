import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, RANGE_OPS } from "./harness.js";

const drive = (driver: string) => (args: string) => `gen::show(gen::${driver}(${args}));`;
const POSITIONS = "Positions run from 0 to n - 1, and every value starts at 0.";

// {1, i, x}: set a[i] to x; {2, l, r}: the tree's answer for a[l..r].
const driver = (cls: string, fn: string) => String.raw`
namespace gen {
std::vector<long long> drive${cls}(int n, const std::vector<std::array<int, 3>>& ops) {
    ${cls} tree(n);
    std::vector<long long> out;
    for (auto [type, a, b] : ops) {
        if (type == 1) tree.set(a, b);
        else out.push_back(tree.${fn}(a, b));
    }
    return out;
}
}  // namespace gen
`;

// {1, i, x}: set a[i] to x; {2, l, x}: the first position from l whose value is at least x.
// When rare is set, big values (above hi / 2) are rare and every search looks for one, so answers lie far apart.
const SEARCH = String.raw`
namespace gen {
std::vector<std::array<int, 3>> searchOps(std::uint64_t seed, int count, int n, int hi, bool rare = false) {
    state = seed;
    std::vector<std::array<int, 3>> ops(count);
    for (auto& op : ops) {
        int type = (int)between(1, 2), at = (int)between(0, n - 1);
        int value = !rare ? (int)between(0, hi) : type == 2 ? (int)between(hi / 2, hi) : between(0, 9999) == 0 ? (int)between(hi / 2, hi) : (int)between(0, hi / 2 - 1);
        op = {type, at, value};
    }
    return ops;
}
}  // namespace gen
`;

// {1, l, r, x}: add x to a[l..r]; {2, l, r, 0}: the smallest of a[l..r].
const LAZY = String.raw`
namespace gen {
std::vector<long long> driveLazy(int n, const std::vector<std::array<int, 4>>& ops) {
    LazyMin tree(n);
    std::vector<long long> out;
    for (auto [type, l, r, x] : ops) {
        if (type == 1) tree.add(l, r, x);
        else out.push_back(tree.minimum(l, r));
    }
    return out;
}
std::vector<std::array<int, 4>> lazyOps(std::uint64_t seed, int count, int n) {
    state = seed;
    std::vector<std::array<int, 4>> ops(count);
    for (auto& op : ops) {
        int a = (int)between(0, n - 1), b = (int)between(0, n - 1);
        op = {(int)between(1, 2), std::min(a, b), std::max(a, b), (int)between(-1000, 1000)};
    }
    return ops;
}
}  // namespace gen
`;

const MAX_TREE = (noOverlap: string, extra = "") => `#include <algorithm>
#include <climits>
#include <vector>

class MaxTree {
public:
    explicit MaxTree(int n) : n_(n), t_(4 * n, 0) {}
    void set(int i, int x) { set(1, 0, n_ - 1, i, x); }
    long long query(int l, int r) const { return query(1, 0, n_ - 1, l, r); }  // the largest of a[l..r]
${extra}
private:
    int n_;
    std::vector<int> t_;  // node v covers lo..hi; its children are 2v and 2v + 1
    void set(int v, int lo, int hi, int i, int x) {
        if (lo == hi) {
            t_[v] = x;
            return;
        }
        int mid = (lo + hi) / 2;
        if (i <= mid) set(2 * v, lo, mid, i, x);
        else set(2 * v + 1, mid + 1, hi, i, x);
        t_[v] = std::max(t_[2 * v], t_[2 * v + 1]);
    }
    int query(int v, int lo, int hi, int l, int r) const {
        if (${noOverlap}) return INT_MIN;  // no overlap with l..r
        if (l <= lo && hi <= r) return t_[v];
        int mid = (lo + hi) / 2;
        return std::max(query(2 * v, lo, mid, l, r), query(2 * v + 1, mid + 1, hi, l, r));
    }
};
`;

const MIN_TREE = (update: string) => `#include <algorithm>
#include <climits>
#include <vector>

class MinTree {
public:
    explicit MinTree(int n) : n_(n), t_(2 * n, 0) {}  // leaves at t_[n..2n-1]; node i combines 2i and 2i + 1
    void set(int i, int x) {
        int at = n_ + i;
        t_[at] = x;
${update}
    }
    long long query(int l, int r) const {  // the smallest of a[l..r]
        int best = INT_MAX;
        for (l += n_, r += n_ + 1; l < r; l /= 2, r /= 2) {
            if (l & 1) best = std::min(best, t_[l++]);
            if (r & 1) best = std::min(best, t_[--r]);
        }
        return best;
    }

private:
    int n_;
    std::vector<int> t_;
};
`;

const plainArray = (cls: string, fn: string, combine: string) => `#include <algorithm>
#include <vector>

class ${cls} {
public:
    explicit ${cls}(int n) : a_(n, 0) {}
    void set(int i, int x) { a_[i] = x; }
    long long ${fn}(int l, int r) const {
        int best = a_[l];
        for (int k = l; k <= r; k++) best = std::${combine}(best, a_[k]);
        return best;
    }

private:
    std::vector<int> a_;
};
`;

export const segmentTrees: ExerciseTemplate[] = [
  predict(
    "segment-trees",
    "What does it print? A bottom-up sum tree",
    `#include <iostream>
#include <vector>

int main() {
    int n = 4;
    std::vector<int> a = {5, 3, 8, 1}, t(2 * n);
    for (int i = 0; i < n; i++) t[n + i] = a[i];
    for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];
    for (int i = 1; i < 2 * n; i++) std::cout << t[i] << " ";
    int sum = 0;
    for (int l = 1 + n, r = 3 + n; l < r; l /= 2, r /= 2) {
        if (l & 1) sum += t[l++];
        if (r & 1) sum += t[--r];
    }
    std::cout << "\\n" << sum << "\\n";
}
`,
    "17 8 9 5 3 8 1\n11",
  ),
  {
    skill: "segment-trees",
    rung: 2,
    title: "Fix the range maximum",
    promptMd: `\`MaxTree\` keeps a list in a segment tree: \`set(i, x)\` changes a[i], and \`query(l, r)\` returns the largest of a[l..r]. A node covering lo..hi that doesn't overlap l..r is skipped. But the test for "doesn't overlap" also skips a node that **ends exactly at l**, so position l is missed. **Find the fault and fix it.** ${POSITIONS} Each test runs sets and queries, and prints what the queries return. ${limits("up to 1,000,000 positions and operations")}`,
    functionSignature: "class MaxTree { public: explicit MaxTree(int n); void set(int i, int x); long long query(int l, int r) const; };",
    call: drive("driveMaxTree"),
    generator: GEN + driver("MaxTree", "query") + RANGE_OPS,
    starterCode: MAX_TREE("r < lo || hi <= l"),
    reference: MAX_TREE("r < lo || hi < l"),
    bruteForce: plainArray("MaxTree", "query", "max"),
    cases: [
      { args: "4, {{1, 0, 5}, {1, 1, 9}, {1, 3, 2}, {2, 1, 3}, {2, 0, 0}, {2, 2, 3}}", expected: "9 5 2" },
      { args: "1, {{2, 0, 0}}", expected: "0" },
      { args: "5, {{1, 4, -3}, {2, 4, 4}, {2, 0, 4}}", expected: "-3 0" },
      { args: "2, {}", expected: "" },
      { args: "2000, gen::rangeOps(401, 2000, 2000, 0, -1000000000, 1000000000)" },
      { args: "1000000, gen::rangeOps(402, 1000000, 1000000, 0, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "segment-trees",
    rung: 3,
    title: "Complete the minimum tree's update",
    promptMd: `\`MinTree\` is a bottom-up segment tree. The values sit in the leaves \`t_[n..2n-1]\`, and node i holds the smaller of its children 2i and 2i + 1. \`query(l, r)\` returns the smallest of a[l..r]. \`set(i, x)\` changes the leaf, but every node above it still holds an old minimum. **Complete \`set\`** by recomputing each parent on the way up to the root: a node's sibling is \`i ^ 1\`. ${POSITIONS} Each test runs sets and queries, and prints what the queries return. ${limits("up to 1,000,000 positions and operations")}`,
    functionSignature: "class MinTree { public: explicit MinTree(int n); void set(int i, int x); long long query(int l, int r) const; };",
    call: drive("driveMinTree"),
    generator: GEN + driver("MinTree", "query") + RANGE_OPS,
    starterCode: MIN_TREE("        // TODO: recompute every parent of at, up to the root"),
    reference: MIN_TREE("        for (; at > 1; at /= 2) t_[at / 2] = std::min(t_[at], t_[at ^ 1]);  // the parent from both children"),
    bruteForce: plainArray("MinTree", "query", "min"),
    cases: [
      { args: "4, {{1, 2, -5}, {2, 0, 3}, {1, 2, 7}, {2, 1, 3}, {1, 0, -1}, {2, 0, 0}}", expected: "-5 0 -1" },
      { args: "1, {{1, 0, 4}, {2, 0, 0}}", expected: "4" },
      { args: "3, {{2, 0, 2}}", expected: "0" },
      { args: "2000, gen::rangeOps(403, 2000, 2000, 0, -1000000000, 1000000000)" },
      { args: "1000000, gen::rangeOps(404, 1000000, 1000000, 0, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "segment-trees",
    rung: 4,
    title: "Extend the maximum tree to a search",
    promptMd: `\`MaxTree\` answers range maximums. **Extend it** with \`firstAtLeast(l, x)\`: the first position at or after l whose value is **at least x**, or -1 if there's none. A node's maximum tells you at once whether its range holds such a value. So go down into the left child when it can, and into the right child otherwise, skipping every node that ends before l. ${POSITIONS} Each test runs sets and searches, and prints what the searches return. ${limits("up to 1,000,000 positions and operations")}`,
    functionSignature: "class MaxTree { public: explicit MaxTree(int n); void set(int i, int x); long long firstAtLeast(int l, int x) const; };",
    call: drive("driveMaxTree"),
    generator: GEN + driver("MaxTree", "firstAtLeast") + SEARCH,
    starterCode: MAX_TREE("r < lo || hi < l", "    long long firstAtLeast(int l, int x) const { return -1; }  // TODO\n"),
    reference: MAX_TREE(
      "r < lo || hi < l",
      `    long long firstAtLeast(int l, int x) const { return first(1, 0, n_ - 1, l, x); }

private:
    int first(int v, int lo, int hi, int l, int x) const {
        if (hi < l || t_[v] < x) return -1;  // ends before l, or nothing here is big enough
        if (lo == hi) return lo;
        int mid = (lo + hi) / 2;
        int left = first(2 * v, lo, mid, l, x);
        return left != -1 ? left : first(2 * v + 1, mid + 1, hi, l, x);
    }

public:
`,
    ),
    bruteForce: `#include <vector>

class MaxTree {
public:
    explicit MaxTree(int n) : a_(n, 0) {}
    void set(int i, int x) { a_[i] = x; }
    long long firstAtLeast(int l, int x) const {
        for (int k = l; k < (int)a_.size(); k++)
            if (a_[k] >= x) return k;
        return -1;
    }

private:
    std::vector<int> a_;
};
`,
    cases: [
      { args: "5, {{1, 1, 4}, {1, 3, 9}, {2, 0, 5}, {2, 2, 4}, {2, 4, 1}, {2, 0, 10}}", expected: "3 3 -1 -1" },
      { args: "1, {{2, 0, 0}}", expected: "0" },
      { args: "3, {{1, 0, 7}, {2, 1, 7}, {2, 0, 7}}", expected: "-1 0" },
      { args: "2000, gen::searchOps(405, 2000, 2000, 1000)" },
      { args: "1000000, gen::searchOps(406, 1000000, 1000000, 1000000, true)" },
    ],
  },
  {
    skill: "segment-trees",
    rung: 5,
    title: "Range add with range minimum",
    promptMd: `\`LazyMin\` keeps a list where \`add(l, r, x)\` adds x to every value of a[l..r], and \`minimum(l, r)\` returns the smallest of a[l..r]. Both run in O(log n). When an add covers a node's whole range, change that node's minimum and leave a **tag** for its children. Push the tag down only when a later call has to go below that node. ${POSITIONS} Each test runs adds and queries, and prints what the queries return. ${TASK} ${limits("up to 200,000 positions and operations")}`,
    functionSignature: "class LazyMin { public: explicit LazyMin(int n); void add(int l, int r, long long x); long long minimum(int l, int r); };",
    call: drive("driveLazy"),
    generator: GEN + LAZY,
    starterCode: `class LazyMin {
public:
    explicit LazyMin(int n) {}
    void add(int l, int r, long long x) {}
    long long minimum(int l, int r) { return 0; }
};
`,
    reference: `#include <algorithm>
#include <climits>
#include <vector>

class LazyMin {
public:
    explicit LazyMin(int n) : n_(n), min_(4 * n, 0), tag_(4 * n, 0) {}
    void add(int l, int r, long long x) { add(1, 0, n_ - 1, l, r, x); }
    long long minimum(int l, int r) { return minimum(1, 0, n_ - 1, l, r); }

private:
    int n_;
    std::vector<long long> min_, tag_;  // tag_[v]: still to be added to v's children
    void apply(int v, long long x) { min_[v] += x, tag_[v] += x; }
    void push(int v) {
        apply(2 * v, tag_[v]), apply(2 * v + 1, tag_[v]);
        tag_[v] = 0;
    }
    void add(int v, int lo, int hi, int l, int r, long long x) {
        if (r < lo || hi < l) return;
        if (l <= lo && hi <= r) return apply(v, x);  // covered: fix this node, tag its children
        push(v);
        int mid = (lo + hi) / 2;
        add(2 * v, lo, mid, l, r, x), add(2 * v + 1, mid + 1, hi, l, r, x);
        min_[v] = std::min(min_[2 * v], min_[2 * v + 1]);
    }
    long long minimum(int v, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return LLONG_MAX;
        if (l <= lo && hi <= r) return min_[v];
        push(v);
        int mid = (lo + hi) / 2;
        return std::min(minimum(2 * v, lo, mid, l, r), minimum(2 * v + 1, mid + 1, hi, l, r));
    }
};
`,
    bruteForce: `#include <algorithm>
#include <vector>

class LazyMin {
public:
    explicit LazyMin(int n) : a_(n, 0) {}
    void add(int l, int r, long long x) {
        for (int k = l; k <= r; k++) a_[k] += x;
    }
    long long minimum(int l, int r) {
        long long best = a_[l];
        for (int k = l; k <= r; k++) best = std::min(best, a_[k]);
        return best;
    }

private:
    std::vector<long long> a_;
};
`,
    cases: [
      { args: "5, {{1, 0, 2, 3}, {2, 0, 4, 0}, {2, 0, 2, 0}, {1, 1, 4, -5}, {2, 0, 4, 0}, {2, 0, 0, 0}}", expected: "0 3 -5 3" },
      { args: "1, {{1, 0, 0, 7}, {2, 0, 0, 0}}", expected: "7" },
      { args: "3, {}", expected: "" },
      { args: "2000, gen::lazyOps(407, 2000, 2000)" },
      { args: "200000, gen::lazyOps(408, 200000, 200000)" },
    ],
  },
];
