import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

// n different random lowercase words of the same length, so none is a prefix of another.
const WORDS = String.raw`
#include <set>

namespace gen {
std::vector<std::string> words(std::uint64_t seed, int n, int length) {
    state = seed;
    std::set<std::string> seen;
    std::vector<std::string> out;
    while ((int)out.size() < n) {
        std::string w;
        for (int i = 0; i < length; i++) w += char('a' + between(0, 25));
        if (seen.insert(w).second) out.push_back(w);
    }
    return out;
}
}  // namespace gen
`;

const TRIE_BUILD = `    std::vector<std::array<int, 26>> next(1);  // node 0 is the root; a child of 0 means "none"
    std::vector<int> pass(1, 0);                // pass[v]: how many words go through node v
    for (const auto& w : words) {
        int v = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (!next[v][c]) {
                next[v][c] = next.size();
                next.push_back({});
                pass.push_back(0);
            }
            v = next[v][c];
            pass[v]++;
        }
    }`;

const TRIE_CLASS = (containsBody: string) => `#include <array>
#include <string>
#include <vector>

class Trie {
public:
    void insert(const std::string& w) {
        int v = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (!next_[v][c]) {
                next_[v][c] = next_.size();
                next_.push_back({});
                end_.push_back(false);
            }
            v = next_[v][c];
        }
        end_[v] = true;  // a word ends here
    }
    bool contains(const std::string& w) const {
${containsBody}
    }

private:
    std::vector<std::array<int, 26>> next_ = std::vector<std::array<int, 26>>(1);  // node 0 is the root
    std::vector<bool> end_ = {false};
};

std::vector<int> lookups(const std::vector<std::string>& words, const std::vector<std::string>& queries) {
    Trie trie;
    for (const auto& w : words) trie.insert(w);
    std::vector<int> out;
    for (const auto& q : queries) out.push_back(trie.contains(q));
    return out;
}
`;

const WALK = `        int v = 0;
        for (char ch : w)
            if (!(v = next_[v][ch - 'a'])) return false;  // the path breaks off`;

