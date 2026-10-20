import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

// Text inputs.
const TEXT = String.raw`
namespace gen {
// A letter-and-count code like "a3b1z9", made of the given number of pairs.
std::string runCode(std::uint64_t seed, int pairs) {
    state = seed;
    std::string s;
    for (int i = 0; i < pairs; i++) s += char('a' + between(0, 25)), s += char('0' + between(1, 9));
    return s;
}
// A random palindrome of about n letters with one extra letter slipped in somewhere.
std::string nearPalindrome(std::uint64_t seed, int n) {
    state = seed;
    std::string half;
    for (int i = 0; i < n / 2; i++) half += char('a' + between(0, 2));
    std::string s = half + std::string(half.rbegin(), half.rend());
    s.insert(s.begin() + between(0, (long long)s.size()), char('a' + between(0, 2)));
    return s;
}
}  // namespace gen
`;

const SLOW_DECODE = `#include <string>

std::string decode(const std::string& code) {
    std::string out;
    for (std::size_t i = 0; i + 1 < code.size(); i += 2)
        for (int k = 0; k < code[i + 1] - '0'; k++) out = out + code[i];
    return out;
}
`;

const RANGE = `// Is s[i..j] a palindrome?
bool isPalindromeRange(const std::string& s, int i, int j) {
    while (i < j)
        if (s[i++] != s[j--]) return false;
    return true;
}`;

