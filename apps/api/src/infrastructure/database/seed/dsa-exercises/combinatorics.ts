import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

const FACTORIALS = `const long long MOD = 1000000007;  // a prime

long long powMod(long long base, long long exp) {
    long long result = 1;
    base %= MOD;
    for (; exp > 0; exp /= 2, base = base * base % MOD)
        if (exp % 2 == 1) result = result * base % MOD;
    return result;
}

// fact[i] = i! and inv[i] = 1 / i!, modulo MOD, for i up to n.
struct Factorials {
    std::vector<long long> fact, inv;
    explicit Factorials(int n) : fact(n + 1, 1), inv(n + 1, 1) {
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
        inv[n] = powMod(fact[n], MOD - 2);
        for (int i = n; i > 0; i--) inv[i - 1] = inv[i] * i % MOD;
    }
    long long choose(int n, int k) const { return k < 0 || k > n ? 0 : fact[n] * inv[k] % MOD * inv[n - k] % MOD; }
};`;

// Right and down moves from (0, 0) to (r, c): choose which r of the r + c moves go down.
const PATHS = `long long paths(const Factorials& f, int r, int c) { return r < 0 || c < 0 ? 0 : f.choose(r + c, r); }`;

export const combinatorics: ExerciseTemplate[] = [
  predict(
    "combinatorics",
    "What does it print? Pascal's triangle in one row",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<long long> row = {1};
    for (int n = 1; n <= 5; n++) {
        row.push_back(0);
        for (int k = n; k > 0; k--) row[k] += row[k - 1];
    }
    for (long long x : row) std::cout << x << " ";
    std::cout << "\\n" << row[2] * row[3] << "\\n";
}
`,
    "1 5 10 10 5 1\n100",
  ),
  {
    skill: "combinatorics",
    rung: 2,
    title: "Fix Pascal's table modulo a prime",
    promptMd: `\`chooseMod(n, k)\` should return C(n, k), the number of ways to choose k items from n, **modulo 1,000,000,007**, for n up to 1000. It builds Pascal's table with C(n, k) = C(n - 1, k - 1) + C(n - 1, k). It's right for small n, but C(66, 33) comes out far too big, and larger values overflow. **Find the fault and fix it.**`,
    functionSignature: "long long chooseMod(int n, int k)",
    call: printCall("chooseMod"),
    starterCode: `#include <vector>

const long long MOD = 1000000007;

long long chooseMod(int n, int k) {
    std::vector<std::vector<long long>> c(n + 1, std::vector<long long>(n + 1, 0));
    for (int i = 0; i <= n; i++) {
        c[i][0] = 1;
        for (int j = 1; j <= i; j++) c[i][j] = c[i - 1][j - 1] + c[i - 1][j];
    }
    return c[n][k];
}
`,
    reference: `#include <vector>

const long long MOD = 1000000007;

long long chooseMod(int n, int k) {
    std::vector<std::vector<long long>> c(n + 1, std::vector<long long>(n + 1, 0));
    for (int i = 0; i <= n; i++) {
        c[i][0] = 1;
        for (int j = 1; j <= i; j++) c[i][j] = (c[i - 1][j - 1] + c[i - 1][j]) % MOD;  // reduce at every step
    }
    return c[n][k];
}
`,
    cases: [
      { args: "5, 2", expected: "10" },
      { args: "10, 0", expected: "1" },
      { args: "66, 33", expected: "480267059" },
      { args: "100, 50", expected: "538992043" },
      { args: "1000, 500", expected: "159835829" },
      { args: "1000, 1", expected: "1000" },
    ],
  },
  {
    skill: "combinatorics",
    rung: 3,
    title: "Complete the Catalan numbers",
    promptMd: `The Catalan numbers 1, 1, 2, 5, 14, 42, … count, among other things, the ways to write n pairs of brackets so they match. The n-th is C(2n, n) / (n + 1). \`catalanAll(queries)\` returns, for each n from 0 to 1,000,000, the n-th Catalan number modulo 1,000,000,007. Factorials and their inverses are computed once. **Complete the line for one query**: dividing by n + 1 modulo the prime means multiplying by its inverse. ${limits("up to 100,000 queries")}`,
    functionSignature: "std::vector<long long> catalanAll(const std::vector<int>& queries)",
    call: showCall("catalanAll"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

${FACTORIALS}

std::vector<long long> catalanAll(const std::vector<int>& queries) {
    int most = queries.empty() ? 0 : *std::max_element(queries.begin(), queries.end());
    Factorials f(2 * most + 1);
    std::vector<long long> out;
    for (int n : queries) out.push_back(f.choose(2 * n, n));  // TODO: divide by n + 1 too
    return out;
}
`,
    reference: `#include <algorithm>
#include <vector>

${FACTORIALS}

std::vector<long long> catalanAll(const std::vector<int>& queries) {
    int most = queries.empty() ? 0 : *std::max_element(queries.begin(), queries.end());
    Factorials f(2 * most + 1);
    std::vector<long long> out;
    for (int n : queries) out.push_back(f.choose(2 * n, n) * f.inv[n + 1] % MOD * f.fact[n] % MOD);  // 1/(n+1) = n!/(n+1)!
    return out;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

const long long MOD = 1000000007;

std::vector<long long> catalanAll(const std::vector<int>& queries) {
    int most = queries.empty() ? 0 : *std::max_element(queries.begin(), queries.end());
    std::vector<long long> cat(most + 1, 0);
    cat[0] = 1;
    for (int n = 1; n <= most; n++)  // the first pair encloses i pairs and is followed by the other n - 1 - i
        for (int i = 0; i < n; i++) cat[n] = (cat[n] + cat[i] * cat[n - 1 - i]) % MOD;
    std::vector<long long> out;
    for (int n : queries) out.push_back(cat[n]);
    return out;
}
`,
    cases: [
      { args: "{3, 5, 0, 1}", expected: "5 42 1 1" },
      { args: "{}", expected: "" },
      { args: "{10}", expected: "16796" },
      { args: "{30, 2}", expected: "475387402 2" },
      { args: "gen::ints(281, 200, 0, 2000)" },
      { args: "gen::ints(282, 100000, 0, 1000000)" },
    ],
  },
  {
    skill: "combinatorics",
    rung: 4,
    title: "Extend grid paths to avoid a blocked cell",
    promptMd: `Moving only right and down, there are C(r + c, r) paths from (0, 0) to (r, c), and \`paths\` computes that modulo 1,000,000,007. \`pathsAvoiding(n, m, br, bc)\` should count the paths from (0, 0) to (n, m) that **don't pass through** the cell (br, bc); that cell is never the start or the end. So far it counts all the paths. **Extend it**: subtract the paths that go through the blocked cell, which are the paths to it times the paths from it. ${limits("n and m up to 1,000,000")}`,
    functionSignature: "long long pathsAvoiding(int n, int m, int br, int bc)",
    call: printCall("pathsAvoiding"),
    starterCode: `#include <vector>

${FACTORIALS}

${PATHS}

long long pathsAvoiding(int n, int m, int br, int bc) {
    Factorials f(n + m);
    return paths(f, n, m);
}
`,
    reference: `#include <vector>

${FACTORIALS}

${PATHS}

long long pathsAvoiding(int n, int m, int br, int bc) {
    Factorials f(n + m);
    long long through = paths(f, br, bc) * paths(f, n - br, m - bc) % MOD;  // to the cell, then on from it
    return (paths(f, n, m) - through + MOD) % MOD;
}
`,
    bruteForce: `#include <vector>

const long long MOD = 1000000007;

long long pathsAvoiding(int n, int m, int br, int bc) {
    std::vector<long long> row(m + 1, 0);  // row[c]: paths to (r, c) for the current row r
    for (int r = 0; r <= n; r++)
        for (int c = 0; c <= m; c++) {
            if (r == br && c == bc) row[c] = 0;
            else if (r == 0 && c == 0) row[c] = 1;
            else row[c] = (row[c] + (c > 0 ? row[c - 1] : 0)) % MOD;
        }
    return row[m];
}
`,
    cases: [
      { args: "2, 2, 1, 1", expected: "2" },
      { args: "3, 3, 1, 2", expected: "11" },
      { args: "2, 3, 0, 1", expected: "4" },
      { args: "30, 30, 15, 15", expected: "894489079" },
      { args: "1, 1, 5, 5", expected: "2" },
      { args: "500, 600, 200, 300" },
      { args: "1000000, 1000000, 400000, 700000" },
    ],
  },
  {
    skill: "combinatorics",
    rung: 5,
    title: "The k-th permutation",
    promptMd: `List every ordering of 1, 2, …, n in dictionary order: for n = 3 that's 123, 132, 213, 231, 312, 321. \`kthPermutation(n, k)\` returns the k-th one, counting from 1, for n up to 20 and k up to n!. Stepping through them one by one is hopeless, since 20! is about 2.4 · 10¹⁸. Instead, each first choice covers (n - 1)! orderings, so k tells you the first number, and so on. ${TASK}`,
    functionSignature: "std::vector<int> kthPermutation(int n, long long k)",
    call: showCall("kthPermutation"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> kthPermutation(int n, long long k) {
    std::vector<int> p;
    for (int i = 1; i <= n; i++) p.push_back(i);
    return p;
}
`,
    reference: `#include <vector>

std::vector<int> kthPermutation(int n, long long k) {
    std::vector<int> left;
    std::vector<long long> fact(n + 1, 1);
    for (int i = 1; i <= n; i++) left.push_back(i), fact[i] = fact[i - 1] * i;
    std::vector<int> p;
    k--;  // count from 0
    for (int i = n; i >= 1; i--) {
        long long block = fact[i - 1];  // orderings per choice of the next number
        p.push_back(left[k / block]);
        left.erase(left.begin() + k / block);
        k %= block;
    }
    return p;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

std::vector<int> kthPermutation(int n, long long k) {
    std::vector<int> p;
    for (int i = 1; i <= n; i++) p.push_back(i);
    for (long long step = 1; step < k; step++) std::next_permutation(p.begin(), p.end());
    return p;
}
`,
    cases: [
      { args: "3, 1", expected: "1 2 3" },
      { args: "3, 6", expected: "3 2 1" },
      { args: "4, 9", expected: "2 3 1 4" },
      { args: "1, 1", expected: "1" },
      { args: "5, 120", expected: "5 4 3 2 1" },
      { args: "8, 40000" },
      { args: "20, 2000000000000000000LL" },
    ],
  },
];
