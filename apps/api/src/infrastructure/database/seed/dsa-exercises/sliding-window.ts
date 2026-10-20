import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

const MOST_ONES = `// The most 1s in any window of k neighbouring values.
int mostOnes(const std::vector<int>& bits, int k) {
    int inWindow = 0, best = 0;
    for (int i = 0; i < (int)bits.size(); i++) {
        inWindow += bits[i];
        if (i >= k) inWindow -= bits[i - k];
        best = std::max(best, inWindow);
    }
    return best;
}`;

export const slidingWindow: ExerciseTemplate[] = [
  predict(
    "sliding-window",
    "What does it print? A window with at most one zero",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {1, 0, 1, 1, 0, 0, 1};
    int left = 0, zeros = 0, best = 0;
    for (int right = 0; right < (int)v.size(); right++) {
        zeros += v[right] == 0;
        while (zeros > 1) zeros -= v[left++] == 0;
        best = std::max(best, right - left + 1);
        std::cout << left << " ";
    }
    std::cout << "\\n" << best << "\\n";
}
`,
    "0 0 0 0 2 5 5\n4",
  ),
  {
    skill: "sliding-window",
    rung: 2,
    title: "Fix the window averages",
    promptMd: `\`windowsAtLeast(v, k, t)\` returns how many windows of k neighbouring values have an average of **at least t**. For \`{1, 5, 3, 6, 2, 8}\`, k = 2 and t = 4 it should return 4, but it counts too many. The window's sum is kept as it slides. **Find the fault and fix it.** ${limits("up to 1,000,000 values, and k up to the list's size")}`,
    functionSignature: "int windowsAtLeast(const std::vector<int>& v, int k, int t)",
    call: printCall("windowsAtLeast"),
    generator: GEN,
    starterCode: `#include <vector>

int windowsAtLeast(const std::vector<int>& v, int k, int t) {
    long long sum = 0;
    int count = 0;
    for (int i = 0; i < (int)v.size(); i++) {
        sum += v[i];
        if (i >= k - 1 && sum >= (long long)t * k) count++;
    }
    return count;
}
`,
    reference: `#include <vector>

int windowsAtLeast(const std::vector<int>& v, int k, int t) {
    long long sum = 0;
    int count = 0;
    for (int i = 0; i < (int)v.size(); i++) {
        sum += v[i];
        if (i >= k) sum -= v[i - k];  // the value that just left the window
        if (i >= k - 1 && sum >= (long long)t * k) count++;
    }
    return count;
}
`,
    bruteForce: `#include <vector>

int windowsAtLeast(const std::vector<int>& v, int k, int t) {
    int count = 0;
    for (int start = 0; start + k <= (int)v.size(); start++) {
        long long sum = 0;
        for (int i = start; i < start + k; i++) sum += v[i];
        count += sum >= (long long)t * k;
    }
    return count;
}
`,
    cases: [
      { args: "{1, 5, 3, 6, 2, 8}, 2, 4", expected: "4" },
      { args: "{3}, 1, 3", expected: "1" },
      { args: "{1, 2}, 3, 1", expected: "0" },
      { args: "{10, 10, 10}, 3, 10", expected: "1" },
      { args: "{9, 1, 1, 9}, 2, 5", expected: "2" },
      { args: "gen::ints(229, 2000, 1, 100), 500, 50" },
      { args: "gen::ints(230, 1000000, 1, 100), 500000, 50" },
    ],
  },
  {
    skill: "sliding-window",
    rung: 3,
    title: "Complete the products below k",
    promptMd: `\`productBelow(v, k)\` gets positive values and returns how many stretches of neighbouring values have a product **less than k**. For \`{4, 2, 6}\` and k = 10 it's 4: (4), (2), (6) and (4, 2). The window grows on the right, and every window that ends at \`right\` and starts at \`left\` or later counts. **Complete the step that shrinks the window** from the left while its product is too big. ${limits("up to 1,000,000 values from 1 to 1000, and k up to 10⁹")}`,
    functionSignature: "long long productBelow(const std::vector<int>& v, long long k)",
    call: printCall("productBelow"),
    generator: GEN,
    starterCode: `#include <vector>

long long productBelow(const std::vector<int>& v, long long k) {
    long long count = 0, product = 1;
    std::size_t left = 0;
    for (std::size_t right = 0; right < v.size(); right++) {
        product *= v[right];
        // TODO: shrink from the left while the product is too big
        count += right + 1 - left;  // the windows ending at right that start at left or later
    }
    return count;
}
`,
    reference: `#include <vector>

long long productBelow(const std::vector<int>& v, long long k) {
    long long count = 0, product = 1;
    std::size_t left = 0;
    for (std::size_t right = 0; right < v.size(); right++) {
        product *= v[right];
        while (left <= right && product >= k) product /= v[left++];  // may empty the window
        count += right + 1 - left;  // the windows ending at right that start at left or later
    }
    return count;
}
`,
    bruteForce: `#include <vector>

long long productBelow(const std::vector<int>& v, long long k) {
    long long count = 0;
    for (std::size_t i = 0; i < v.size(); i++) {
        long long product = 1;
        for (std::size_t j = i; j < v.size(); j++) {
            product *= v[j];
            if (product >= k) break;
            count++;
        }
    }
    return count;
}
`,
    cases: [
      { args: "{4, 2, 6}, 10", expected: "4" },
      { args: "{1, 1, 1}, 2", expected: "6" },
      { args: "{5}, 5", expected: "0" },
      { args: "{}, 3", expected: "0" },
      { args: "{10, 1, 1, 10}, 11", expected: "9" },
      { args: "gen::ints(227, 2000, 1, 3), 1000000" },
      { args: "gen::ints(228, 1000000, 1, 1), 2" },
    ],
  },
  {
    skill: "sliding-window",
    rung: 4,
    title: "Extend the window to the fewest swaps",
    promptMd: `\`mostOnes(bits, k)\` works: it slides a window of length k and returns the most 1s any window holds. Now \`fewestSwaps(bits)\` should return the fewest swaps (of any two positions) that bring all the 1s together into one block. For \`{1, 0, 1, 0, 1}\` that's 1. Hint: the block will be as long as the number of 1s, and every 0 inside it needs one swap. **Extend the code** to answer this using \`mostOnes\`. ${limits("up to 1,000,000 values")}`,
    functionSignature: "int fewestSwaps(const std::vector<int>& bits)",
    call: printCall("fewestSwaps"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

${MOST_ONES}

int fewestSwaps(const std::vector<int>& bits) {
    return 0;  // TODO: use mostOnes
}
`,
    reference: `#include <algorithm>
#include <vector>

${MOST_ONES}

int fewestSwaps(const std::vector<int>& bits) {
    int ones = 0;
    for (int b : bits) ones += b;
    return ones - mostOnes(bits, ones);  // the best block of length ones; each 0 in it swaps once
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

int fewestSwaps(const std::vector<int>& bits) {
    int ones = 0;
    for (int b : bits) ones += b;
    int best = 0;
    for (int start = 0; start + ones <= (int)bits.size(); start++) {
        int inBlock = 0;
        for (int i = start; i < start + ones; i++) inBlock += bits[i];
        best = std::max(best, inBlock);
    }
    return ones - best;
}
`,
    cases: [
      { args: "{1, 0, 1, 0, 1}", expected: "1" },
      { args: "{0, 0}", expected: "0" },
      { args: "{1, 1, 0, 1}", expected: "1" },
      { args: "{}", expected: "0" },
      { args: "{1, 0, 0, 1, 0, 1, 1}", expected: "1" },
      { args: "gen::ints(231, 2000, 0, 1)" },
      { args: "gen::ints(232, 1000000, 0, 1)" },
    ],
  },
  {
    skill: "sliding-window",
    rung: 5,
    title: "The longest steady stretch",
    promptMd: `\`longestSteady(v, d)\` returns the length of the longest stretch of neighbouring values whose largest and smallest differ by **at most d**. For \`{5, 1, 3, 8, 6, 7}\` and d = 2 it's 3 (8, 6, 7). A \`std::multiset\` holding the window's values gives its smallest and largest at once. ${TASK} ${limits("up to 500,000 values")}`,
    functionSignature: "int longestSteady(const std::vector<int>& v, int d)",
    call: printCall("longestSteady"),
    generator: GEN,
    starterCode: `#include <vector>

int longestSteady(const std::vector<int>& v, int d) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <set>
#include <vector>

int longestSteady(const std::vector<int>& v, int d) {
    std::multiset<int> window;  // sorted, with repeats: smallest at begin, largest at rbegin
    int best = 0;
    std::size_t left = 0;
    for (std::size_t right = 0; right < v.size(); right++) {
        window.insert(v[right]);
        while ((long long)*window.rbegin() - *window.begin() > d) window.erase(window.find(v[left++]));
        best = std::max(best, (int)window.size());
    }
    return best;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

int longestSteady(const std::vector<int>& v, int d) {
    int best = 0;
    for (std::size_t i = 0; i < v.size(); i++) {
        int lo = v[i], hi = v[i];
        for (std::size_t j = i; j < v.size(); j++) {
            lo = std::min(lo, v[j]);
            hi = std::max(hi, v[j]);
            if ((long long)hi - lo > d) break;
            best = std::max(best, int(j - i + 1));
        }
    }
    return best;
}
`,
    cases: [
      { args: "{5, 1, 3, 8, 6, 7}, 2", expected: "3" },
      { args: "{}, 5", expected: "0" },
      { args: "{4}, 0", expected: "1" },
      { args: "{3, 3, 3}, 0", expected: "3" },
      { args: "{-1000000000, 1000000000}, 1000000000", expected: "1" },
      { args: "gen::ints(233, 2000, 1, 100), 50" },
      { args: "gen::ints(234, 500000, 1, 1000), 999" },
    ],
  },
];
