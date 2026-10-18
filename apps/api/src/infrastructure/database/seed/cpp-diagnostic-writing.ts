// Placement-test code tasks (ADR-0012): one small function per cpp-basics skill, in placement order.
// An AC vouches for the skill and everything below it, so each task makes the learner use the
// skill's direct prerequisites too. Verified in the sandbox like practice exercises (reference
// passes, starter fails). Frozen: to correct one, add a copy with `variant: 1`.
import type { ExerciseTemplate } from "./cpp-templates.js";

const TASK = "Write the function. Hidden tests call it with other inputs too, so don't hard-code the example.";

export const cppDiagnosticWriting: ExerciseTemplate[] = [
  {
    skill: "program-structure",
    rung: 5,
    title: "Print a two-line receipt",
    promptMd: `Write \`void receipt(std::string item, int price)\` that prints two lines: \`Bought: \` followed by the item, then \`Paid: \` followed by the price and the word \`rupees\`.\n\nExample: \`receipt("Pen", 20)\` prints:\n\n\`\`\`\nBought: Pen\nPaid: 20 rupees\n\`\`\`\n\n${TASK}`,
    functionSignature: "void receipt(std::string item, int price)",
    call: (args) => `receipt(${args});`,
    starterCode: `#include <iostream>
#include <string>

void receipt(std::string item, int price) {
}
`,
    reference: `#include <iostream>
#include <string>

void receipt(std::string item, int price) {
    std::cout << "Bought: " << item << "\\n";
    std::cout << "Paid: " << price << " rupees" << "\\n";
}
`,
    cases: [
      { args: `"Pen", 20`, expected: "Bought: Pen\nPaid: 20 rupees" },
      { args: `"School bag", 1450`, expected: "Bought: School bag\nPaid: 1450 rupees" },
      { args: `"Free sticker", 0`, expected: "Bought: Free sticker\nPaid: 0 rupees" },
    ],
  },
  {
    skill: "variables-and-types",
    rung: 5,
    title: "Volume of a box",
    promptMd: `Write \`long long volume(int length, int width, int height)\` that returns the volume of a box: length × width × height. Each side is between 0 and 100,000, so the volume can be far bigger than an \`int\` can hold.\n\nExample: \`volume(2, 3, 4)\` returns \`24\`.\n\n${TASK}`,
    functionSignature: "long long volume(int length, int width, int height)",
    call: (args) => `std::cout << volume(${args}) << "\\n";`,
    starterCode: `long long volume(int length, int width, int height) {
    return 0;
}
`,
    reference: `long long volume(int length, int width, int height) {
    return 1LL * length * width * height;
}
`,
    cases: [
      { args: "2, 3, 4", expected: "24" },
      { args: "100000, 100000, 100000", expected: "1000000000000000" },
      { args: "0, 500, 700", expected: "0" },
      { args: "2000, 3000, 1000", expected: "6000000000" },
    ],
  },
  {
    skill: "operators",
    rung: 5,
    title: "Divide and round up",
    promptMd: `Write \`int ceilDiv(int a, int b)\` that returns \`a\` divided by \`b\`, **rounded up** to a whole number. For example, 7 students in cars that seat 2 need 4 cars. \`a\` is between 0 and 1,000,000,000 and \`b\` is between 1 and 1,000,000,000.\n\nExample: \`ceilDiv(7, 2)\` returns \`4\`.\n\n${TASK}`,
    functionSignature: "int ceilDiv(int a, int b)",
    call: (args) => `std::cout << ceilDiv(${args}) << "\\n";`,
    starterCode: `int ceilDiv(int a, int b) {
    return 0;
}
`,
    reference: `int ceilDiv(int a, int b) {
    return (a + b - 1) / b;
}
`,
    cases: [
      { args: "7, 2", expected: "4" },
      { args: "12, 4", expected: "3" },
      { args: "0, 5", expected: "0" },
      { args: "1000000000, 3", expected: "333333334" },
    ],
  },
  {
    skill: "conditionals",
    rung: 5,
    title: "Letter grade",
    promptMd: `Write \`std::string grade(int score)\` that returns the letter grade for a score from 0 to 100: \`"A"\` for 90 and above, \`"B"\` for 75 to 89, \`"C"\` for 50 to 74, and \`"F"\` below 50.\n\nExample: \`grade(75)\` returns \`"B"\`.\n\n${TASK}`,
    functionSignature: "std::string grade(int score)",
    call: (args) => `std::cout << grade(${args}) << "\\n";`,
    starterCode: `#include <string>

std::string grade(int score) {
    return "";
}
`,
    reference: `#include <string>

std::string grade(int score) {
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 50) return "C";
    return "F";
}
`,
    cases: [
      { args: "75", expected: "B" },
      { args: "90", expected: "A" },
      { args: "50", expected: "C" },
      { args: "49", expected: "F" },
    ],
  },
  {
    skill: "bitwise-operators",
    rung: 5,
    title: "Extract a group of bits",
    promptMd: `Write \`unsigned getBits(unsigned x, int pos, int len)\` that returns the \`len\` bits of \`x\` starting at bit \`pos\` (bit 0 is the lowest), read as a number on their own. 0 ≤ pos ≤ 16 and 1 ≤ len ≤ 15.\n\nExample: 182 is \`10110110\` in binary. Bits 2 to 4 are \`101\`, so \`getBits(182, 2, 3)\` returns \`5\`.\n\n${TASK}`,
    functionSignature: "unsigned getBits(unsigned x, int pos, int len)",
    call: (args) => `std::cout << getBits(${args}) << "\\n";`,
    starterCode: `unsigned getBits(unsigned x, int pos, int len) {
    return 0;
}
`,
    reference: `unsigned getBits(unsigned x, int pos, int len) {
    unsigned mask = (1u << len) - 1;
    return (x >> pos) & mask;
}
`,
    cases: [
      { args: "182, 2, 3", expected: "5" },
      { args: "4660, 4, 8", expected: "35" },
      { args: "1024, 10, 1", expected: "1" },
      { args: "0, 5, 3", expected: "0" },
    ],
  },
  {
    skill: "functions",
    rung: 5,
    title: "Greatest common divisor",
    promptMd: `Write \`int gcd(int a, int b)\` that returns the greatest common divisor of \`a\` and \`b\`: the largest number that divides both. 0 ≤ a, b ≤ 1,000,000,000 and they are never both 0.\n\nUseful facts: \`gcd(a, 0)\` is \`a\`, and \`gcd(a, b)\` equals \`gcd(b, a % b)\`.\n\nExample: \`gcd(12, 18)\` returns \`6\`.\n\n${TASK}`,
    functionSignature: "int gcd(int a, int b)",
    call: (args) => `std::cout << gcd(${args}) << "\\n";`,
    starterCode: `int gcd(int a, int b) {
    return 0;
}
`,
    reference: `int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}
`,
    cases: [
      { args: "12, 18", expected: "6" },
      { args: "17, 5", expected: "1" },
      { args: "0, 9", expected: "9" },
      { args: "7, 0", expected: "7" },
    ],
  },
  {
    skill: "loops",
    rung: 5,
    title: "Count the divisors",
    promptMd: `Write \`int countDivisors(int n)\` that returns how many whole numbers from 1 to \`n\` divide \`n\` exactly (with no remainder). 1 ≤ n ≤ 100,000.\n\nExample: the divisors of 12 are 1, 2, 3, 4, 6 and 12, so \`countDivisors(12)\` returns \`6\`.\n\n${TASK}`,
    functionSignature: "int countDivisors(int n)",
    call: (args) => `std::cout << countDivisors(${args}) << "\\n";`,
    starterCode: `int countDivisors(int n) {
    return 0;
}
`,
    reference: `int countDivisors(int n) {
    int count = 0;
    for (int i = 1; i <= n; i++)
        if (n % i == 0) count++;
    return count;
}
`,
    cases: [
      { args: "12", expected: "6" },
      { args: "1", expected: "1" },
      { args: "36", expected: "9" },
      { args: "97", expected: "2" },
    ],
  },
  {
    skill: "arrays",
    rung: 5,
    title: "Largest element of an array",
    promptMd: `Write \`int maxOf(const int a[], int n)\` that returns the largest of the first \`n\` elements of \`a\`. 1 ≤ n ≤ 1000, and the elements may be negative.\n\nExample: for the array \`{4, 9, 2, 7}\` (so n = 4), \`maxOf\` returns \`9\`.\n\n${TASK}`,
    functionSignature: "int maxOf(const int a[], int n)",
    call: (args) => `{ int a[] = ${args}; std::cout << maxOf(a, int(std::size(a))) << "\\n"; }`,
    starterCode: `int maxOf(const int a[], int n) {
    return 0;
}
`,
    reference: `int maxOf(const int a[], int n) {
    int best = a[0];
    for (int i = 1; i < n; i++)
        if (a[i] > best) best = a[i];
    return best;
}
`,
    cases: [
      { args: "{4, 9, 2, 7}", expected: "9" },
      { args: "{-5, -2, -8}", expected: "-2" },
      { args: "{6}", expected: "6" },
      { args: "{1, 3, 5, 8}", expected: "8" },
    ],
  },
  // `std::string s` by value, not the proposed const&: references is not an ancestor of strings.
  // Counting needs a loop over the characters, so loops (the prerequisite) cannot be skipped. The reference
  // indexes rather than using range-for, which is taught in iterators, not an ancestor.
  {
    skill: "strings",
    rung: 5,
    title: "Count the vowels",
    promptMd: `Write \`int countVowels(std::string s)\` that returns how many vowels are in \`s\`. The vowels are a, e, i, o and u, in lower or upper case; every other character (including \`y\`, spaces and digits) is not a vowel.\n\nExample: \`countVowels("Hello World")\` returns \`3\`.\n\n${TASK}`,
    functionSignature: "int countVowels(std::string s)",
    call: (args) => `std::cout << countVowels(${args}) << "\\n";`,
    starterCode: `#include <string>

int countVowels(std::string s) {
    return 0;
}
`,
    reference: `#include <string>

int countVowels(std::string s) {
    std::string vowels = "aeiouAEIOU";
    int count = 0;
    for (int i = 0; i < s.size(); i++)
        if (vowels.find(s[i]) != std::string::npos) count++;
    return count;
}
`,
    cases: [
      { args: `"Hello World"`, expected: "3" },
      { args: `"AEIOU are vowels"`, expected: "9" },
      { args: `""`, expected: "0" },
      { args: `"Yearly Idea"`, expected: "5" },
    ],
  },
  // compose(f, g), not adder(k): adder's body was one return, so an AC said nothing about functions (the
  // prerequisite). Here the learner calls functions it was passed and feeds one's result into the other.
  // No loop for the learner (repeat-n-times was the alternative): loops is not an ancestor of lambdas.
  // The harness builds the compositions in a loop so both reuse one stack slot: a lambda that captured
  // f and g by reference then reads the second pair and fails (two plain calls let -O2 hide it).
  {
    skill: "lambdas",
    rung: 5,
    title: "Compose two functions",
    promptMd: `Write \`compose(f, g)\` that returns a new function (use a lambda) which, given \`x\`, returns \`f(g(x))\`: it applies \`g\` first, then \`f\` to the result. Each returned function must keep its own \`f\` and \`g\`: the tests build several at once.\n\nThe tests are given \`a, b, x\`, pass \`f(v) = v + a\` and \`g(v) = v * b\`, and print \`compose(f, g)(x)\`.\n\nExample: for \`1, 10, 4\`, \`g(4)\` is 40 and \`f(40)\` is 41, so it prints \`41\`.\n\n${TASK}`,
    functionSignature: "std::function<int(int)> compose(std::function<int(int)> f, std::function<int(int)> g)",
    call: (args) => {
      const [a, b, x] = args.split(", ");
      return `{ int as[] = {${a}, 1000}, bs[] = {${b}, 1000}; std::function<int(int)> h[2]; for (int i = 0; i < 2; i++) { int a = as[i], b = bs[i]; h[i] = compose([a](int v) { return v + a; }, [b](int v) { return v * b; }); } std::cout << h[0](${x}) << "\\n"; }`;
    },
    starterCode: `#include <functional>

std::function<int(int)> compose(std::function<int(int)> f, std::function<int(int)> g) {
    return {};
}
`,
    reference: `#include <functional>

std::function<int(int)> compose(std::function<int(int)> f, std::function<int(int)> g) {
    return [f, g](int x) { return f(g(x)); };
}
`,
    cases: [
      { args: "1, 10, 4", expected: "41" },
      { args: "-3, 2, 5", expected: "7" },
      { args: "0, 1, 9", expected: "9" },
      { args: "5, 0, 123", expected: "5" },
    ],
  },
  // Starter and shown signature take copies on purpose: given `int&`, the learner would never choose a
  // reference, and by-value (this skill's usual mistake) could not be written. The placement test shows
  // functionSignature, so it must not carry the `&` either; the reference solution does. It returns a bool,
  // not void like a plain swap, so the learner uses parameters and a return value together (functions is
  // the prerequisite) and a by-value answer cannot pass on the printed flag alone.
  {
    skill: "references",
    rung: 5,
    title: "Put two variables in order",
    promptMd: `Write \`sortPair(a, b)\` so that it puts the caller's two \`int\` variables in ascending order. If \`a\` is greater than \`b\`, it swaps them (the caller's \`a\` then holds the old \`b\` and the caller's \`b\` the old \`a\`) and returns \`true\`. Otherwise it leaves both unchanged and returns \`false\`. You may change the parameter list.\n\nThe tests are given \`a, b\`, call \`sortPair(a, b)\` on two variables holding them, then print \`a b\` followed by \`swapped\` or \`kept\` (what \`sortPair\` returned).\n\nExample: for \`8, 3\`, after the call \`a\` is 3 and \`b\` is 8 and it returned \`true\`, so it prints \`3 8 swapped\`.\n\n${TASK}`,
    functionSignature: "bool sortPair(int a, int b)",
    call: (args) => {
      const [a, b] = args.split(", ");
      return `{ int a = ${a}, b = ${b}; bool swapped = sortPair(a, b); std::cout << a << " " << b << " " << (swapped ? "swapped" : "kept") << "\\n"; }`;
    },
    starterCode: `bool sortPair(int a, int b) {
    return false;
}
`,
    reference: `bool sortPair(int& a, int& b) {
    if (a <= b) return false;
    int old = a;
    a = b;
    b = old;
    return true;
}
`,
    cases: [
      { args: "8, 3", expected: "3 8 swapped" },
      { args: "-2, 9", expected: "-2 9 kept" },
      { args: "7, 7", expected: "7 7 kept" },
      { args: "0, -100", expected: "-100 0 swapped" },
    ],
  },
  // A class with a constructor and three member functions, not Point::distanceTo(): that was one return
  // expression in a given method, so an AC said little about functions (the prerequisite). Here the learner
  // writes four function bodies that share the object's state, and adds the data member itself.
  {
    skill: "structs-and-classes",
    rung: 5,
    title: "An account that cannot go negative",
    promptMd: `Complete \`class Account\`, a bank account whose balance never goes below zero. Add whatever data members you need.\n\n- \`Account(start)\` opens it holding \`start\`.\n- \`deposit(amount)\` adds \`amount\`.\n- \`withdraw(amount)\` takes \`amount\` out and returns \`true\` if the balance is large enough; otherwise it changes nothing and returns \`false\`.\n- \`balance()\` returns the money now in the account.\n\nThe tests are given \`start, d, w\`, create \`Account acc(start)\`, call \`acc.deposit(d)\` and then \`acc.withdraw(w)\`, and print \`ok\` or \`refused\` (what \`withdraw\` returned) followed by \`acc.balance()\`.\n\nExample: for \`100, 20, 50\`, the account holds 120 after the deposit and the withdrawal succeeds, so it prints \`ok 70\`.\n\n${TASK}`,
    functionSignature: "class Account { public: Account(int start); void deposit(int amount); bool withdraw(int amount); int balance() const; };",
    call: (args) => {
      const [s, d, w] = args.split(", ");
      return `{ Account acc(${s}); acc.deposit(${d}); bool ok = acc.withdraw(${w}); std::cout << (ok ? "ok" : "refused") << " " << acc.balance() << "\\n"; }`;
    },
    starterCode: `class Account {
public:
    Account(int start) {}
    void deposit(int amount) {}
    bool withdraw(int amount) {
        return false;
    }
    int balance() const {
        return 0;
    }
};
`,
    reference: `class Account {
public:
    Account(int start) { money = start; }
    void deposit(int amount) { money += amount; }
    bool withdraw(int amount) {
        if (amount > money) return false;
        money -= amount;
        return true;
    }
    int balance() const { return money; }

private:
    int money;
};
`,
    cases: [
      { args: "100, 20, 50", expected: "ok 70" },
      { args: "10, 5, 30", expected: "refused 15" },
      { args: "40, 10, 50", expected: "ok 0" },
      { args: "0, 0, 1", expected: "refused 0" },
    ],
  },
  {
    skill: "vectors",
    rung: 5,
    title: "Keep the even numbers",
    promptMd: `Write \`std::vector<int> evens(const int a[], int n)\` that returns a new vector holding only the even numbers among the \`n\` numbers of the array \`a\`, in their original order. The numbers may include zero and negatives; zero is even. \`n\` may be 0. If there are no even numbers, return an empty vector.\n\nExample: for the array \`{3, 8, -2, 7, 0}\` (so \`n = 5\`), \`evens\` returns \`{8, -2, 0}\`. The tests print the returned numbers separated by spaces.\n\n${TASK}`,
    // An array plus its length, not a vector: arrays and functions are the direct prerequisites, so the
    // learner must index a passed array and build the vector. No const&: references is not an ancestor.
    functionSignature: "std::vector<int> evens(const int a[], int n)",
    // 1000 sits just past the n numbers and is even, so a loop that runs to i <= n returns it.
    call: (args) =>
      `{ int a[16]; int n = 0; for (int x : std::initializer_list<int>${args}) a[n++] = x; a[n] = 1000; for (int x : evens(a, n)) std::cout << x << ' '; std::cout << "\\n"; }`,
    starterCode: `#include <vector>

std::vector<int> evens(const int a[], int n) {
    return {};
}
`,
    reference: `#include <vector>

std::vector<int> evens(const int a[], int n) {
    std::vector<int> result;
    for (int i = 0; i < n; i++)
        if (a[i] % 2 == 0) result.push_back(a[i]);
    return result;
}
`,
    cases: [
      { args: "{3, 8, -2, 7, 0}", expected: "8 -2 0" },
      { args: "{-3, 5, 4, -6, 9}", expected: "4 -6" },
      { args: "{}", expected: "" },
      { args: "{10}", expected: "10" },
    ],
  },
  {
    skill: "container-adaptors",
    rung: 5,
    title: "Load a stack so it pops in order",
    promptMd: `Write \`std::stack<int> toStack(std::vector<int> v)\` that returns a stack holding every number of \`v\`, arranged so that popping the stack gives the numbers back in their original order: \`v[0]\` must be on top. \`v\` may be empty.\n\nExample: \`toStack({4, 9, 1, 7})\` returns a stack with 4 on top and 7 at the bottom. The tests pop the returned stack until it is empty and print the numbers separated by spaces, here \`4 9 1 7\`.\n\n${TASK}`,
    // Vector in, stack out: the learner must read a vector (the direct prerequisite) and push into a
    // stack, and only a last-in-first-out push order passes. A stack-in, vector-out task never makes them push.
    functionSignature: "std::stack<int> toStack(std::vector<int> v)",
    call: (args) =>
      `{ std::stack<int> s = toStack(${args}); while (!s.empty()) { std::cout << s.top() << ' '; s.pop(); } std::cout << "\\n"; }`,
    starterCode: `#include <stack>
#include <vector>

std::stack<int> toStack(std::vector<int> v) {
    return {};
}
`,
    reference: `#include <stack>
#include <vector>

std::stack<int> toStack(std::vector<int> v) {
    std::stack<int> s;
    for (int i = int(v.size()) - 1; i >= 0; i--)
        s.push(v[i]);
    return s;
}
`,
    cases: [
      { args: "{4, 9, 1, 7}", expected: "4 9 1 7" },
      { args: "{6, -2, 6, 0}", expected: "6 -2 6 0" },
      { args: "{}", expected: "" },
      { args: "{8}", expected: "8" },
    ],
  },
  {
    skill: "iterators",
    rung: 5,
    title: "Copy from the first negative",
    promptMd: `Write \`fromFirstNegative(first, last)\`. It receives an iterator range \`[first, last)\` inside a \`std::vector<int>\` and returns a new \`std::vector<int>\` holding the numbers of the range from its first negative number up to \`last\`, in order. Zero is not negative. If the range has no negative number, return an empty vector.\n\nExample: for \`v = {3, 0, -4, 8, -1}\`, \`fromFirstNegative(v.begin(), v.end())\` returns \`{-4, 8, -1}\`. The tests print the returned numbers separated by spaces.\n\n${TASK}`,
    // Iterator pair in, vector out: the learner must walk iterators and build a vector, the direct
    // prerequisite. No std::vector<int>&: references is not an ancestor of iterators.
    functionSignature: "std::vector<int> fromFirstNegative(std::vector<int>::iterator first, std::vector<int>::iterator last)",
    // 1000 sits at `last`, so a loop that reads *last or copies one step too far prints it or crashes.
    call: (args) =>
      `{ std::vector<int> v = ${args}; v.push_back(1000); for (int x : fromFirstNegative(v.begin(), v.end() - 1)) std::cout << x << ' '; std::cout << "\\n"; }`,
    starterCode: `#include <vector>

std::vector<int> fromFirstNegative(std::vector<int>::iterator first, std::vector<int>::iterator last) {
    return {};
}
`,
    reference: `#include <vector>

std::vector<int> fromFirstNegative(std::vector<int>::iterator first, std::vector<int>::iterator last) {
    while (first != last && *first >= 0)
        ++first;
    return std::vector<int>(first, last);
}
`,
    cases: [
      { args: "{3, 0, -4, 8, -1}", expected: "-4 8 -1" },
      { args: "{-7}", expected: "-7" },
      { args: "{5, 1, 9}", expected: "" },
      { args: "{}", expected: "" },
    ],
  },
  {
    skill: "pointers",
    rung: 5,
    title: "Clamp an array through pointers",
    promptMd: `Write \`void clampAll(int* first, int* last, int limit, int& changed)\`. \`first\` points to the first number of an array and \`last\` points just past its last number; the array may be empty. Replace every number greater than \`limit\` with \`limit\`, in the array itself, and add 1 to \`changed\` for each number you replace (\`changed\` starts at 0). Numbers equal to \`limit\` stay as they are.\n\nExample: for the array \`{4, 12, -3, 9}\` and \`limit = 8\`, the array becomes \`{4, 8, -3, 8}\` and \`changed\` ends at 2. The tests print \`changed\`, a colon, then the array: here \`2: 4 8 -3 8\`.\n\n${TASK}`,
    // Walks an array through a pointer range and reports through a reference: both direct prerequisites
    // (arrays, references) are used. Not doubleAll(int* a, int n): a[i] passes with arrays alone.
    functionSignature: "void clampAll(int* first, int* last, int limit, int& changed)",
    // 1000 sits just past `last` and above every limit, so a loop that runs one step too far changes it and miscounts.
    call: (args) =>
      `{ auto run = [](std::initializer_list<int> xs, int limit) { int a[16]; int n = 0; for (int x : xs) a[n++] = x; a[n] = 1000; int changed = 0; clampAll(a, a + n, limit, changed); std::cout << changed << ':'; for (int i = 0; i < n; i++) std::cout << ' ' << a[i]; std::cout << "\\n"; }; run(${args}); }`,
    starterCode: `void clampAll(int* first, int* last, int limit, int& changed) {
}
`,
    reference: `void clampAll(int* first, int* last, int limit, int& changed) {
    for (int* p = first; p != last; ++p)
        if (*p > limit) {
            *p = limit;
            ++changed;
        }
}
`,
    cases: [
      { args: "{4, 12, -3, 9}, 8", expected: "2: 4 8 -3 8" },
      { args: "{5, 9, 5}, 5", expected: "1: 5 5 5" },
      { args: "{-1, -6}, -4", expected: "1: -4 -6" },
      { args: "{}, 3", expected: "0:" },
    ],
  },
  {
    skill: "associative-containers",
    rung: 5,
    title: "Find the cheapest item",
    promptMd: `Write \`std::map<std::string, int>::const_iterator cheapest(const std::map<std::string, int>& prices)\`. \`prices\` maps item names to prices. It returns an iterator to the entry with the **lowest price**. If several entries share the lowest price, return the one that comes first in the map. If \`prices\` is empty, return \`prices.end()\`.\n\nThe tests print the entry as \`name price\`, or \`none\` for \`end()\`. Example: for \`{{"pear", 4}, {"fig", 6}, {"kiwi", 3}}\` it returns an iterator to \`kiwi\`, printed as \`kiwi 3\`.\n\n${TASK}`,
    functionSignature: "std::map<std::string, int>::const_iterator cheapest(const std::map<std::string, int>& prices)",
    call: (args) =>
      `{ const std::map<std::string, int> m = ${args}; auto it = cheapest(m); if (it == m.end()) std::cout << "none\\n"; else std::cout << it->first << ' ' << it->second << "\\n"; }`,
    starterCode: `#include <map>
#include <string>

std::map<std::string, int>::const_iterator cheapest(const std::map<std::string, int>& prices) {
    return prices.end();
}
`,
    reference: `#include <map>
#include <string>

std::map<std::string, int>::const_iterator cheapest(const std::map<std::string, int>& prices) {
    auto best = prices.begin();
    for (auto it = prices.begin(); it != prices.end(); ++it)
        if (it->second < best->second) best = it;
    return best;
}
`,
    cases: [
      { args: '{{"pear", 4}, {"fig", 6}, {"kiwi", 3}}', expected: "kiwi 3" },
      { args: '{{"pear", 2}, {"lime", 5}, {"apple", 2}}', expected: "apple 2" },
      { args: "{}", expected: "none" },
      { args: '{{"melon", 5000}, {"grape", 7000}}', expected: "melon 5000" },
    ],
  },
  {
    skill: "dynamic-memory",
    rung: 5,
    title: "Grow a heap array by one",
    promptMd: `Write \`int* pushBack(int* a, int n, int x)\`. \`a\` points to a heap array of \`n\` ints made with \`new[]\` (it is \`nullptr\` when \`n\` is 0). The function creates a new heap array one element longer, copies the \`n\` values into it, puts \`x\` at the end, frees the old array with \`delete[]\` and returns a pointer to the new array.\n\nThe tests start from \`nullptr\` with \`n = 0\`, call \`pushBack\` once per value, then print the array. Example: pushing \`4\`, \`1\`, \`7\` in turn gives \`4 1 7\`.\n\n${TASK}`,
    functionSignature: "int* pushBack(int* a, int n, int x)",
    call: (args) =>
      `{ int* a = nullptr; int n = 0; for (int x : {${args}}) { a = pushBack(a, n, x); n++; } for (int i = 0; i < n; i++) std::cout << a[i] << ' '; std::cout << "\\n"; delete[] a; }`,
    starterCode: `int* pushBack(int* a, int n, int x) {
    return nullptr;
}
`,
    reference: `int* pushBack(int* a, int n, int x) {
    int* b = new int[n + 1];
    for (int i = 0; i < n; i++) b[i] = a[i];
    b[n] = x;
    delete[] a;
    return b;
}
`,
    cases: [
      { args: "4, 1, 7", expected: "4 1 7" },
      { args: "5", expected: "5" },
      { args: "0, -3, 0, 12, -3", expected: "0 -3 0 12 -3" },
      {
        args: Array.from({ length: 1000 }, (_, i) => i + 1).join(", "),
        expected: Array.from({ length: 1000 }, (_, i) => i + 1).join(" "),
      },
    ],
  },
  {
    skill: "stl-algorithms",
    rung: 5,
    title: "Sort by distance, split near from far",
    promptMd: `Write \`std::vector<int>::iterator splitByDistance(std::vector<int>& v, int target, int maxDist)\`. It sorts \`v\` in place so that numbers closer to \`target\` come first; if two numbers are equally far from \`target\`, the **larger** one comes first. Then it returns an iterator to the first number that is **more than** \`maxDist\` away from \`target\`, or \`v.end()\` if there is none. Use \`std::sort\`.\n\nThe tests print the numbers before the returned iterator, then \`|\`, then the rest. Example: with \`v = {7, 1, 4, 10}\`, \`target = 5\` and \`maxDist = 2\`, \`v\` becomes \`{4, 7, 1, 10}\` and the iterator points at the \`1\`, printed as \`4 7 | 1 10\`.\n\n${TASK}`,
    functionSignature: "std::vector<int>::iterator splitByDistance(std::vector<int>& v, int target, int maxDist)",
    call: (args) =>
      `{ auto run = [](std::vector<int> v, int target, int maxDist) { auto far = splitByDistance(v, target, maxDist); for (auto p = v.begin(); p != far; ++p) std::cout << *p << ' '; std::cout << "| "; for (auto p = far; p != v.end(); ++p) std::cout << *p << ' '; std::cout << "\\n"; }; run(${args}); }`,
    starterCode: `#include <algorithm>
#include <cstdlib>
#include <vector>

std::vector<int>::iterator splitByDistance(std::vector<int>& v, int target, int maxDist) {
    return v.end();
}
`,
    reference: `#include <algorithm>
#include <cstdlib>
#include <vector>

std::vector<int>::iterator splitByDistance(std::vector<int>& v, int target, int maxDist) {
    auto dist = [target](int x) { return std::abs(x - target); };
    std::sort(v.begin(), v.end(), [&](int a, int b) {
        return dist(a) != dist(b) ? dist(a) < dist(b) : a > b;
    });
    return std::find_if(v.begin(), v.end(), [&](int x) { return dist(x) > maxDist; });
}
`,
    cases: [
      { args: "{7, 1, 4, 10}, 5, 2", expected: "4 7 | 1 10" },
      { args: "{7, 3, 9, 5}, 5, 2", expected: "5 7 3 | 9" },
      { args: "{0, -4, 3, -1}, -2, 0", expected: "| -1 0 -4 3" },
      { args: "{}, 3, 1", expected: "|" },
    ],
  },
  {
    skill: "smart-pointers",
    rung: 5,
    title: "Own a heap array inside a struct",
    promptMd: `\`Scores\` owns \`n\` ints in a heap array through \`vals\`. Complete \`int sum() const\`, which returns the total of the \`n\` values, and write \`std::unique_ptr<Scores> makeScores(const int* src, int n)\`. It creates a \`Scores\` on the heap, gives it a new heap array of \`n\` ints holding a copy of the \`n\` values at \`src\`, and returns it owned by a \`std::unique_ptr\`.\n\nThe tests print the values, then \`sum\` and the result of \`sum()\`. Example: for the values \`{3, 1, 4}\` it prints \`3 1 4 sum 8\`.\n\n${TASK}`,
    functionSignature: "struct Scores { int n; std::unique_ptr<int[]> vals; int sum() const; }; std::unique_ptr<Scores> makeScores(const int* src, int n)",
    call: (args) =>
      `{ auto run = [](std::initializer_list<int> v) { std::unique_ptr<Scores> s = makeScores(v.begin(), (int)v.size()); if (!s) { std::cout << "empty\\n"; return; } for (int i = 0; i < s->n; i++) std::cout << s->vals[i] << ' '; std::cout << "sum " << s->sum() << "\\n"; }; run(${args}); }`,
    starterCode: `#include <memory>

struct Scores {
    int n;
    std::unique_ptr<int[]> vals;
    int sum() const { return 0; }
};

std::unique_ptr<Scores> makeScores(const int* src, int n) {
    return nullptr;
}
`,
    reference: `#include <memory>

struct Scores {
    int n;
    std::unique_ptr<int[]> vals;
    int sum() const {
        int total = 0;
        for (int i = 0; i < n; i++) total += vals[i];
        return total;
    }
};

std::unique_ptr<Scores> makeScores(const int* src, int n) {
    auto s = std::make_unique<Scores>();
    s->n = n;
    s->vals = std::make_unique<int[]>(n);
    for (int i = 0; i < n; i++) s->vals[i] = src[i];
    return s;
}
`,
    cases: [
      { args: "{3, 1, 4}", expected: "3 1 4 sum 8" },
      { args: "{-5}", expected: "-5 sum -5" },
      { args: "{}", expected: "sum 0" },
      { args: "{10, -2, 7, 0, 5}", expected: "10 -2 7 0 5 sum 20" },
    ],
  },
];
