import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

const POW_MOD = `const long long MOD = 1000000007;  // a prime

long long powMod(long long base, long long exp) {
    long long result = 1;
    base %= MOD;
    for (; exp > 0; exp /= 2, base = base * base % MOD)
        if (exp % 2 == 1) result = result * base % MOD;
    return result;
}`;

// Primes picked at random from lo..hi: the slowest numbers for trial division.
const PRIMES = String.raw`
namespace gen {
std::vector<int> primesBetween(std::uint64_t seed, int count, int lo, int hi) {
    std::vector<bool> composite(hi + 1, false);
    std::vector<int> primes;
    for (int n = 2; n <= hi; n++) {
        if (composite[n]) continue;
        if (n >= lo) primes.push_back(n);
        for (long long m = (long long)n * n; m <= hi; m += n) composite[m] = true;
    }
    state = seed;
    std::vector<int> out(count);
    for (int& x : out) x = primes[between(0, (long long)primes.size() - 1)];
    return out;
}
}  // namespace gen
`;

export const numberTheory: ExerciseTemplate[] = [
  predict(
    "number-theory",
    "What does it print? Euclid's steps",
    `#include <iostream>

int main() {
    int a = 84, b = 36;
    while (b != 0) {
        std::cout << a << "," << b << " ";
        int r = a % b;
        a = b;
        b = r;
    }
    std::cout << "\\n" << a << " " << 84 / a * 36 << "\\n";
}
`,
    "84,36 36,12\n12 252",
  ),
  {
    skill: "number-theory",
    rung: 2,
    title: "Fix the prime test",
    promptMd: `\`isPrime(n)\` tries the divisors from 2 up to √n. It says 25 and 49 are prime, which they aren't. **Find the fault and fix it.** n is up to 10¹². Each test prints 1 or 0.`,
    functionSignature: "bool isPrime(long long n)",
    call: printCall("isPrime"),
    starterCode: `bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long i = 2; i * i < n; i++)
        if (n % i == 0) return false;
    return true;
}
`,
    reference: `bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long i = 2; i * i <= n; i++)  // <=, or squares of primes slip through
        if (n % i == 0) return false;
    return true;
}
`,
    cases: [
      { args: "25", expected: "0" },
      { args: "2", expected: "1" },
      { args: "1", expected: "0" },
      { args: "97", expected: "1" },
      { args: "49", expected: "0" },
      { args: "1000000007", expected: "1" },
      { args: "999999999", expected: "0" },
      { args: "999966000289LL", expected: "0" },
    ],
  },
  {
    skill: "number-theory",
    rung: 3,
    title: "Complete the smallest-factor sieve",
    promptMd: `\`factorCounts(queries)\` returns, for each query from 2 to 10,000,000, how many prime factors it has, counting repeats: 12 = 2 · 2 · 3 has 3. It first builds \`spf\`, the smallest prime factor of every number up to the largest query, like a sieve. Then each query is divided by its smallest factor until 1 is left. **Complete the sieve step for a prime p.** ${limits("up to 1,000,000 queries")}`,
    functionSignature: "std::vector<int> factorCounts(const std::vector<int>& queries)",
    call: showCall("factorCounts"),
    generator: GEN + PRIMES,
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> factorCounts(const std::vector<int>& queries) {
    int limit = queries.empty() ? 1 : *std::max_element(queries.begin(), queries.end());
    std::vector<int> spf(limit + 1, 0);  // spf[x]: the smallest prime factor of x, 0 if not found yet
    for (int p = 2; p <= limit; p++) {
        if (spf[p] != 0) continue;  // already has a smaller factor: not a prime
        // TODO: p is prime; make it the smallest factor of p and of every multiple that has none yet
    }
    std::vector<int> counts;
    for (int q : queries) {
        int c = 0;
        for (int x = q; x > 1; x /= spf[x]) c++;
        counts.push_back(c);
    }
    return counts;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> factorCounts(const std::vector<int>& queries) {
    int limit = queries.empty() ? 1 : *std::max_element(queries.begin(), queries.end());
    std::vector<int> spf(limit + 1, 0);  // spf[x]: the smallest prime factor of x, 0 if not found yet
    for (int p = 2; p <= limit; p++) {
        if (spf[p] != 0) continue;  // already has a smaller factor: not a prime
        for (int m = p; m <= limit; m += p)
            if (spf[m] == 0) spf[m] = p;
    }
    std::vector<int> counts;
    for (int q : queries) {
        int c = 0;
        for (int x = q; x > 1; x /= spf[x]) c++;
        counts.push_back(c);
    }
    return counts;
}
`,
    bruteForce: `#include <vector>

std::vector<int> factorCounts(const std::vector<int>& queries) {
    std::vector<int> counts;
    for (int q : queries) {
        int c = 0, x = q;
        for (int d = 2; (long long)d * d <= x; d++)
            while (x % d == 0) x /= d, c++;
        counts.push_back(c + (x > 1));
    }
    return counts;
}
`,
    cases: [
      { args: "{12, 7, 1000000, 9973, 2}", expected: "3 1 12 1 1" },
      { args: "{}", expected: "" },
      { args: "{8}", expected: "3" },
      { args: "{30, 31, 32}", expected: "3 1 5" },
      { args: "gen::ints(271, 2000, 2, 100000)" },
      { args: "gen::primesBetween(272, 1000000, 9000000, 10000000)" },
    ],
  },
  {
    skill: "number-theory",
    rung: 4,
    title: "Extend multiplying to dividing modulo a prime",
    promptMd: `\`divideMod(a, b)\` should return a / b modulo 1,000,000,007, a prime, for any b that isn't a multiple of it. Dividing by b means multiplying by its inverse: the number x with b · x ≡ 1. By Fermat's little theorem, that's b^(p - 2). So far the function multiplies by b instead, and \`powMod\` works. **Extend it.** For example, 1/2 is 500000004, because 2 · 500000004 = 1,000,000,008 ≡ 1.`,
    functionSignature: "long long divideMod(long long a, long long b)",
    call: printCall("divideMod"),
    starterCode: `${POW_MOD}

long long divideMod(long long a, long long b) {
    return a % MOD * (b % MOD) % MOD;
}
`,
    reference: `${POW_MOD}

long long divideMod(long long a, long long b) {
    return a % MOD * powMod(b, MOD - 2) % MOD;  // Fermat: b^(p-2) is the inverse of b
}
`,
    cases: [
      { args: "6, 3", expected: "2" },
      { args: "1, 2", expected: "500000004" },
      { args: "10, 4", expected: "500000006" },
      { args: "7, 1", expected: "7" },
      { args: "0, 9", expected: "0" },
      { args: "1000000008, 2", expected: "500000004" },
    ],
  },
  {
    skill: "number-theory",
    rung: 5,
    title: "How many primes up to each query?",
    promptMd: `\`primeCounts(queries)\` returns, for each query n from 1 to 10,000,000, how many primes are at most n: 4 for 10 (2, 3, 5 and 7). Testing each number separately is far too slow. Sieve once up to the largest query, then keep a running count. ${TASK} ${limits("up to 100,000 queries")}`,
    functionSignature: "std::vector<int> primeCounts(const std::vector<int>& queries)",
    call: showCall("primeCounts"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> primeCounts(const std::vector<int>& queries) {
    return std::vector<int>(queries.size(), 0);
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> primeCounts(const std::vector<int>& queries) {
    int limit = queries.empty() ? 1 : std::max(1, *std::max_element(queries.begin(), queries.end()));
    std::vector<bool> composite(limit + 1, false);
    std::vector<int> upTo(limit + 1, 0);  // upTo[n]: how many primes are at most n
    for (int n = 2; n <= limit; n++) {
        if (!composite[n])
            for (long long m = (long long)n * n; m <= limit; m += n) composite[m] = true;
        upTo[n] = upTo[n - 1] + !composite[n];
    }
    std::vector<int> answers;
    for (int q : queries) answers.push_back(upTo[q]);
    return answers;
}
`,
    bruteForce: `#include <vector>

std::vector<int> primeCounts(const std::vector<int>& queries) {
    std::vector<int> answers;
    for (int q : queries) {
        int count = 0;
        for (int n = 2; n <= q; n++) {
            bool prime = true;
            for (int d = 2; d * d <= n && prime; d++) prime = n % d != 0;
            count += prime;
        }
        answers.push_back(count);
    }
    return answers;
}
`,
    cases: [
      { args: "{10, 1, 2, 100, 1000000}", expected: "4 0 1 25 78498" },
      { args: "{}", expected: "" },
      { args: "{30}", expected: "10" },
      { args: "{3, 4, 5}", expected: "2 2 3" },
      { args: "gen::ints(273, 200, 1, 2000)" },
      { args: "gen::ints(274, 100000, 1, 10000000)" },
    ],
  },
];
