// Hand-written template exercises for cpp-basics (Q10c): the fallback bank when generation fails,
// and the pilot's first content. Rungs follow the synopsis ladder: 1 Predict · 2 Diagnose ·
// 3 Complete · 4 Extend · 5 Build. Nothing is served until `pnpm exercises:verify` has run the
// reference in the sandbox. To change a seeded exercise, add a new variant instead of editing it.

export type Rung = 1 | 2 | 3 | 4 | 5;

// One test: the arguments passed to the learner's function, and the exact expected output.
export type Case = { args: string; expected: string };

export type ExerciseTemplate = {
  skill: string;
  rung: Rung;
  title: string;
  promptMd: string;
  starterCode: string; // rung 1: the program to read; otherwise what the editor starts with
  reference: string; // passes every case (rung 1: the program itself)
  functionSignature?: string; // rungs 2–5
  call?: (args: string) => string; // rungs 2–5: one test as a C++ statement
  cases: Case[]; // the first is shown as the sample; the rest are hidden
  variant?: number; // 1, 2, …: a corrected copy of a seeded template (seeded content is never edited)
};

// Rungs 2–5 use a `void solve(...)` box: the learner writes inside it, inputs arrive as parameters.
export const solve = (args: string) => `solve(${args});`;
export const BOX = "Write your code inside `solve`. Your inputs arrive as its parameters; print the answer with `std::cout`.";
// Or the learner writes a named function, and each test prints what it returns.
export const TASK = "Write the function. Hidden tests call it with other inputs too, so don't hard-code the example.";
export const printCall = (fn: string) => (args: string) => `std::cout << ${fn}(${args}) << "\\n";`;

export const predict = (skill: string, title: string, program: string, expected: string): ExerciseTemplate => ({
  skill,
  rung: 1,
  title,
  promptMd: "Read the program carefully. **What does it print?** Type the exact output.",
  starterCode: program,
  reference: program,
  cases: [{ args: "", expected }],
});

