// Shared C++ for the DSA harnesses (ADR-0020), placed after the learner's code so its names can't clash.
// gen:: builds seeded inputs with its own generator (splitmix64), so generated data never depends on
// the standard library's random distributions. show() prints a short vector in full, a long one as a checksum.
export const GEN = String.raw`#include <algorithm>
#include <array>
#include <cstdint>
#include <utility>
#include <vector>

namespace gen {
std::uint64_t state = 0;
std::uint64_t next() {
    std::uint64_t z = (state += 0x9E3779B97F4A7C15ULL);
    z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ULL;
    z = (z ^ (z >> 27)) * 0x94D049BB133111EBULL;
    return z ^ (z >> 31);
}
long long between(long long lo, long long hi) { return lo + (long long)(next() % (std::uint64_t)(hi - lo + 1)); }
// n whole numbers from lo to hi: the same list every time for the same seed.
std::vector<int> ints(std::uint64_t seed, int n, int lo, int hi) {
    state = seed;
    std::vector<int> v(n);
    for (int& x : v) x = (int)between(lo, hi);
    return v;
}
std::vector<int> sortedInts(std::uint64_t seed, int n, int lo, int hi) {
    std::vector<int> v = ints(seed, n, lo, hi);
    std::sort(v.begin(), v.end());
    return v;
}
// 1, 2, ..., n in a shuffled order.
std::vector<int> permutation(std::uint64_t seed, int n) {
    state = seed;
    std::vector<int> v(n);
    for (int i = 0; i < n; i++) v[i] = i + 1;
    for (int i = n - 1; i > 0; i--) std::swap(v[i], v[between(0, i)]);
    return v;
}
// q ranges (l, r) with 0 <= l <= r < n.
std::vector<std::pair<int, int>> ranges(std::uint64_t seed, int q, int n) {
    state = seed;
    std::vector<std::pair<int, int>> out(q);
    for (auto& [l, r] : out) {
        int a = (int)between(0, n - 1), b = (int)between(0, n - 1);
        l = std::min(a, b), r = std::max(a, b);
    }
    return out;
}
// m intervals {l, r, w} inside 0..n-1, with weights from 1 to wmax.
std::vector<std::array<int, 3>> weighted(std::uint64_t seed, int m, int n, int wmax) {
    std::vector<std::array<int, 3>> out;
    for (auto [l, r] : ranges(seed, m, n)) out.push_back({l, r, (int)between(1, wmax)});
    return out;
}
template <class T> void show(const std::vector<T>& v) {
    if (v.size() <= 20) {
        for (std::size_t i = 0; i < v.size(); i++) std::cout << (i ? " " : "") << v[i];
        std::cout << "\n";
        return;
    }
    std::uint64_t h = 1469598103934665603ULL;
    for (const T& x : v) h = (h ^ (std::uint64_t)(long long)x) * 1099511628211ULL;
    std::cout << "size " << v.size() << ", hash " << h << "\n";
}
void showText(const std::string& s) {
    if (s.size() <= 60) {
        std::cout << s << "\n";
        return;
    }
    std::uint64_t h = 1469598103934665603ULL;
    for (char c : s) h = (h ^ (unsigned char)c) * 1099511628211ULL;
    std::cout << "length " << s.size() << ", hash " << h << "\n";
}
}  // namespace gen
`;

// Lists for exercises whose starter defines \`struct ListNode { int value; ListNode* next; };\`.
export const LIST = String.raw`
namespace gen {
ListNode* list(const std::vector<int>& v) {
    ListNode* head = nullptr;
    for (auto it = v.rbegin(); it != v.rend(); ++it) head = new ListNode{*it, head};
    return head;
}
// The list with its last node linked back to the node at position loopTo (0-based); -1 for no loop.
ListNode* cyclic(const std::vector<int>& v, int loopTo) {
    ListNode* head = list(v);
    if (loopTo < 0 || !head) return head;
    ListNode *tail = head, *target = head;
    while (tail->next) tail = tail->next;
    for (int i = 0; i < loopTo; i++) target = target->next;
    tail->next = target;
    return head;
}
void showList(const ListNode* p) {  // stops after 3,000,000 nodes, in case of a loop
    std::vector<int> values;
    for (; p && values.size() < 3000000; p = p->next) values.push_back(p->value);
    show(values);
}
// Calls f with the values turned into a list, then the other arguments.
template <class F, class... Rest> auto withList(F f, const std::vector<int>& v, Rest... rest) { return f(list(v), rest...); }
}  // namespace gen
`;

