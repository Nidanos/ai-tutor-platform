import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";

// Recursion builds only on C++ functions and conditionals, so these tasks use no loops, vectors or strings.
const printThen = (fn: string) => (args: string) => `${fn}(${args}); std::cout << "\\n";`;

export const recursion: ExerciseTemplate[] = [
  predict(
    "recursion",
    "What does it print? Two recursive functions",
    `#include <iostream>

int mystery(int a, int b) {
    if (b == 0) return a;
    return mystery(b, a % b);
}

int steps(int n) {
    if (n <= 1) return 0;
    return 1 + steps(n % 2 == 0 ? n / 2 : 3 * n + 1);
}

int main() {
    std::cout << mystery(48, 18) << " " << mystery(17, 5) << "\\n";
    std::cout << steps(6) << "\\n";
}
`,
    "6 1\n8",
  ),
  {
    skill: "recursion",
    rung: 2,
    title: "Fix the base case of the bit counter",
    promptMd: `\`countOnes(n)\` should return how many 1s there are in the binary form of n (n ≥ 0): 2 for 5 (101), 1 for 8 (1000). It works for most numbers, but for one input it never reaches its base case. **Find the fault and fix it.**`,
    functionSignature: "int countOnes(int n)",
    call: printCall("countOnes"),
    starterCode: `// The last binary digit is n % 2; the rest of the digits are those of n / 2.
int countOnes(int n) {
    if (n == 1) return 1;
    return n % 2 + countOnes(n / 2);
}
`,
    reference: `// The last binary digit is n % 2; the rest of the digits are those of n / 2.
int countOnes(int n) {
    if (n == 0) return 0;
    return n % 2 + countOnes(n / 2);
}
`,
    cases: [
      { args: "5", expected: "2" },
      { args: "8", expected: "1" },
      { args: "0", expected: "0" },
      { args: "255", expected: "8" },
      { args: "1023", expected: "10" },
    ],
  },
  {
    skill: "recursion",
    rung: 3,
    title: "Complete fast power by halving",
    promptMd: `\`powMod(base, exp)\` returns base^exp modulo 1,000,000,007. Instead of multiplying exp times, it works out base^(exp / 2) once and squares it, so even exp = 10¹⁸ takes only about 60 calls. Squaring is enough when exp is even. **Complete the odd case.** Hidden tests include exponents up to 10¹⁸, and each test must finish within 2 seconds.`,
    functionSignature: "long long powMod(long long base, long long exp)",
    call: printCall("powMod"),
    starterCode: `const long long MOD = 1000000007;

long long powMod(long long base, long long exp) {
    if (exp == 0) return 1;
    long long half = powMod(base, exp / 2);
    long long result = half * half % MOD;
    // TODO: when exp is odd, one factor of base is still missing
    return result;
}
`,
    reference: `const long long MOD = 1000000007;

long long powMod(long long base, long long exp) {
    if (exp == 0) return 1;
    long long half = powMod(base, exp / 2);
    long long result = half * half % MOD;
    if (exp % 2 == 1) result = result * (base % MOD) % MOD;
    return result;
}
`,
    bruteForce: `const long long MOD = 1000000007;

long long powMod(long long base, long long exp) {
    long long result = 1;
    for (long long i = 0; i < exp; i++) result = result * (base % MOD) % MOD;
    return result;
}
`,
    cases: [
      { args: "3, 5", expected: "243" },
      { args: "2, 10", expected: "1024" },
      { args: "7, 0", expected: "1" },
      { args: "10, 9", expected: "1000000000" },
      { args: "2, 30", expected: "73741817" },
      { args: "123456789, 1000000" },
      { args: "987654321, 1000000000000000000LL" },
    ],
  },
  {
    skill: "recursion",
    rung: 4,
    title: "Extend binary printing to any base",
    promptMd: `\`printInBase(n, base)\` prints n (n ≥ 0) in binary: first, recursively, the digits of n / 2, then the last digit n % 2. **Extend it** to any base from 2 to 16, using the digits 0–9 and then A–F, so \`printInBase(255, 16)\` prints \`FF\`. Each test prints one number.`,
    functionSignature: "void printInBase(int n, int base)",
    call: printThen("printInBase"),
    starterCode: `#include <iostream>

void printInBase(int n, int base) {
    if (n >= 2) printInBase(n / 2, base);
    std::cout << n % 2;
}
`,
    reference: `#include <iostream>

void printInBase(int n, int base) {
    if (n >= base) printInBase(n / base, base);
    std::cout << "0123456789ABCDEF"[n % base];
}
`,
    cases: [
      { args: "255, 16", expected: "FF" },
      { args: "10, 2", expected: "1010" },
      { args: "0, 8", expected: "0" },
      { args: "64, 8", expected: "100" },
      { args: "100, 10", expected: "100" },
      { args: "48879, 16", expected: "BEEF" },
    ],
  },
  {
    skill: "recursion",
    rung: 5,
    title: "Tower of Hanoi",
    promptMd: `Move a tower of n disks from peg \`from\` to peg \`to\`, using peg \`via\`. Only the top disk of a peg can move, and a disk may never sit on a smaller one. \`hanoi(n, from, to, via)\` prints the moves of the shortest solution, one per line, like \`A -> C\`. For n = 2 from A to C, that's \`A -> B\`, \`A -> C\`, \`B -> C\`. ${TASK}`,
    functionSignature: "void hanoi(int n, char from, char to, char via)",
    call: (args) => `hanoi(${args});`,
    starterCode: `#include <iostream>

void hanoi(int n, char from, char to, char via) {
}
`,
    reference: `#include <iostream>

void hanoi(int n, char from, char to, char via) {
    if (n == 0) return;
    hanoi(n - 1, from, via, to);                 // the n - 1 smaller disks out of the way
    std::cout << from << " -> " << to << "\\n";  // the largest disk
    hanoi(n - 1, via, to, from);                 // the smaller disks back on top of it
}
`,
    cases: [
      { args: "2, 'A', 'C', 'B'", expected: "A -> B\nA -> C\nB -> C" },
      { args: "1, 'A', 'C', 'B'", expected: "A -> C" },
      { args: "3, 'A', 'C', 'B'", expected: "A -> C\nA -> B\nC -> B\nA -> C\nB -> A\nB -> C\nA -> C" },
      { args: "2, 'X', 'Y', 'Z'", expected: "X -> Z\nX -> Y\nZ -> Y" },
      { args: "0, 'A', 'C', 'B'", expected: "" },
    ],
  },
];