export const cppBasicsTemplates: ExerciseTemplate[] = [
  // ── Skill 1: Your first program ──────────────────────────────────────────────
  predict(
    "program-structure",
    "What does it print? Hello World",
    `#include <iostream>

int main() {
    std::cout << "Hello";
    std::cout << " World" << "\\n";
    std::cout << 1 + 2 << "\\n";
    return 0;
}
`,
    "Hello World\n3",
  ),
  {
    skill: "program-structure",
    rung: 2,
    title: "Fix the missing line break",
    promptMd: `This code should print two lines:\n\n\`\`\`\nLine 1\nLine 2\n\`\`\`\n\nbut it prints them on one line. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve()",
    call: solve,
    starterCode: `#include <iostream>

void solve() {
    std::cout << "Line 1";
    std::cout << "Line 2" << "\\n";
}
`,
    reference: `#include <iostream>

void solve() {
    std::cout << "Line 1" << "\\n";
    std::cout << "Line 2" << "\\n";
}
`,
    cases: [{ args: "", expected: "Line 1\nLine 2" }],
  },
  {
    skill: "program-structure",
    rung: 3,
    title: "Complete the receipt",
    promptMd: `Complete the receipt by filling in the missing line, so it prints:\n\n\`\`\`\nItem: Notebook\nPrice: 45\nThank you!\n\`\`\`\n\n${BOX}`,
    functionSignature: "void solve()",
    call: solve,
    starterCode: `#include <iostream>

void solve() {
    std::cout << "Item: Notebook" << "\\n";
    // TODO: print "Price: 45" on its own line
    std::cout << "Thank you!" << "\\n";
}
`,
    reference: `#include <iostream>

void solve() {
    std::cout << "Item: Notebook" << "\\n";
    std::cout << "Price: 45" << "\\n";
    std::cout << "Thank you!" << "\\n";
}
`,
    cases: [{ args: "", expected: "Item: Notebook\nPrice: 45\nThank you!" }],
  },
  {
    skill: "program-structure",
    rung: 4,
    title: "Extend the welcome message",
    promptMd: `This code works and prints \`Name: Asha\`. **Extend it** so it prints three lines:\n\n\`\`\`\nName: Asha\nCourse: C++\nWelcome!\n\`\`\`\n\n${BOX}`,
    functionSignature: "void solve()",
    call: solve,
    starterCode: `#include <iostream>

void solve() {
    std::cout << "Name: Asha" << "\\n";
}
`,
    reference: `#include <iostream>

void solve() {
    std::cout << "Name: Asha" << "\\n";
    std::cout << "Course: C++" << "\\n";
    std::cout << "Welcome!" << "\\n";
}
`,
    cases: [{ args: "", expected: "Name: Asha\nCourse: C++\nWelcome!" }],
  },
  {
    skill: "program-structure",
    rung: 5,
    title: "Print a staircase",
    promptMd: `Print this pattern exactly:\n\n\`\`\`\n*\n**\n***\n\`\`\`\n\n${BOX}`,
    functionSignature: "void solve()",
    call: solve,
    starterCode: `#include <iostream>

void solve() {
}
`,
    reference: `#include <iostream>

void solve() {
    std::cout << "*" << "\\n";
    std::cout << "**" << "\\n";
    std::cout << "***" << "\\n";
}
`,
    cases: [{ args: "", expected: "*\n**\n***" }],
  },

  // ── Skill 2: Variables and types ─────────────────────────────────────────────
  predict(
    "variables-and-types",
    "What does it print? Division and types",
    `#include <iostream>

int main() {
    int a = 7;
    double b = a / 2;
    double c = a / 2.0;
    char grade = 'B';
    bool passed = true;
    std::cout << b << "\\n" << c << "\\n" << grade << "\\n" << passed << "\\n";
}
`,
    "3\n3.5\nB\n1",
  ),
  {
    skill: "variables-and-types",
    rung: 2,
    title: "Fix the seconds counter",
    promptMd: `\`solve(days)\` should print how many seconds are in \`days\` days. It works for small numbers but prints a wrong answer for 100000 days. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve(int days)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int days) {
    int seconds = days * 24 * 60 * 60;
    std::cout << seconds << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int days) {
    long long seconds = 1LL * days * 24 * 60 * 60;
    std::cout << seconds << "\\n";
}
`,
    cases: [
      { args: "1", expected: "86400" },
      { args: "30", expected: "2592000" },
      { args: "100000", expected: "8640000000" },
    ],
  },
  {
    skill: "variables-and-types",
    rung: 3,
    title: "Complete the average",
    promptMd: `\`solve(a, b, c)\` should print the average of three marks **with its decimals**. Fill in the missing expression. ${BOX}`,
    functionSignature: "void solve(int a, int b, int c)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int a, int b, int c) {
    int sum = a + b + c;
    double average = /* TODO: divide so the decimals are kept */;
    std::cout << average << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int a, int b, int c) {
    int sum = a + b + c;
    double average = sum / 3.0;
    std::cout << average << "\\n";
}
`,
    cases: [
      { args: "70, 80, 95", expected: "81.6667" },
      { args: "90, 90, 90", expected: "90" },
      { args: "1, 2, 2", expected: "1.66667" },
    ],
  },
  {
    skill: "variables-and-types",
    rung: 4,
    title: "Extend the temperature converter",
    promptMd: `This code converts Celsius to Fahrenheit and works. **Extend it** to print Fahrenheit on the first line and Kelvin (Celsius + 273.15) on the second. ${BOX}`,
    functionSignature: "void solve(double celsius)",
    call: solve,
    starterCode: `#include <iostream>

void solve(double celsius) {
    double fahrenheit = celsius * 9 / 5 + 32;
    std::cout << fahrenheit << "\\n";
}
`,
    reference: `#include <iostream>

void solve(double celsius) {
    double fahrenheit = celsius * 9 / 5 + 32;
    double kelvin = celsius + 273.15;
    std::cout << fahrenheit << "\\n" << kelvin << "\\n";
}
`,
    cases: [
      { args: "0", expected: "32\n273.15" },
      { args: "100", expected: "212\n373.15" },
      { args: "-40", expected: "-40\n233.15" },
    ],
  },
  {
    skill: "variables-and-types",
    rung: 5,
    title: "Multiply without overflow",
    promptMd: `\`solve(a, b)\` receives two integers. Print their product. Careful: the product may not fit in an \`int\`. ${BOX}`,
    functionSignature: "void solve(int a, int b)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int a, int b) {
}
`,
    reference: `#include <iostream>

