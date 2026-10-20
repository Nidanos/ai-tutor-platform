import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

export const complexity: ExerciseTemplate[] = [
  predict(
    "complexity",
    "What does it print? Counting loop steps",
    `#include <iostream>

int main() {
    int n = 16;
    long long a = 0, b = 0, c = 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j++) a++;
    for (int i = 1; i < n; i *= 2)
        for (int j = 0; j < n; j++) b++;
    for (int i = n; i > 0; i /= 2)
        for (int j = 0; j < i; j++) c++;
    std::cout << a << " " << b << " " << c << "\\n";
}
`,
    "136 64 31",
  ),
  {
    skill: "complexity",
    rung: 2,
    title: "Make the pair counter fast enough",
    promptMd: `\`onesBeforeZeros(a)\` receives a list of 0s and 1s and returns how many pairs of positions i < j have \`a[i] == 1\` and \`a[j] == 0\`. For \`{1, 0, 1, 0}\` that's 3. It gives the right answers, but it compares every pair, which is far too slow for a million values. **Make it fast enough.** ${limits("up to 1,000,000 values")}`,
    functionSignature: "long long onesBeforeZeros(const std::vector<int>& a)",
    call: printCall("onesBeforeZeros"),
    generator: GEN,
    starterCode: `#include <vector>

long long onesBeforeZeros(const std::vector<int>& a) {
    long long pairs = 0;
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++)
            if (a[i] == 1 && a[j] == 0) pairs++;
    return pairs;
}
`,
    reference: `#include <vector>

long long onesBeforeZeros(const std::vector<int>& a) {
    long long pairs = 0, ones = 0;
    for (int x : a) {
        if (x == 1) ones++;
        else pairs += ones;  // this 0 pairs with every 1 before it
    }
    return pairs;
}
`,
    bruteForce: `#include <vector>

long long onesBeforeZeros(const std::vector<int>& a) {
    long long pairs = 0;
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++)
            if (a[i] == 1 && a[j] == 0) pairs++;
    return pairs;
}
`,
    cases: [
      { args: "{1, 0, 1, 0}", expected: "3" },
      { args: "{0, 0, 1, 1}", expected: "0" },
      { args: "{1, 1, 1, 0, 0}", expected: "6" },
      { args: "{}", expected: "0" },
      { args: "gen::ints(1, 2000, 0, 1)" },
      { args: "gen::ints(2, 1000000, 0, 1)" },
    ],
  },
  {
    skill: "complexity",
    rung: 3,
    title: "Count even-sum pairs without checking every pair",
    promptMd: `\`evenSumPairs(a)\` returns how many pairs of positions i < j have an even sum \`a[i] + a[j]\`. A sum is even when both numbers are even or both are odd, so the function already counts the evens and the odds. **Complete the return statement**, using only those two counts. ${limits("up to 1,000,000 values from -10⁹ to 10⁹")}`,
    functionSignature: "long long evenSumPairs(const std::vector<int>& a)",
    call: printCall("evenSumPairs"),
    generator: GEN,
    starterCode: `#include <vector>

long long evenSumPairs(const std::vector<int>& a) {
    long long evens = 0, odds = 0;
    for (int x : a) {
        if (x % 2 == 0) evens++;
        else odds++;
    }
    return 0;  // TODO: the number of pairs, from evens and odds alone
}
`,
    reference: `#include <vector>

long long evenSumPairs(const std::vector<int>& a) {
    long long evens = 0, odds = 0;
    for (int x : a) {
        if (x % 2 == 0) evens++;
        else odds++;
    }
    return evens * (evens - 1) / 2 + odds * (odds - 1) / 2;
}
`,
    bruteForce: `#include <vector>

long long evenSumPairs(const std::vector<int>& a) {
    long long pairs = 0;
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++)
            if ((a[i] + (long long)a[j]) % 2 == 0) pairs++;
    return pairs;
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5}", expected: "4" },
      { args: "{2, 4}", expected: "1" },
      { args: "{7}", expected: "0" },
      { args: "{-3, 5, 8}", expected: "1" },
      { args: "gen::ints(3, 3000, -1000000000, 1000000000)" },
      { args: "gen::ints(4, 1000000, -1000000000, 1000000000)" },
    ],
  },
  {
    skill: "complexity",
    rung: 4,
    title: "Extend the multiples counter to 3 or 5",
    promptMd: `\`multiplesOf3Or5(n)\` should return how many of the numbers 1, 2, …, n are divisible by 3 **or** 5. For 10 that's 5 (3, 5, 6, 9 and 10). So far it only counts the multiples of 3, with a formula. **Extend it** to count multiples of 3 or 5. n can be as large as 10¹⁸, so a loop up to n is far too slow. Each test must finish within 2 seconds.`,
    functionSignature: "long long multiplesOf3Or5(long long n)",
    call: printCall("multiplesOf3Or5"),
    starterCode: `long long multiplesOf3Or5(long long n) {
    return n / 3;  // the multiples of 3 only
}
`,
    reference: `long long multiplesOf3Or5(long long n) {
    return n / 3 + n / 5 - n / 15;  // multiples of 15 were counted twice
}
`,
    bruteForce: `long long multiplesOf3Or5(long long n) {
    long long count = 0;
    for (long long i = 1; i <= n; i++)
        if (i % 3 == 0 || i % 5 == 0) count++;
    return count;
}
`,
    cases: [
      { args: "10", expected: "5" },
      { args: "15", expected: "7" },
      { args: "1", expected: "0" },
      { args: "30", expected: "14" },
      { args: "1000000" },
      { args: "1000000000000000000LL" },
    ],
  },
  {
    skill: "complexity",
    rung: 5,
    title: "The best single trade",
    promptMd: `\`price[i]\` is a share's price on day i. You may buy once and sell once, on a **later** day. \`bestProfit(price)\` returns the largest profit possible, or 0 if no trade makes money. For \`{9, 4, 6, 2, 8, 5}\` it's 6: buy at 2, sell at 8. ${TASK} ${limits("up to 1,000,000 days, prices from 1 to 10⁹")}`,
    functionSignature: "long long bestProfit(const std::vector<int>& price)",
    call: printCall("bestProfit"),
    generator: GEN,
    starterCode: `#include <vector>

long long bestProfit(const std::vector<int>& price) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <climits>
#include <vector>

long long bestProfit(const std::vector<int>& price) {
    long long best = 0;
    int cheapest = INT_MAX;  // the lowest price so far
    for (int p : price) {
        cheapest = std::min(cheapest, p);
        best = std::max(best, (long long)p - cheapest);
    }
    return best;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

long long bestProfit(const std::vector<int>& price) {
    long long best = 0;
    for (std::size_t i = 0; i < price.size(); i++)
        for (std::size_t j = i + 1; j < price.size(); j++) best = std::max(best, (long long)price[j] - price[i]);
    return best;
}
`,
    cases: [
      { args: "{9, 4, 6, 2, 8, 5}", expected: "6" },
      { args: "{5, 4, 3}", expected: "0" },
      { args: "{3}", expected: "0" },
      { args: "{1, 1000000000}", expected: "999999999" },
      { args: "gen::ints(5, 3000, 1, 1000000000)" },
      { args: "gen::ints(6, 1000000, 1, 1000000000)" },
    ],
  },
];