// Trees for exercises whose starter defines TREE_NODE. A test gives a tree in level order, with X for a
// missing child: {1, 2, 3, X, 4} is 1 with children 2 and 3, and 4 as the right child of 2.
export const TREE = String.raw`
#include <climits>
#include <queue>

const int X = INT_MIN;  // a missing child in a level-order list

namespace gen {
TreeNode* node(int v) { return new TreeNode{v, nullptr, nullptr}; }
TreeNode* tree(const std::vector<int>& v) {
    if (v.empty() || v[0] == X) return nullptr;
    TreeNode* root = node(v[0]);
    std::queue<TreeNode*> q;
    q.push(root);
    for (std::size_t i = 1; !q.empty() && i < v.size(); i += 2) {
        TreeNode* n = q.front();
        q.pop();
        if (v[i] != X) q.push(n->left = node(v[i]));
        if (i + 1 < v.size() && v[i + 1] != X) q.push(n->right = node(v[i + 1]));
    }
    return root;
}
std::vector<int> levelOrder(const TreeNode* root) {  // X for missing children, none at the end
    std::vector<int> out;
    std::queue<const TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        const TreeNode* n = q.front();
        q.pop();
        out.push_back(n ? n->value : X);
        if (n) q.push(n->left), q.push(n->right);
    }
    while (!out.empty() && out.back() == X) out.pop_back();
    return out;
}
void showTree(const TreeNode* root) {
    std::vector<int> v = levelOrder(root);
    if (v.size() > 30) return show(v);
    for (std::size_t i = 0; i < v.size(); i++) std::cout << (i ? " " : "") << (v[i] == X ? std::string("x") : std::to_string(v[i]));
    std::cout << "\n";
}
// n nodes, each hung from the first free spot of a random walk down: about log n deep on average.
TreeNode* randomTree(std::uint64_t seed, int n, int lo, int hi) {
    state = seed;
    TreeNode* root = n > 0 ? node((int)between(lo, hi)) : nullptr;
    for (int i = 1; i < n; i++)
        for (TreeNode* p = root;;) {
            TreeNode*& child = next() & 1 ? p->left : p->right;
            if (!child) {
                child = node((int)between(lo, hi));
                break;
            }
            p = child;
        }
    return root;
}
// A path of n nodes going right, or left, the deepest tree there is.
TreeNode* chainTree(std::uint64_t seed, int n, int lo, int hi, bool goLeft = false) {
    state = seed;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; i++) {
        TreeNode* top = node((int)between(lo, hi));
        (goLeft ? top->left : top->right) = root;
        root = top;
    }
    return root;
}
// A binary search tree of the distinct values among n random ones, inserted in random order.
TreeNode* bstOf(std::uint64_t seed, int n, int lo, int hi) {
    TreeNode* root = nullptr;
    for (int x : ints(seed, n, lo, hi)) {
        TreeNode** at = &root;
        while (*at && (*at)->value != x) at = x < (*at)->value ? &(*at)->left : &(*at)->right;
        if (!*at) *at = node(x);
    }
    return root;
}
// Calls f with the tree built from a level-order list, or with a tree already built, then the other arguments.
template <class F, class... Rest> auto withTree(F f, const std::vector<int>& v, Rest... rest) { return f(tree(v), rest...); }
template <class F, class... Rest> auto withTree(F f, TreeNode* t, Rest... rest) { return f(t, rest...); }
// A braced list like {5, 8} can't be deduced through Rest, so the common second arguments get their own.
template <class F> auto withTree(F f, const std::vector<int>& v, const std::vector<int>& w) { return f(tree(v), w); }
template <class F> auto withTree(F f, const std::vector<int>& v, const std::vector<std::pair<int, int>>& w) { return f(tree(v), w); }
template <class F> auto withTree(F f, TreeNode* t, const std::vector<int>& w) { return f(t, w); }
template <class F> auto withTree(F f, TreeNode* t, const std::vector<std::pair<int, int>>& w) { return f(t, w); }
}  // namespace gen
`;