void solve(int a, int b) {
    long long product = 1LL * a * b;
    std::cout << product << "\\n";
}
`,
    cases: [
      { args: "3, 4", expected: "12" },
      { args: "100000, 100000", expected: "10000000000" },
      { args: "-50000, 60000", expected: "-3000000000" },
    ],
  },

  // ── Skill 3: Operators ───────────────────────────────────────────────────────
  predict(
    "operators",
    "What does it print? Division, remainder and logic",
    `#include <iostream>

int main() {
    int a = 17, b = 5;
    std::cout << a / b << "\\n";
    std::cout << a % b << "\\n";
    std::cout << (a > b && b > 10) << "\\n";
    std::cout << (a > b || b > 10) << "\\n";
    std::cout << -a / b << "\\n";
}
`,
    "3\n2\n0\n1\n-3",
  ),
  {
    skill: "operators",
    rung: 2,
    title: "Fix the average of two numbers",
    promptMd: `\`solve(a, b)\` should print the exact average of two integers, for example \`2.5\` for 2 and 3. It's sometimes wrong. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve(int a, int b)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int a, int b) {
    double average = (a + b) / 2;
    std::cout << average << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int a, int b) {
    double average = (a + b) / 2.0;
    std::cout << average << "\\n";
}
`,
    cases: [
      { args: "4, 6", expected: "5" },
      { args: "2, 3", expected: "2.5" },
      { args: "7, 10", expected: "8.5" },
    ],
  },
  {
    skill: "operators",
    rung: 3,
    title: "Complete the bill splitter",
    promptMd: `\`solve(total, people)\` splits a bill in whole rupees. Print each person's share and the rupees left over, separated by a space. Fill in the missing expression. ${BOX}`,
    functionSignature: "void solve(int total, int people)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int total, int people) {
    int share = total / people;
    int left = /* TODO: what's left after everyone pays share? */;
    std::cout << share << " " << left << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int total, int people) {
    int share = total / people;
    int left = total % people;
    std::cout << share << " " << left << "\\n";
}
`,
    cases: [
      { args: "100, 3", expected: "33 1" },
      { args: "250, 5", expected: "50 0" },
      { args: "7, 10", expected: "0 7" },
    ],
  },
  {
    skill: "operators",
    rung: 4,
    title: "Extend to the full leap-year rule",
    promptMd: `This code prints \`1\` if a year is divisible by 4 and \`0\` otherwise. **Extend it** to the full leap-year rule: divisible by 4, **except** years divisible by 100, **unless** also divisible by 400. ${BOX}`,
    functionSignature: "void solve(int year)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int year) {
    std::cout << (year % 4 == 0) << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int year) {
    bool leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    std::cout << leap << "\\n";
}
`,
    cases: [
      { args: "2024", expected: "1" },
      { args: "1900", expected: "0" },
      { args: "2000", expected: "1" },
      { args: "2023", expected: "0" },
    ],
  },
  {
    skill: "operators",
    rung: 5,
    title: "Digits of a three-digit number",
    promptMd: `\`solve(n)\` receives a number from 100 to 999. Print its last digit and the sum of its three digits, separated by a space. ${BOX}`,
    functionSignature: "void solve(int n)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n) {
}
`,
    reference: `#include <iostream>

void solve(int n) {
    int last = n % 10;
    int sum = n / 100 + n / 10 % 10 + n % 10;
    std::cout << last << " " << sum << "\\n";
}
`,
    cases: [
      { args: "472", expected: "2 13" },
      { args: "100", expected: "0 1" },
      { args: "999", expected: "9 27" },
    ],
  },

  // ── Skill 4: Making decisions ────────────────────────────────────────────────
  predict(
    "conditionals",
    "What does it print? if, switch and ?:",
    `#include <iostream>

