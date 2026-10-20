import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

const PREFIX_FUNCTION = `// pi[i]: the length of the longest proper prefix of s[0..i] that is also a suffix of it.
std::vector<int> prefixFunction(const std::string& s) {
    std::vector<int> pi(s.size(), 0);
    for (std::size_t i = 1; i < s.size(); i++) {
        int k = pi[i - 1];
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];
        if (s[i] == s[k]) k++;
        pi[i] = k;
    }
    return pi;
}`;

// One 'b' among n letters 'a', at the given position: the worst case for a naive scan.
const ONE_B = String.raw`
namespace gen {
std::string oneB(int n, int at) {
    std::string s(n, 'a');
    s[at] = 'b';
    return s;
}
}  // namespace gen
`;

export const stringMatching: ExerciseTemplate[] = [
  predict(
    "string-matching",
    "What does it print? Overlapping and separate matches",
    `#include <iostream>
#include <string>

int main() {
    std::string text = "abababa", pat = "aba";
    int overlapping = 0, separate = 0;
    for (std::size_t pos = text.find(pat); pos != std::string::npos; pos = text.find(pat, pos + 1)) {
        std::cout << pos << " ";
        overlapping++;
    }
    for (std::size_t pos = text.find(pat); pos != std::string::npos; pos = text.find(pat, pos + pat.size())) separate++;
    std::cout << "\\n" << overlapping << " " << separate << "\\n";
}
`,
    "0 2 4\n3 2",
  ),
  {
    skill: "string-matching",
    rung: 2,
    title: "Fix the naive search",
    promptMd: `\`occurrences(text, pattern)\` returns every position where pattern starts in text, overlaps included; pattern is never empty. It compares pattern with each place in text, but for \`"abcab"\` and \`"ab"\` it returns only \`0\`: it never tries the last possible place. **Find the fault and fix it.**`,
    functionSignature: "std::vector<int> occurrences(const std::string& text, const std::string& pattern)",
    call: showCall("occurrences"),
    generator: GEN,
    starterCode: `#include <string>
#include <vector>

std::vector<int> occurrences(const std::string& text, const std::string& pattern) {
    std::vector<int> found;
    for (std::size_t i = 0; i + pattern.size() < text.size(); i++)
        if (text.compare(i, pattern.size(), pattern) == 0) found.push_back(i);
    return found;
}
`,
    reference: `#include <string>
#include <vector>

std::vector<int> occurrences(const std::string& text, const std::string& pattern) {
    std::vector<int> found;
    for (std::size_t i = 0; i + pattern.size() <= text.size(); i++)  // the last start is size - pattern size
        if (text.compare(i, pattern.size(), pattern) == 0) found.push_back(i);
    return found;
}
`,
    cases: [
      { args: `"abcab", "ab"`, expected: "0 3" },
      { args: `"aaa", "aa"`, expected: "0 1" },
      { args: `"abc", "abc"`, expected: "0" },
      { args: `"abc", "d"`, expected: "" },
      { args: `"ab", "abc"`, expected: "" },
    ],
  },
  {
    skill: "string-matching",
    rung: 3,
    title: "Complete KMP's matching step",
    promptMd: `\`countMatches(text, pattern)\` counts how often a non-empty pattern occurs in text, overlaps included. It's KMP: \`pi\` is the pattern's prefix function, and \`k\` is how much of the pattern matches the text read so far. When the next character can't extend the match, k falls back to \`pi[k - 1]\` instead of starting over, so each character is read once. **Complete the step for each character.** ${limits("texts of up to 1,000,000 letters and patterns of up to 500,000")}`,
    functionSignature: "long long countMatches(const std::string& text, const std::string& pattern)",
    call: printCall("countMatches"),
    starterCode: `#include <string>
#include <vector>

${PREFIX_FUNCTION}

long long countMatches(const std::string& text, const std::string& pattern) {
    std::vector<int> pi = prefixFunction(pattern);
    int m = pattern.size(), k = 0;
    long long count = 0;
    for (char c : text) {
        // TODO: fall back while c can't extend the match, then extend it
        if (k == m) {
            count++;
            k = pi[k - 1];  // keep the overlap for the next match
        }
    }
    return count;
}
`,
    reference: `#include <string>
#include <vector>

${PREFIX_FUNCTION}

long long countMatches(const std::string& text, const std::string& pattern) {
    std::vector<int> pi = prefixFunction(pattern);
    int m = pattern.size(), k = 0;
    long long count = 0;
    for (char c : text) {
        while (k > 0 && c != pattern[k]) k = pi[k - 1];
        if (c == pattern[k]) k++;
        if (k == m) {
            count++;
            k = pi[k - 1];  // keep the overlap for the next match
        }
    }
    return count;
}
`,
    bruteForce: `#include <string>

long long countMatches(const std::string& text, const std::string& pattern) {
    long long count = 0;
    for (std::size_t i = 0; i + pattern.size() <= text.size(); i++) {
        std::size_t j = 0;
        while (j < pattern.size() && text[i + j] == pattern[j]) j++;
        count += j == pattern.size();
    }
    return count;
}
`,
    cases: [
      { args: `"abababa", "aba"`, expected: "3" },
      { args: `"aaaa", "aa"`, expected: "3" },
      { args: `"abc", "d"`, expected: "0" },
      { args: `"abcabc", "abc"`, expected: "2" },
      { args: `"a", "aa"`, expected: "0" },
      { args: `std::string(3000, 'a'), std::string(60, 'a')` },
      { args: `std::string(1000000, 'a'), std::string(500000, 'a') + "b"` },
    ],
  },
  {
    skill: "string-matching",
    rung: 4,
    title: "Extend the border to the shortest period",
    promptMd: `\`longestBorder(s)\` works: it returns the length of the longest proper prefix of s that is also a suffix (\`abcab\` → 2), using the prefix function. Now \`shortestPeriod(s)\` should return the smallest k such that s is its first k letters repeated a whole number of times: 2 for \`ababab\`, 3 for \`abcabc\`, and s's own length for \`abcab\`. Hint: with a border of length b, the string repeats every n - b letters. Does that piece fit a whole number of times? **Extend the code.** ${limits("strings of up to 1,000,000 letters")}`,
    functionSignature: "int shortestPeriod(const std::string& s)",
    call: printCall("shortestPeriod"),
    generator: GEN + ONE_B,
    starterCode: `#include <string>
#include <vector>

${PREFIX_FUNCTION}

int longestBorder(const std::string& s) { return s.empty() ? 0 : prefixFunction(s).back(); }

int shortestPeriod(const std::string& s) {
    return s.size();  // TODO: use longestBorder
}
`,
    reference: `#include <string>
#include <vector>

${PREFIX_FUNCTION}

int longestBorder(const std::string& s) { return s.empty() ? 0 : prefixFunction(s).back(); }

int shortestPeriod(const std::string& s) {
    int n = s.size(), p = n - longestBorder(s);  // s matches itself shifted by p
    return n > 0 && n % p == 0 ? p : n;            // a whole number of pieces, or no repeat at all
}
`,
    bruteForce: `#include <string>

int shortestPeriod(const std::string& s) {
    int n = s.size();
    for (int k = 1; k < n; k++) {  // compare s with itself shifted by every k
        bool repeats = true;
        for (int i = k; i < n && repeats; i++) repeats = s[i] == s[i - k];
        if (repeats && n % k == 0) return k;
    }
    return n;
}
`,
    cases: [
      { args: `"ababab"`, expected: "2" },
      { args: `"abcabc"`, expected: "3" },
      { args: `"abcab"`, expected: "5" },
      { args: `"aaaa"`, expected: "1" },
      { args: `""`, expected: "0" },
      { args: `"abaaba"`, expected: "3" },
      { args: "gen::oneB(2000, 1999)" },
      { args: "gen::oneB(720720, 720719)" },
    ],
  },
  {
    skill: "string-matching",
    rung: 5,
    title: "Is it a rotation?",
    promptMd: `\`isRotation(a, b)\` says whether b is a rotation of a: some letters moved from the front of a to its back, in order. \`"waterbottle"\` rotates to \`"erbottlewat"\`. Hint: b is a rotation of a exactly when both have the same length and b occurs in a + a. Find it in linear time: \`std::string::find\` can slow down to O(nm) on texts like \`aaa…ab\`. ${TASK} ${limits("strings of up to 1,000,000 letters")} Each test prints 1 or 0.`,
    functionSignature: "bool isRotation(const std::string& a, const std::string& b)",
    call: printCall("isRotation"),
    generator: GEN + ONE_B,
    starterCode: `#include <string>

bool isRotation(const std::string& a, const std::string& b) {
    return a == b;
}
`,
    reference: `#include <string>
#include <vector>

${PREFIX_FUNCTION}

bool isRotation(const std::string& a, const std::string& b) {
    if (a.size() != b.size()) return false;
    std::vector<int> pi = prefixFunction(b + "#" + a + a);  // a full-length border match means b occurs in a + a
    for (int x : pi)
        if (x == (int)b.size()) return true;
    return b.empty();
}
`,
    bruteForce: `#include <string>

bool isRotation(const std::string& a, const std::string& b) {
    if (a.size() != b.size()) return false;
    std::size_t n = a.size();
    if (n == 0) return true;
    for (std::size_t shift = 0; shift < n; shift++) {
        std::size_t i = 0;
        while (i < n && a[(shift + i) % n] == b[i]) i++;
        if (i == n) return true;
    }
    return false;
}
`,
    cases: [
      { args: `"waterbottle", "erbottlewat"`, expected: "1" },
      { args: `"abc", "acb"`, expected: "0" },
      { args: `"", ""`, expected: "1" },
      { args: `"aa", "a"`, expected: "0" },
      { args: `"abab", "baba"`, expected: "1" },
      { args: "gen::oneB(2000, 700), gen::oneB(2000, 1500)" },
      { args: `gen::oneB(1000000, 999999), std::string(1000000, 'a')` },
    ],
  },
];