export const TREE_NODE = "struct TreeNode {  // keep this as it is: the tests build trees from it\n    int value;\n    TreeNode* left;\n    TreeNode* right;\n};";

export const LIST_NODE ="struct ListNode {  // keep this as it is: the tests build lists from it\n    int value;\n    ListNode* next;\n};";

// Random operations on positions first..first+n-1: {1, position, value} updates and {2, l, r} range queries.
export const RANGE_OPS = String.raw`
namespace gen {
std::vector<std::array<int, 3>> rangeOps(std::uint64_t seed, int count, int n, int first, int lo, int hi) {
    state = seed;
    std::vector<std::array<int, 3>> ops(count);
    for (auto& op : ops) {
        int a = first + (int)between(0, n - 1), b = first + (int)between(0, n - 1);
        op = between(0, 1) ? std::array<int, 3>{1, a, (int)between(lo, hi)} : std::array<int, 3>{2, std::min(a, b), std::max(a, b)};
    }
    return ops;
}
}  // namespace gen
`;

// Graphs on vertices 0..n-1, and grids of '.' and '#'.
export const GRAPH = String.raw`
#include <string>

namespace gen {
// m random edges {u, v} with u != v; the same pair can come up more than once.
std::vector<std::pair<int, int>> edges(std::uint64_t seed, int n, int m) {
    state = seed;
    std::vector<std::pair<int, int>> out(m);
    for (auto& [u, v] : out) {
        u = (int)between(0, n - 1);
        do v = (int)between(0, n - 1);
        while (v == u);
    }
    return out;
}
// The same, each with a weight from 1 to wmax: {u, v, w}.
std::vector<std::array<int, 3>> weightedEdges(std::uint64_t seed, int n, int m, int wmax) {
    std::vector<std::array<int, 3>> out;
    for (auto [u, v] : edges(seed, n, m)) out.push_back({u, v, (int)between(1, wmax)});
    return out;
}
// A connected graph of m weighted edges: a random tree joining all n vertices, then random extra edges.
std::vector<std::array<int, 3>> connected(std::uint64_t seed, int n, int m, int wmax) {
    std::vector<int> order = permutation(seed, n);
    std::vector<std::array<int, 3>> out;
    for (int i = 1; i < n; i++) out.push_back({order[i] - 1, order[between(0, i - 1)] - 1, (int)between(1, wmax)});
    for (auto e : weightedEdges(seed + 1, n, m - (n - 1), wmax)) out.push_back(e);
    return out;
}
// m edges that only go forward in a hidden order of the vertices, each at most reach places ahead:
// no cycles, and long paths.
std::vector<std::pair<int, int>> dag(std::uint64_t seed, int n, int m, int reach) {
    std::vector<int> order = permutation(seed, n);
    std::vector<std::pair<int, int>> out(m);
    for (auto& [u, v] : out) {
        int a = (int)between(0, n - 2), b = (int)std::min<long long>(n - 1, a + between(1, reach));
        u = order[a] - 1, v = order[b] - 1;
    }
    return out;
}
// The edges plus one of them reversed: in a DAG, that closes a cycle.
std::vector<std::pair<int, int>> plusBack(std::vector<std::pair<int, int>> e) {
    auto [u, v] = e[e.size() / 2];
    e.push_back({v, u});
    return e;
}
// rows lines of cols cells, each '#' with the given percent chance and '.' otherwise.
std::vector<std::string> grid(std::uint64_t seed, int rows, int cols, int percent) {
    state = seed;
    std::vector<std::string> out(rows, std::string(cols, '.'));
    for (auto& line : out)
        for (char& cell : line) cell = between(1, 100) <= percent ? '#' : '.';
    return out;
}
}  // namespace gen
`;

// Each test prints the vector the learner's function returns.
export const showCall = (fn: string) => (args: string) => `gen::show(${fn}(${args}));`;
// Each test prints yes or no for the bool the learner's function returns.
export const yesNoCall = (fn: string) => (args: string) => `std::cout << (${fn}(${args}) ? "yes" : "no") << "\\n";`;

// What every speed-tested task tells the learner about its limits.
export const limits = (n: string) => `Hidden tests include large inputs (${n}), and each test must finish within 2 seconds.`;