int main() {
    int marks = 72;
    if (marks >= 90) std::cout << "A\\n";
    else if (marks >= 70) std::cout << "B\\n";
    else std::cout << "C\\n";

    int day = 3;
    switch (day) {
        case 1: std::cout << "Mon\\n"; break;
        case 3: std::cout << "Wed\\n";
        case 4: std::cout << "Thu\\n"; break;
        default: std::cout << "Other\\n";
    }

    std::cout << (marks % 2 == 0 ? "even" : "odd") << "\\n";
}
`,
    "B\nWed\nThu\neven",
  ),
  {
    skill: "conditionals",
    rung: 2,
    title: "Fix the grade calculator",
    promptMd: `\`solve(marks)\` should print \`Distinction\` for 75 and above, \`Pass\` for 40 to 74, and \`Fail\` below 40. Students with 80 get \`Pass\`. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve(int marks)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int marks) {
    if (marks >= 40) std::cout << "Pass\\n";
    else if (marks >= 75) std::cout << "Distinction\\n";
    else std::cout << "Fail\\n";
}
`,
    reference: `#include <iostream>

void solve(int marks) {
    if (marks >= 75) std::cout << "Distinction\\n";
    else if (marks >= 40) std::cout << "Pass\\n";
    else std::cout << "Fail\\n";
}
`,
    cases: [
      { args: "50", expected: "Pass" },
      { args: "80", expected: "Distinction" },
      { args: "39", expected: "Fail" },
    ],
  },
  {
    skill: "conditionals",
    rung: 3,
    title: "Complete the largest of three",
    promptMd: `\`solve(a, b, c)\` should print the largest of three numbers. Complete the missing comparison. ${BOX}`,
    functionSignature: "void solve(int a, int b, int c)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int a, int b, int c) {
    int largest = a;
    if (b > largest) largest = b;
    // TODO: also compare c
    std::cout << largest << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int a, int b, int c) {
    int largest = a;
    if (b > largest) largest = b;
    if (c > largest) largest = c;
    std::cout << largest << "\\n";
}
`,
    cases: [
      { args: "3, 9, 5", expected: "9" },
      { args: "1, 2, 7", expected: "7" },
      { args: "-5, -2, -9", expected: "-2" },
    ],
  },
  {
    skill: "conditionals",
    rung: 4,
    title: "Extend the ticket price",
    promptMd: `This code prints a ticket price: 50 for children under 12, otherwise 100. **Extend it** so people aged 60 and over pay 60. ${BOX}`,
    functionSignature: "void solve(int age)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int age) {
    if (age < 12) std::cout << 50 << "\\n";
    else std::cout << 100 << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int age) {
    if (age < 12) std::cout << 50 << "\\n";
    else if (age >= 60) std::cout << 60 << "\\n";
    else std::cout << 100 << "\\n";
}
`,
    cases: [
      { args: "8", expected: "50" },
      { args: "30", expected: "100" },
      { args: "65", expected: "60" },
      { args: "60", expected: "60" },
      { args: "12", expected: "100" },
    ],
  },
  {
    skill: "conditionals",
    rung: 5,
    title: "What kind of triangle?",
    promptMd: `\`solve(a, b, c)\` receives three side lengths. Print \`invalid\` if they can't form a triangle (one side is at least the sum of the other two). Otherwise print \`equilateral\` (all equal), \`isosceles\` (exactly two equal) or \`scalene\` (all different). ${BOX}`,
    functionSignature: "void solve(int a, int b, int c)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int a, int b, int c) {
}
`,
    reference: `#include <iostream>

void solve(int a, int b, int c) {
    if (a + b <= c || a + c <= b || b + c <= a) std::cout << "invalid\\n";
    else if (a == b && b == c) std::cout << "equilateral\\n";
    else if (a == b || b == c || a == c) std::cout << "isosceles\\n";
    else std::cout << "scalene\\n";
}
`,
    cases: [
      { args: "3, 3, 3", expected: "equilateral" },
      { args: "3, 4, 5", expected: "scalene" },
      { args: "2, 2, 3", expected: "isosceles" },
      { args: "1, 2, 3", expected: "invalid" },
      { args: "5, 1, 1", expected: "invalid" },
    ],
  },

  // ── Skill 5: Loops ───────────────────────────────────────────────────────────
  predict(
    "loops",
    "What does it print? for, continue and while",
    `#include <iostream>

