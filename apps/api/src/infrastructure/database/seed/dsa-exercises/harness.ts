// Shared C++ for the DSA harnesses (ADR-0020), placed after the learner's code so its names can't clash.
// gen:: builds seeded inputs with its own generator (splitmix64), so generated data never depends on
// the standard library's random distributions. show() prints a short vector in full, a long one as a checksum.
export const GEN = String.raw`#include <cstdint>
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
}  // namespace gen
`;

// Each test prints the vector the learner's function returns.
export const showCall = (fn: string) => (args: string) => `gen::show(${fn}(${args}));`;

// What every speed-tested task tells the learner about its limits.
export const limits = (n: string) => `Hidden tests include large inputs (${n}), and each test must finish within 2 seconds.`;
