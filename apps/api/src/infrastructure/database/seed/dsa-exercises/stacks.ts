import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits } from "./harness.js";

// Deeply nested brackets, and a random word followed by its reverse.
const NESTING = String.raw`
namespace gen {
std::string nested(std::uint64_t seed, int depth) {
    state = seed;
    std::string open, close;
    for (int i = 0; i < depth; i++) {
        int kind = (int)between(0, 2);
        open += "([{"[kind];
        close += ")]}"[kind];
    }
    return open + std::string(close.rbegin(), close.rend());
}
std::string mirrored(std::uint64_t seed, int half) {
    state = seed;
    std::string s;
    for (int i = 0; i < half; i++) s += char('a' + between(0, 25));
    return s + std::string(s.rbegin(), s.rend());
}
}  // namespace gen
`;

export const stacks: ExerciseTemplate[] = [
  predict(
    "stacks",
    "What does it print? Pushing and popping",
    `#include <iostream>
#include <stack>

int main() {
    std::stack<int> s;
    for (int x : {5, 1, 4}) s.push(x);
    std::cout << s.top() << " ";
    s.pop();
    s.push(s.top() * 2);
    std::cout << s.top() << " " << s.size() << "\\n";
    while (!s.empty()) {
        std::cout << s.top() << " ";
        s.pop();
    }
    std::cout << "\\n";
}
`,
    "4 2 3\n2 1 5",
  ),
  {
    skill: "stacks",
    rung: 2,
    title: "Fix the bracket checker",
    promptMd: `\`balanced(s)\` says whether every bracket in s, made only of \`()[]{}\`, is closed by the right kind in the right order. It pushes each opening bracket and pops it at its closing one. It rejects \`(]\` correctly, but it accepts \`((\`. **Find the fault and fix it.** ${limits("strings of up to 1,000,000 brackets")} Each test prints 1 or 0.`,
    functionSignature: "bool balanced(const std::string& s)",
    call: printCall("balanced"),
    generator: GEN + NESTING,
    starterCode: `#include <stack>
#include <string>

bool balanced(const std::string& s) {
    std::stack<char> open;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            open.push(c);
        } else {
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (open.empty() || open.top() != want) return false;
            open.pop();
        }
    }
    return true;
}
`,
    reference: `#include <stack>
#include <string>

bool balanced(const std::string& s) {
    std::stack<char> open;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            open.push(c);
        } else {
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (open.empty() || open.top() != want) return false;
            open.pop();
        }
    }
    return open.empty();  // anything left was never closed
}
`,
    bruteForce: `#include <string>

bool balanced(const std::string& s) {
    std::string t = s;
    for (bool removed = true; removed;) {  // remove an innermost pair, again and again
        removed = false;
        for (std::size_t i = 0; i + 1 < t.size() && !removed; i++)
            if ((t[i] == '(' && t[i + 1] == ')') || (t[i] == '[' && t[i + 1] == ']') || (t[i] == '{' && t[i + 1] == '}')) {
                t.erase(i, 2);
                removed = true;
            }
    }
    return t.empty();
}
`,
    cases: [
      { args: `"([]{})"`, expected: "1" },
      { args: `"(]"`, expected: "0" },
      { args: `"(("`, expected: "0" },
      { args: `""`, expected: "1" },
      { args: `")("`, expected: "0" },
      { args: `"{[()()]}"`, expected: "1" },
      { args: "gen::nested(311, 1000)" },
      { args: "gen::nested(312, 500000)" },
    ],
  },
  {
    skill: "stacks",
    rung: 3,
    title: "Complete removing neighbouring pairs",
    promptMd: `\`removePairs(s)\` keeps removing two neighbouring equal letters until none are left: \`xyyxzw\` → \`xxzw\` → \`zw\`. A stack does it in one pass: the string \`kept\` acts as the stack, with its back as the top. **Complete the step for each letter.** ${limits("strings of up to 1,000,000 letters")} Each test prints what's left, or its length and a checksum when it's long.`,
    functionSignature: "std::string removePairs(const std::string& s)",
    call: (args) => `gen::showText(removePairs(${args}));`,
    generator: GEN + NESTING,
    starterCode: `#include <string>

std::string removePairs(const std::string& s) {
    std::string kept;  // a stack: its back is the top
    for (char c : s) {
        // TODO: if c matches the top, pop it; otherwise push c
    }
    return kept;
}
`,
    reference: `#include <string>

std::string removePairs(const std::string& s) {
    std::string kept;  // a stack: its back is the top
    for (char c : s) {
        if (!kept.empty() && kept.back() == c) kept.pop_back();  // c cancels the letter before it
        else kept.push_back(c);
    }
    return kept;
}
`,
    bruteForce: `#include <string>

std::string removePairs(const std::string& s) {
    std::string t = s;
    for (bool removed = true; removed;) {
        removed = false;
        for (std::size_t i = 0; i + 1 < t.size() && !removed; i++)
            if (t[i] == t[i + 1]) {
                t.erase(i, 2);
                removed = true;
            }
    }
    return t;
}
`,
    cases: [
      { args: `"xyyxzw"`, expected: "zw" },
      { args: `"aa"`, expected: "" },
      { args: `"abc"`, expected: "abc" },
      { args: `""`, expected: "" },
      { args: `"abccbad"`, expected: "d" },
      { args: "gen::mirrored(313, 1000)" },
      { args: "gen::mirrored(314, 500000)" },
    ],
  },
  {
    skill: "stacks",
    rung: 4,
    title: "Extend the calculator to brackets",
    promptMd: `\`evaluate(s)\` works out expressions of single digits joined by \`+\` and \`-\`, like \`"7-2+4"\`, from left to right. **Extend it** to allow brackets, as in \`"1-(2-3)"\`, which is 2. A minus in front of a bracket flips the sign of everything inside it. Keep a stack with the sign in effect inside each open bracket. Brackets are always balanced, and a bracket may open right after a sign or at the start.`,
    functionSignature: "long long evaluate(const std::string& s)",
    call: printCall("evaluate"),
    starterCode: `#include <string>

long long evaluate(const std::string& s) {
    long long total = 0;
    int sign = 1;
    for (char c : s) {
        if (c == '+') sign = 1;
        else if (c == '-') sign = -1;
        else if (c >= '0' && c <= '9') total += sign * (c - '0');
    }
    return total;
}
`,
    reference: `#include <stack>
#include <string>

long long evaluate(const std::string& s) {
    long long total = 0;
    std::stack<int> outer;  // the sign in effect inside each open bracket
    outer.push(1);
    int sign = 1;  // the sign of the next digit or bracket
    for (char c : s) {
        if (c == '+') {
            sign = 1;
        } else if (c == '-') {
            sign = -1;
        } else if (c == '(') {
            outer.push(outer.top() * sign);
            sign = 1;
        } else if (c == ')') {
            outer.pop();
        } else if (c >= '0' && c <= '9') {
            total += outer.top() * sign * (c - '0');
        }
    }
    return total;
}
`,
    cases: [
      { args: `"1-(2-3)"`, expected: "2" },
      { args: `"7-2+4"`, expected: "9" },
      { args: `"-(4+5)"`, expected: "-9" },
      { args: `"(1)"`, expected: "1" },
      { args: `"2-(3-(4-5))"`, expected: "-2" },
      { args: `""`, expected: "0" },
    ],
  },
  {
    skill: "stacks",
    rung: 5,
    title: "Decode repeated text",
    promptMd: `\`decodeString(s)\` expands \`k[text]\`, meaning text written k times; codes can nest, and k can have several digits. \`2[ab3[c]]\` becomes \`abcccabccc\`, and letters outside brackets stay as they are. Each test prints the decoded text. ${TASK}`,
    functionSignature: "std::string decodeString(const std::string& s)",
    call: (args) => `std::cout << decodeString(${args}) << "\\n";`,
    starterCode: `#include <string>

std::string decodeString(const std::string& s) {
    return s;
}
`,
    reference: `#include <cctype>
#include <stack>
#include <string>
#include <utility>

std::string decodeString(const std::string& s) {
    std::stack<std::pair<std::string, int>> outer;  // the text before each '[' and its repeat count
    std::string current;
    int count = 0;
    for (char c : s) {
        if (std::isdigit((unsigned char)c)) {
            count = count * 10 + (c - '0');
        } else if (c == '[') {
            outer.push({current, count});
            current.clear();
            count = 0;
        } else if (c == ']') {
            auto [before, times] = outer.top();
            outer.pop();
            std::string repeated;
            for (int i = 0; i < times; i++) repeated += current;
            current = before + repeated;
        } else {
            current += c;
        }
    }
    return current;
}
`,
    cases: [
      { args: `"2[ab3[c]]"`, expected: "abcccabccc" },
      { args: `"x"`, expected: "x" },
      { args: `"10[z]"`, expected: "zzzzzzzzzz" },
      { args: `"a2[b]c"`, expected: "abbc" },
      { args: `""`, expected: "" },
      { args: `"2[m2[n]]o"`, expected: "mnnmnno" },
    ],
  },
];
