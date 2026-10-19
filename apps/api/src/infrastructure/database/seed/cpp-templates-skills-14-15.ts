// Hand-written practice for cpp-basics skills 14–15 (smart pointers, iterators), same rules as
// cpp-templates.ts. Each exercise uses only its own skill and the skills before it in the graph:
// iterators come before references.
import { type ExerciseTemplate, predict, TASK } from "./cpp-templates.js";

const printVector = (expr: string) => `{ for (int x : ${expr}) std::cout << x << ' '; std::cout << "\\n"; }`;

export const templatesSkills14to15: ExerciseTemplate[] = [
  // ── Skill 14: Smart pointers ─────────────────────────────────────────────────
  predict(
    "smart-pointers",
    "What does it print? Moving a unique_ptr",
    `#include <iostream>
#include <memory>

struct Lamp {
    int id;
    Lamp(int i) : id(i) { std::cout << "on " << id << "\\n"; }
    ~Lamp() { std::cout << "off " << id << "\\n"; }
};

int main() {
    std::unique_ptr<Lamp> a = std::make_unique<Lamp>(1);
    std::unique_ptr<Lamp> b = std::move(a);
    std::cout << (a == nullptr) << " " << b->id << "\\n";
    b = std::make_unique<Lamp>(2);
    std::cout << "end\\n";
}
`,
    "on 1\n1 1\non 2\noff 1\nend\noff 2",
  ),
  {
    skill: "smart-pointers",
    rung: 2,
    title: "Fix the pointer that never frees",
    promptMd: `\`clear(p)\` should empty \`p\` **and** free the \`Node\` it owned. \`p\` does end up empty, but the node is never freed: \`Node::alive\` counts the nodes still in memory, and it stays at 1. **Find the fault and fix it.** The tests print whether \`p\` is empty (1 or 0) and \`Node::alive\`.`,
    functionSignature: "void clear(std::unique_ptr<Node>& p)",
    call: (args) =>
      `{ std::unique_ptr<Node> p; if (${args} != 0) p = std::make_unique<Node>(${args}); clear(p); std::cout << (p == nullptr) << " " << Node::alive << "\\n"; }`,
    starterCode: `#include <memory>

struct Node {
    static int alive;
    int value;
    Node(int v) : value(v) { alive++; }
    ~Node() { alive--; }
};
int Node::alive = 0;

void clear(std::unique_ptr<Node>& p) {
    p.release();
}
`,
    reference: `#include <memory>

struct Node {
    static int alive;
    int value;
    Node(int v) : value(v) { alive++; }
    ~Node() { alive--; }
};
int Node::alive = 0;

void clear(std::unique_ptr<Node>& p) {
    p.reset();
}
`,
    cases: [
      { args: "5", expected: "1 0" },
      { args: "0", expected: "1 0" },
      { args: "-3", expected: "1 0" },
    ],
  },
  {
    skill: "smart-pointers",
    rung: 3,
    title: "Complete the linked list's pushFront",
    promptMd: `A list is a chain of \`Link\`s, each owning the next through a \`std::unique_ptr\`. \`pushFront(head, value)\` should put a new link holding \`value\` at the front, keeping the rest of the list after it. Fill in the missing line. The tests push each number in turn and print the list from the front.`,
    functionSignature: "void pushFront(std::unique_ptr<Link>& head, int value)",
    call: (args) =>
      `{ std::unique_ptr<Link> head; for (int x : std::initializer_list<int>${args}) pushFront(head, x); for (Link* p = head.get(); p != nullptr; p = p->next.get()) std::cout << p->value << ' '; std::cout << "\\n"; }`,
    starterCode: `#include <memory>

struct Link {
    int value = 0;
    std::unique_ptr<Link> next;
};

void pushFront(std::unique_ptr<Link>& head, int value) {
    auto link = std::make_unique<Link>();
    link->value = value;
    // TODO: hang the old list after the new link
    head = std::move(link);
}
`,
    reference: `#include <memory>

struct Link {
    int value = 0;
    std::unique_ptr<Link> next;
};

void pushFront(std::unique_ptr<Link>& head, int value) {
    auto link = std::make_unique<Link>();
    link->value = value;
    link->next = std::move(head);
    head = std::move(link);
}
`,
    cases: [
      { args: "{1, 2, 3}", expected: "3 2 1" },
      { args: "{5}", expected: "5" },
      { args: "{}", expected: "" },
      { args: "{4, 4, 9}", expected: "9 4 4" },
    ],
  },
  {
    skill: "smart-pointers",
    rung: 4,
    title: "Extend the list sum",
    promptMd: `\`sum(head, count)\` adds up the values of a list of \`Link\`s, following each \`next\` with \`.get()\`. **Extend it**: leave negative values out of the total, and set \`count\` to the number of links in the list (negative ones included). The tests build the list and print the total and \`count\`.`,
    functionSignature: "int sum(const Link* head, int& count)",
    call: (args) =>
      `{ std::initializer_list<int> xs = ${args}; std::unique_ptr<Link> head; for (auto it = std::rbegin(xs); it != std::rend(xs); ++it) { auto link = std::make_unique<Link>(); link->value = *it; link->next = std::move(head); head = std::move(link); } int count = -1; int total = sum(head.get(), count); std::cout << total << " " << count << "\\n"; }`,
    starterCode: `#include <memory>

struct Link {
    int value = 0;
    std::unique_ptr<Link> next;
};

int sum(const Link* head, int& count) {
    int total = 0;
    for (const Link* p = head; p != nullptr; p = p->next.get())
        total += p->value;
    return total;
}
`,
    reference: `#include <memory>

struct Link {
    int value = 0;
    std::unique_ptr<Link> next;
};

int sum(const Link* head, int& count) {
    int total = 0;
    count = 0;
    for (const Link* p = head; p != nullptr; p = p->next.get()) {
        if (p->value >= 0) total += p->value;
        count++;
    }
    return total;
}
`,
    cases: [
      { args: "{3, -2, 5}", expected: "8 3" },
      { args: "{}", expected: "0 0" },
      { args: "{-1, -1}", expected: "0 2" },
      { args: "{10}", expected: "10 1" },
    ],
  },
  {
    skill: "smart-pointers",
    rung: 5,
    title: "Build a stack from unique_ptr links",
    promptMd: `Write a class \`Stack\` of ints on a chain of nodes owned by \`std::unique_ptr\` (no \`std::stack\`, no \`new\` or \`delete\`): \`push(value)\`, \`pop()\` (only called when not empty), \`top()\`, \`empty()\` and \`size()\`.\n\nThe tests read a list of numbers: a non-zero number is pushed; a 0 pops and prints the top, or prints \`empty\` if there's nothing to pop. Finally they print \`|\` and the size. For \`{1, 2, 0, 3, 0, 0, 0}\` that's \`2 3 1 empty | 0\`.`,
    functionSignature: "class Stack { void push(int value); void pop(); int top() const; bool empty() const; int size() const; }",
    call: (args) =>
      `{ Stack s; for (int op : std::initializer_list<int>${args}) { if (op != 0) s.push(op); else if (s.empty()) std::cout << "empty "; else { std::cout << s.top() << ' '; s.pop(); } } std::cout << "| " << s.size() << "\\n"; }`,
    starterCode: `#include <memory>

class Stack {
public:
    void push(int value) {}
    void pop() {}
    int top() const { return 0; }
    bool empty() const { return true; }
    int size() const { return 0; }
};
`,
    reference: `#include <memory>

class Stack {
public:
    void push(int value) {
        auto node = std::make_unique<Node>();
        node->value = value;
        node->below = std::move(top_);
        top_ = std::move(node);
        size_++;
    }

    void pop() {
        top_ = std::move(top_->below);
        size_--;
    }

    int top() const { return top_->value; }
    bool empty() const { return top_ == nullptr; }
    int size() const { return size_; }

private:
    struct Node {
        int value = 0;
        std::unique_ptr<Node> below;
    };
    std::unique_ptr<Node> top_;
    int size_ = 0;
};
`,
    cases: [
      { args: "{1, 2, 0, 3, 0, 0, 0}", expected: "2 3 1 empty | 0" },
      { args: "{5, 6}", expected: "| 2" },
      { args: "{0}", expected: "empty | 0" },
      { args: "{4, 0, 7}", expected: "4 | 1" },
      { args: "{-1, -2, 0}", expected: "-2 | 1" },
    ],
  },

  // ── Skill 15: Iterators ──────────────────────────────────────────────────────
  predict(
    "iterators",
    "What does it print? Moving an iterator",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {5, 10, 15, 20};
    auto it = v.begin();
    it += 2;
    std::cout << *it << " " << (it - v.begin()) << "\\n";
    for (int x : v) x = 0;
    std::cout << v[0] << "\\n";
    for (auto p = v.begin(); p != v.end(); ++p) *p += 1;
    std::cout << v.front() << " " << *(v.end() - 1) << "\\n";
}
`,
    "15 2\n5\n6 21",
  ),
  {
    skill: "iterators",
    rung: 2,
    title: "Fix the iterator that skips the first number",
    promptMd: `\`countAtLeast(first, last, limit)\` should count the numbers from \`first\` up to (not including) \`last\` that are at least \`limit\`. It never counts the first number. **Find the fault and fix it.** The tests print what it returns.`,
    functionSignature: "int countAtLeast(std::vector<int>::iterator first, std::vector<int>::iterator last, int limit)",
    call: (args) =>
      `{ auto run = [](std::vector<int> v, int limit) { v.push_back(1000); std::cout << countAtLeast(v.begin(), v.end() - 1, limit) << "\\n"; }; run(${args}); }`,
    starterCode: `#include <vector>

int countAtLeast(std::vector<int>::iterator first, std::vector<int>::iterator last, int limit) {
    int count = 0;
    while (first != last) {
        ++first;
        if (first != last && *first >= limit) count++;
    }
    return count;
}
`,
    reference: `#include <vector>

int countAtLeast(std::vector<int>::iterator first, std::vector<int>::iterator last, int limit) {
    int count = 0;
    while (first != last) {
        if (*first >= limit) count++;
        ++first;
    }
    return count;
}
`,
    cases: [
      { args: "{7, 2, 9}, 5", expected: "2" },
      { args: "{1, 2}, 5", expected: "0" },
      { args: "{}, 0", expected: "0" },
      { args: "{5, 5, 5}, 5", expected: "3" },
    ],
  },
  {
    skill: "iterators",
    rung: 3,
    title: "Complete the search with iterators",
    promptMd: `\`findFirst(first, last, target)\` should return an iterator to the first number equal to \`target\` from \`first\` up to (not including) \`last\`, or \`last\` if there is none. Fill in the body of the loop. The tests print the position found, or \`not found\`.`,
    functionSignature: "std::vector<int>::iterator findFirst(std::vector<int>::iterator first, std::vector<int>::iterator last, int target)",
    call: (args) =>
      `{ auto run = [](std::vector<int> v, int target) { auto it = findFirst(v.begin(), v.end(), target); if (it == v.end()) std::cout << "not found\\n"; else std::cout << "at " << (it - v.begin()) << "\\n"; }; run(${args}); }`,
    starterCode: `#include <vector>

std::vector<int>::iterator findFirst(std::vector<int>::iterator first, std::vector<int>::iterator last, int target) {
    for (auto it = first; it != last; ++it) {
        // TODO: return it when it points at target
    }
    return last;
}
`,
    reference: `#include <vector>

std::vector<int>::iterator findFirst(std::vector<int>::iterator first, std::vector<int>::iterator last, int target) {
    for (auto it = first; it != last; ++it) {
        if (*it == target) return it;
    }
    return last;
}
`,
    cases: [
      { args: "{4, 8, 8, 1}, 8", expected: "at 1" },
      { args: "{3}, 9", expected: "not found" },
      { args: "{}, 1", expected: "not found" },
      { args: "{2, 2}, 2", expected: "at 0" },
    ],
  },
  {
    skill: "iterators",
    rung: 4,
    title: "Extend the range description",
    promptMd: `\`describe(first, last)\` prints how many numbers lie from \`first\` up to (not including) \`last\`. **Extend it** to print, on the same line, the first and the last number of the range, or the word \`empty\` when the range has none. For \`{4, 1, 9}\` print \`3 4 9\`.`,
    functionSignature: "void describe(std::vector<int>::iterator first, std::vector<int>::iterator last)",
    call: (args) => `{ std::vector<int> v = ${args}; v.push_back(1000); describe(v.begin(), v.end() - 1); }`,
    starterCode: `#include <iostream>
#include <vector>

void describe(std::vector<int>::iterator first, std::vector<int>::iterator last) {
    std::cout << (last - first) << "\\n";
}
`,
    reference: `#include <iostream>
#include <vector>

void describe(std::vector<int>::iterator first, std::vector<int>::iterator last) {
    std::cout << (last - first);
    if (first == last) std::cout << " empty";
    else std::cout << " " << *first << " " << *(last - 1);
    std::cout << "\\n";
}
`,
    cases: [
      { args: "{4, 1, 9}", expected: "3 4 9" },
      { args: "{7}", expected: "1 7 7" },
      { args: "{}", expected: "0 empty" },
      { args: "{-2, 0}", expected: "2 -2 0" },
    ],
  },
  {
    skill: "iterators",
    rung: 5,
    title: "Collapse repeated runs",
    promptMd: `Write \`std::vector<int> collapseRuns(std::vector<int>::iterator first, std::vector<int>::iterator last)\` that returns the numbers of the range with every run of equal neighbours collapsed into one: \`{1, 1, 2, 2, 2, 3, 1}\` gives \`{1, 2, 3, 1}\`. Numbers that repeat later, after a different one, stay.\n\nThe tests print the returned numbers separated by spaces.\n\n${TASK}`,
    functionSignature: "std::vector<int> collapseRuns(std::vector<int>::iterator first, std::vector<int>::iterator last)",
    call: (args) => `{ std::vector<int> v = ${args}; ${printVector("collapseRuns(v.begin(), v.end())")} }`,
    starterCode: `#include <vector>

std::vector<int> collapseRuns(std::vector<int>::iterator first, std::vector<int>::iterator last) {
    return {};
}
`,
    reference: `#include <vector>

std::vector<int> collapseRuns(std::vector<int>::iterator first, std::vector<int>::iterator last) {
    std::vector<int> result;
    for (auto it = first; it != last; ++it)
        if (result.empty() || result.back() != *it) result.push_back(*it);
    return result;
}
`,
    cases: [
      { args: "{1, 1, 2, 2, 2, 3, 1}", expected: "1 2 3 1" },
      { args: "{}", expected: "" },
      { args: "{5}", expected: "5" },
      { args: "{4, 4, 4}", expected: "4" },
      { args: "{1, 2, 1, 2}", expected: "1 2 1 2" },
    ],
  },
];
