// Placement-test reading items (ADR-0012): one predict-the-output program per cpp-basics skill, in
// placement order. Each answer key is the program's real output, checked in the sandbox by
// `pnpm exercises:verify` before the item is ever asked. Seeded content is frozen: to correct an item,
// add a copy with `variant: 1`; the newest verified item of a skill is the one asked.
import { type ExerciseTemplate, predict } from "./cpp-templates.js";

export const cppDiagnosticReading: ExerciseTemplate[] = [
  predict(
    "program-structure",
    "What does it print? Comments and line breaks",
    `#include <iostream>

int main() {
    std::cout << "Ready";
    // std::cout << "\\n";
    std::cout << "Go!" << "\\n";
    std::cout << "A\\nB" << std::endl;
    /* std::cout << "C" << "\\n"; */
    std::cout << "Done" << "\\n";
    return 0;
}
`,
    "ReadyGo!\nA\nB\nDone",
  ),
  predict(
    "variables-and-types",
    "What does it print? Implicit conversions",
    `#include <iostream>

int main() {
    double temperature = -3.8;
    int whole = temperature;
    double back = whole;
    int up = 3.99;
    bool ready = 2;
    std::cout << whole << " " << back << "\\n";
    std::cout << up << " " << ready << "\\n";
}
`,
    "-3 -3\n3 1",
  ),
  predict(
    "operators",
    "What does it print? Negative division and remainder",
    `#include <iostream>

int main() {
    int a = -7, b = 2;
    int q = a / b;
    int r = a % b;
    std::cout << q << " " << r << "\\n";
    std::cout << 7 % -2 << " " << -7 % -2 << "\\n";
    std::cout << q * b + r << "\\n";
}
`,
    "-3 -1\n1 -1\n-7",
  ),
  predict(
    "conditionals",
    "What does it print? Short-circuit conditions",
    `#include <iostream>

int main() {
    int count = 0;
    int x = 4;
    if (x > 5 && ++count > 0) std::cout << "A\\n";
    else std::cout << "not A\\n";
    if (x > 3 || ++count > 0) std::cout << "B\\n";
    if (x % 2 == 0 && ++count > 0) std::cout << "C\\n";
    std::cout << count << "\\n";
}
`,
    "not A\nB\nC\n1",
  ),
  predict(
    "bitwise-operators",
    "What does it print? Bitwise AND, OR, XOR and shifts",
    `#include <iostream>

int main() {
    int a = 12, b = 10;
    std::cout << (a & b) << " " << (a | b) << " " << (a ^ b) << "\\n";
    std::cout << (a << 2) << " " << (a >> 2) << "\\n";
    int x = 6, y = 9;
    std::cout << (x & y) << " " << (x && y) << "\\n";
}
`,
    "8 14 6\n48 3\n0 1",
  ),
  predict(
    "functions",
    "What does it print? Pass by value and return",
    `#include <iostream>

int twice(int x) {
    x = x * 2;
    return x;
}

int main() {
    int x = 4;
    twice(x);
    std::cout << x << "\\n";
    x = twice(x);
    std::cout << x << "\\n";
    std::cout << twice(x) + twice(1) << "\\n";
}
`,
    "4\n8\n18",
  ),
  predict(
    "loops",
    "What does it print? Loop bounds and i--",
    `#include <iostream>

int main() {
    int count = 0;
    for (int i = 0; i <= 10; i += 2) count++;
    std::cout << count << "\\n";

    int i = 5;
    while (i-- > 0) std::cout << i << " ";
    std::cout << "\\n" << i << "\\n";
}
`,
    "6\n4 3 2 1 0\n-1",
  ),
  predict(
    "arrays",
    "What does it print? Indexes, zero-fill and a running sum",
    `#include <iostream>

int main() {
    int a[5] = {3, 1, 4};
    std::cout << a[1] << " " << a[4] << "\\n";
    for (int i = 1; i < 5; i++) a[i] = a[i] + a[i - 1];
    for (int i = 0; i < 5; i++) std::cout << a[i] << " ";
    std::cout << "\\n";
}
`,
    "1 0\n3 4 8 8 8",
  ),
  predict(
    "strings",
    "What does it print? substr, find and indexing",
    `#include <iostream>
#include <string>

int main() {
    std::string s = "keyboard";
    std::cout << s.substr(2, 3) << "\\n";
    std::cout << s.find("oa") << "\\n";
    std::string t;
    for (int i = s.size() - 1; i >= 4; i--) t += s[i];
    std::cout << t << " " << t.size() << "\\n";
}
`,
    "ybo\n4\ndrao 4",
  ),
  predict(
    "lambdas",
    "What does it print? Capture by value and by reference",
    `#include <iostream>

int main() {
    int x = 10;
    auto byValue = [x]() { return x * 2; };
    auto byRef = [&x]() { return x * 2; };
    x = 7;
    std::cout << byValue() << "\\n";
    std::cout << byRef() << "\\n";
    auto add = [&x](int d) { x += d; };
    add(5);
    std::cout << x << " " << byValue() << "\\n";
}
`,
    "20\n14\n12 20",
  ),
  predict(
    "references",
    "What does it print? Copies and references",
    `#include <iostream>

void addTen(int n) { n += 10; }
void addFive(int& n) { n += 5; }

int main() {
    int a = 1, b = 50;
    addTen(a);
    addFive(a);
    std::cout << a << "\\n";
    int& r = a;
    r = b;
    b = 7;
    std::cout << a << " " << b << " " << r << "\\n";
}
`,
    "6\n50 7 50",
  ),
  predict(
    "structs-and-classes",
    "What does it print? Copying objects",
    `#include <iostream>

struct Counter {
    int value = 0;
    void add(int n) { value += n; }
};

void bump(Counter c) { c.add(100); }

int main() {
    Counter a;
    a.add(5);
    Counter b = a;
    b.add(3);
    bump(a);
    std::cout << a.value << " " << b.value << "\\n";
}
`,
    "5 8",
  ),
  predict(
    "vectors",
    "What does it print? Vector constructors and size",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> a(3, 5);
    std::vector<int> b{3, 5};
    a.push_back(1);
    b.pop_back();
    std::cout << a.size() << " " << b.size() << "\\n";
    std::cout << a[0] + a.back() << "\\n";
    std::cout << b[0] << "\\n";
}
`,
    "4 1\n6\n3",
  ),
  predict(
    "container-adaptors",
    "What does it print? Stack and queue order",
    `#include <iostream>
#include <queue>
#include <stack>

int main() {
    std::stack<int> s;
    std::queue<int> q;
    for (int i = 1; i <= 4; i++) {
        s.push(i * 10);
        q.push(i * 10);
    }
    s.pop();
    q.pop();
    std::cout << s.top() << " " << q.front() << "\\n";
    std::cout << s.size() << " " << q.back() << "\\n";
}
`,
    "30 20\n3 40",
  ),
  predict(
    "iterators",
    "What does it print? Walking backwards to begin()",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{2, 4, 6, 8};
    int sum = 0;
    for (auto it = v.end() - 1; it != v.begin(); --it)
        sum += *it;
    std::cout << sum << "\\n";
    auto mid = v.begin() + v.size() / 2;
    std::cout << *mid << " " << (v.end() - mid) << "\\n";
}
`,
    "18\n6 2",
  ),
  predict(
    "pointers",
    "What does it print? Pointer arithmetic",
    `#include <iostream>

int main() {
    int a[] = {10, 20, 30, 40};
    int* p = a + 1;
    *p += 5;
    p += 2;
    std::cout << *p << " " << *(p - 1) << "\\n";
    int* q = a;
    std::cout << *q + 1 << " " << *(q + 1) << "\\n";
    std::cout << p - q << "\\n";
}
`,
    "40 30\n11 25\n3",
  ),
  predict(
    "associative-containers",
    "What does it print? std::map order",
    `#include <iostream>
#include <map>

int main() {
    std::map<int, int> stock;
    stock[30] = 4;
    stock[-5] = 7;
    stock[12] = 2;
    stock[-5] += 3;
    for (auto it = stock.begin(); it != stock.end(); ++it)
        std::cout << it->first << " " << it->second << "\\n";
    std::cout << stock.size() << "\\n";
}
`,
    "-5 10\n12 2\n30 4\n3",
  ),
  predict(
    "dynamic-memory",
    "What does it print? new int(n) vs new int[n]",
    `#include <iostream>

int main() {
    int* a = new int(3);
    int* b = new int[3]{};
    b[*a - 1] = 7;
    for (int i = 0; i < 3; i++) std::cout << b[i] << " ";
    std::cout << *a << "\\n";
    delete a;
    delete[] b;
}
`,
    "0 0 7 3",
  ),
  predict(
    "stl-algorithms",
    "What does it print? Sorting with a comparator",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {15, 3, 22, 41, 8};
    std::sort(v.begin(), v.end(), [](int a, int b) { return a % 10 < b % 10; });
    for (int x : v) std::cout << x << " ";
    std::cout << "\\n";
    auto it = std::find(v.begin(), v.end(), 3);
    std::cout << it - v.begin() << "\\n";
}
`,
    "41 22 3 15 8\n2",
  ),
  predict(
    "smart-pointers",
    "What does it print? shared_ptr owners",
    `#include <iostream>
#include <memory>

int main() {
    auto a = std::make_shared<int>(7);
    auto b = a;
    *b += 1;
    {
        auto c = b;
        std::cout << a.use_count() << "\\n";
    }
    std::cout << *a << " " << a.use_count() << "\\n";
}
`,
    "3\n8 2",
  ),
];
