import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

// Each test runs a list of operations on the learner's class and prints what they return.
const drive = (driver: string) => (args: string) => `gen::show(gen::${driver}(${args}));`;

const COUNTER_DRIVER = String.raw`
namespace gen {
std::vector<int> driveCounter(const std::vector<int>& times) {
    RecentCounter counter;
    std::vector<int> out;
    for (int t : times) out.push_back(counter.hit(t));
    return out;
}
}  // namespace gen
`;

// {1, x}: insert x, {2, x}: remove x, {3, 0}: size. The last output is the sum of what's left, as a check.
const SET_DRIVER = String.raw`
namespace gen {
std::vector<long long> driveSet(const std::vector<std::array<int, 2>>& ops) {
    FastSet set;
    std::vector<long long> out;
    for (auto [type, x] : ops) out.push_back(type == 1 ? set.insert(x) : type == 2 ? set.remove(x) : set.size());
    long long sum = 0;
    for (int i = 0; i < set.size(); i++) sum += set.at(i);
    out.push_back(sum);
    return out;
}
std::vector<std::array<int, 2>> setOps(std::uint64_t seed, int count, int range) {
    state = seed;
    std::vector<std::array<int, 2>> ops(count);
    for (int i = 0; i < count; i++) ops[i] = {i % 10 == 9 ? 3 : (int)between(1, 2) == 1 || i < count / 2 ? 1 : 2, (int)between(1, range)};
    return ops;
}
}  // namespace gen
`;

// {1, x, 0}: push x, {2, 0, 0}: pop, {3, k, val}: add val to the bottom k.
const STACK_DRIVER = String.raw`
namespace gen {
std::vector<long long> driveStack(const std::vector<std::array<int, 3>>& ops) {
    IncStack stack;
    std::vector<long long> out;
    for (auto [type, a, b] : ops) {
        if (type == 1) stack.push(a);
        else if (type == 2) out.push_back(stack.pop());
        else stack.increment(a, b);
    }
    return out;
}
std::vector<std::array<int, 3>> stackOps(std::uint64_t seed, int count) {
    state = seed;
    std::vector<std::array<int, 3>> ops(count);
    for (int i = 0; i < count; i++) {
        int r = (int)between(1, 10);
        ops[i] = r <= 5 ? std::array<int, 3>{1, (int)between(1, 1000), 0}
               : r <= 7 ? std::array<int, 3>{2, 0, 0}
                        : std::array<int, 3>{3, (int)between(1, count), (int)between(1, 100)};
    }
    return ops;
}
}  // namespace gen
`;

// {1, key, value, time}: set, {2, key, time, 0}: get. Times only increase.
const STORE_DRIVER = String.raw`
namespace gen {
std::vector<int> driveStore(const std::vector<std::array<int, 4>>& ops) {
    TimeStore store;
    std::vector<int> out;
    for (auto [type, a, b, c] : ops) {
        if (type == 1) store.set(a, b, c);
        else out.push_back(store.get(a, b));
    }
    return out;
}
std::vector<std::array<int, 4>> storeOps(std::uint64_t seed, int count, int keys) {
    state = seed;
    std::vector<std::array<int, 4>> ops(count);
    int time = 0;
    for (auto& op : ops) {
        time += (int)between(1, 3);
        op = between(1, 2) == 1 ? std::array<int, 4>{1, (int)between(1, keys), (int)between(1, 1000000), time}
                                : std::array<int, 4>{2, (int)between(1, keys), time - (int)between(0, 50), 0};
    }
    return ops;
}
}  // namespace gen
`;

