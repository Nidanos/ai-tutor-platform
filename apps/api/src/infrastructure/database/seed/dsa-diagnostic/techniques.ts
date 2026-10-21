import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall, TEXT, WORDS } from "../dsa-exercises/harness.js";

// q pairs {n, k} with 0 ≤ n ≤ maxN and 1 ≤ k ≤ maxK.
const SHAPES = String.raw`
namespace gen {
std::vector<std::pair<int, int>> nk(std::uint64_t seed, int q, int maxN, int maxK) {
    state = seed;
    std::vector<std::pair<int, int>> out(q);
    for (auto& [n, k] : out) n = (int)between(0, maxN), k = (int)between(1, maxK);
    return out;
}
}  // namespace gen
`;

export const techniques: ExerciseTemplate[] = [
  // ── prefix-sums ──
  predict(
    "prefix-sums",
    "What does it print? Counts and maximums so far",
    `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {4, 7, 2, 9, 6, 1};
    std::vector<int> evens(a.size() + 1, 0), best(a.size());
    for (std::size_t i = 0; i < a.size(); i++) evens[i + 1] = evens[i] + (a[i] % 2 == 0);
    best[0] = a[0];
    for (std::size_t i = 1; i < a.size(); i++) best[i] = std::max(best[i - 1], a[i]);
    std::cout << evens[6] - evens[2] << " " << evens[3] - evens[0] << " " << best[3] << best[5] << "\\n";
}
`,
    "2 2 99",
  ),
  {
    skill: "prefix-sums",
    rung: 5,
    title: "Count the runs divisible by k",
    promptMd: `Write \`long long divisibleRuns(const std::vector<int>& a, int k)\` that counts the runs of one or more neighbouring numbers whose sum is divisible by k. The numbers are between -10,000 and 10,000, and 1 ≤ k ≤ 1,000,000. For \`{4, 5, 0, -2, -3, 1}\` and k = 5 that's 7. Hint: a run's sum is the difference of two prefix sums, so it is divisible by k when they leave the same remainder. ${TASK} ${limits("up to 200,000 numbers")}`,
    functionSignature: "long long divisibleRuns(const std::vector<int>& a, int k)",
    call: printCall("divisibleRuns"),
    generator: GEN,
    starterCode: `#include <vector>

long long divisibleRuns(const std::vector<int>& a, int k) {
    return 0;
}
`,
    reference: `#include <vector>

long long divisibleRuns(const std::vector<int>& a, int k) {
    std::vector<long long> seen(k, 0);  // how many prefix sums so far left each remainder
    seen[0] = 1;  // the empty prefix
    long long prefix = 0, runs = 0;
    for (int x : a) {
        prefix += x;
        int r = (int)(((prefix % k) + k) % k);  // a negative sum still needs a remainder from 0 to k - 1
        runs += seen[r]++;
    }
    return runs;
}
`,
    bruteForce: `#include <vector>

long long divisibleRuns(const std::vector<int>& a, int k) {
    long long runs = 0;
    for (std::size_t i = 0; i < a.size(); i++) {
        long long sum = 0;
        for (std::size_t j = i; j < a.size(); j++) sum += a[j], runs += sum % k == 0;
    }
    return runs;
}
`,
    cases: [
      { args: "{4, 5, 0, -2, -3, 1}, 5", expected: "7" },
      { args: "{5}, 9", expected: "0" },
      { args: "{}, 3", expected: "0" },
      { args: "{3, 3}, 3", expected: "3" },
      { args: "{1, 2, 3}, 6", expected: "1" },
      { args: "{0, 0}, 1", expected: "3" },
      { args: "gen::ints(721, 2000, -10000, 10000), 7" },
      { args: "gen::ints(722, 200000, -10000, 10000), 1000" },
    ],
  },

  // ── two-pointers ──
  predict(
    "two-pointers",
    "What does it print? Squeeze out repeats, then search inwards",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {1, 1, 2, 3, 3, 3, 4};
    int w = 1;
    for (std::size_t r = 1; r < a.size(); r++)
        if (a[r] != a[w - 1]) a[w++] = a[r];
    std::cout << w << " ";
    for (int i = 0; i < w; i++) std::cout << a[i];
    int lo = 0, hi = w - 1, steps = 0;
    while (lo < hi) {
        int sum = a[lo] + a[hi];
        steps++;
        if (sum == 6) break;
        if (sum < 6) lo++;
        else hi--;
    }
    std::cout << " " << lo << hi << steps << "\\n";
}
`,
    "4 1234 132",
  ),
  {
    skill: "two-pointers",
    rung: 5,
    title: "Count the triples below a target",
    promptMd: `Write \`long long triplesBelow(std::vector<int> a, int target)\` that counts the triples of positions i < j < k with \`a[i] + a[j] + a[k] < target\`. For \`{-2, 0, 1, 3}\` and target 2 that's 2: (-2, 0, 1) and (-2, 0, 3). Hint: after sorting, fix the smallest number and move two pointers inwards. ${TASK} ${limits("up to 5,000 numbers between -1,000,000 and 1,000,000")}`,
    functionSignature: "long long triplesBelow(std::vector<int> a, int target)",
    call: printCall("triplesBelow"),
    generator: GEN,
    starterCode: `#include <vector>

long long triplesBelow(std::vector<int> a, int target) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <vector>

long long triplesBelow(std::vector<int> a, int target) {
    std::sort(a.begin(), a.end());
    long long count = 0;
    int n = a.size();
    for (int i = 0; i < n; i++)
        for (int lo = i + 1, hi = n - 1; lo < hi;) {
            if ((long long)a[i] + a[lo] + a[hi] < target) count += hi - lo, lo++;  // every hi' in (lo, hi] works with lo too
            else hi--;
        }
    return count;
}
`,
    bruteForce: `#include <vector>

long long triplesBelow(std::vector<int> a, int target) {
    long long count = 0;
    int n = a.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            for (int k = j + 1; k < n; k++) count += (long long)a[i] + a[j] + a[k] < target;
    return count;
}
`,
    cases: [
      { args: "{-2, 0, 1, 3}, 2", expected: "2" },
      { args: "{}, 0", expected: "0" },
      { args: "{1, 1, 1}, 4", expected: "1" },
      { args: "{1, 1, 1}, 3", expected: "0" },
      { args: "{5, 1, 3, 4, 7}, 12", expected: "4" },
      { args: "gen::ints(723, 200, -1000000, 1000000), 0" },
      { args: "gen::ints(724, 5000, -1000000, 1000000), 100000" },
    ],
  },

  // ── hashing ──
  predict(
    "hashing",
    "What does it print? Counting words in a map",
    `#include <iostream>
#include <string>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, int> seen;
    for (std::string w : {"to", "be", "or", "not", "to", "be"}) seen[w]++;
    std::cout << seen.size() << seen["to"] << seen.count("is") << seen.size() << " ";
    std::cout << seen["is"] << seen.size() << "\\n";
}
`,
    "4204 05",
  ),
  {
    skill: "hashing",
    rung: 5,
    title: "Count the anagram groups",
    promptMd: `Two words are anagrams if one's letters can be rearranged into the other, like "tea" and "eat". Write \`int anagramGroups(const std::vector<std::string>& words)\` that returns how many groups the words form, where each group holds words that are all anagrams of each other (repeated words are in the same group). The words are lowercase. For \`{"eat", "tea", "tan", "ate", "nat", "bat"}\` that's 3. ${TASK} ${limits("up to 200,000 words of up to 10 letters")}`,
    functionSignature: "int anagramGroups(const std::vector<std::string>& words)",
    call: printCall("anagramGroups"),
    generator: GEN + WORDS,
    starterCode: `#include <string>
#include <vector>

int anagramGroups(const std::vector<std::string>& words) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <string>
#include <unordered_set>
#include <vector>

int anagramGroups(const std::vector<std::string>& words) {
    std::unordered_set<std::string> keys;  // anagrams share the same letters in sorted order
    for (std::string w : words) {
        std::sort(w.begin(), w.end());
        keys.insert(w);
    }
    return keys.size();
}
`,
    bruteForce: `#include <algorithm>
#include <string>
#include <vector>

int anagramGroups(const std::vector<std::string>& words) {
    std::vector<std::string> groups;  // one sorted word per group, searched one by one
    for (std::string w : words) {
        std::sort(w.begin(), w.end());
        if (std::find(groups.begin(), groups.end(), w) == groups.end()) groups.push_back(w);
    }
    return groups.size();
}
`,
    cases: [
      { args: `{"eat", "tea", "tan", "ate", "nat", "bat"}`, expected: "3" },
      { args: "{}", expected: "0" },
      { args: `{"a"}`, expected: "1" },
      { args: `{"ab", "ba", "abc"}`, expected: "2" },
      { args: `{"", ""}`, expected: "1" },
      { args: `{"aab", "aba", "abb"}`, expected: "2" },
      { args: "gen::words(725, 2000, 4, 6)" },
      { args: "gen::words(726, 200000, 8, 26)" },
    ],
  },

  // ── sliding-window ──
  predict(
    "sliding-window",
    "What does it print? A window of three, sliding",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {2, 1, 5, 1, 3, 2};
    int k = 3, sum = 0, best = 0, at = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        sum += a[i];
        if (i >= k) sum -= a[i - k];
        if (i >= k - 1 && sum > best) best = sum, at = i - k + 1;
        std::cout << sum << " ";
    }
    std::cout << "| " << best << " " << at << "\\n";
}
`,
    "2 3 8 7 9 6 | 9 2",
  ),
  {
    skill: "sliding-window",
    rung: 5,
    title: "The shortest stretch that adds up enough",
    promptMd: `Write \`int shortestAtLeast(const std::vector<int>& a, long long target)\` that returns the length of the shortest run of neighbouring numbers whose sum is **at least** \`target\`, or 0 if there's none. All numbers are positive. For \`{2, 3, 1, 2, 4, 3}\` and 7 that's 2 (4 + 3). ${TASK} ${limits("up to 1,000,000 numbers up to 1,000")}`,
    functionSignature: "int shortestAtLeast(const std::vector<int>& a, long long target)",
    call: printCall("shortestAtLeast"),
    generator: GEN,
    starterCode: `#include <vector>

int shortestAtLeast(const std::vector<int>& a, long long target) {
    return 0;
}
`,
    reference: `#include <vector>

int shortestAtLeast(const std::vector<int>& a, long long target) {
    int best = 0;
    long long sum = 0;
    for (int left = 0, right = 0; right < (int)a.size(); right++) {
        sum += a[right];
        while (sum >= target) {  // all positive: shrinking from the left can only lower the sum
            if (best == 0 || right - left + 1 < best) best = right - left + 1;
            sum -= a[left++];
        }
    }
    return best;
}
`,
    bruteForce: `#include <vector>

int shortestAtLeast(const std::vector<int>& a, long long target) {
    int best = 0;
    for (std::size_t i = 0; i < a.size(); i++) {  // every start, grown until it's enough
        long long sum = 0;
        for (std::size_t j = i; j < a.size(); j++) {
            sum += a[j];
            if (sum >= target) {
                if (best == 0 || (int)(j - i + 1) < best) best = j - i + 1;
                break;
            }
        }
    }
    return best;
}
`,
    cases: [
      { args: "{2, 3, 1, 2, 4, 3}, 7", expected: "2" },
      { args: "{1, 4, 4}, 4", expected: "1" },
      { args: "{1, 1, 1}, 5", expected: "0" },
      { args: "{}, 1", expected: "0" },
      { args: "{5, 1, 3, 5, 10, 7, 4, 9, 2, 8}, 15", expected: "2" },
      { args: "gen::ints(727, 2000, 1, 1000), 100000" },
      { args: "gen::ints(728, 1000000, 1, 1000), 100000000" },
    ],
  },

  // ── matrices ──
  predict(
    "matrices",
    "What does it print? A quarter turn",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> m = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    std::vector<std::vector<int>> r(3, std::vector<int>(3));
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 3; j++) r[j][2 - i] = m[i][j];
    for (const auto& row : r) {
        for (int x : row) std::cout << x;
        std::cout << " ";
    }
    std::cout << m[0][2] + m[1][1] + m[2][0] << "\\n";
}
`,
    "741 852 963 15",
  ),
  {
    skill: "matrices",
    rung: 5,
    title: "Read a grid in a spiral",
    promptMd: `Write \`std::vector<int> spiral(const std::vector<std::vector<int>>& m)\` that returns the values of a rows × cols grid in spiral order: along the top row left to right, down the right column, back along the bottom row, up the left column, and so on inwards. Every row has the same length. For \`{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}\` that's \`1 2 3 6 9 8 7 4 5\`. ${TASK} Grids up to 500 × 500.`,
    functionSignature: "std::vector<int> spiral(const std::vector<std::vector<int>>& m)",
    call: showCall("spiral"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> spiral(const std::vector<std::vector<int>>& m) {
    return {};
}
`,
    reference: `#include <vector>

std::vector<int> spiral(const std::vector<std::vector<int>>& m) {
    std::vector<int> out;
    if (m.empty()) return out;
    int top = 0, bottom = m.size() - 1, left = 0, right = m[0].size() - 1;
    while (top <= bottom && left <= right) {  // peel one ring at a time
        for (int c = left; c <= right; c++) out.push_back(m[top][c]);
        for (int r = top + 1; r <= bottom; r++) out.push_back(m[r][right]);
        if (top < bottom)
            for (int c = right - 1; c >= left; c--) out.push_back(m[bottom][c]);
        if (left < right)
            for (int r = bottom - 1; r > top; r--) out.push_back(m[r][left]);
        top++, bottom--, left++, right--;
    }
    return out;
}
`,
    cases: [
      { args: "{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}", expected: "1 2 3 6 9 8 7 4 5" },
      { args: "{{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}}", expected: "1 2 3 4 8 12 11 10 9 5 6 7" },
      { args: "{}", expected: "" },
      { args: "{{7}}", expected: "7" },
      { args: "{{1}, {2}, {3}}", expected: "1 2 3" },
      { args: "{{1, 2}, {3, 4}}", expected: "1 2 4 3" },
      { args: "{{1, 2, 3}}", expected: "1 2 3" },
    ],
  },

  // ── string-techniques ──
  predict(
    "string-techniques",
    "What does it print? Reversing and finding",
    `#include <iostream>
#include <string>

int main() {
    std::string s = "level up";
    std::string r(s.rbegin(), s.rend());
    std::cout << r << "|" << s.substr(2, 3) << "|" << s.find('e') << s.rfind('e') << s.find("up") << "\\n";
}
`,
    "pu level|vel|136",
  ),
  {
    skill: "string-techniques",
    rung: 5,
    title: "The longest palindrome inside",
    promptMd: `A palindrome reads the same both ways, like "abba". Write \`int longestPalindrome(const std::string& s)\` that returns the length of the longest palindrome made of neighbouring letters of \`s\`. For "babad" that's 3 ("bab" or "aba"). Hint: every palindrome has a centre, a letter or the gap between two letters, and grows outwards from it. ${TASK} ${limits("strings up to 5,000 lowercase letters")}`,
    functionSignature: "int longestPalindrome(const std::string& s)",
    call: printCall("longestPalindrome"),
    generator: GEN + TEXT,
    starterCode: `#include <string>

int longestPalindrome(const std::string& s) {
    return 0;
}
`,
    reference: `#include <string>

int longestPalindrome(const std::string& s) {
    int n = s.size(), best = 0;
    for (int centre = 0; centre < 2 * n - 1; centre++) {  // even centres sit between two letters
        int lo = centre / 2, hi = lo + centre % 2;
        while (lo >= 0 && hi < n && s[lo] == s[hi]) lo--, hi++;
        if (hi - lo - 1 > best) best = hi - lo - 1;
    }
    return best;
}
`,
    bruteForce: `#include <string>

int longestPalindrome(const std::string& s) {
    int n = s.size(), best = 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j++) {  // every piece, checked against its own reverse
            std::string piece = s.substr(i, j - i + 1);
            if (piece == std::string(piece.rbegin(), piece.rend()) && j - i + 1 > best) best = j - i + 1;
        }
    return best;
}
`,
    cases: [
      { args: `"babad"`, expected: "3" },
      { args: `"cbbd"`, expected: "2" },
      { args: `""`, expected: "0" },
      { args: `"a"`, expected: "1" },
      { args: `"aaaa"`, expected: "4" },
      { args: `"abacdfgdcaba"`, expected: "3" },
      { args: "gen::text(729, 300, 2)" },
      { args: "gen::text(730, 5000, 2)" },
    ],
  },

  // ── string-matching ──
  predict(
    "string-matching",
    "What does it print? The prefix function",
    `#include <iostream>
#include <string>
#include <vector>

int main() {
    std::string s = "aabaaab";
    std::vector<int> pi(s.size(), 0);  // pi[i]: the longest proper prefix of s[0..i] that is also its suffix
    for (std::size_t i = 1; i < s.size(); i++) {
        int k = pi[i - 1];
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];
        if (s[i] == s[k]) k++;
        pi[i] = k;
    }
    for (int x : pi) std::cout << x;
    std::cout << "\\n";
}
`,
    "0101223",
  ),
  {
    skill: "string-matching",
    rung: 5,
    title: "Letters to add for a palindrome",
    promptMd: `Write \`int lettersToAdd(const std::string& s)\` that returns the fewest letters to add at the **front** of \`s\` to make it a palindrome. That's \`s\`'s length minus its longest prefix that is a palindrome. For "aacecaaa" that's 1 (add "a" to get "aaacecaaa"). Hint: a prefix of s that is a palindrome is also a suffix of s reversed, so the prefix function of s + "#" + reverse(s) finds the longest one in linear time. ${TASK} ${limits("strings up to 1,000,000 lowercase letters")}`,
    functionSignature: "int lettersToAdd(const std::string& s)",
    call: printCall("lettersToAdd"),
    generator: GEN + TEXT,
    starterCode: `#include <string>

int lettersToAdd(const std::string& s) {
    return 0;
}
`,
    reference: `#include <string>
#include <vector>

int lettersToAdd(const std::string& s) {
    std::string t = s + "#" + std::string(s.rbegin(), s.rend());
    std::vector<int> pi(t.size(), 0);
    for (std::size_t i = 1; i < t.size(); i++) {
        int k = pi[i - 1];
        while (k > 0 && t[i] != t[k]) k = pi[k - 1];
        if (t[i] == t[k]) k++;
        pi[i] = k;
    }
    return s.size() - pi.back();  // pi.back(): the longest prefix of s that ends reverse(s), a palindrome
}
`,
    bruteForce: `#include <string>

int lettersToAdd(const std::string& s) {
    for (int len = s.size(); len > 0; len--) {  // the longest palindromic prefix, each one checked against its reverse
        std::string prefix = s.substr(0, len);
        if (prefix == std::string(prefix.rbegin(), prefix.rend())) return s.size() - len;
    }
    return 0;
}
`,
    cases: [
      { args: `"aacecaaa"`, expected: "1" },
      { args: `"abcd"`, expected: "3" },
      { args: `""`, expected: "0" },
      { args: `"a"`, expected: "0" },
      { args: `"aba"`, expected: "0" },
      { args: `"abab"`, expected: "1" },
      { args: "gen::text(731, 2000, 2)" },
      { args: "gen::text(732, 1000000, 2)" },
    ],
  },

  // ── bit-manipulation ──
  predict(
    "bit-manipulation",
    "What does it print? Submasks and Gray codes",
    `#include <iostream>

int main() {
    int mask = 0b1011;
    for (int sub = mask; sub > 0; sub = (sub - 1) & mask) std::cout << sub << " ";
    std::cout << "| ";
    for (int i = 0; i < 4; i++) std::cout << (i ^ (i >> 1));
    std::cout << "\\n";
}
`,
    "11 10 9 8 3 2 1 | 0132",
  ),
  {
    skill: "bit-manipulation",
    rung: 5,
    title: "Add up every pair's XOR",
    promptMd: `Write \`long long pairXorSum(const std::vector<int>& a)\` that returns the sum of \`a[i] ^ a[j]\` (bitwise XOR) over all pairs of positions i < j. The numbers are between 0 and 1,000,000. For \`{1, 2, 3}\` that's 3 + 2 + 1 = 6. Hint: look at one bit at a time. A pair's XOR has bit b set when exactly one of the two numbers has it. ${TASK} ${limits("up to 300,000 numbers")}`,
    functionSignature: "long long pairXorSum(const std::vector<int>& a)",
    call: printCall("pairXorSum"),
    generator: GEN,
    starterCode: `#include <vector>

long long pairXorSum(const std::vector<int>& a) {
    return 0;
}
`,
    reference: `#include <vector>

long long pairXorSum(const std::vector<int>& a) {
    long long total = 0, n = a.size();
    for (int b = 0; b < 20; b++) {
        long long ones = 0;
        for (int x : a) ones += x >> b & 1;
        total += ones * (n - ones) << b;  // each pair of one set and one clear bit adds 2^b
    }
    return total;
}
`,
    bruteForce: `#include <vector>

long long pairXorSum(const std::vector<int>& a) {
    long long total = 0;
    for (std::size_t i = 0; i < a.size(); i++)
        for (std::size_t j = i + 1; j < a.size(); j++) total += a[i] ^ a[j];
    return total;
}
`,
    cases: [
      { args: "{1, 2, 3}", expected: "6" },
      { args: "{}", expected: "0" },
      { args: "{5}", expected: "0" },
      { args: "{7, 7}", expected: "0" },
      { args: "{0, 8, 15}", expected: "30" },
      { args: "{1, 1, 2}", expected: "6" },
      { args: "gen::ints(733, 2000, 0, 1000000)" },
      { args: "gen::ints(734, 300000, 0, 1000000)" },
    ],
  },

  // ── number-theory ──
  predict(
    "number-theory",
    "What does it print? A sieve, a gcd and an lcm",
    `#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<bool> composite(30, false);
    for (int p = 2; p * p < 30; p++)
        if (!composite[p])
            for (int m = p * p; m < 30; m += p) composite[m] = true;
    int count = 0, last = 0;
    for (int n = 2; n < 30; n++)
        if (!composite[n]) count++, last = n;
    std::cout << count << " " << last << " " << std::gcd(84, 36) << " " << std::lcm(4, 6) << "\\n";
}
`,
    "10 29 12 12",
  ),
  {
    skill: "number-theory",
    rung: 5,
    title: "Euler's totient",
    promptMd: `Write \`long long totient(long long n)\` that returns how many of the numbers 1, 2, …, n share no factor with n other than 1 (their gcd with n is 1). For 9 that's 6: 1, 2, 4, 5, 7 and 8. 1 ≤ n ≤ 10^12. Hint: for each prime p that divides n, exactly 1 in p of the numbers is a multiple of p, and trial division up to √n finds those primes. ${TASK} Each test must finish within 2 seconds.`,
    functionSignature: "long long totient(long long n)",
    call: printCall("totient"),
    starterCode: `long long totient(long long n) {
    return 0;
}
`,
    reference: `long long totient(long long n) {
    long long result = n;
    for (long long p = 2; p * p <= n; p++)
        if (n % p == 0) {
            while (n % p == 0) n /= p;
            result -= result / p;  // take out the multiples of the prime p
        }
    if (n > 1) result -= result / n;  // one prime factor larger than the square root can remain
    return result;
}
`,
    bruteForce: `#include <numeric>

long long totient(long long n) {
    long long count = 0;
    for (long long k = 1; k <= n; k++) count += std::gcd(k, n) == 1;
    return count;
}
`,
    cases: [
      { args: "9", expected: "6" },
      { args: "1", expected: "1" },
      { args: "10", expected: "4" },
      { args: "13", expected: "12" },
      { args: "36", expected: "12" },
      { args: "97", expected: "96" },
      { args: "100", expected: "40" },
      { args: "123456" },
      { args: "1000000000000" },
    ],
  },

  // ── combinatorics ──
  predict(
    "combinatorics",
    "What does it print? Orderings and a running binomial",
    `#include <algorithm>
#include <iostream>
#include <string>

int main() {
    std::string s = "abb";
    int orders = 0;
    do {
        orders++;
        std::cout << s << " ";
    } while (std::next_permutation(s.begin(), s.end()));
    std::cout << orders << "\\n";
    long long ways = 1;
    for (int i = 1; i <= 3; i++) ways = ways * (5 + i) / i;
    std::cout << ways << "\\n";
}
`,
    "abb bab bba 3\n56",
  ),
  {
    skill: "combinatorics",
    rung: 5,
    title: "Share out identical sweets",
    promptMd: `n identical sweets are shared among k children; a child may get none. The number of ways is C(n + k - 1, k - 1) ("stars and bars"). Write \`std::vector<long long> shareWays(const std::vector<std::pair<int, int>>& queries)\` that answers each query \`{n, k}\` modulo 1,000,000,007. 0 ≤ n ≤ 1,000,000 and 1 ≤ k ≤ 1,000,000. For \`{{3, 2}, {0, 4}}\` that's \`4 1\`. Hint: compute factorials and their inverses once, then each query is two multiplications. ${TASK} ${limits("up to 100,000 queries")}`,
    functionSignature: "std::vector<long long> shareWays(const std::vector<std::pair<int, int>>& queries)",
    call: showCall("shareWays"),
    generator: GEN + SHAPES,
    starterCode: `#include <utility>
#include <vector>

std::vector<long long> shareWays(const std::vector<std::pair<int, int>>& queries) {
    return {};
}
`,
    reference: `#include <utility>
#include <vector>

const long long MOD = 1000000007;

long long power(long long b, long long e) {
    long long r = 1;
    for (b %= MOD; e; e >>= 1, b = b * b % MOD)
        if (e & 1) r = r * b % MOD;
    return r;
}

std::vector<long long> shareWays(const std::vector<std::pair<int, int>>& queries) {
    const int TOP = 2000000;
    std::vector<long long> fact(TOP + 1, 1), inv(TOP + 1, 1);
    for (int i = 1; i <= TOP; i++) fact[i] = fact[i - 1] * i % MOD;
    inv[TOP] = power(fact[TOP], MOD - 2);  // Fermat: one inverse, then the rest walking down
    for (int i = TOP; i > 0; i--) inv[i - 1] = inv[i] * i % MOD;
    std::vector<long long> out;
    for (auto [n, k] : queries) out.push_back(fact[n + k - 1] * inv[k - 1] % MOD * inv[n] % MOD);
    return out;
}
`,
    bruteForce: `#include <utility>
#include <vector>

const long long MOD = 1000000007;

long long power(long long b, long long e) {
    long long r = 1;
    for (b %= MOD; e; e >>= 1, b = b * b % MOD)
        if (e & 1) r = r * b % MOD;
    return r;
}

std::vector<long long> shareWays(const std::vector<std::pair<int, int>>& queries) {
    std::vector<long long> out;
    for (auto [n, k] : queries) {  // C(n + k - 1, k - 1) from scratch, one factor and one inverse at a time
        long long c = 1;
        for (int i = 1; i < k; i++) c = c * ((n + i) % MOD) % MOD * power(i, MOD - 2) % MOD;
        out.push_back(c);
    }
    return out;
}
`,
    cases: [
      { args: "{{3, 2}, {0, 4}}", expected: "4 1" },
      { args: "{{5, 3}, {1, 1}}", expected: "21 1" },
      { args: "{{10, 1}, {2, 5}}", expected: "1 15" },
      { args: "{}", expected: "" },
      { args: "gen::nk(735, 200, 1000, 1000)" },
      { args: "gen::nk(736, 100000, 1000000, 1000000)" },
    ],
  },
];
