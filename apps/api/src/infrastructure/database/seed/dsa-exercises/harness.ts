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

export const LIST_NODE = "struct ListNode {  // keep this as it is: the tests build lists from it\n    int value;\n    ListNode* next;\n};";

// Each test prints the vector the learner's function returns.
export const showCall = (fn: string) => (args: string) => `gen::show(${fn}(${args}));`;

// What every speed-tested task tells the learner about its limits.
export const limits = (n: string) => `Hidden tests include large inputs (${n}), and each test must finish within 2 seconds.`;
