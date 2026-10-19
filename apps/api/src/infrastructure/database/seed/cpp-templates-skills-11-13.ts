// Hand-written practice for cpp-basics skills 11–13 (pointers, heap memory, structs and classes),
// same rules as cpp-templates.ts. Each exercise uses only its own skill and the skills before it in
// the graph: structs come before loops, so their exercises have none.
import { type ExerciseTemplate, predict, TASK } from "./cpp-templates.js";

// The case's numbers in a fixed-size array, then a sentinel just past the end, so code that
// walks one element too far picks it up.
const intArray = (list: string, sentinel = 1000) =>
  `int a[16]; int n = 0; for (int x : std::initializer_list<int>${list}) a[n++] = x; a[n] = ${sentinel};`;

export const templatesSkills11to13: ExerciseTemplate[] = [
  // ── Skill 11: Pointers ───────────────────────────────────────────────────────
  predict(
    "pointers",
    "What does it print? Re-pointing a pointer",
    `#include <iostream>

int main() {
    int a = 5, b = 8;
    int* p = &a;
    *p = 6;
    p = &b;
    *p += a;
    std::cout << a << " " << b << "\\n";
    int* q = nullptr;
    std::cout << (q == nullptr) << " " << (p == &b) << "\\n";
    int** pp = &p;
    **pp = 1;
    std::cout << b << "\\n";
}
`,
    "6 14\n1 1\n1",
  ),
  {
    skill: "pointers",
    rung: 2,
    title: "Fix the swap through pointers",
    promptMd: `\`swapThrough(a, b)\` should swap the two numbers that \`a\` and \`b\` point to. After calling it, the numbers are unchanged. **Find the fault and fix it.** The tests print both numbers afterwards.`,
    functionSignature: "void swapThrough(int* a, int* b)",
    call: (args) => `{ int v[] = {${args}}; swapThrough(&v[0], &v[1]); std::cout << v[0] << " " << v[1] << "\\n"; }`,
    starterCode: `void swapThrough(int* a, int* b) {
    int* t = a;
    a = b;
    b = t;
}
`,
    reference: `void swapThrough(int* a, int* b) {
    int t = *a;
    *a = *b;
    *b = t;
}
`,
    cases: [
      { args: "1, 2", expected: "2 1" },
      { args: "5, 5", expected: "5 5" },
      { args: "-3, 9", expected: "9 -3" },
    ],
  },
  {
    skill: "pointers",
    rung: 3,
    title: "Complete the pointer to the largest",
    promptMd: `\`largest(first, last)\` should return a pointer to the largest number in the range from \`first\` up to (not including) \`last\`, or \`nullptr\` if the range is empty. If the largest number appears more than once, point at the first one. Fill in the body of the loop. The tests print the number and its position, or \`none\`.`,
    functionSignature: "int* largest(int* first, int* last)",
    call: (args) =>
      `{ ${intArray(args)} int* m = largest(a, a + n); if (m == nullptr) std::cout << "none\\n"; else std::cout << *m << " at " << (m - a) << "\\n"; }`,
    starterCode: `int* largest(int* first, int* last) {
    if (first == last) return nullptr;
    int* best = first;
    for (int* p = first + 1; p != last; ++p) {
        // TODO: move best to p when *p is larger
    }
    return best;
}
`,
    reference: `int* largest(int* first, int* last) {
    if (first == last) return nullptr;
    int* best = first;
    for (int* p = first + 1; p != last; ++p) {
        if (*p > *best) best = p;
    }
    return best;
}
`,
    cases: [
      { args: "{3, 9, 4}", expected: "9 at 1" },
      { args: "{7}", expected: "7 at 0" },
      { args: "{}", expected: "none" },
      { args: "{2, 5, 5, 1}", expected: "5 at 1" },
      { args: "{-4, -1, -9}", expected: "-1 at 1" },
    ],
  },
  {
    skill: "pointers",
    rung: 4,
    title: "Extend the counter to clear what it counts",
    promptMd: `\`countValue(first, last, target)\` returns how many numbers from \`first\` up to (not including) \`last\` equal \`target\`. **Extend it** so it also sets each of those numbers to 0, through the pointer. The tests print the count, a colon, then the array.`,
    functionSignature: "int countValue(int* first, int* last, int target)",
    call: (args) =>
      `{ auto run = [](std::initializer_list<int> xs, int target) { int a[16]; int n = 0; for (int x : xs) a[n++] = x; a[n] = target; int count = countValue(a, a + n, target); std::cout << count << ':'; for (int i = 0; i < n; i++) std::cout << ' ' << a[i]; std::cout << "\\n"; }; run(${args}); }`,
    starterCode: `int countValue(int* first, int* last, int target) {
    int count = 0;
    for (int* p = first; p != last; ++p)
        if (*p == target) count++;
    return count;
}
`,
    reference: `int countValue(int* first, int* last, int target) {
    int count = 0;
    for (int* p = first; p != last; ++p)
        if (*p == target) {
            count++;
            *p = 0;
        }
    return count;
}
`,
    cases: [
      { args: "{1, 2, 1, 3}, 1", expected: "2: 0 2 0 3" },
      { args: "{4, 5}, 9", expected: "0: 4 5" },
      { args: "{7, 7, 7}, 7", expected: "3: 0 0 0" },
      { args: "{}, 1", expected: "0:" },
    ],
  },
  {
    skill: "pointers",
    rung: 5,
    title: "Find a pair with a given sum",
    promptMd: `Write \`bool findPair(int* first, int* last, int target, int& a, int& b)\`. The numbers from \`first\` up to (not including) \`last\` are sorted from smallest to largest. Find two of them, at different positions, that add up to \`target\`: put the smaller one in \`a\`, the other in \`b\`, and return \`true\`. If several pairs work, use the one with the smallest \`a\`. If none does, return \`false\`. Use two pointers moving towards each other.\n\nExample: for \`{1, 3, 4, 6, 9}\` and target 10, \`a\` is 1 and \`b\` is 9. The tests print \`a b\`, or \`none\`.\n\n${TASK}`,
    functionSignature: "bool findPair(int* first, int* last, int target, int& a, int& b)",
    call: (args) =>
      `{ auto run = [](std::initializer_list<int> xs, int target) { int arr[16]; int n = 0; for (int x : xs) arr[n++] = x; arr[n] = 1000; int a = 0, b = 0; if (findPair(arr, arr + n, target, a, b)) std::cout << a << ' ' << b << "\\n"; else std::cout << "none\\n"; }; run(${args}); }`,
    starterCode: `bool findPair(int* first, int* last, int target, int& a, int& b) {
    return false;
}
`,
    reference: `bool findPair(int* first, int* last, int target, int& a, int& b) {
    if (first == last) return false;
    int* left = first;
    int* right = last - 1;
    while (left < right) {
        int sum = *left + *right;
        if (sum == target) {
            a = *left;
            b = *right;
            return true;
        }
        if (sum < target) ++left;
        else --right;
    }
    return false;
}
`,
    cases: [
      { args: "{1, 3, 4, 6, 9}, 10", expected: "1 9" },
      { args: "{2, 5, 8}, 20", expected: "none" },
      { args: "{}, 1", expected: "none" },
      { args: "{-3, 0, 3, 7}, 0", expected: "-3 3" },
      { args: "{5, 5}, 10", expected: "5 5" },
      { args: "{5}, 10", expected: "none" },
    ],
  },

  // ── Skill 12: Heap memory ────────────────────────────────────────────────────
  predict(
    "dynamic-memory",
    "What does it print? Two pointers to one heap int",
    `#include <iostream>

int main() {
    int* a = new int(3);
    int* b = a;
    *b = 7;
    std::cout << *a << "\\n";
    delete a;
    a = nullptr;
    int* arr = new int[4]{1, 2, 3, 4};
    int* mid = arr + 2;
    std::cout << mid[1] << " " << (a == nullptr) << "\\n";
    delete[] arr;
}
`,
    "7\n4 1",
  ),
  {
    skill: "dynamic-memory",
    rung: 2,
    title: "Fix the range that loses its last number",
    promptMd: `\`range(from, to, size)\` should return a new heap array holding every whole number from \`from\` to \`to\`, both included (\`from\` ≤ \`to\`), and set \`size\` to how many there are. It always loses the last number. **Find the fault and fix it.** The tests print the numbers, then free the array with \`delete[]\`.`,
    functionSignature: "int* range(int from, int to, int& size)",
    call: (args) =>
      `{ auto run = [](int from, int to) { int size = -1; int* a = range(from, to, size); for (int i = 0; i < size; i++) std::cout << a[i] << ' '; std::cout << "\\n"; delete[] a; }; run(${args}); }`,
    starterCode: `int* range(int from, int to, int& size) {
    size = to - from;
    int* a = new int[size];
    for (int i = 0; i < size; i++) a[i] = from + i;
    return a;
}
`,
    reference: `int* range(int from, int to, int& size) {
    size = to - from + 1;
    int* a = new int[size];
    for (int i = 0; i < size; i++) a[i] = from + i;
    return a;
}
`,
    cases: [
      { args: "1, 5", expected: "1 2 3 4 5" },
      { args: "3, 3", expected: "3" },
      { args: "-2, 1", expected: "-2 -1 0 1" },
    ],
  },
  {
    skill: "dynamic-memory",
    rung: 3,
    title: "Complete the reversed copy",
    promptMd: `\`copyReversed(a, n)\` should return a new heap array holding the \`n\` numbers of \`a\` in reverse order, leaving \`a\` itself unchanged. Fill in the line inside the loop. The tests print the copy, then free it with \`delete[]\`.`,
    functionSignature: "int* copyReversed(int* a, int n)",
    call: (args) =>
      `{ ${intArray(args)} int* r = copyReversed(a, n); for (int i = 0; i < n; i++) std::cout << r[i] << ' '; std::cout << "\\n"; delete[] r; }`,
    starterCode: `int* copyReversed(int* a, int n) {
    int* result = new int[n];
    for (int i = 0; i < n; i++) {
        // TODO: fill result so it holds a backwards
        result[i] = 0;
    }
    return result;
}
`,
    reference: `int* copyReversed(int* a, int n) {
    int* result = new int[n];
    for (int i = 0; i < n; i++) {
        result[i] = a[n - 1 - i];
    }
    return result;
}
`,
    cases: [
      { args: "{1, 2, 3}", expected: "3 2 1" },
      { args: "{9}", expected: "9" },
      { args: "{}", expected: "" },
      { args: "{4, -4, 0, 8}", expected: "8 0 -4 4" },
    ],
  },
  {
    skill: "dynamic-memory",
    rung: 4,
    title: "Extend to drop repeated numbers",
    promptMd: `\`positives(a, n, size)\` returns a new heap array with the positive numbers of \`a\`, in order, and sets \`size\` to how many it kept. **Extend it** to keep each positive number only once: \`{3, -1, 3, 5, 0, 5}\` gives \`{3, 5}\`. The tests print the kept numbers, then free the array with \`delete[]\`.`,
    functionSignature: "int* positives(int* a, int n, int& size)",
    call: (args) =>
      `{ ${intArray(args)} int size = -1; int* r = positives(a, n, size); for (int i = 0; i < size; i++) std::cout << r[i] << ' '; std::cout << "\\n"; delete[] r; }`,
    starterCode: `int* positives(int* a, int n, int& size) {
    int* result = new int[n];
    size = 0;
    for (int i = 0; i < n; i++)
        if (a[i] > 0) result[size++] = a[i];
    return result;
}
`,
    reference: `int* positives(int* a, int n, int& size) {
    int* result = new int[n];
    size = 0;
    for (int i = 0; i < n; i++) {
        if (a[i] <= 0) continue;
        bool seen = false;
        for (int j = 0; j < size; j++)
            if (result[j] == a[i]) seen = true;
        if (!seen) result[size++] = a[i];
    }
    return result;
}
`,
    cases: [
      { args: "{3, -1, 3, 5, 0, 5}", expected: "3 5" },
      { args: "{1, 2}", expected: "1 2" },
      { args: "{-1, -2}", expected: "" },
      { args: "{}", expected: "" },
      { args: "{7, 7, 7}", expected: "7" },
    ],
  },
  {
    skill: "dynamic-memory",
    rung: 5,
    title: "Build a multiplication table on the heap",
    promptMd: `Write \`int** makeTable(int n)\` that builds an n × n multiplication table on the heap: row \`r\`, column \`c\` (both counting from 0) holds (r + 1) × (c + 1). Allocate an array of \`n\` row pointers, and each row with its own \`new int[n]\`: the tests print the table, then free every row with \`delete[]\` and then the row pointers. \`n\` may be 0.\n\nExample: \`makeTable(3)\` gives the rows \`1 2 3\`, \`2 4 6\` and \`3 6 9\`.\n\n${TASK}`,
    functionSignature: "int** makeTable(int n)",
    call: (args) =>
      `{ int n = ${args}; int** t = makeTable(n); for (int r = 0; r < n; r++) { for (int c = 0; c < n; c++) std::cout << t[r][c] << ' '; std::cout << "\\n"; delete[] t[r]; } delete[] t; }`,
    starterCode: `int** makeTable(int n) {
    return nullptr;
}
`,
    reference: `int** makeTable(int n) {
    int** table = new int*[n];
    for (int r = 0; r < n; r++) {
        table[r] = new int[n];
        for (int c = 0; c < n; c++) table[r][c] = (r + 1) * (c + 1);
    }
    return table;
}
`,
    cases: [
      { args: "3", expected: "1 2 3\n2 4 6\n3 6 9" },
      { args: "1", expected: "1" },
      { args: "4", expected: "1 2 3 4\n2 4 6 8\n3 6 9 12\n4 8 12 16" },
      { args: "0", expected: "" },
    ],
  },

  // ── Skill 13: Structs and classes ────────────────────────────────────────────
  predict(
    "structs-and-classes",
    "What does it print? Constructors and member functions",
    `#include <iostream>

struct Counter {
    int value = 0;
    int step;
    Counter(int s) : step(s) {}
    void tick() { value += step; }
};

int main() {
    Counter a(2);
    Counter b(5);
    a.tick();
    a.tick();
    b.tick();
    std::cout << a.value << " " << b.value << "\\n";
    b.step = -1;
    b.tick();
    std::cout << b.value << " " << a.step << "\\n";
}
`,
    "4 5\n4 2",
  ),
  {
    skill: "structs-and-classes",
    rung: 2,
    title: "Fix the constructor that forgets its values",
    promptMd: `\`Point(x, y)\` should store its two coordinates, and \`manhattan()\` should return |x| + |y|. Every point comes out as (0, 0). **Find the fault and fix it.** The tests build a point and print x, y and \`manhattan()\`.`,
    functionSignature: "struct Point { int x; int y; Point(int x, int y); int manhattan(); }",
    call: (args) => `{ Point p(${args}); std::cout << p.x << " " << p.y << " " << p.manhattan() << "\\n"; }`,
    starterCode: `struct Point {
    int x = 0;
    int y = 0;

    Point(int x, int y) {
        x = x;
        y = y;
    }

    int manhattan() {
        return (x < 0 ? -x : x) + (y < 0 ? -y : y);
    }
};
`,
    reference: `struct Point {
    int x = 0;
    int y = 0;

    Point(int x, int y) : x(x), y(y) {}

    int manhattan() {
        return (x < 0 ? -x : x) + (y < 0 ? -y : y);
    }
};
`,
    cases: [
      { args: "3, -4", expected: "3 -4 7" },
      { args: "0, 0", expected: "0 0 0" },
      { args: "-2, -5", expected: "-2 -5 7" },
    ],
  },
  {
    skill: "structs-and-classes",
    rung: 3,
    title: "Complete the thermometer",
    promptMd: `\`Thermometer\` keeps a temperature in Celsius. Complete \`fahrenheit()\` so it returns the same temperature in Fahrenheit (C × 9 / 5 + 32). The tests create a thermometer, warm it, and print \`celsius()\` and \`fahrenheit()\`.`,
    functionSignature: "class Thermometer { Thermometer(double celsius); double celsius() const; double fahrenheit() const; void warm(double degrees); }",
    call: (args) =>
      `{ auto run = [](double start, double warmBy) { Thermometer t(start); t.warm(warmBy); std::cout << t.celsius() << " " << t.fahrenheit() << "\\n"; }; run(${args}); }`,
    starterCode: `class Thermometer {
public:
    Thermometer(double celsius) : celsius_(celsius) {}

    double celsius() const { return celsius_; }

    double fahrenheit() const {
        // TODO: convert celsius_ to Fahrenheit
        return 0;
    }

    void warm(double degrees) { celsius_ += degrees; }

private:
    double celsius_;
};
`,
    reference: `class Thermometer {
public:
    Thermometer(double celsius) : celsius_(celsius) {}

    double celsius() const { return celsius_; }

    double fahrenheit() const {
        return celsius_ * 9 / 5 + 32;
    }

    void warm(double degrees) { celsius_ += degrees; }

private:
    double celsius_;
};
`,
    cases: [
      { args: "20, 5", expected: "25 77" },
      { args: "0, 0", expected: "0 32" },
      { args: "-40, 0", expected: "-40 -40" },
      { args: "36, 1", expected: "37 98.6" },
    ],
  },
  {
    skill: "structs-and-classes",
    rung: 4,
    title: "Extend the tally with best and count",
    promptMd: `\`Tally\` adds up points and \`total()\` works. **Extend it** so \`best()\` returns the largest single amount added so far, and \`count()\` returns how many times \`add\` was called; both are 0 before anything is added. Amounts can be negative. The tests add each number and print \`total()\`, \`best()\` and \`count()\`.`,
    functionSignature: "class Tally { void add(int points); int total() const; int best() const; int count() const; }",
    call: (args) =>
      `{ Tally t; for (int x : std::initializer_list<int>${args}) t.add(x); std::cout << t.total() << " " << t.best() << " " << t.count() << "\\n"; }`,
    starterCode: `class Tally {
public:
    void add(int points) {
        total_ += points;
    }

    int total() const { return total_; }
    int best() const { return 0; }   // not tracked yet
    int count() const { return 0; }  // not tracked yet

private:
    int total_ = 0;
};
`,
    reference: `class Tally {
public:
    void add(int points) {
        total_ += points;
        if (count_ == 0 || points > best_) best_ = points;
        count_++;
    }

    int total() const { return total_; }
    int best() const { return best_; }
    int count() const { return count_; }

private:
    int total_ = 0;
    int best_ = 0;
    int count_ = 0;
};
`,
    cases: [
      { args: "{5, 12, 3}", expected: "20 12 3" },
      { args: "{}", expected: "0 0 0" },
      { args: "{-4, -1}", expected: "-5 -1 2" },
      { args: "{7}", expected: "7 7 1" },
    ],
  },
  {
    skill: "structs-and-classes",
    rung: 5,
    title: "Build a clock-time class",
    promptMd: `Write a class \`Time\` for a 24-hour clock: \`Time(int hours, int minutes)\` starts it at a valid time, \`addMinutes(int minutes)\` moves it forward (minutes ≥ 0, wrapping past midnight), and \`print()\` prints it as \`HH:MM\` with leading zeros, then a line break.\n\nExample: a clock at 23:30 plus 45 minutes prints \`00:15\`.\n\nThe tests create a clock, add minutes once and call \`print()\`.`,
    functionSignature: "class Time { Time(int hours, int minutes); void addMinutes(int minutes); void print(); }",
    call: (args) => `{ auto run = [](int h, int m, int add) { Time t(h, m); t.addMinutes(add); t.print(); }; run(${args}); }`,
    starterCode: `#include <iostream>

class Time {
public:
    Time(int hours, int minutes) {}
    void addMinutes(int minutes) {}
    void print() {}
};
`,
    reference: `#include <iostream>

class Time {
public:
    Time(int hours, int minutes) : total_(hours * 60 + minutes) {}

    void addMinutes(int minutes) { total_ = (total_ + minutes) % 1440; }

    void print() {
        int h = total_ / 60, m = total_ % 60;
        if (h < 10) std::cout << '0';
        std::cout << h << ':';
        if (m < 10) std::cout << '0';
        std::cout << m << "\\n";
    }

private:
    int total_;
};
`,
    cases: [
      { args: "9, 5, 0", expected: "09:05" },
      { args: "23, 30, 45", expected: "00:15" },
      { args: "0, 0, 1439", expected: "23:59" },
      { args: "12, 0, 60", expected: "13:00" },
      { args: "22, 50, 2890", expected: "23:00" },
    ],
  },
];
