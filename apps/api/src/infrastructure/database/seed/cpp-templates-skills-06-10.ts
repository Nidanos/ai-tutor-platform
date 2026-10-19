// Hand-written practice for cpp-basics skills 6–10 (functions to references), same rules as
// cpp-templates.ts. Each exercise uses only its own skill and the skills before it in the graph:
// functions, references and structs come before loops, so their exercises have none.
import { BOX, type ExerciseTemplate, predict, printCall, solve, TASK } from "./cpp-templates.js";

// The case's numbers in a fixed-size array, then a sentinel just past the end, so a loop that
// reads one element too far picks it up.
const intArray = (list: string, sentinel = 1000) =>
  `int a[16]; int n = 0; for (int x : std::initializer_list<int>${list}) a[n++] = x; a[n] = ${sentinel};`;
const printVector = (expr: string) => `{ for (int x : ${expr}) std::cout << x << ' '; std::cout << "\\n"; }`;

export const templatesSkills06to10: ExerciseTemplate[] = [
  // ── Skill 6: Functions (rung 3 is "Sum of digits" in cpp-templates.ts) ────────
  predict(
    "functions",
    "What does it print? Overloads and local scope",
    `#include <iostream>

int scale(int x) { return x * 2; }
double scale(double x) { return x * 2.5; }

int counter = 0;

void bump() {
    int counter = 10;
    counter++;
}

int main() {
    std::cout << scale(3) << "\\n";
    std::cout << scale(3.0) << "\\n";
    bump();
    std::cout << counter << "\\n";
    std::cout << scale(scale(2)) << "\\n";
}
`,
    "6\n7.5\n0\n8",
  ),
  {
    skill: "functions",
    rung: 2,
    title: "Fix the minutes between two times",
    promptMd: `\`minutesBetween(h1, m1, h2, m2)\` should return how many minutes pass from the time h1:m1 to the later time h2:m2 on the same day. From 9:00 to 10:30 it should return 90, but it doesn't. **Find the fault and fix it.** The tests print what it returns.`,
    functionSignature: "int minutesBetween(int h1, int m1, int h2, int m2)",
    call: printCall("minutesBetween"),
    starterCode: `int toMinutes(int hours, int minutes) {
    return hours * 60 + minutes;
}

int minutesBetween(int h1, int m1, int h2, int m2) {
    return toMinutes(h2, m2) - toMinutes(m1, h1);
}
`,
    reference: `int toMinutes(int hours, int minutes) {
    return hours * 60 + minutes;
}

int minutesBetween(int h1, int m1, int h2, int m2) {
    return toMinutes(h2, m2) - toMinutes(h1, m1);
}
`,
    cases: [
      { args: "9, 0, 10, 30", expected: "90" },
      { args: "8, 15, 8, 45", expected: "30" },
      { args: "0, 0, 23, 59", expected: "1439" },
      { args: "13, 50, 14, 5", expected: "15" },
    ],
  },
  {
    skill: "functions",
    rung: 4,
    title: "Extend the BMI report",
    promptMd: `\`report\` prints a person's BMI and works. **Extend it** to print the category on a second line: \`underweight\` below 18.5, \`normal\` from 18.5 to below 25, and \`overweight\` from 25 up. Write the category in a function of its own and call it from \`report\`. ${BOX.replace("`solve`", "`report`")}`,
    functionSignature: "void report(double weightKg, double heightM)",
    call: (args) => `report(${args});`,
    starterCode: `#include <iostream>

double bmi(double weightKg, double heightM) {
    return weightKg / (heightM * heightM);
}

void report(double weightKg, double heightM) {
    double value = bmi(weightKg, heightM);
    std::cout << value << "\\n";
}
`,
    reference: `#include <iostream>

double bmi(double weightKg, double heightM) {
    return weightKg / (heightM * heightM);
}

void printCategory(double value) {
    if (value < 18.5) std::cout << "underweight\\n";
    else if (value < 25) std::cout << "normal\\n";
    else std::cout << "overweight\\n";
}

void report(double weightKg, double heightM) {
    double value = bmi(weightKg, heightM);
    std::cout << value << "\\n";
    printCategory(value);
}
`,
    cases: [
      { args: "70, 1.75", expected: "22.8571\nnormal" },
      { args: "50, 1.8", expected: "15.4321\nunderweight" },
      { args: "74, 2", expected: "18.5\nnormal" },
      { args: "100, 2", expected: "25\noverweight" },
      { args: "90, 1.7", expected: "31.1419\noverweight" },
    ],
  },
  {
    skill: "functions",
    rung: 5,
    title: "Days in a month",
    promptMd: `Write \`int daysInMonth(int month, int year)\` that returns how many days the month has (1 = January … 12 = December). February has 29 days in a leap year: divisible by 4, except years divisible by 100, unless also divisible by 400. Put the leap-year rule in a helper function \`bool isLeap(int year)\`.\n\nExample: \`daysInMonth(2, 2024)\` returns \`29\`.\n\n${TASK}`,
    functionSignature: "int daysInMonth(int month, int year)",
    call: printCall("daysInMonth"),
    starterCode: `int daysInMonth(int month, int year) {
    return 0;
}
`,
    reference: `bool isLeap(int year) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}

int daysInMonth(int month, int year) {
    if (month == 2) return isLeap(year) ? 29 : 28;
    if (month == 4 || month == 6 || month == 9 || month == 11) return 30;
    return 31;
}
`,
    cases: [
      { args: "2, 2024", expected: "29" },
      { args: "2, 1900", expected: "28" },
      { args: "2, 2000", expected: "29" },
      { args: "4, 2023", expected: "30" },
      { args: "12, 2023", expected: "31" },
      { args: "9, 2021", expected: "30" },
      { args: "1, 2021", expected: "31" },
    ],
  },

  // ── Skill 7: Arrays ──────────────────────────────────────────────────────────
  predict(
    "arrays",
    "What does it print? Indexes from other values",
    `#include <iostream>

int main() {
    int a[5] = {4, 8, 15, 16, 23};
    int b[3];
    for (int i = 0; i < 3; i++) b[i] = a[4 - i];
    std::cout << b[0] << " " << b[2] << "\\n";
    a[a[0] - 3] = 99;
    std::cout << a[1] << "\\n";
    std::cout << sizeof(a) / sizeof(a[0]) << "\\n";
}
`,
    "23 15\n99\n5",
  ),
  {
    skill: "arrays",
    rung: 2,
    title: "Fix the array reversal",
    promptMd: `\`solve(a, n)\` should reverse the \`n\` numbers of the array \`a\` in place, then print them separated by spaces. It prints them in their original order. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve(int a[], int n)",
    call: (args) => `{ ${intArray(args)} solve(a, n); }`,
    starterCode: `#include <iostream>

void solve(int a[], int n) {
    for (int i = 0; i < n; i++) {
        int t = a[i];
        a[i] = a[n - 1 - i];
        a[n - 1 - i] = t;
    }
    for (int i = 0; i < n; i++) std::cout << a[i] << " ";
    std::cout << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int a[], int n) {
    for (int i = 0; i < n / 2; i++) {
        int t = a[i];
        a[i] = a[n - 1 - i];
        a[n - 1 - i] = t;
    }
    for (int i = 0; i < n; i++) std::cout << a[i] << " ";
    std::cout << "\\n";
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5}", expected: "5 4 3 2 1" },
      { args: "{10, 20, 30, 40}", expected: "40 30 20 10" },
      { args: "{7, 9}", expected: "9 7" },
      { args: "{6}", expected: "6" },
    ],
  },
  {
    skill: "arrays",
    rung: 3,
    title: "Complete the range counter",
    promptMd: `\`solve(a, n, low, high)\` should print how many of the \`n\` numbers in \`a\` lie between \`low\` and \`high\`, both included. Fill in the body of the loop. ${BOX}`,
    functionSignature: "void solve(int a[], int n, int low, int high)",
    call: (args) =>
      `{ auto run = [](std::initializer_list<int> xs, int low, int high) { int a[16]; int n = 0; for (int x : xs) a[n++] = x; a[n] = 5; solve(a, n, low, high); }; run(${args}); }`,
    starterCode: `#include <iostream>

void solve(int a[], int n, int low, int high) {
    int count = 0;
    for (int i = 0; i < n; i++) {
        // TODO: count a[i] if it is between low and high (both included)
    }
    std::cout << count << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int a[], int n, int low, int high) {
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (a[i] >= low && a[i] <= high) count++;
    }
    std::cout << count << "\\n";
}
`,
    cases: [
      { args: "{3, 8, 5, 10}, 4, 8", expected: "2" },
      { args: "{1, 2, 3}, 1, 3", expected: "3" },
      { args: "{-5, 0, 5}, -1, 1", expected: "1" },
      { args: "{}, 0, 10", expected: "0" },
    ],
  },
  {
    skill: "arrays",
    rung: 4,
    title: "Extend the sum to count above-average numbers",
    promptMd: `\`solve(a, n)\` prints the sum of the \`n\` numbers in \`a\` (n is at least 1). **Extend it** to print, on a second line, how many numbers are greater than the average. The average may have decimals. ${BOX}`,
    functionSignature: "void solve(int a[], int n)",
    call: (args) => `{ ${intArray(args)} solve(a, n); }`,
    starterCode: `#include <iostream>

void solve(int a[], int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) sum += a[i];
    std::cout << sum << "\\n";
}
`,
    reference: `#include <iostream>

void solve(int a[], int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) sum += a[i];
    std::cout << sum << "\\n";
    double average = static_cast<double>(sum) / n;
    int above = 0;
    for (int i = 0; i < n; i++)
        if (a[i] > average) above++;
    std::cout << above << "\\n";
}
`,
    cases: [
      { args: "{2, 4, 6, 8}", expected: "20\n2" },
      { args: "{5, 5, 5}", expected: "15\n0" },
      { args: "{1, 2, 3, 10}", expected: "16\n1" },
      { args: "{-3, -2}", expected: "-5\n1" },
    ],
  },
  {
    skill: "arrays",
    rung: 5,
    title: "Rotate an array left by one",
    promptMd: `\`solve(a, n)\` receives \`n\` numbers (n is at least 1). Move every number one place to the left; the first number goes to the end. Then print the array, numbers separated by spaces. For \`{1, 2, 3, 4}\` print \`2 3 4 1\`. ${BOX}`,
    functionSignature: "void solve(int a[], int n)",
    call: (args) => `{ ${intArray(args)} solve(a, n); }`,
    starterCode: `#include <iostream>

void solve(int a[], int n) {
}
`,
    reference: `#include <iostream>

void solve(int a[], int n) {
    int first = a[0];
    for (int i = 0; i < n - 1; i++) a[i] = a[i + 1];
    a[n - 1] = first;
    for (int i = 0; i < n; i++) std::cout << a[i] << " ";
    std::cout << "\\n";
}
`,
    cases: [
      { args: "{1, 2, 3, 4}", expected: "2 3 4 1" },
      { args: "{9}", expected: "9" },
      { args: "{5, 7}", expected: "7 5" },
      { args: "{3, 3, 8, 1, 6}", expected: "3 8 1 6 3" },
    ],
  },

  // ── Skill 8: Strings ─────────────────────────────────────────────────────────
  predict(
    "strings",
    "What does it print? Comparing and joining strings",
    `#include <iostream>
#include <string>

int main() {
    std::string a = "apple", b = "Apple";
    std::cout << (a < b) << " " << (a == "apple") << "\\n";
    std::string word = "ban";
    word += "ana";
    std::cout << word << " " << word.size() << "\\n";
    word[0] = 'B';
    std::cout << word << "\\n";
    std::cout << word.back() << word.front() << "\\n";
}
`,
    "0 1\nbanana 6\nBanana\naB",
  ),
  {
    skill: "strings",
    rung: 2,
    title: "Fix the palindrome check",
    promptMd: `\`solve(s)\` should print \`yes\` if \`s\` reads the same backwards (like \`level\`) and \`no\` otherwise. It says \`no\` even for \`level\`. **Find the fault and fix it.** ${BOX}`,
    functionSignature: "void solve(std::string s)",
    call: solve,
    starterCode: `#include <iostream>
#include <string>

void solve(std::string s) {
    int n = s.size();
    bool same = true;
    for (int i = 0; i < n / 2; i++)
        if (s[i] != s[n - i]) same = false;
    std::cout << (same ? "yes" : "no") << "\\n";
}
`,
    reference: `#include <iostream>
#include <string>

void solve(std::string s) {
    int n = s.size();
    bool same = true;
    for (int i = 0; i < n / 2; i++)
        if (s[i] != s[n - 1 - i]) same = false;
    std::cout << (same ? "yes" : "no") << "\\n";
}
`,
    cases: [
      { args: '"level"', expected: "yes" },
      { args: '"racecar"', expected: "yes" },
      { args: '"ab"', expected: "no" },
      { args: '"a"', expected: "yes" },
      { args: '"abca"', expected: "no" },
    ],
  },
  {
    skill: "strings",
    rung: 3,
    title: "Complete the space-to-dash converter",
    promptMd: `\`solve(s)\` should print \`s\` with every space replaced by a dash: \`hello world\` becomes \`hello-world\`. Fill in the body of the loop. ${BOX}`,
    functionSignature: "void solve(std::string s)",
    call: solve,
    starterCode: `#include <iostream>
#include <string>

void solve(std::string s) {
    std::string result = "";
    for (int i = 0; i < (int)s.size(); i++) {
        // TODO: add s[i] to result, but add '-' instead of a space
    }
    std::cout << result << "\\n";
}
`,
    reference: `#include <iostream>
#include <string>

void solve(std::string s) {
    std::string result = "";
    for (int i = 0; i < (int)s.size(); i++) {
        if (s[i] == ' ') result += '-';
        else result += s[i];
    }
    std::cout << result << "\\n";
}
`,
    cases: [
      { args: '"hello world"', expected: "hello-world" },
      { args: '"a b c"', expected: "a-b-c" },
      { args: '"nospace"', expected: "nospace" },
      { args: '"x y "', expected: "x-y-" },
    ],
  },
  {
    skill: "strings",
    rung: 4,
    title: "Extend the letter counter",
    promptMd: `\`solve(s)\` prints how many uppercase letters \`s\` has. **Extend it** to print three counts on one line, separated by spaces: uppercase letters, lowercase letters, and digits. For \`Hello World 2026\` print \`2 8 4\`. ${BOX}`,
    functionSignature: "void solve(std::string s)",
    call: solve,
    starterCode: `#include <iostream>
#include <string>

void solve(std::string s) {
    int upper = 0;
    for (int i = 0; i < (int)s.size(); i++)
        if (s[i] >= 'A' && s[i] <= 'Z') upper++;
    std::cout << upper << "\\n";
}
`,
    reference: `#include <iostream>
#include <string>

void solve(std::string s) {
    int upper = 0, lower = 0, digits = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        if (s[i] >= 'A' && s[i] <= 'Z') upper++;
        else if (s[i] >= 'a' && s[i] <= 'z') lower++;
        else if (s[i] >= '0' && s[i] <= '9') digits++;
    }
    std::cout << upper << " " << lower << " " << digits << "\\n";
}
`,
    cases: [
      { args: '"Hello World 2026"', expected: "2 8 4" },
      { args: '"abc"', expected: "0 3 0" },
      { args: '"C++20"', expected: "1 0 2" },
      { args: '""', expected: "0 0 0" },
    ],
  },
  {
    skill: "strings",
    rung: 5,
    title: "Compress repeated letters",
    promptMd: `\`solve(s)\` prints \`s\` compressed: each run of the same letter becomes the letter followed by how many times it repeats. \`aaabbc\` becomes \`a3b2c1\`, and \`aabaa\` becomes \`a2b1a2\`. An empty string prints an empty line. ${BOX}`,
    functionSignature: "void solve(std::string s)",
    call: solve,
    starterCode: `#include <iostream>
#include <string>

void solve(std::string s) {
}
`,
    reference: `#include <iostream>
#include <string>

void solve(std::string s) {
    int n = s.size();
    int i = 0;
    while (i < n) {
        int j = i;
        while (j < n && s[j] == s[i]) j++;
        std::cout << s[i] << j - i;
        i = j;
    }
    std::cout << "\\n";
}
`,
    cases: [
      { args: '"aaabbc"', expected: "a3b2c1" },
      { args: '"abc"', expected: "a1b1c1" },
      { args: '"zzzz"', expected: "z4" },
      { args: '""', expected: "" },
      { args: '"aabaa"', expected: "a2b1a2" },
    ],
  },

  // ── Skill 9: Vectors ─────────────────────────────────────────────────────────
  predict(
    "vectors",
    "What does it print? push_back, pop_back and a 2D grid",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v;
    for (int i = 1; i <= 4; i++) v.push_back(i * i);
    v.pop_back();
    std::cout << v.size() << " " << v.back() << "\\n";
    std::vector<std::vector<int>> grid(2, std::vector<int>(3, 0));
    grid[1][2] = 7;
    grid[0][1] = v[1];
    std::cout << grid[0][1] + grid[1][2] << " " << grid.size() << " " << grid[0].size() << "\\n";
}
`,
    "3 9\n11 2 3",
  ),
  {
    skill: "vectors",
    rung: 2,
    title: "Fix the running totals",
    promptMd: `\`prefixSums(v)\` should return the running totals of \`v\`: for \`{1, 2, 3, 4}\` that's \`{1, 3, 6, 10}\`. Every total comes out one step behind. **Find the fault and fix it.** The tests print the returned numbers separated by spaces.`,
    functionSignature: "std::vector<int> prefixSums(std::vector<int> v)",
    call: (args) => printVector(`prefixSums(${args})`),
    starterCode: `#include <vector>

std::vector<int> prefixSums(std::vector<int> v) {
    std::vector<int> sums;
    int total = 0;
    for (int i = 0; i < (int)v.size(); i++) {
        sums.push_back(total);
        total += v[i];
    }
    return sums;
}
`,
    reference: `#include <vector>

std::vector<int> prefixSums(std::vector<int> v) {
    std::vector<int> sums;
    int total = 0;
    for (int i = 0; i < (int)v.size(); i++) {
        total += v[i];
        sums.push_back(total);
    }
    return sums;
}
`,
    cases: [
      { args: "{1, 2, 3, 4}", expected: "1 3 6 10" },
      { args: "{5}", expected: "5" },
      { args: "{}", expected: "" },
      { args: "{-2, 2, -2}", expected: "-2 0 -2" },
    ],
  },
  {
    skill: "vectors",
    rung: 3,
    title: "Complete the row sums",
    promptMd: `\`rowSums(grid)\` should return the sum of each row of a 2D grid, in order. Rows may have different lengths, and a row may be empty. Fill in the missing loop. The tests print the returned numbers separated by spaces.`,
    functionSignature: "std::vector<int> rowSums(std::vector<std::vector<int>> grid)",
    call: (args) => printVector(`rowSums(${args})`),
    starterCode: `#include <vector>

std::vector<int> rowSums(std::vector<std::vector<int>> grid) {
    std::vector<int> sums;
    for (int r = 0; r < (int)grid.size(); r++) {
        int total = 0;
        // TODO: add every number of row r to total
        sums.push_back(total);
    }
    return sums;
}
`,
    reference: `#include <vector>

std::vector<int> rowSums(std::vector<std::vector<int>> grid) {
    std::vector<int> sums;
    for (int r = 0; r < (int)grid.size(); r++) {
        int total = 0;
        for (int c = 0; c < (int)grid[r].size(); c++) total += grid[r][c];
        sums.push_back(total);
    }
    return sums;
}
`,
    cases: [
      { args: "{{1, 2, 3}, {4, 5, 6}}", expected: "6 15" },
      { args: "{{7}}", expected: "7" },
      { args: "{{1, -1}, {}, {2, 2, 2}}", expected: "0 0 6" },
      { args: "{}", expected: "" },
    ],
  },
  {
    skill: "vectors",
    rung: 4,
    title: "Extend to every position of the maximum",
    promptMd: `\`positionsOfMax(v)\` returns where the largest number of \`v\` first appears, as a one-element vector (or an empty one when \`v\` is empty). **Extend it** to return every position where the largest number appears, in order: for \`{3, 9, 2, 9}\` that's \`{1, 3}\`. The tests print the returned positions separated by spaces.`,
    functionSignature: "std::vector<int> positionsOfMax(std::vector<int> v)",
    call: (args) => printVector(`positionsOfMax(${args})`),
    starterCode: `#include <vector>

std::vector<int> positionsOfMax(std::vector<int> v) {
    std::vector<int> result;
    if (v.empty()) return result;
    int best = 0;
    for (int i = 1; i < (int)v.size(); i++)
        if (v[i] > v[best]) best = i;
    result.push_back(best);
    return result;
}
`,
    reference: `#include <vector>

std::vector<int> positionsOfMax(std::vector<int> v) {
    std::vector<int> result;
    if (v.empty()) return result;
    int best = 0;
    for (int i = 1; i < (int)v.size(); i++)
        if (v[i] > v[best]) best = i;
    for (int i = 0; i < (int)v.size(); i++)
        if (v[i] == v[best]) result.push_back(i);
    return result;
}
`,
    cases: [
      { args: "{3, 9, 2, 9}", expected: "1 3" },
      { args: "{5}", expected: "0" },
      { args: "{}", expected: "" },
      { args: "{-1, -1, -1}", expected: "0 1 2" },
      { args: "{4, 8, 1}", expected: "1" },
    ],
  },
  {
    skill: "vectors",
    rung: 5,
    title: "Merge two sorted lists",
    promptMd: `Write \`std::vector<int> mergeSorted(std::vector<int> a, std::vector<int> b)\`. Both vectors are sorted from smallest to largest; return one sorted vector holding every number of both. Either may be empty. Don't sort the result: walk both vectors at once.\n\nExample: \`mergeSorted({1, 4, 9}, {2, 3, 10})\` returns \`{1, 2, 3, 4, 9, 10}\`. The tests print the returned numbers separated by spaces.\n\n${TASK}`,
    functionSignature: "std::vector<int> mergeSorted(std::vector<int> a, std::vector<int> b)",
    call: (args) => printVector(`mergeSorted(${args})`),
    starterCode: `#include <vector>

std::vector<int> mergeSorted(std::vector<int> a, std::vector<int> b) {
    return {};
}
`,
    reference: `#include <vector>

std::vector<int> mergeSorted(std::vector<int> a, std::vector<int> b) {
    std::vector<int> result;
    int i = 0, j = 0;
    while (i < (int)a.size() && j < (int)b.size()) {
        if (a[i] <= b[j]) result.push_back(a[i++]);
        else result.push_back(b[j++]);
    }
    while (i < (int)a.size()) result.push_back(a[i++]);
    while (j < (int)b.size()) result.push_back(b[j++]);
    return result;
}
`,
    cases: [
      { args: "{1, 4, 9}, {2, 3, 10}", expected: "1 2 3 4 9 10" },
      { args: "{}, {5, 6}", expected: "5 6" },
      { args: "{1, 1}, {1}", expected: "1 1 1" },
      { args: "{}, {}", expected: "" },
      { args: "{-3, 0}, {-5, 7}", expected: "-5 -3 0 7" },
    ],
  },

  // ── Skill 10: References ─────────────────────────────────────────────────────
  predict(
    "references",
    "What does it print? Returning a reference",
    `#include <iostream>

void addTen(int& x) { x += 10; }
void addFive(int x) { x += 5; }

int& bigger(int& a, int& b) {
    if (a > b) return a;
    return b;
}

int main() {
    int p = 1, q = 2;
    addTen(p);
    addFive(q);
    std::cout << p << " " << q << "\\n";
    bigger(p, q) = 0;
    std::cout << p << " " << q << "\\n";
    int& r = q;
    r = p + 3;
    std::cout << q << "\\n";
}
`,
    "11 2\n0 2\n3",
  ),
  {
    skill: "references",
    rung: 2,
    title: "Fix the withdrawal that never happens",
    promptMd: `\`withdraw(balance, amount)\` should take \`amount\` out of the caller's \`balance\` and return \`true\`, or return \`false\` and change nothing when there isn't enough money. It returns \`true\`, but the caller's balance never changes. **Find the fault and fix it.** The tests print what it returns (1 or 0) and the balance afterwards.`,
    functionSignature: "bool withdraw(int& balance, int amount)",
    call: (args) =>
      `{ auto run = [](int start, int amount) { int balance = start; bool ok = withdraw(balance, amount); std::cout << ok << " " << balance << "\\n"; }; run(${args}); }`,
    starterCode: `bool withdraw(int balance, int amount) {
    if (amount > balance) return false;
    balance -= amount;
    return true;
}
`,
    reference: `bool withdraw(int& balance, int amount) {
    if (amount > balance) return false;
    balance -= amount;
    return true;
}
`,
    cases: [
      { args: "100, 30", expected: "1 70" },
      { args: "50, 80", expected: "0 50" },
      { args: "20, 20", expected: "1 0" },
    ],
  },
  {
    skill: "references",
    rung: 3,
    title: "Complete the time splitter",
    promptMd: `\`splitTime(totalSeconds, hours, minutes, seconds)\` should split a number of seconds into hours, minutes and seconds, handing all three back through its reference parameters: 3725 seconds is 1 hour, 2 minutes and 5 seconds. Fill in the missing lines. The tests print the three values.`,
    functionSignature: "void splitTime(int totalSeconds, int& hours, int& minutes, int& seconds)",
    call: (args) => `{ int h = -1, m = -1, s = -1; splitTime(${args}, h, m, s); std::cout << h << " " << m << " " << s << "\\n"; }`,
    starterCode: `void splitTime(int totalSeconds, int& hours, int& minutes, int& seconds) {
    hours = totalSeconds / 3600;
    // TODO: set minutes and seconds from what is left
    minutes = 0;
    seconds = 0;
}
`,
    reference: `void splitTime(int totalSeconds, int& hours, int& minutes, int& seconds) {
    hours = totalSeconds / 3600;
    minutes = totalSeconds % 3600 / 60;
    seconds = totalSeconds % 60;
}
`,
    cases: [
      { args: "3725", expected: "1 2 5" },
      { args: "59", expected: "0 0 59" },
      { args: "7200", expected: "2 0 0" },
      { args: "86399", expected: "23 59 59" },
    ],
  },
  {
    skill: "references",
    rung: 4,
    title: "Extend the division to report the remainder",
    promptMd: `\`divide(a, b, quotient, remainder)\` sets \`quotient\` to a / b. **Extend it**: also set \`remainder\` to a % b, and when \`b\` is 0 set both to 0 instead of dividing. The tests print the quotient and the remainder.`,
    functionSignature: "void divide(int a, int b, int& quotient, int& remainder)",
    call: (args) => `{ int q = -1, r = -1; divide(${args}, q, r); std::cout << q << " " << r << "\\n"; }`,
    starterCode: `void divide(int a, int b, int& quotient, int& remainder) {
    quotient = a / b;
}
`,
    reference: `void divide(int a, int b, int& quotient, int& remainder) {
    if (b == 0) {
        quotient = 0;
        remainder = 0;
        return;
    }
    quotient = a / b;
    remainder = a % b;
}
`,
    cases: [
      { args: "17, 5", expected: "3 2" },
      { args: "20, 4", expected: "5 0" },
      { args: "7, 0", expected: "0 0" },
      { args: "-7, 2", expected: "-3 -1" },
    ],
  },
  {
    skill: "references",
    rung: 5,
    title: "Normalise a clock time",
    promptMd: `Write \`void normalizeTime(int& hours, int& minutes)\`. \`hours\` is 0–23, but \`minutes\` may be any whole number, even negative or above 59. Change both, through the references, into a normal 24-hour time: hours 0–23 and minutes 0–59, carrying whole hours and wrapping around midnight.\n\nExample: hours 22 and minutes 150 become 0 and 30 (24:30 wraps to 00:30). The tests print hours and minutes.\n\n${TASK}`,
    functionSignature: "void normalizeTime(int& hours, int& minutes)",
    call: (args) => `{ int v[] = {${args}}; normalizeTime(v[0], v[1]); std::cout << v[0] << " " << v[1] << "\\n"; }`,
    starterCode: `void normalizeTime(int& hours, int& minutes) {
}
`,
    reference: `void normalizeTime(int& hours, int& minutes) {
    int total = hours * 60 + minutes;
    total = ((total % 1440) + 1440) % 1440;
    hours = total / 60;
    minutes = total % 60;
}
`,
    cases: [
      { args: "10, 75", expected: "11 15" },
      { args: "23, 60", expected: "0 0" },
      { args: "0, -30", expected: "23 30" },
      { args: "5, 0", expected: "5 0" },
      { args: "22, 150", expected: "0 30" },
    ],
  },
];
