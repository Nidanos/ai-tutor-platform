import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

const drive = (driver: string) => (args: string) => `gen::show(gen::${driver}(${args}));`;

// {start, end}: book the half-open time [start, end); prints 1 if booked.
const CALENDAR = String.raw`
namespace gen {
std::vector<int> driveCalendar(const std::vector<std::pair<int, int>>& ops) {
    Calendar calendar;
    std::vector<int> out;
    for (auto [s, e] : ops) out.push_back(calendar.book(s, e));
    return out;
}
std::vector<std::pair<int, int>> calendarOps(std::uint64_t seed, int count, int maxTime) {
    state = seed;
    std::vector<std::pair<int, int>> ops(count);
    for (auto& [s, e] : ops) s = (int)between(0, maxTime), e = s + (int)between(1, 3);
    return ops;
}
}  // namespace gen
`;

// {1, 0}: reserve, prints the seat; {2, s}: give seat s back, if it's taken (otherwise skipped).
const SEATS = String.raw`
namespace gen {
std::vector<int> driveSeats(const std::vector<std::pair<int, int>>& ops) {
    Seats seats;
    std::vector<int> out;
    std::vector<bool> taken(ops.size() + 2, false);
    for (auto [type, s] : ops) {
        if (type == 1) {
            int seat = seats.reserve();
            out.push_back(seat);
            if (seat >= 0 && seat < (int)taken.size()) taken[seat] = true;
        } else if (s >= 0 && s < (int)taken.size() && taken[s]) {
            seats.unreserve(s);
            taken[s] = false;
        }
    }
    return out;
}
std::vector<std::pair<int, int>> seatOps(std::uint64_t seed, int count) {
    state = seed;
    std::vector<std::pair<int, int>> ops(count);
    for (int i = 0; i < count; i++) ops[i] = between(1, 3) == 1 ? std::make_pair(2, (int)between(1, i / 2 + 1)) : std::make_pair(1, 0);
    return ops;
}
}  // namespace gen
`;

// {1, t, p}: the price at time t is p (it may correct an earlier one); {2}: the latest price; {3}: highest; {4}: lowest.
const PRICES = String.raw`
namespace gen {
std::vector<int> drivePrices(const std::vector<std::array<int, 3>>& ops) {
    PriceTracker tracker;
    std::vector<int> out;
    bool any = false;
    for (auto [type, t, p] : ops) {
        if (type == 1) tracker.update(t, p), any = true;
        else if (any) out.push_back(type == 2 ? tracker.current() : type == 3 ? tracker.highest() : tracker.lowest());
    }
    return out;
}
std::vector<std::array<int, 3>> priceOps(std::uint64_t seed, int count, int times) {
    state = seed;
    std::vector<std::array<int, 3>> ops(count);
    for (auto& op : ops) op = between(1, 10) <= 6 ? std::array<int, 3>{1, (int)between(1, times), (int)between(1, 1000000)} : std::array<int, 3>{(int)between(2, 4), 0, 0};
    return ops;
}
}  // namespace gen
`;