export const tries: ExerciseTemplate[] = [
  predict(
    "tries",
    "What does it print? Counting words through a trie",
    `#include <array>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::array<int, 26>> next(1);
    std::vector<int> pass(1, 0);
    for (std::string w : {"cab", "cat", "cow", "do", "cab"}) {
        int v = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (!next[v][c]) {
                next[v][c] = next.size();
                next.push_back({});
                pass.push_back(0);
            }
            v = next[v][c];
            pass[v]++;
        }
    }
    int c = next[0]['c' - 'a'], ca = next[c]['a' - 'a'];
    std::cout << next.size() << " " << pass[c] << " " << pass[ca] << "\\n";
}
`,
    "9 4 3",
  ),
  {
    skill: "tries",
    rung: 2,
    title: "Fix the word lookup",
    promptMd: `\`lookups(words, queries)\` puts the words in a trie, then says for each query whether it is **one of the words**. For words \`{"car", "cart", "dog"}\` it wrongly says yes to \`"ca"\` and \`"do"\`, which are only beginnings of words. **Find the fault and fix it.** Each test prints 1 or 0 per query.`,
    functionSignature: "std::vector<int> lookups(const std::vector<std::string>& words, const std::vector<std::string>& queries)",
    call: showCall("lookups"),
    generator: GEN,
    starterCode: TRIE_CLASS(`${WALK}
        return true;`),
    reference: TRIE_CLASS(`${WALK}
        return end_[v];  // the path exists; is it a whole word?`),
    cases: [
      { args: `{"car", "cart", "dog"}, {"car", "ca", "cart", "do", "dog", "cars"}`, expected: "1 0 1 0 1 0" },
      { args: `{}, {"a"}`, expected: "0" },
      { args: `{"a"}, {"a", ""}`, expected: "1 0" },
      { args: `{"be", "bee"}, {"b", "bee", "be"}`, expected: "0 1 1" },
    ],
  },
  {
    skill: "tries",
    rung: 3,
    title: "Complete the shortest unique prefixes",
    promptMd: `\`uniquePrefixLengths(words)\` returns, for each word, the length of its **shortest beginning that no other word shares**. The words are all different, and none is the beginning of another. For \`{"dog", "dove", "cat"}\` it's \`3 3 1\`. The words are put in a trie, where \`pass[v]\` counts the words going through node v. **Complete the walk**: follow the word's letters until you reach a node that only this word goes through. ${limits("up to 100,000 words")}`,
    functionSignature: "std::vector<int> uniquePrefixLengths(const std::vector<std::string>& words)",
    call: showCall("uniquePrefixLengths"),
    generator: GEN + WORDS,
    starterCode: `#include <array>
#include <string>
#include <vector>

std::vector<int> uniquePrefixLengths(const std::vector<std::string>& words) {
${TRIE_BUILD}
    std::vector<int> out;
    for (const auto& w : words) {
        int length = w.size();
        // TODO: walk w's letters until a node that only this word goes through
        out.push_back(length);
    }
    return out;
}
`,
    reference: `#include <array>
#include <string>
#include <vector>

std::vector<int> uniquePrefixLengths(const std::vector<std::string>& words) {
${TRIE_BUILD}
    std::vector<int> out;
    for (const auto& w : words) {
        int length = 0, v = 0;
        for (char ch : w) {
            v = next[v][ch - 'a'];
            length++;
            if (pass[v] == 1) break;  // no other word shares this beginning
        }
        out.push_back(length);
    }
    return out;
}
`,
    bruteForce: `#include <string>
#include <vector>

std::vector<int> uniquePrefixLengths(const std::vector<std::string>& words) {
    std::vector<int> out;
    for (std::size_t i = 0; i < words.size(); i++) {
        std::size_t length = 1;
        for (; length < words[i].size(); length++) {
            bool shared = false;
            for (std::size_t j = 0; j < words.size() && !shared; j++)
                shared = j != i && words[j].compare(0, length, words[i], 0, length) == 0;
            if (!shared) break;
        }
        out.push_back(length);
    }
    return out;
}
`,
    cases: [
      { args: `{"dog", "dove", "cat"}`, expected: "3 3 1" },
      { args: `{"zebra"}`, expected: "1" },
      { args: "{}", expected: "" },
      { args: `{"apple", "apply", "ape"}`, expected: "5 5 3" },
      { args: `{"ab", "cd"}`, expected: "1 1" },
      { args: "gen::words(381, 300, 6)" },
      { args: "gen::words(382, 100000, 12)" },
    ],
  },
  {
    skill: "tries",
    rung: 4,
    title: "Extend the lookup to wildcards",
    promptMd: `\`matches(words, patterns)\` says for each pattern whether it **matches** one of the words. So far a pattern must be exactly the word. **Extend it** so that a \`.\` in a pattern matches any one letter: with words \`{"cat", "cot", "dog"}\`, \`"c.t"\` and \`"..."\` match but \`"c..g"\` doesn't. At a dot, the search has to try every child of the current node. Each test prints 1 or 0 per pattern.`,
    functionSignature: "std::vector<int> matches(const std::vector<std::string>& words, const std::vector<std::string>& patterns)",
    call: showCall("matches"),
    generator: GEN,
    starterCode: `#include <array>
#include <string>
#include <vector>

struct Trie {
    std::vector<std::array<int, 26>> next = std::vector<std::array<int, 26>>(1);  // node 0 is the root
    std::vector<bool> end = {false};
    void insert(const std::string& w) {
        int v = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (!next[v][c]) {
                next[v][c] = next.size();
                next.push_back({});
                end.push_back(false);
            }
            v = next[v][c];
        }
        end[v] = true;
    }
    bool match(const std::string& p) const {
        int v = 0;
        for (char ch : p)
            if (!(v = next[v][ch - 'a'])) return false;
        return end[v];
    }
};

std::vector<int> matches(const std::vector<std::string>& words, const std::vector<std::string>& patterns) {
    Trie trie;
    for (const auto& w : words) trie.insert(w);
    std::vector<int> out;
    for (const auto& p : patterns) out.push_back(trie.match(p));
    return out;
}
`,
    reference: `#include <array>
#include <string>
#include <vector>

struct Trie {
    std::vector<std::array<int, 26>> next = std::vector<std::array<int, 26>>(1);  // node 0 is the root
    std::vector<bool> end = {false};
    void insert(const std::string& w) {
        int v = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (!next[v][c]) {
                next[v][c] = next.size();
                next.push_back({});
                end.push_back(false);
            }
            v = next[v][c];
        }
        end[v] = true;
    }
    bool match(const std::string& p, std::size_t i = 0, int v = 0) const {  // does p[i..] match below node v?
        if (i == p.size()) return end[v];
        if (p[i] != '.') return next[v][p[i] - 'a'] && match(p, i + 1, next[v][p[i] - 'a']);
        for (int child : next[v])
            if (child && match(p, i + 1, child)) return true;  // a dot: try every letter
        return false;
    }
};

std::vector<int> matches(const std::vector<std::string>& words, const std::vector<std::string>& patterns) {
    Trie trie;
    for (const auto& w : words) trie.insert(w);
    std::vector<int> out;
    for (const auto& p : patterns) out.push_back(trie.match(p));
    return out;
}
`,
    cases: [
      { args: `{"cat", "cot", "dog"}, {"c.t", "d..", "c..g", "...", "x.t", "co."}`, expected: "1 1 0 1 0 1" },
      { args: `{}, {"."}`, expected: "0" },
      { args: `{"a"}, {".", "..", "a"}`, expected: "1 0 1" },
      { args: `{"ab", "abc"}, {"a.", "..c", "...."}`, expected: "1 1 0" },
    ],
  },
  {
    skill: "tries",
    rung: 5,
    title: "Count the pairs with a small XOR",
    promptMd: `\`pairsXorBelow(v, k)\` returns how many pairs of positions i < j have \`v[i] ^ v[j] < k\`, for values below 2³⁰. For \`{1, 2, 3, 4}\` and k = 3 it's 2 (1 ^ 3 = 2 and 2 ^ 3 = 1). Hint: put the numbers in a binary trie, highest bit first, counting how many numbers pass through each node. For each new number, walk down along k's bits. Wherever k has a 1, all the numbers on the side that makes that bit of the XOR 0 are smaller and count at once. ${TASK} ${limits("up to 200,000 values")}`,
    functionSignature: "long long pairsXorBelow(const std::vector<int>& v, int k)",
    call: printCall("pairsXorBelow"),
    generator: GEN,
    starterCode: `#include <vector>

long long pairsXorBelow(const std::vector<int>& v, int k) {
    return 0;
}
`,
    reference: `#include <array>
#include <vector>

long long pairsXorBelow(const std::vector<int>& v, int k) {
    const int BITS = 30;
    std::vector<std::array<int, 2>> next(1, {0, 0});  // node 0 is the root; a child of 0 means "none"
    std::vector<int> count(1, 0);                       // how many inserted numbers pass through each node
    long long pairs = 0;
    for (int x : v) {
        int node = 0;
        bool alive = true;  // the earlier numbers under node match k's bits so far, in their XOR with x
        for (int b = BITS - 1; b >= 0 && alive; b--) {
            int xb = x >> b & 1, kb = k >> b & 1;
            if (kb == 1 && next[node][xb]) pairs += count[next[node][xb]];  // XOR bit 0 where k has 1: all smaller
            int follow = next[node][xb ^ kb];  // keep the XOR equal to k's bits
            if (follow) node = follow;
            else alive = false;
        }
        int at = 0;  // now insert x
        count[0]++;
        for (int b = BITS - 1; b >= 0; b--) {
            int xb = x >> b & 1;
            if (!next[at][xb]) {
                next[at][xb] = next.size();
                next.push_back({0, 0});
                count.push_back(0);
            }
            at = next[at][xb];
            count[at]++;
        }
    }
    return pairs;
}
`,
    bruteForce: `#include <vector>

long long pairsXorBelow(const std::vector<int>& v, int k) {
    long long pairs = 0;
    for (std::size_t i = 0; i < v.size(); i++)
        for (std::size_t j = i + 1; j < v.size(); j++) pairs += (v[i] ^ v[j]) < k;
    return pairs;
}
`,
    cases: [
      { args: "{1, 2, 3, 4}, 3", expected: "2" },
      { args: "{5, 5}, 1", expected: "1" },
      { args: "{}, 5", expected: "0" },
      { args: "{0, 7}, 8", expected: "1" },
      { args: "{4, 6, 7}, 2", expected: "1" },
      { args: "gen::ints(383, 2000, 0, 1000000), 50000" },
      { args: "gen::ints(384, 200000, 0, 1000000000), 1048576" },
    ],
  },
];