export const designDataStructures: ExerciseTemplate[] = [
  predict(
    "design-data-structures",
    "What does it print? A stack that knows its maximum",
    `#include <algorithm>
#include <iostream>
#include <stack>

int main() {
    std::stack<int> values, maxes;  // maxes.top(): the largest value in the stack
    auto push = [&](int x) {
        values.push(x);
        maxes.push(maxes.empty() ? x : std::max(x, maxes.top()));
    };
    auto pop = [&]() {
        values.pop();
        maxes.pop();
    };
    push(3);
    push(7);
    push(5);
    std::cout << maxes.top() << " ";
    pop();
    pop();
    std::cout << maxes.top() << " ";
    push(9);
    push(1);
    std::cout << maxes.top() << " " << values.size() << "\\n";
}
`,
    "7 3 9 3",
  ),
  {
    skill: "design-data-structures",
    rung: 2,
    title: "Fix the hit counter's window",
    promptMd: `\`RecentCounter::hit(t)\` records a hit at time t, in milliseconds, and returns how many hits fall in the last 1000 ms: from t - 999 to t, both included. Times never go down. Hits at 1, 500, 1000, 1001 and 2000 should give \`1 2 3 3 2\`, but at 1001 it still counts the hit at 1. **Find the fault and fix it.** ${limits("up to 1,000,000 hits")} Each test prints the answers to its hits.`,
    functionSignature: "class RecentCounter { public: int hit(int t); };",
    call: drive("driveCounter"),
    generator: GEN + COUNTER_DRIVER,
    starterCode: `#include <queue>

class RecentCounter {
public:
    int hit(int t) {
        times_.push(t);
        while (times_.front() < t - 1000) times_.pop();
        return times_.size();
    }

private:
    std::queue<int> times_;  // the hits still inside the window, oldest first
};
`,
    reference: `#include <queue>

class RecentCounter {
public:
    int hit(int t) {
        times_.push(t);
        while (times_.front() < t - 999) times_.pop();  // the window starts at t - 999
        return times_.size();
    }

private:
    std::queue<int> times_;  // the hits still inside the window, oldest first
};
`,
    bruteForce: `#include <vector>

class RecentCounter {
public:
    int hit(int t) {
        all_.push_back(t);
        int count = 0;
        for (int x : all_) count += x >= t - 999;
        return count;
    }

private:
    std::vector<int> all_;
};
`,
    cases: [
      { args: "{1, 500, 1000, 1001, 2000}", expected: "1 2 3 3 2" },
      { args: "{}", expected: "" },
      { args: "{5, 5, 5}", expected: "1 2 3" },
      { args: "{100, 1099, 1100}", expected: "1 2 2" },
      { args: "gen::sortedInts(331, 2000, 1, 100000)" },
      { args: "gen::sortedInts(332, 1000000, 1, 1000000000)" },
    ],
  },
  {
    skill: "design-data-structures",
    rung: 3,
    title: "Complete the O(1) removal",
    promptMd: `\`FastSet\` keeps its items in a vector, so it can pick a random one by position with \`at\`, and a hash map from each item to its slot. That makes insert O(1). Remove must be O(1) too, so it can't erase from the middle of the vector. **Complete \`remove\`**: move the last item into the removed item's slot, then drop the last slot. Each test runs operations: insert and remove print 1 if they changed the set, size prints the size, and a final line adds up what's left. ${limits("up to 1,000,000 operations")}`,
    functionSignature: "class FastSet { public: bool insert(int x); bool remove(int x); int size() const; int at(int i) const; };",
    call: drive("driveSet"),
    generator: GEN + SET_DRIVER,
    starterCode: `#include <unordered_map>
#include <vector>

class FastSet {
public:
    bool insert(int x) {
        if (where_.count(x)) return false;
        where_[x] = items_.size();
        items_.push_back(x);
        return true;
    }
    bool remove(int x) {
        auto it = where_.find(x);
        if (it == where_.end()) return false;
        // TODO: move the last item into x's slot, then drop the last slot
        return true;
    }
    int size() const { return items_.size(); }
    int at(int i) const { return items_[i]; }

private:
    std::vector<int> items_;
    std::unordered_map<int, std::size_t> where_;  // item -> its slot in items_
};
`,
    reference: `#include <unordered_map>
#include <vector>

class FastSet {
public:
    bool insert(int x) {
        if (where_.count(x)) return false;
        where_[x] = items_.size();
        items_.push_back(x);
        return true;
    }
    bool remove(int x) {
        auto it = where_.find(x);
        if (it == where_.end()) return false;
        std::size_t slot = it->second;
        int last = items_.back();
        items_[slot] = last;  // the last item takes x's slot (if x is the last, it's overwritten by itself)
        where_[last] = slot;
        items_.pop_back();
        where_.erase(x);
        return true;
    }
    int size() const { return items_.size(); }
    int at(int i) const { return items_[i]; }

private:
    std::vector<int> items_;
    std::unordered_map<int, std::size_t> where_;  // item -> its slot in items_
};
`,
    bruteForce: `#include <algorithm>
#include <vector>

class FastSet {
public:
    bool insert(int x) {
        if (std::find(items_.begin(), items_.end(), x) != items_.end()) return false;
        items_.push_back(x);
        return true;
    }
    bool remove(int x) {
        auto it = std::find(items_.begin(), items_.end(), x);
        if (it == items_.end()) return false;
        items_.erase(it);
        return true;
    }
    int size() const { return items_.size(); }
    int at(int i) const { return items_[i]; }

private:
    std::vector<int> items_;
};
`,
    cases: [
      { args: "{{1, 5}, {1, 5}, {1, 8}, {2, 5}, {3, 0}, {2, 5}, {1, 5}}", expected: "1 0 1 1 1 0 1 13" },
      { args: "{}", expected: "0" },
      { args: "{{2, 4}, {3, 0}}", expected: "0 0 0" },
      { args: "{{1, 1}, {1, 2}, {1, 3}, {2, 3}, {2, 1}, {3, 0}}", expected: "1 1 1 1 1 1 2" },
      { args: "gen::setOps(333, 2000, 500)" },
      { args: "gen::setOps(334, 1000000, 400000)" },
    ],
  },
  {
    skill: "design-data-structures",
    rung: 4,
    title: "Extend the stack with a fast bottom increment",
    promptMd: `\`IncStack\` is a stack of numbers: push adds on top, and pop removes the top and returns it, or -1 when empty. **Extend it** with \`increment(k, val)\`, which adds val to the **bottom k** values, or to all of them if there are fewer. Adding to each value one by one is too slow when k is large. Instead, record the addition at the highest position it reaches, and hand it down to the next item when that one is popped. Each test runs operations and prints what the pops return. ${limits("up to 1,000,000 operations, with k up to 1,000,000")}`,
    functionSignature: "class IncStack { public: void push(int x); long long pop(); void increment(int k, int val); };",
    call: drive("driveStack"),
    generator: GEN + STACK_DRIVER,
    starterCode: `#include <vector>

class IncStack {
public:
    void push(int x) { values_.push_back(x); }
    long long pop() {
        if (values_.empty()) return -1;
        long long x = values_.back();
        values_.pop_back();
        return x;
    }
    void increment(int k, int val) {}  // TODO: add val to the bottom k values

private:
    std::vector<long long> values_;
};
`,
    reference: `#include <algorithm>
#include <vector>

class IncStack {
public:
    void push(int x) {
        values_.push_back(x);
        add_.push_back(0);
    }
    long long pop() {
        if (values_.empty()) return -1;
        std::size_t top = values_.size() - 1;
        long long x = values_[top] + add_[top];
        if (top > 0) add_[top - 1] += add_[top];  // the pending addition covers everything below too
        values_.pop_back();
        add_.pop_back();
        return x;
    }
    void increment(int k, int val) {
        if (values_.empty() || k <= 0) return;
        add_[std::min<std::size_t>(k, values_.size()) - 1] += val;  // the highest position it reaches
    }

private:
    std::vector<long long> values_, add_;  // add_[i]: still to be added to items 0..i
};
`,
    bruteForce: `#include <algorithm>
#include <vector>

class IncStack {
public:
    void push(int x) { values_.push_back(x); }
    long long pop() {
        if (values_.empty()) return -1;
        long long x = values_.back();
        values_.pop_back();
        return x;
    }
    void increment(int k, int val) {
        for (std::size_t i = 0; i < std::min<std::size_t>(k, values_.size()); i++) values_[i] += val;
    }

private:
    std::vector<long long> values_;
};
`,
    cases: [
      { args: "{{1, 1, 0}, {1, 2, 0}, {1, 3, 0}, {3, 2, 100}, {2, 0, 0}, {2, 0, 0}, {2, 0, 0}, {2, 0, 0}}", expected: "3 102 101 -1" },
      { args: "{}", expected: "" },
      { args: "{{3, 5, 10}, {1, 7, 0}, {2, 0, 0}}", expected: "7" },
      { args: "{{1, 4, 0}, {3, 9, 1}, {3, 1, 1}, {1, 5, 0}, {2, 0, 0}, {2, 0, 0}}", expected: "5 6" },
      { args: "gen::stackOps(335, 2000)" },
      { args: "gen::stackOps(336, 1000000)" },
    ],
  },
  {
    skill: "design-data-structures",
    rung: 5,
    title: "A key-value store with history",
    promptMd: `\`TimeStore\` remembers every value a key has had. \`set(key, value, time)\` records a value from that time on. \`get(key, time)\` returns the value set most recently **at or before** time, or -1 if there's none. Set times only increase, so each key's history is sorted, and a binary search answers get in O(log n). Each test runs operations and prints the answers to the gets. ${TASK} ${limits("up to 1,000,000 operations")}`,
    functionSignature: "class TimeStore { public: void set(int key, int value, int time); int get(int key, int time); };",
    call: drive("driveStore"),
    generator: GEN + STORE_DRIVER,
    starterCode: `class TimeStore {
public:
    void set(int key, int value, int time) {}
    int get(int key, int time) { return -1; }
};
`,
    reference: `#include <algorithm>
#include <unordered_map>
#include <utility>
#include <vector>

class TimeStore {
public:
    void set(int key, int value, int time) { history_[key].push_back({time, value}); }
    int get(int key, int time) {
        auto it = history_.find(key);
        if (it == history_.end()) return -1;
        const auto& h = it->second;  // sorted by time, because set times only increase
        auto after = std::upper_bound(h.begin(), h.end(), std::make_pair(time, 2147483647));  // the first set after time
        return after == h.begin() ? -1 : std::prev(after)->second;
    }

private:
    std::unordered_map<int, std::vector<std::pair<int, int>>> history_;  // key -> (time, value) in time order
};
`,
    bruteForce: `#include <array>
#include <vector>

class TimeStore {
public:
    void set(int key, int value, int time) { all_.push_back({key, value, time}); }
    int get(int key, int time) {
        int answer = -1;
        for (const auto& [k, v, t] : all_)
            if (k == key && t <= time) answer = v;  // later sets come later in all_
        return answer;
    }

private:
    std::vector<std::array<int, 3>> all_;
};
`,
    cases: [
      { args: "{{1, 7, 10, 1}, {1, 7, 20, 5}, {2, 7, 6, 0}, {2, 7, 4, 0}, {2, 7, 0, 0}, {2, 8, 9, 0}}", expected: "20 10 -1 -1" },
      { args: "{}", expected: "" },
      { args: "{{1, 3, 5, 2}, {2, 3, 2, 0}, {2, 3, 100, 0}}", expected: "5 5" },
      { args: "{{1, 1, 1, 1}, {1, 1, 2, 2}, {1, 1, 3, 3}, {2, 1, 1, 0}, {2, 1, 2, 0}, {2, 1, 3, 0}}", expected: "1 2 3" },
      { args: "gen::storeOps(337, 2000, 20)" },
      { args: "gen::storeOps(338, 1000000, 10)" },
    ],
  },
];
