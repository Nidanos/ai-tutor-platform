import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, LIST, LIST_NODE, showCall } from "../dsa-exercises/harness.js";

const listCall = (fn: string) => (args: string) => `gen::showList(gen::withList(${fn}, ${args}));`;

// {1, key, value}: put, {2, key, 0}: get. The test prints what each get returns.
const LRU_DRIVER = String.raw`
namespace gen {
std::vector<int> driveLru(int capacity, const std::vector<std::array<int, 3>>& ops) {
    LRUCache cache(capacity);
    std::vector<int> out;
    for (auto [type, key, value] : ops) {
        if (type == 1) cache.put(key, value);
        else out.push_back(cache.get(key));
    }
    return out;
}
std::vector<std::array<int, 3>> lruOps(std::uint64_t seed, int count, int keys) {
    state = seed;
    std::vector<std::array<int, 3>> ops(count);
    for (auto& op : ops) op = {(int)between(1, 2), (int)between(1, keys), (int)between(0, 1000000)};
    return ops;
}
}  // namespace gen
`;

const MERGE = (body: string) => `${LIST_NODE}

ListNode* mergeLists(ListNode* a, ListNode* b) {
${body}
}
`;

export const linearStructures: ExerciseTemplate[] = [
  // ── linked-lists ──
  predict(
    "linked-lists",
    "What does it print? Pushing, inserting, unlinking",
    `#include <iostream>

struct Node {
    int value;
    Node* next;
};

int main() {
    Node* head = nullptr;
    for (int x : {3, 1, 4}) head = new Node{x, head};
    head->next = new Node{9, head->next};
    Node* gone = head->next->next;
    head->next->next = gone->next;
    delete gone;
    for (Node* p = head; p; p = p->next) std::cout << p->value;
    std::cout << "\\n";
}
`,
    "493",
  ),
  {
    skill: "linked-lists",
    rung: 5,
    title: "Merge two sorted linked lists",
    promptMd: `\`a\` and \`b\` are linked lists, each in increasing order. Write \`ListNode* mergeLists(ListNode* a, ListNode* b)\` that returns one list in increasing order holding all their values, by relinking the existing nodes. For 1 → 3 → 5 and 2 → 4 that's 1 2 3 4 5. Keep the \`ListNode\` struct as it is. ${TASK} ${limits("lists up to 200,000 nodes each")}`,
    functionSignature: "ListNode* mergeLists(ListNode* a, ListNode* b)",
    call: (args) => `gen::showList(mergeLists(${args}));`,
    generator: GEN + LIST,
    starterCode: MERGE("    return a;"),
    reference: MERGE(`    ListNode dummy{0, nullptr};  // a node before the start, so the first link needs no special case
    ListNode* tail = &dummy;
    while (a && b) {
        ListNode*& smaller = a->value <= b->value ? a : b;
        tail = tail->next = smaller;
        smaller = smaller->next;
    }
    tail->next = a ? a : b;  // whatever is left is already in order
    return dummy.next;`),
    bruteForce: MERGE(`    for (ListNode* node = b; node;) {  // insert b's nodes into a one by one, walking from a's head every time
        ListNode* next = node->next;
        if (!a || node->value < a->value) node->next = a, a = node;
        else {
            ListNode* p = a;
            while (p->next && p->next->value <= node->value) p = p->next;
            node->next = p->next, p->next = node;
        }
        node = next;
    }
    return a;`),
    cases: [
      { args: "gen::list({1, 3, 5}), gen::list({2, 4})", expected: "1 2 3 4 5" },
      { args: "gen::list({}), gen::list({})", expected: "" },
      { args: "gen::list({}), gen::list({1, 2})", expected: "1 2" },
      { args: "gen::list({5}), gen::list({1})", expected: "1 5" },
      { args: "gen::list({1, 1, 2}), gen::list({1, 3})", expected: "1 1 1 2 3" },
      { args: "gen::list(gen::sortedInts(741, 2000, 1, 100000)), gen::list(gen::sortedInts(742, 2000, 1, 100000))" },
      { args: "gen::list(gen::sortedInts(743, 200000, 1, 1000000000)), gen::list(gen::sortedInts(744, 200000, 1, 1000000000))" },
    ],
  },

  // ── linked-list-techniques ──
  predict(
    "linked-list-techniques",
    "What does it print? Reverse a part, then count from the end",
    `#include <iostream>

struct Node {
    int value;
    Node* next;
};

int main() {
    Node* head = nullptr;
    for (int x = 7; x >= 1; x--) head = new Node{x, head};
    Node *prev = nullptr, *cur = head;
    for (int steps = 0; cur && steps < 3; steps++) {
        Node* next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    head->next = cur;
    head = prev;
    for (Node* p = head; p; p = p->next) std::cout << p->value;
    Node *lead = head, *trail = head;
    for (int i = 0; i < 3; i++) lead = lead->next;
    while (lead) lead = lead->next, trail = trail->next;
    std::cout << " " << trail->value << "\\n";
}
`,
    "3214567 5",
  ),
  {
    skill: "linked-list-techniques",
    rung: 5,
    title: "Remove the n-th node from the end",
    promptMd: `Write \`ListNode* removeFromEnd(ListNode* head, int n)\` that removes the n-th node from the **end** of the list (n = 1 is the last node) and returns the list's head. n is between 1 and the list's length. For 1 → 2 → 3 → 4 → 5 and n = 2 that's 1 2 3 5. Try it in one pass: send one pointer n nodes ahead, then move both. Keep the \`ListNode\` struct as it is. ${TASK} Lists up to 100,000 nodes.`,
    functionSignature: "ListNode* removeFromEnd(ListNode* head, int n)",
    call: listCall("removeFromEnd"),
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

ListNode* removeFromEnd(ListNode* head, int n) {
    return head;
}
`,
    reference: `${LIST_NODE}

ListNode* removeFromEnd(ListNode* head, int n) {
    ListNode dummy{0, head};  // a node before the head, so removing the head is no special case
    ListNode *lead = &dummy, *trail = &dummy;
    for (int i = 0; i < n; i++) lead = lead->next;
    while (lead->next) lead = lead->next, trail = trail->next;  // n nodes apart: trail stops just before the one to go
    ListNode* gone = trail->next;
    trail->next = gone->next;
    delete gone;
    return dummy.next;
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5}, 2", expected: "1 2 3 5" },
      { args: "{1}, 1", expected: "" },
      { args: "{1, 2}, 1", expected: "1" },
      { args: "{1, 2}, 2", expected: "2" },
      { args: "{1, 2, 3}, 3", expected: "2 3" },
      { args: "{4, 5, 6, 7}, 1", expected: "4 5 6" },
    ],
  },

  // ── stacks ──
  predict(
    "stacks",
    "What does it print? Evaluating postfix",
    `#include <cctype>
#include <iostream>
#include <stack>
#include <string>

int main() {
    std::stack<int> st;
    for (std::string tok : {"5", "1", "2", "+", "4", "*", "+", "3", "-"}) {
        if (isdigit(tok[0])) st.push(std::stoi(tok));
        else {
            int b = st.top();
            st.pop();
            int a = st.top();
            st.pop();
            st.push(tok == "+" ? a + b : tok == "-" ? a - b : a * b);
        }
        std::cout << st.size();
    }
    std::cout << " " << st.top() << "\\n";
}
`,
    "123232121 14",
  ),
  {
    skill: "stacks",
    rung: 5,
    title: "Simplify a file path",
    promptMd: `A Unix-style absolute path is made of names separated by \`/\`. In it, \`.\` means the current folder, \`..\` means the folder above (and stays at the root if there is none), and several \`/\` in a row count as one; any other name, such as \`...\`, is an ordinary folder. Write \`std::string simplifyPath(const std::string& path)\` that returns the simplest equivalent path: it starts with one \`/\`, has single slashes between names, no \`.\` or \`..\`, and no slash at the end (unless it is just \`/\`). For "/a/./b/../../c/" that's "/c". ${TASK} Paths up to 100,000 characters.`,
    functionSignature: "std::string simplifyPath(const std::string& path)",
    call: printCall("simplifyPath"),
    starterCode: `#include <string>

std::string simplifyPath(const std::string& path) {
    return path;
}
`,
    reference: `#include <string>
#include <vector>

std::string simplifyPath(const std::string& path) {
    std::vector<std::string> folders;  // a stack: ".." pops the folder we're in
    for (std::size_t i = 0; i < path.size();) {
        std::size_t end = path.find('/', i);
        if (end == std::string::npos) end = path.size();
        std::string name = path.substr(i, end - i);
        if (name == "..") {
            if (!folders.empty()) folders.pop_back();
        } else if (!name.empty() && name != ".") folders.push_back(name);
        i = end + 1;
    }
    std::string out;
    for (const auto& f : folders) out += "/" + f;
    return out.empty() ? "/" : out;
}
`,
    cases: [
      { args: `"/a/./b/../../c/"`, expected: "/c" },
      { args: `"/home/"`, expected: "/home" },
      { args: `"/../"`, expected: "/" },
      { args: `"/home//foo/"`, expected: "/home/foo" },
      { args: `"/a/b/c/../.."`, expected: "/a" },
      { args: `"/..."`, expected: "/..." },
      { args: `"/"`, expected: "/" },
    ],
  },

  // ── queues ──
  predict(
    "queues",
    "What does it print? Taking turns",
    `#include <algorithm>
#include <iostream>
#include <queue>
#include <utility>

int main() {
    std::queue<std::pair<char, int>> q;  // (task, time still needed)
    q.push({'A', 3});
    q.push({'B', 1});
    q.push({'C', 2});
    int clock = 0;
    while (!q.empty()) {
        auto [task, left] = q.front();
        q.pop();
        int run = std::min(left, 2);
        clock += run, left -= run;
        if (left > 0) q.push({task, left});
        else std::cout << task << clock << " ";
    }
    std::cout << "\\n";
}
`,
    "B3 C5 A6",
  ),
  {
    skill: "queues",
    rung: 5,
    title: "The order a printer prints in",
    promptMd: `Print jobs wait in a queue, numbered from 0 in arrival order, each with a priority from 1 to 9. The printer looks at the job at the front: if any waiting job has a **higher** priority, the front job goes to the back of the queue; otherwise it is printed. Write \`std::vector<int> printOrder(const std::vector<int>& priority)\` that returns the job numbers in the order they are printed. For \`{2, 1, 3, 2}\` that's \`2 3 0 1\`. ${TASK} ${limits("up to 200,000 jobs")}`,
    functionSignature: "std::vector<int> printOrder(const std::vector<int>& priority)",
    call: showCall("printOrder"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> printOrder(const std::vector<int>& priority) {
    return {};
}
`,
    reference: `#include <array>
#include <queue>
#include <vector>

std::vector<int> printOrder(const std::vector<int>& priority) {
    std::queue<int> q;
    std::array<int, 10> waiting{};  // how many jobs of each priority are still queued: the check is O(9), not O(n)
    for (int i = 0; i < (int)priority.size(); i++) q.push(i), waiting[priority[i]]++;
    std::vector<int> order;
    while (!q.empty()) {
        int job = q.front();
        q.pop();
        bool higher = false;
        for (int p = priority[job] + 1; p <= 9; p++) higher |= waiting[p] > 0;
        if (higher) q.push(job);
        else order.push_back(job), waiting[priority[job]]--;
    }
    return order;
}
`,
    bruteForce: `#include <deque>
#include <vector>

std::vector<int> printOrder(const std::vector<int>& priority) {
    std::deque<int> q;
    for (int i = 0; i < (int)priority.size(); i++) q.push_back(i);
    std::vector<int> order;
    while (!q.empty()) {
        int job = q.front();
        q.pop_front();
        bool higher = false;
        for (int other : q) higher |= priority[other] > priority[job];  // look through the whole queue every time
        if (higher) q.push_back(job);
        else order.push_back(job);
    }
    return order;
}
`,
    cases: [
      { args: "{2, 1, 3, 2}", expected: "2 3 0 1" },
      { args: "{1, 1, 9, 1, 1, 1}", expected: "2 3 4 5 0 1" },
      { args: "{}", expected: "" },
      { args: "{5}", expected: "0" },
      { args: "{1, 2, 3}", expected: "2 1 0" },
      { args: "{3, 3, 3}", expected: "0 1 2" },
      { args: "gen::ints(745, 2000, 1, 9)" },
      { args: "gen::ints(746, 200000, 1, 9)" },
    ],
  },

  // ── monotonic-stack ──
  predict(
    "monotonic-stack",
    "What does it print? Stock spans",
    `#include <iostream>
#include <stack>
#include <vector>

int main() {
    std::vector<int> price = {100, 80, 60, 70, 60, 75, 85};
    std::stack<int> st;  // days whose price beats every later day's so far
    for (int i = 0; i < (int)price.size(); i++) {
        while (!st.empty() && price[st.top()] <= price[i]) st.pop();
        std::cout << (st.empty() ? i + 1 : i - st.top());
        st.push(i);
    }
    std::cout << "\\n";
}
`,
    "1112146",
  ),
  {
    skill: "monotonic-stack",
    rung: 5,
    title: "The largest rectangle in a histogram",
    promptMd: `A histogram has bars of width 1 and heights \`h\`. Write \`long long largestRectangle(const std::vector<int>& h)\` that returns the area of the largest rectangle that fits inside it, made of neighbouring bars and as tall as the shortest of them. For \`{2, 1, 5, 6, 2, 3}\` that's 10 (bars 5 and 6, height 5). Hint: a bar's rectangle stretches until the nearest shorter bar on each side. ${TASK} ${limits("up to 1,000,000 bars up to 1,000,000,000 high")}`,
    functionSignature: "long long largestRectangle(const std::vector<int>& h)",
    call: printCall("largestRectangle"),
    generator: GEN,
    starterCode: `#include <vector>

long long largestRectangle(const std::vector<int>& h) {
    return 0;
}
`,
    reference: `#include <stack>
#include <vector>

long long largestRectangle(const std::vector<int>& h) {
    std::stack<int> st;  // bars in increasing height: each is popped when a shorter bar ends its rectangle
    long long best = 0;
    int n = h.size();
    for (int i = 0; i <= n; i++) {
        int height = i < n ? h[i] : 0;  // a bar of height 0 at the end empties the stack
        while (!st.empty() && h[st.top()] >= height) {
            long long tall = h[st.top()];
            st.pop();
            int left = st.empty() ? -1 : st.top();
            best = std::max(best, tall * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

long long largestRectangle(const std::vector<int>& h) {
    long long best = 0;
    for (std::size_t i = 0; i < h.size(); i++) {  // every start, widened to the right
        long long low = h[i];
        for (std::size_t j = i; j < h.size(); j++) {
            low = std::min<long long>(low, h[j]);
            best = std::max(best, low * (long long)(j - i + 1));
        }
    }
    return best;
}
`,
    cases: [
      { args: "{2, 1, 5, 6, 2, 3}", expected: "10" },
      { args: "{}", expected: "0" },
      { args: "{4}", expected: "4" },
      { args: "{2, 4}", expected: "4" },
      { args: "{3, 3, 3}", expected: "9" },
      { args: "{6, 2, 5, 4, 5, 1, 6}", expected: "12" },
      { args: "gen::ints(747, 2000, 1, 1000000000)" },
      { args: "gen::ints(748, 1000000, 1, 1000000000)" },
    ],
  },

  // ── design-data-structures ──
  predict(
    "design-data-structures",
    "What does it print? A queue made of two stacks",
    `#include <iostream>
#include <stack>

struct TwoStackQueue {
    std::stack<int> in, out;
    void push(int x) { in.push(x); }
    int pop() {
        if (out.empty())
            while (!in.empty()) out.push(in.top()), in.pop();
        int x = out.top();
        out.pop();
        return x;
    }
};

int main() {
    TwoStackQueue q;
    q.push(1), q.push(2), q.push(3);
    std::cout << q.pop() << " ";
    q.push(4);
    std::cout << q.pop() << " " << q.in.size() << q.out.size() << " ";
    std::cout << q.pop() << " " << q.pop() << "\\n";
}
`,
    "1 2 11 3 4",
  ),
  {
    skill: "design-data-structures",
    rung: 5,
    title: "A least-recently-used cache",
    promptMd: `Write a class \`LRUCache\` that holds at most \`capacity\` key-value pairs:
- \`LRUCache(int capacity)\` makes an empty cache (capacity is at least 1).
- \`int get(int key)\` returns the key's value, or -1 if it isn't there. Reading a key counts as using it.
- \`void put(int key, int value)\` sets the key's value (that counts as using it too). If a new key would make the cache too big, first remove the key that was used **longest ago**.

Both must be fast: a list in usage order plus a hash map from key to its place in the list does it. The tests run many operations and print what each \`get\` returns. ${TASK} ${limits("capacities up to 100,000 and 200,000 operations")}`,
    functionSignature: "class LRUCache { public: LRUCache(int capacity); int get(int key); void put(int key, int value); };",
    call: (args) => `gen::show(gen::driveLru(${args}));`,
    generator: GEN + LRU_DRIVER,
    starterCode: `class LRUCache {
public:
    LRUCache(int capacity) {}
    int get(int key) { return -1; }
    void put(int key, int value) {}
};
`,
    reference: `#include <list>
#include <unordered_map>
#include <utility>

class LRUCache {
    int capacity;
    std::list<std::pair<int, int>> items;  // (key, value), most recently used first
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> where;

public:
    LRUCache(int capacity) : capacity(capacity) {}
    int get(int key) {
        auto it = where.find(key);
        if (it == where.end()) return -1;
        items.splice(items.begin(), items, it->second);  // move to the front in O(1); the iterator stays valid
        return it->second->second;
    }
    void put(int key, int value) {
        auto it = where.find(key);
        if (it != where.end()) {
            it->second->second = value;
            items.splice(items.begin(), items, it->second);
            return;
        }
        if ((int)items.size() == capacity) where.erase(items.back().first), items.pop_back();
        items.push_front({key, value});
        where[key] = items.begin();
    }
};
`,
    bruteForce: `#include <vector>

class LRUCache {
    struct Entry {
        int key, value;
        long long used;
    };
    int capacity;
    long long clock = 0;
    std::vector<Entry> items;  // searched from end to end on every operation

public:
    LRUCache(int capacity) : capacity(capacity) {}
    int get(int key) {
        for (auto& e : items)
            if (e.key == key) return e.used = ++clock, e.value;
        return -1;
    }
    void put(int key, int value) {
        for (auto& e : items)
            if (e.key == key) {
                e.value = value, e.used = ++clock;
                return;
            }
        if ((int)items.size() == capacity) {
            std::size_t oldest = 0;
            for (std::size_t i = 1; i < items.size(); i++)
                if (items[i].used < items[oldest].used) oldest = i;
            items.erase(items.begin() + oldest);
        }
        items.push_back({key, value, ++clock});
    }
};
`,
    cases: [
      { args: "2, {{1, 1, 10}, {1, 2, 20}, {2, 1, 0}, {1, 3, 30}, {2, 2, 0}, {1, 1, 15}, {1, 4, 40}, {2, 1, 0}, {2, 3, 0}, {2, 4, 0}}", expected: "10 -1 15 -1 40" },
      { args: "1, {{1, 5, 50}, {1, 6, 60}, {2, 5, 0}, {2, 6, 0}}", expected: "-1 60" },
      { args: "3, {{2, 1, 0}, {2, 2, 0}}", expected: "-1 -1" },
      { args: "2, {{1, 1, 1}, {1, 2, 2}, {1, 1, 11}, {1, 3, 3}, {2, 1, 0}, {2, 2, 0}, {2, 3, 0}}", expected: "11 -1 3" },
      { args: "100, gen::lruOps(749, 2000, 300)" },
      { args: "100000, gen::lruOps(750, 200000, 300000)" },
    ],
  },
];