export const stringTechniques: ExerciseTemplate[] = [
  predict(
    "string-techniques",
    "What does it print? Finding inside a string",
    `#include <iostream>
#include <string>

int main() {
    std::string s = "data structures";
    std::cout << s.find('t') << " " << s.rfind('t') << " " << s.substr(5, 6) << "\\n";
    int vowels = 0;
    for (char c : s) vowels += std::string("aeiou").find(c) != std::string::npos;
    std::cout << vowels << " " << char(s[0] - 'a' + 'A') << "\\n";
}
`,
    "2 10 struct\n5 D",
  ),
  {
    skill: "string-techniques",
    rung: 2,
    title: "Make the decoder fast enough",
    promptMd: `\`decode(code)\` expands a code made of letter-and-count pairs, each count a digit from 1 to 9: \`"a3b1c2"\` becomes \`aaabcc\`. It gives the right answers, but on long codes it's far too slow, because \`out = out + c\` copies the whole string every time it adds one letter. **Make it fast enough.** ${limits("codes of up to 400,000 pairs")} Each test prints the text, or its length and a checksum when it's long.`,
    functionSignature: "std::string decode(const std::string& code)",
    call: (args) => `gen::showText(decode(${args}));`,
    generator: GEN + TEXT,
    starterCode: SLOW_DECODE,
    reference: `#include <string>

std::string decode(const std::string& code) {
    std::string out;
    for (std::size_t i = 0; i + 1 < code.size(); i += 2) out.append(code[i + 1] - '0', code[i]);  // adds in place
    return out;
}
`,
    bruteForce: SLOW_DECODE,
    cases: [
      { args: `"a3b1c2"`, expected: "aaabcc" },
      { args: `""`, expected: "" },
      { args: `"z9"`, expected: "zzzzzzzzz" },
      { args: `"x1y1x1"`, expected: "xyx" },
      { args: "gen::runCode(251, 300)" },
      { args: "gen::runCode(252, 400000)" },
    ],
  },
  {
    skill: "string-techniques",
    rung: 3,
    title: "Complete the almost-palindrome",
    promptMd: `\`almostPalindrome(s)\` says whether s can be read the same both ways after deleting **at most one** character: \`kayaks\` can (delete the last s). It walks in from both ends. When the two characters differ, one of them has to go. **Complete that case**, using \`isPalindromeRange\` to check what's left. ${limits("strings of up to 1,000,000 letters")} Each test prints 1 or 0.`,
    functionSignature: "bool almostPalindrome(const std::string& s)",
    call: printCall("almostPalindrome"),
    generator: GEN + TEXT,
    starterCode: `#include <string>

${RANGE}

bool almostPalindrome(const std::string& s) {
    int i = 0, j = (int)s.size() - 1;
    while (i < j) {
        if (s[i] != s[j]) return false;  // TODO: one deletion may still fix it
        i++, j--;
    }
    return true;
}
`,
    reference: `#include <string>

${RANGE}

bool almostPalindrome(const std::string& s) {
    int i = 0, j = (int)s.size() - 1;
    while (i < j) {
        if (s[i] != s[j]) return isPalindromeRange(s, i + 1, j) || isPalindromeRange(s, i, j - 1);  // drop one of them
        i++, j--;
    }
    return true;
}
`,
    bruteForce: `#include <string>

${RANGE}

bool almostPalindrome(const std::string& s) {
    if (isPalindromeRange(s, 0, (int)s.size() - 1)) return true;
    for (std::size_t skip = 0; skip < s.size(); skip++) {
        std::string t = s.substr(0, skip) + s.substr(skip + 1);
        if (isPalindromeRange(t, 0, (int)t.size() - 1)) return true;
    }
    return false;
}
`,
    cases: [
      { args: `"kayaks"`, expected: "1" },
      { args: `"abc"`, expected: "0" },
      { args: `"racecar"`, expected: "1" },
      { args: `""`, expected: "1" },
      { args: `"abcdba"`, expected: "1" },
      { args: `"abcxdba"`, expected: "0" },
      { args: "gen::nearPalindrome(253, 2000)" },
      { args: "gen::nearPalindrome(254, 1000000)" },
    ],
  },
  {
    skill: "string-techniques",
    rung: 4,
    title: "Extend reversing to each word",
    promptMd: `\`reverseWords(s)\` reverses s in place with two indexes walking inwards, so \`"hello world"\` becomes \`"dlrow olleh"\`. **Extend it** to reverse the letters of **each word** instead, keeping the words in their order and the spaces where they are: \`"hello world"\` should become \`"olleh dlrow"\`. Words are separated by single spaces.`,
    functionSignature: "void reverseWords(std::string& s)",
    call: (args) => `{ std::string s = ${args}; reverseWords(s); std::cout << s << "\\n"; }`,
    starterCode: `#include <string>
#include <utility>

void reverseWords(std::string& s) {
    int i = 0, j = (int)s.size() - 1;
    while (i < j) std::swap(s[i++], s[j--]);
}
`,
    reference: `#include <string>
#include <utility>

void reverseWords(std::string& s) {
    std::size_t start = 0;
    while (start < s.size()) {
        std::size_t end = s.find(' ', start);  // the space after this word, or npos at the end
        if (end == std::string::npos) end = s.size();
        int i = start, j = (int)end - 1;
        while (i < j) std::swap(s[i++], s[j--]);
        start = end + 1;
    }
}
`,
    cases: [
      { args: `"hello world"`, expected: "olleh dlrow" },
      { args: `"a"`, expected: "a" },
      { args: `""`, expected: "" },
      { args: `"ab cd ef"`, expected: "ba dc fe" },
      { args: `"racecar level"`, expected: "racecar level" },
    ],
  },
  {
    skill: "string-techniques",
    rung: 5,
    title: "The longest common prefix",
    promptMd: `\`commonPrefix(words)\` returns the longest beginning that **every** word in the list shares: for \`{"interview", "internet", "interval"}\` it's \`inter\`. It's empty if the list is empty or the words share nothing. ${TASK}`,
    functionSignature: "std::string commonPrefix(const std::vector<std::string>& words)",
    call: (args) => `std::cout << commonPrefix(${args}) << "\\n";`,
    starterCode: `#include <string>
#include <vector>

std::string commonPrefix(const std::vector<std::string>& words) {
    return "";
}
`,
    reference: `#include <string>
#include <vector>

std::string commonPrefix(const std::vector<std::string>& words) {
    if (words.empty()) return "";
    std::string prefix = words[0];
    for (const std::string& w : words) {
        std::size_t k = 0;
        while (k < prefix.size() && k < w.size() && prefix[k] == w[k]) k++;
        prefix.resize(k);  // only what this word shares too
    }
    return prefix;
}
`,
    cases: [
      { args: `{"interview", "internet", "interval"}`, expected: "inter" },
      { args: `{"dog", "cat"}`, expected: "" },
      { args: `{}`, expected: "" },
      { args: `{"alone"}`, expected: "alone" },
      { args: `{"ab", "abc", "a"}`, expected: "a" },
      { args: `{"same", "same"}`, expected: "same" },
    ],
  },
];
