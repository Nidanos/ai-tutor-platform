import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, TEXT } from "./harness.js";

const LIS_LENGTHS = `    int n = a.size();
    std::vector<int> len(n, 1);  // len[i]: the longest rise ending at a[i]
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++)
            if (a[j] < a[i] && len[j] + 1 > len[i]) len[i] = len[j] + 1;
    int best = n ? *std::max_element(len.begin(), len.end()) : 0;
`;

const editDistance = (step: string) => `#include <algorithm>
#include <string>
#include <vector>

int editDistance(const std::string& a, const std::string& b) {
    int n = a.size(), m = b.size();
    std::vector<std::vector<int>> d(n + 1, std::vector<int>(m + 1, 0));  // d[i][j]: a's first i letters into b's first j
    for (int i = 0; i <= n; i++) d[i][0] = i;
    for (int j = 0; j <= m; j++) d[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) d[i][j] = d[i - 1][j - 1];
            else {
${step}
            }
        }
    return d[n][m];
}
`;

export const dpSequences: ExerciseTemplate[] = [
  predict(
    "dp-sequences",
    "What does it print? A common subsequence table",
    `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::string a = "ACB", b = "ABC";
    std::vector<std::vector<int>> dp(a.size() + 1, std::vector<int>(b.size() + 1, 0));
    for (std::size_t i = 1; i <= a.size(); i++) {
        for (std::size_t j = 1; j <= b.size(); j++)
            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : std::max(dp[i - 1][j], dp[i][j - 1]);
        for (int x : dp[i]) std::cout << x;
        std::cout << "\\n";
    }
}
`,
    "0111\n0112\n0122",
  ),
  {
    skill: "dp-sequences",
    rung: 2,
    title: "Fix the longest rise",
    promptMd: `\`longestRise(a)\` returns the length of the longest **strictly** increasing subsequence of \`a\` (its numbers in their original order, not necessarily side by side). It keeps \`tails[k]\`, the smallest last number of a rise of length k + 1, and binary-searches where each number goes. For \`{10, 9, 2, 5, 3, 7, 101, 18}\` that's 4, but repeated numbers fool it. **Find the fault and fix it.** ${limits("up to 200,000 numbers")}`,
    functionSignature: "int longestRise(const std::vector<int>& a)",
    call: printCall("longestRise"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

int longestRise(const std::vector<int>& a) {
    std::vector<int> tails;
    for (int x : a) {
        auto it = std::upper_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
`,
    reference: `#include <algorithm>
#include <vector>

int longestRise(const std::vector<int>& a) {
    std::vector<int> tails;
    for (int x : a) {
        auto it = std::lower_bound(tails.begin(), tails.end(), x);  // an equal tail is replaced, never extended
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

int longestRise(const std::vector<int>& a) {
${LIS_LENGTHS}    return best;
}
`,
    cases: [
      { args: "{10, 9, 2, 5, 3, 7, 101, 18}", expected: "4" },
      { args: "{2, 2, 2}", expected: "1" },
      { args: "{}", expected: "0" },
      { args: "{5}", expected: "1" },
      { args: "{1, 3, 3, 4}", expected: "3" },
      { args: "{4, 3, 2, 1}", expected: "1" },
      { args: "gen::ints(541, 2000, 1, 100)" },
      { args: "gen::ints(542, 200000, 1, 1000000)" },
    ],
  },
  {
    skill: "dp-sequences",
    rung: 3,
    title: "Complete the edit distance",
    promptMd: `\`editDistance(a, b)\` returns the fewest single-letter edits that turn \`a\` into \`b\`: inserting a letter, deleting one, or replacing one with another. \`d[i][j]\` is the answer for the first i letters of a and the first j of b. **Complete the TODO** for when \`a[i - 1]\` and \`b[j - 1]\` differ. For "kitten" and "sitting" that's 3. Strings up to 5,000 letters.`,
    functionSignature: "int editDistance(const std::string& a, const std::string& b)",
    call: printCall("editDistance"),
    starterCode: editDistance("                // TODO: one more than the cheapest of replacing, deleting from a, or inserting into a"),
    reference: editDistance("                d[i][j] = 1 + std::min({d[i - 1][j - 1], d[i - 1][j], d[i][j - 1]});  // replace, delete, insert"),
    cases: [
      { args: `"kitten", "sitting"`, expected: "3" },
      { args: `"", "abc"`, expected: "3" },
      { args: `"abc", "abc"`, expected: "0" },
      { args: `"horse", "ros"`, expected: "3" },
      { args: `"intention", "execution"`, expected: "5" },
      { args: `"a", "b"`, expected: "1" },
      { args: `"ab", "ba"`, expected: "2" },
    ],
  },
  {
    skill: "dp-sequences",
    rung: 4,
    title: "Extend the longest rise to count them",
    promptMd: `\`countLongest(a)\` works out, for each position, the length of the longest strictly increasing subsequence ending there, and so far returns the overall longest length. **Extend it** to return **how many** strictly increasing subsequences have that longest length, modulo 1,000,000,007; subsequences at different positions count separately, even with equal numbers. Return 0 for an empty list. For \`{1, 3, 5, 4, 7}\` the longest length is 4, reached by 1 3 5 7 and 1 3 4 7, so the answer is 2. ${limits("up to 8,000 numbers")}`,
    functionSignature: "long long countLongest(const std::vector<int>& a)",
    call: printCall("countLongest"),
    generator: GEN,
    starterCode: `#include <algorithm>
#include <vector>

long long countLongest(const std::vector<int>& a) {
${LIS_LENGTHS}    return best;  // so far: the longest length
}
`,
    reference: `#include <algorithm>
#include <vector>

long long countLongest(const std::vector<int>& a) {
    const long long MOD = 1000000007;
    int n = a.size();
    std::vector<int> len(n, 1);  // len[i]: the longest rise ending at a[i]
    std::vector<long long> ways(n, 1);  // ways[i]: how many rises of that length end at a[i]
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++) {
            if (a[j] >= a[i]) continue;
            if (len[j] + 1 > len[i]) len[i] = len[j] + 1, ways[i] = ways[j];  // a longer rise: start counting again
            else if (len[j] + 1 == len[i]) ways[i] = (ways[i] + ways[j]) % MOD;
        }
    int best = n ? *std::max_element(len.begin(), len.end()) : 0;
    long long total = 0;
    for (int i = 0; i < n; i++)
        if (len[i] == best) total = (total + ways[i]) % MOD;
    return total;
}
`,
    bruteForce: `#include <vector>

long long countLongest(const std::vector<int>& a) {
    const long long MOD = 1000000007;
    int n = a.size();
    if (n == 0) return 0;
    std::vector<long long> ways(n, 1);  // rises of the current length ending at each position: length 1 first
    std::vector<char> exists(n, 1);
    while (true) {  // one length at a time, until no rise is longer
        std::vector<long long> next(n, 0);
        std::vector<char> nextExists(n, 0);
        bool any = false;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < i; j++)
                if (a[j] < a[i] && exists[j]) next[i] = (next[i] + ways[j]) % MOD, nextExists[i] = 1, any = true;
        if (!any) break;
        ways = next, exists = nextExists;
    }
    long long total = 0;
    for (int i = 0; i < n; i++)
        if (exists[i]) total = (total + ways[i]) % MOD;
    return total;
}
`,
    cases: [
      { args: "{1, 3, 5, 4, 7}", expected: "2" },
      { args: "{2, 2, 2, 2, 2}", expected: "5" },
      { args: "{}", expected: "0" },
      { args: "{1, 2, 4, 3, 5, 4, 7, 2}", expected: "3" },
      { args: "{3, 2, 1}", expected: "3" },
      { args: "{1, 2}", expected: "1" },
      { args: "gen::ints(543, 300, 1, 100)" },
      { args: "gen::ints(544, 8000, 1, 1000000)" },
    ],
  },
  {
    skill: "dp-sequences",
    rung: 5,
    title: "The fewest cuts into palindromes",
    promptMd: `A palindrome reads the same both ways, like "aba". \`fewestCuts(s)\` returns the fewest cuts that split \`s\` into pieces that are all palindromes. For "aab" that's 1: "aa" and "b". ${TASK} ${limits("strings up to 5,000 lowercase letters")}`,
    functionSignature: "int fewestCuts(const std::string& s)",
    call: printCall("fewestCuts"),
    generator: GEN + TEXT,
    starterCode: `#include <string>

int fewestCuts(const std::string& s) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <string>
#include <vector>

int fewestCuts(const std::string& s) {
    int n = s.size();
    if (n == 0) return 0;
    std::vector<std::vector<char>> pal(n, std::vector<char>(n, 0));  // pal[i][j]: is s[i..j] a palindrome?
    std::vector<int> cuts(n);  // cuts[j]: the fewest cuts for s[0..j]
    for (int j = 0; j < n; j++) {
        cuts[j] = j;
        for (int i = 0; i <= j; i++)
            if (s[i] == s[j] && (j - i < 2 || pal[i + 1][j - 1])) {  // the inside was settled on an earlier j
                pal[i][j] = 1;
                cuts[j] = std::min(cuts[j], i == 0 ? 0 : cuts[i - 1] + 1);
            }
    }
    return cuts[n - 1];
}
`,
    bruteForce: `#include <algorithm>
#include <string>
#include <vector>

int fewestCuts(const std::string& s) {
    int n = s.size();
    if (n == 0) return 0;
    std::vector<int> cuts(n);
    for (int j = 0; j < n; j++) {
        cuts[j] = j;
        for (int i = 0; i <= j; i++) {
            std::string piece = s.substr(i, j - i + 1);  // check every piece afresh by reversing it
            if (piece == std::string(piece.rbegin(), piece.rend())) cuts[j] = std::min(cuts[j], i == 0 ? 0 : cuts[i - 1] + 1);
        }
    }
    return cuts[n - 1];
}
`,
    cases: [
      { args: `"aab"`, expected: "1" },
      { args: `"a"`, expected: "0" },
      { args: `"ab"`, expected: "1" },
      { args: `"aba"`, expected: "0" },
      { args: `"abcbm"`, expected: "2" },
      { args: `""`, expected: "0" },
      { args: `"abacdc"`, expected: "1" },
      { args: "gen::text(545, 300, 2)" },
      { args: "gen::text(546, 5000, 2)" },
    ],
  },
];