export const balancedTrees: ExerciseTemplate[] = [
  predict(
    "balanced-trees",
    "What does it print? Bounds in a std::set",
    `#include <iostream>
#include <iterator>
#include <set>

int main() {
    std::set<int> s = {40, 10, 30, 20, 50};
    auto it = s.lower_bound(25);
    std::cout << *it << " " << *std::prev(it) << " " << *s.upper_bound(30) << "\\n";
    s.erase(30);
    std::cout << *s.lower_bound(25) << " " << s.size() << " " << *s.rbegin() << "\\n";
}
`,
    "30 20 40\n40 4 50",
  ),
  {
    skill: "balanced-trees",
    rung: 2,
    title: "Fix the nearest earlier value",
    promptMd: `\`nearestGaps(values)\` returns, as each value arrives, the smallest difference between it and any **earlier** value, or -1 for the first. For \`{10, 20, 14, 30, 11}\` that's \`-1 10 4 10 1\`. It keeps the earlier values in a \`std::set\` and looks at the first one not less than x. But the closest one may be just **below** x. **Find the fault and fix it.** ${limits("up to 300,000 values")}`,
    functionSignature: "std::vector<long long> nearestGaps(const std::vector<int>& values)",
    call: showCall("nearestGaps"),
    generator: GEN,
    starterCode: `#include <set>
#include <vector>

std::vector<long long> nearestGaps(const std::vector<int>& values) {
    std::set<int> seen;
    std::vector<long long> out;
    for (int x : values) {
        long long best = -1;
        auto it = seen.lower_bound(x);  // the first earlier value >= x
        if (it != seen.end()) best = (long long)*it - x;
        out.push_back(best);
        seen.insert(x);
    }
    return out;
}
`,
    reference: `#include <algorithm>
#include <iterator>
#include <set>
#include <vector>

std::vector<long long> nearestGaps(const std::vector<int>& values) {
    std::set<int> seen;
    std::vector<long long> out;
    for (int x : values) {
        long long best = -1;
        auto it = seen.lower_bound(x);  // the first earlier value >= x
        if (it != seen.end()) best = (long long)*it - x;
        if (it != seen.begin()) {  // and the one just below x
            long long below = x - (long long)*std::prev(it);
            best = best < 0 ? below : std::min(best, below);
        }
        out.push_back(best);
        seen.insert(x);
    }
    return out;
}
`,
    bruteForce: `#include <vector>

std::vector<long long> nearestGaps(const std::vector<int>& values) {
    std::vector<long long> out;
    for (std::size_t i = 0; i < values.size(); i++) {
        long long best = -1;
        for (std::size_t j = 0; j < i; j++) {
            long long d = values[i] > values[j] ? (long long)values[i] - values[j] : (long long)values[j] - values[i];
            if (best < 0 || d < best) best = d;
        }
        out.push_back(best);
    }
    return out;
}
`,
    cases: [
      { args: "{10, 20, 14, 30, 11}", expected: "-1 10 4 10 1" },
      { args: "{5}", expected: "-1" },
      { args: "{}", expected: "" },
      { args: "{3, 3}", expected: "-1 0" },
      { args: "{1, 100, 50}", expected: "-1 99 49" },
      { args: "gen::ints(361, 2000, 1, 1000000000)" },
      { args: "gen::ints(362, 300000, 1, 1000000000)" },
    ],
  },
  {
    skill: "balanced-trees",
    rung: 3,
    title: "Complete the calendar's overlap check",
    promptMd: `\`Calendar::book(start, end)\` books the time from start up to, but not including, end, and returns false without booking if that overlaps an existing booking. Bookings are kept in a \`std::map\` from start to end, sorted by start. So only two bookings can overlap: the first one starting at or after start, and the one just before it. **Complete the check.** Each test makes bookings and prints 1 for each one made, 0 for each refused. ${limits("up to 300,000 bookings")}`,
    functionSignature: "class Calendar { public: bool book(int start, int end); };",
    call: drive("driveCalendar"),
    generator: GEN + CALENDAR,
    starterCode: `#include <map>

class Calendar {
public:
    bool book(int start, int end) {
        auto next = booked_.lower_bound(start);  // the first booking starting at or after start
        // TODO: return false if it overlaps the next booking or the one before it
        booked_[start] = end;
        return true;
    }

private:
    std::map<int, int> booked_;  // start -> end
};
`,
    reference: `#include <iterator>
#include <map>

class Calendar {
public:
    bool book(int start, int end) {
        auto next = booked_.lower_bound(start);  // the first booking starting at or after start
        if (next != booked_.end() && next->first < end) return false;                 // it starts before we end
        if (next != booked_.begin() && std::prev(next)->second > start) return false;  // the one before runs into us
        booked_[start] = end;
        return true;
    }

private:
    std::map<int, int> booked_;  // start -> end
};
`,
    bruteForce: `#include <utility>
#include <vector>

class Calendar {
public:
    bool book(int start, int end) {
        for (auto [s, e] : booked_)
            if (s < end && start < e) return false;
        booked_.push_back({start, end});
        return true;
    }

private:
    std::vector<std::pair<int, int>> booked_;
};
`,
    cases: [
      { args: "{{10, 20}, {15, 25}, {20, 30}, {5, 10}, {5, 15}}", expected: "1 0 1 1 0" },
      { args: "{}", expected: "" },
      { args: "{{1, 2}, {1, 2}}", expected: "1 0" },
      { args: "{{5, 8}, {1, 5}, {8, 9}, {4, 6}}", expected: "1 1 1 0" },
      { args: "gen::calendarOps(363, 2000, 4000)" },
      { args: "gen::calendarOps(364, 300000, 2000000000)" },
    ],
  },
  {
    skill: "balanced-trees",
    rung: 4,
    title: "Extend the seats so they can be given back",
    promptMd: `\`Seats::reserve()\` hands out seats 1, 2, 3, … in order. **Extend the class** so that \`unreserve(seat)\` gives a reserved seat back, and \`reserve()\` always returns the **smallest free** seat. A \`std::set\` of the seats that were given back keeps that smallest one at its front. Each test runs reserve and unreserve calls and prints the seat each reserve returns. ${limits("up to 1,000,000 calls")}`,
    functionSignature: "class Seats { public: int reserve(); void unreserve(int seat); };",
    call: drive("driveSeats"),
    generator: GEN + SEATS,
    starterCode: `class Seats {
public:
    int reserve() { return next_++; }
    void unreserve(int seat) {}

private:
    int next_ = 1;  // the lowest seat never handed out
};
`,
    reference: `#include <set>

class Seats {
public:
    int reserve() {
        if (freed_.empty()) return next_++;
        int seat = *freed_.begin();  // a seat given back, smaller than next_
        freed_.erase(freed_.begin());
        return seat;
    }
    void unreserve(int seat) { freed_.insert(seat); }

private:
    int next_ = 1;         // the lowest seat never handed out
    std::set<int> freed_;  // seats given back, smallest first
};
`,
    bruteForce: `#include <vector>

class Seats {
public:
    int reserve() {
        int seat = 1;
        while (seat < (int)taken_.size() && taken_[seat]) seat++;
        if (seat == (int)taken_.size()) taken_.push_back(false);
        taken_[seat] = true;
        return seat;
    }
    void unreserve(int seat) { taken_[seat] = false; }

private:
    std::vector<bool> taken_ = {true};  // seat 0 doesn't exist
};
`,
    cases: [
      { args: "{{1, 0}, {1, 0}, {1, 0}, {2, 2}, {1, 0}, {1, 0}}", expected: "1 2 3 2 4" },
      { args: "{}", expected: "" },
      { args: "{{2, 5}, {1, 0}}", expected: "1" },
      { args: "{{1, 0}, {1, 0}, {2, 1}, {2, 2}, {1, 0}, {1, 0}, {1, 0}}", expected: "1 2 1 2 3" },
      { args: "gen::seatOps(365, 2000)" },
      { args: "gen::seatOps(366, 1000000)" },
    ],
  },
  {
    skill: "balanced-trees",
    rung: 5,
    title: "A price tracker with corrections",
    promptMd: `\`PriceTracker\` follows a share's price from records that arrive out of order and may correct each other. \`update(time, price)\` says the price at that time was price, replacing any earlier record for the same time. \`current()\` returns the price at the **latest** time recorded. \`highest()\` and \`lowest()\` return the highest and lowest prices over all times, using each time's latest record. Each runs in O(log n). Each test runs calls and prints what the queries return; queries come only after the first update. ${TASK} ${limits("up to 300,000 calls")}`,
    functionSignature: "class PriceTracker { public: void update(int time, int price); int current(); int highest(); int lowest(); };",
    call: drive("drivePrices"),
    generator: GEN + PRICES,
    starterCode: `class PriceTracker {
public:
    void update(int time, int price) {}
    int current() { return 0; }
    int highest() { return 0; }
    int lowest() { return 0; }
};
`,
    reference: `#include <map>
#include <set>

class PriceTracker {
public:
    void update(int time, int price) {
        auto it = byTime_.find(time);
        if (it != byTime_.end()) prices_.erase(prices_.find(it->second));  // the old record no longer counts
        byTime_[time] = price;
        prices_.insert(price);
    }
    int current() { return byTime_.rbegin()->second; }
    int highest() { return *prices_.rbegin(); }
    int lowest() { return *prices_.begin(); }

private:
    std::map<int, int> byTime_;  // time -> price, latest time last
    std::multiset<int> prices_;  // every time's price, sorted, with repeats
};
`,
    bruteForce: `#include <algorithm>
#include <map>

class PriceTracker {
public:
    void update(int time, int price) { byTime_[time] = price; }
    int current() { return byTime_.rbegin()->second; }
    int highest() {
        int best = byTime_.begin()->second;
        for (const auto& [t, p] : byTime_) best = std::max(best, p);
        return best;
    }
    int lowest() {
        int best = byTime_.begin()->second;
        for (const auto& [t, p] : byTime_) best = std::min(best, p);
        return best;
    }

private:
    std::map<int, int> byTime_;
};
`,
    cases: [
      { args: "{{1, 3, 40}, {1, 7, 25}, {2, 0, 0}, {3, 0, 0}, {1, 3, 20}, {3, 0, 0}, {4, 0, 0}}", expected: "25 40 25 20" },
      { args: "{}", expected: "" },
      { args: "{{1, 5, 7}, {4, 0, 0}, {1, 5, 9}, {4, 0, 0}, {2, 0, 0}}", expected: "7 9 9" },
      { args: "{{1, 2, 10}, {1, 1, 30}, {2, 0, 0}, {3, 0, 0}, {1, 2, 50}, {2, 0, 0}, {4, 0, 0}}", expected: "10 30 50 30" },
      { args: "gen::priceOps(367, 2000, 300)" },
      { args: "gen::priceOps(368, 300000, 120000)" },
    ],
  },
];