int main() {
    int total = 0;
    for (int i = 1; i <= 5; i++) {
        if (i == 3) continue;
        total += i;
    }
    std::cout << total << "\\n";

    int n = 10;
    while (n > 1) {
        std::cout << n << " ";
        n /= 2;
    }
    std::cout << "\\n";
}
`,
    "12\n10 5 2",
  ),
  {
    skill: "loops",
    rung: 2,
    title: "Fix the sum from 1 to n",
    promptMd: `\`solve(n)\` should print 1 + 2 + … + n. For 5 it should print 15. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve(int n)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n) {
    long long sum = 0;
    for (int i = 1; i < n; i++) sum += i;
    std::cout << sum << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int n) {
    long long sum = 0;
    for (int i = 1; i <= n; i++) sum += i;
    std::cout << sum << "\\n";
}
`,
    cases: [
      { args: "5", expected: "15" },
      { args: "1", expected: "1" },
      { args: "100000", expected: "5000050000" },
    ],
  },
  {
    skill: "loops",
    rung: 3,
    title: "Complete the times table",
    promptMd: `\`solve(n)\` should print the first three rows of n's times table, like \`7 x 2 = 14\`. Fill in the body of the loop. ${BOX}`,
    functionSignature: "void solve(int n)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n) {
    for (int i = 1; i <= 3; i++) {
        // TODO: print one row, e.g. "7 x 2 = 14"
    }
}
`,
    reference: `#include <iostream>

void solve(int n) {
    for (int i = 1; i <= 3; i++) {
        std::cout << n << " x " << i << " = " << n * i << "\\n";
    }
}
`,
    cases: [
      { args: "7", expected: "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21" },
      { args: "12", expected: "12 x 1 = 12\n12 x 2 = 24\n12 x 3 = 36" },
    ],
  },
  {
    skill: "loops",
    rung: 4,
    title: "Extend the digit counter",
    promptMd: `This code prints how many digits a positive number has. **Extend it** to also print the number reversed on the next line (for 1200 that's \`21\`). ${BOX}`,
    functionSignature: "void solve(int n)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n) {
    int digits = 0;
    while (n > 0) {
        digits++;
        n /= 10;
    }
    std::cout << digits << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int n) {
    int digits = 0, reversed = 0;
    while (n > 0) {
        digits++;
        reversed = reversed * 10 + n % 10;
        n /= 10;
    }
    std::cout << digits << "\\n" << reversed << "\\n";
}
`,
    cases: [
      { args: "1234", expected: "4\n4321" },
      { args: "7", expected: "1\n7" },
      { args: "1200", expected: "4\n21" },
    ],
  },
  {
    skill: "loops",
    rung: 5,
    title: "FizzBuzz",
    promptMd: `\`solve(n)\` prints the numbers 1 to n, one per line, but prints \`Fizz\` for multiples of 3, \`Buzz\` for multiples of 5, and \`FizzBuzz\` for multiples of both. ${BOX}`,
    functionSignature: "void solve(int n)",
    call: solve,
    starterCode: `#include <iostream>

void solve(int n) {
}
`,
    reference: `#include <iostream>

void solve(int n) {
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) std::cout << "FizzBuzz\\n";
        else if (i % 3 == 0) std::cout << "Fizz\\n";
        else if (i % 5 == 0) std::cout << "Buzz\\n";
        else std::cout << i << "\\n";
    }
}
`,
    cases: [
      { args: "5", expected: "1\n2\nFizz\n4\nBuzz" },
      { args: "1", expected: "1" },
      { args: "15", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" },
    ],
  },

  // ── Functions (first exercise, seeded 15 Oct) ────────────────────────────────
  {
    skill: "functions",
    rung: 3,
    title: "Sum of digits",
    promptMd:
      "Write `int sumOfDigits(int n)` that returns the sum of the decimal digits of `n` (0 ≤ n ≤ 1,000,000,000).\n\n" +
      "Example: `sumOfDigits(123)` returns `6`.",
    functionSignature: "int sumOfDigits(int n)",
    call: (args) => `std::cout << sumOfDigits(${args}) << "\\n";`,
    starterCode: "int sumOfDigits(int n) {\n  // your code here\n  return 0;\n}\n",
    reference: `int sumOfDigits(int n) {
  int sum = 0;
  for (; n > 0; n /= 10) sum += n % 10;
  return sum;
}
`,
    cases: [
      { args: "123", expected: "6" },
      { args: "0", expected: "0" },
      { args: "999999999", expected: "81" },
      { args: "1000000000", expected: "1" },
    ],
  },
];
