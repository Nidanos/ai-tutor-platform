import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, RANGE_OPS, showCall, TREE, TREE_NODE, WORDS, yesNoCall } from "../dsa-exercises/harness.js";

const TREES = "Trees are given in level order, with X for a missing child: `{1, 2, 3, X, 4}` is 1 with children 2 and 3, and 4 as the right child of 2.";
const printWithTree = (fn: string) => (args: string) => `std::cout << gen::withTree(${fn}, ${args}) << "\\n";`;

// n different numbers 10, 20, ..., 10n in a random order: no two closer than 10.
// {1, x}: insert x; {2, k}: the k-th smallest so far, with k always between 1 and the count.
// count words joined by spaces.
const SHAPES = String.raw`
namespace gen {
std::vector<int> spaced(std::uint64_t seed, int n) {
    std::vector<int> v = permutation(seed, n);
    for (int& x : v) x *= 10;
    return v;
}
std::vector<std::pair<int, int>> rankOps(std::uint64_t seed, int count, int maxValue) {
    state = seed;
    std::vector<std::pair<int, int>> ops;
    int size = 0;
    for (int i = 0; i < count; i++)
        if (size == 0 || between(0, 1)) ops.push_back({1, (int)between(1, maxValue)}), size++;
        else ops.push_back({2, (int)between(1, size)});
    return ops;
}
std::string sentence(std::uint64_t seed, int count, int len, int letters) {
    std::string s;
    for (const auto& w : words(seed, count, len, letters)) s += (s.empty() ? "" : " ") + w;
    return s;
}
}  // namespace gen
`;

// {1, i, x}: set a[i] to x; {2, l, r}: the best run sum inside a[l..r]. Every value starts at 0.
const RUN_DRIVER = String.raw`
namespace gen {
std::vector<long long> driveRuns(int n, const std::vector<std::array<int, 3>>& ops) {
    MaxRun tree(n);
    std::vector<long long> out;
    for (auto [type, a, b] : ops) {
        if (type == 1) tree.set(a, b);
        else out.push_back(tree.best(a, b));
    }
    return out;
}
}  // namespace gen
`;

export const trees: ExerciseTemplate[] = [
  // ── binary-trees ──
  predict(
    "binary-trees",
    "What does it print? Three walks of one tree",
    `#include <iostream>
#include <string>

struct Node {
    int value;
    Node *left, *right;
};

void walk(const Node* n, std::string& pre, std::string& in, std::string& post) {
    if (!n) return;
    pre += std::to_string(n->value);
    walk(n->left, pre, in, post);
    in += std::to_string(n->value);
    walk(n->right, pre, in, post);
    post += std::to_string(n->value);
}

int main() {
    Node* root = new Node{1, new Node{2, new Node{4, nullptr, nullptr}, nullptr},
                          new Node{3, new Node{5, nullptr, nullptr}, new Node{6, nullptr, nullptr}}};
    std::string pre, in, post;
    walk(root, pre, in, post);
    std::cout << pre << " " << in << " " << post << "\\n";
}
`,
    "124356 421536 425631",
  ),
  {
    skill: "binary-trees",
    rung: 5,
    title: "Add up the deepest level",
    promptMd: `Write \`long long deepestSum(const TreeNode* root)\` that returns the sum of the values on the tree's **deepest** level (0 for an empty tree). For \`{1, 2, 3, 4, 5, X, 6, 7, X, X, X, X, 8}\` the deepest level holds 7 and 8, so that's 15. ${TREES} Keep the \`TreeNode\` struct as it is. ${TASK} Trees up to 100,000 nodes.`,
    functionSignature: "long long deepestSum(const TreeNode* root)",
    call: printWithTree("deepestSum"),
    generator: GEN + TREE,
    starterCode: `${TREE_NODE}

long long deepestSum(const TreeNode* root) {
    return 0;
}
`,
    reference: `#include <queue>

${TREE_NODE}

long long deepestSum(const TreeNode* root) {
    long long sum = 0;
    std::queue<const TreeNode*> level;
    if (root) level.push(root);
    while (!level.empty()) {  // level by level: the last level's sum is the answer
        sum = 0;
        for (int i = level.size(); i > 0; i--) {
            const TreeNode* n = level.front();
            level.pop();
            sum += n->value;
            if (n->left) level.push(n->left);
            if (n->right) level.push(n->right);
        }
    }
    return sum;
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5, X, 6, 7, X, X, X, X, 8}", expected: "15" },
      { args: "{}", expected: "0" },
      { args: "{5}", expected: "5" },
      { args: "{1, 2, 3}", expected: "5" },
      { args: "{1, 2, X, 3}", expected: "3" },
      { args: "{-1, -2, -3, X, X, -4, -5}", expected: "-9" },
    ],
  },

  // ── tree-problems ──
  predict(
    "tree-problems",
    "What does it print? Heights and the longest path",
    `#include <algorithm>
#include <iostream>

struct Node {
    int value;
    Node *left, *right;
};

int best = 0;

int height(const Node* n) {
    if (!n) return 0;
    int l = height(n->left), r = height(n->right);
    best = std::max(best, l + r);
    std::cout << l + r;
    return 1 + std::max(l, r);
}

int main() {
    Node* root = new Node{1, new Node{2, new Node{4, new Node{7, nullptr, nullptr}, nullptr}, new Node{5, nullptr, nullptr}},
                          new Node{3, nullptr, new Node{6, nullptr, nullptr}}};
    int h = height(root);
    std::cout << " " << best << " " << h << "\\n";
}
`,
    "0103015 5 4",
  ),
  {
    skill: "tree-problems",
    rung: 5,
    title: "The best path sum",
    promptMd: `A path goes from any node to any other along the tree's links, never using a node twice; a single node is a path too. Write \`long long bestPath(const TreeNode* root)\` that returns the largest sum of values along any path in a non-empty tree. For \`{-10, 9, 20, X, X, 15, 7}\` that's 42 (15 → 20 → 7). Hint: for each node, work out the best path that goes **down** from it, and try that node as the top of a path. ${TREES} Keep the \`TreeNode\` struct as it is. ${TASK} Trees up to 100,000 nodes.`,
    functionSignature: "long long bestPath(const TreeNode* root)",
    call: printWithTree("bestPath"),
    generator: GEN + TREE,
    starterCode: `${TREE_NODE}

long long bestPath(const TreeNode* root) {
    return 0;
}
`,
    reference: `#include <algorithm>
#include <climits>

${TREE_NODE}

long long down(const TreeNode* n, long long& best) {  // the best path that starts at n and goes down
    if (!n) return 0;
    long long l = std::max(0LL, down(n->left, best)), r = std::max(0LL, down(n->right, best));  // a negative branch is left off
    best = std::max(best, n->value + l + r);  // n as the top of a path
    return n->value + std::max(l, r);
}

long long bestPath(const TreeNode* root) {
    long long best = LLONG_MIN;
    down(root, best);
    return best;
}
`,
    cases: [
      { args: "{-10, 9, 20, X, X, 15, 7}", expected: "42" },
      { args: "{1, 2, 3}", expected: "6" },
      { args: "{-3}", expected: "-3" },
      { args: "{2, -1}", expected: "2" },
      { args: "{-2, -1}", expected: "-1" },
      { args: "{5, 4, 8, 11, X, 13, 4, 7, 2, X, X, X, 1}", expected: "48" },
    ],
  },

  // ── binary-search-trees ──
  predict(
    "binary-search-trees",
    "What does it print? Successors in a search tree",
    `#include <iostream>

struct Node {
    int value;
    Node *left, *right;
};

Node* insert(Node* root, int x) {
    if (!root) return new Node{x, nullptr, nullptr};
    if (x < root->value) root->left = insert(root->left, x);
    else root->right = insert(root->right, x);
    return root;
}

int successor(const Node* root, int x) {  // the smallest key greater than x, or -1
    int best = -1;
    while (root) {
        if (root->value > x) best = root->value, root = root->left;
        else root = root->right;
    }
    return best;
}

int main() {
    Node* root = nullptr;
    for (int x : {20, 8, 22, 4, 12, 10, 14}) root = insert(root, x);
    for (int x : {8, 14, 22, 5}) std::cout << successor(root, x) << " ";
    std::cout << "\\n";
}
`,
    "10 20 -1 8",
  ),
  {
    skill: "binary-search-trees",
    rung: 5,
    title: "Trim a search tree to a range",
    promptMd: `\`root\` is a binary search tree. Write \`TreeNode* trim(TreeNode* root, int lo, int hi)\` that removes every key outside \`[lo, hi]\` and returns the root of what remains, keeping the remaining keys in the same parent-child order. For \`{3, 0, 4, X, 2, X, X, 1}\` with lo = 1 and hi = 3 that's \`3 2 x 1\` in level order. Hint: if a node's key is too small, its whole left subtree is too small too. ${TREES} Keep the \`TreeNode\` struct as it is. ${TASK} Trees up to 100,000 nodes.`,
    functionSignature: "TreeNode* trim(TreeNode* root, int lo, int hi)",
    call: (args) => `gen::showTree(gen::withTree(trim, ${args}));`,
    generator: GEN + TREE,
    starterCode: `${TREE_NODE}

TreeNode* trim(TreeNode* root, int lo, int hi) {
    return root;
}
`,
    reference: `${TREE_NODE}

TreeNode* trim(TreeNode* root, int lo, int hi) {
    if (!root) return nullptr;
    if (root->value < lo) return trim(root->right, lo, hi);  // the node and its left side are all too small
    if (root->value > hi) return trim(root->left, lo, hi);
    root->left = trim(root->left, lo, hi);
    root->right = trim(root->right, lo, hi);
    return root;
}
`,
    cases: [
      { args: "{3, 0, 4, X, 2, X, X, 1}, 1, 3", expected: "3 2 x 1" },
      { args: "{1, 0, 2}, 1, 2", expected: "1 x 2" },
      { args: "{5}, 1, 4", expected: "" },
      { args: "{5, 3, 8, 1, 4, 7, 9}, 4, 7", expected: "5 4 7" },
      { args: "{2, 1, 3}, 2, 2", expected: "2" },
      { args: "{}, 0, 9", expected: "" },
    ],
  },

  // ── balanced-trees ──
  predict(
    "balanced-trees",
    "What does it print? A multiset and a map's bounds",
    `#include <iostream>
#include <iterator>
#include <map>
#include <set>

int main() {
    std::multiset<int> m = {5, 1, 5, 3, 5};
    m.erase(m.find(5));
    std::cout << m.size() << m.count(5);
    m.erase(5);
    std::cout << m.size() << " ";
    std::map<int, char> grade = {{90, 'A'}, {75, 'B'}, {50, 'C'}, {0, 'F'}};
    for (int score : {82, 50, 49, 100}) std::cout << std::prev(grade.upper_bound(score))->second;
    std::cout << "\\n";
}
`,
    "422 BCFA",
  ),
  {
    skill: "balanced-trees",
    rung: 5,
    title: "Close values, close together",
    promptMd: `Write \`bool closeAndNear(const std::vector<int>& a, int k, int t)\` that says whether there are two different positions i and j with \`|i - j| <= k\` and \`|a[i] - a[j]| <= t\`. The numbers are between -10^9 and 10^9, and 0 ≤ k, t ≤ 10^9 (so differences need \`long long\`). For \`{1, 5, 9, 1, 5, 9}\`, k = 2 and t = 3 the answer is no. Hint: keep the last k values in a \`std::set\` and ask it for the nearest value to each new one. ${TASK} ${limits("up to 200,000 numbers")}`,
    functionSignature: "bool closeAndNear(const std::vector<int>& a, int k, int t)",
    call: yesNoCall("closeAndNear"),
    generator: GEN + WORDS + SHAPES,
    starterCode: `#include <vector>

bool closeAndNear(const std::vector<int>& a, int k, int t) {
    return false;
}
`,
    reference: `#include <set>
#include <vector>

bool closeAndNear(const std::vector<int>& a, int k, int t) {
    std::set<long long> window;  // the last k values, sorted
    for (int i = 0; i < (int)a.size(); i++) {
        auto it = window.lower_bound((long long)a[i] - t);  // the smallest value not too far below a[i]
        if (it != window.end() && *it <= (long long)a[i] + t) return true;
        window.insert(a[i]);
        if (i >= k) window.erase(a[i - k]);
    }
    return false;
}
`,
    bruteForce: `#include <vector>

bool closeAndNear(const std::vector<int>& a, int k, int t) {
    for (int i = 0; i < (int)a.size(); i++)
        for (long long j = i + 1; j < (long long)a.size() && j <= (long long)i + k; j++)  // every pair within k
            if ((long long)a[i] - a[j] <= t && (long long)a[j] - a[i] <= t) return true;
    return false;
}
`,
    cases: [
      { args: "{1, 5, 9, 1, 5, 9}, 2, 3", expected: "no" },
      { args: "{1, 2, 3, 1}, 3, 0", expected: "yes" },
      { args: "{1, 0, 1, 1}, 1, 2", expected: "yes" },
      { args: "{}, 1, 1", expected: "no" },
      { args: "{4, 1}, 1, 2", expected: "no" },
      { args: "{-1000000000, 1000000000}, 1, 2000000000", expected: "yes" },
      { args: "{7, 7}, 0, 5", expected: "no" },
      { args: "gen::ints(751, 2000, 1, 1000000), 100, 10" },
      { args: "gen::spaced(752, 2000), 2000, 5" },
      { args: "gen::spaced(753, 200000), 100000, 5" },
    ],
  },

  // ── heaps ──
  predict(
    "heaps",
    "What does it print? A min-heap in an array",
    `#include <iostream>
#include <utility>
#include <vector>

std::vector<int> h;

void push(int x) {
    h.push_back(x);
    for (int i = h.size() - 1; i > 0 && h[(i - 1) / 2] > h[i]; i = (i - 1) / 2) std::swap(h[i], h[(i - 1) / 2]);
}

void pop() {
    h[0] = h.back();
    h.pop_back();
    for (int i = 0;;) {
        int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < (int)h.size() && h[l] < h[smallest]) smallest = l;
        if (r < (int)h.size() && h[r] < h[smallest]) smallest = r;
        if (smallest == i) break;
        std::swap(h[i], h[smallest]);
        i = smallest;
    }
}

int main() {
    for (int x : {5, 3, 8, 1, 4}) push(x);
    for (int x : h) std::cout << x;
    pop();
    std::cout << " ";
    for (int x : h) std::cout << x;
    std::cout << "\\n";
}
`,
    "13854 3485",
  ),
  {
    skill: "heaps",
    rung: 5,
    title: "The running median",
    promptMd: `Numbers arrive one at a time. Write \`std::vector<int> runningMedian(const std::vector<int>& stream)\` that returns, after each arrival, the median of the numbers so far; with an even count, take the **lower** of the two middle numbers. For \`{5, 15, 1, 3}\` that's \`5 5 5 3\`. Hint: keep the smaller half in a max-heap and the larger half in a min-heap. ${TASK} ${limits("up to 1,000,000 numbers")}`,
    functionSignature: "std::vector<int> runningMedian(const std::vector<int>& stream)",
    call: showCall("runningMedian"),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<int> runningMedian(const std::vector<int>& stream) {
    return {};
}
`,
    reference: `#include <functional>
#include <queue>
#include <vector>

std::vector<int> runningMedian(const std::vector<int>& stream) {
    std::priority_queue<int> low;  // the smaller half, largest on top: its top is the median
    std::priority_queue<int, std::vector<int>, std::greater<int>> high;  // the larger half
    std::vector<int> out;
    for (int x : stream) {
        if (low.empty() || x <= low.top()) low.push(x);
        else high.push(x);
        if (low.size() > high.size() + 1) high.push(low.top()), low.pop();  // keep low the same size as high, or one bigger
        else if (high.size() > low.size()) low.push(high.top()), high.pop();
        out.push_back(low.top());
    }
    return out;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

std::vector<int> runningMedian(const std::vector<int>& stream) {
    std::vector<int> sorted, out;
    for (int x : stream) {  // keep a sorted list, shifting the rest along for each insert
        sorted.insert(std::upper_bound(sorted.begin(), sorted.end(), x), x);
        out.push_back(sorted[(sorted.size() - 1) / 2]);
    }
    return out;
}
`,
    cases: [
      { args: "{5, 15, 1, 3}", expected: "5 5 5 3" },
      { args: "{}", expected: "" },
      { args: "{7}", expected: "7" },
      { args: "{2, 2, 2}", expected: "2 2 2" },
      { args: "{3, 1, 2}", expected: "3 1 2" },
      { args: "{-1, -2, -3, -4}", expected: "-1 -2 -2 -3" },
      { args: "gen::ints(754, 2000, -1000000, 1000000)" },
      { args: "gen::ints(755, 1000000, -1000000000, 1000000000)" },
    ],
  },

  // ── tries ──
  predict(
    "tries",
    "What does it print? Nodes, words and prefixes",
    `#include <array>
#include <iostream>
#include <string>
#include <vector>

std::vector<std::array<int, 26>> next(1);  // node 0 is the root; 0 also means "no child"
std::vector<bool> isWord(1, false);

void insert(const std::string& w) {
    int node = 0;
    for (char c : w) {
        if (!next[node][c - 'a']) {
            next[node][c - 'a'] = next.size();
            next.push_back({});
            isWord.push_back(false);
        }
        node = next[node][c - 'a'];
    }
    isWord[node] = true;
}

int find(const std::string& s) {  // the node s ends at, or -1
    int node = 0;
    for (char c : s)
        if (!(node = next[node][c - 'a'])) return -1;
    return node;
}

int main() {
    for (std::string w : {"car", "cat", "cart", "dog"}) insert(w);
    std::cout << next.size() << " " << (find("ca") != -1) << isWord[find("ca")] << isWord[find("cart")] << "\\n";
}
`,
    "9 101",
  ),
  {
    skill: "tries",
    rung: 5,
    title: "Replace words with their roots",
    promptMd: `Write \`std::string withRoots(const std::vector<std::string>& roots, const std::string& sentence)\` that replaces every word of the sentence by the **shortest** root it starts with, and leaves words with no root as they are. Words are lowercase and separated by single spaces. For \`{"cat", "bat", "rat"}\` and "the cattle was rattled by the battery" that's "the cat was rat by the bat". ${TASK} ${limits("up to 100,000 roots and a sentence of 100,000 words")}`,
    functionSignature: "std::string withRoots(const std::vector<std::string>& roots, const std::string& sentence)",
    call: (args) => `gen::showText(withRoots(${args}));`,
    generator: GEN + WORDS + SHAPES,
    starterCode: `#include <string>
#include <vector>

std::string withRoots(const std::vector<std::string>& roots, const std::string& sentence) {
    return sentence;
}
`,
    reference: `#include <array>
#include <sstream>
#include <string>
#include <vector>

std::string withRoots(const std::vector<std::string>& roots, const std::string& sentence) {
    std::vector<std::array<int, 26>> next(1, std::array<int, 26>{});
    std::vector<bool> isRoot(1, false);
    for (const auto& r : roots) {
        int node = 0;
        for (char c : r) {
            if (!next[node][c - 'a']) next[node][c - 'a'] = next.size(), next.push_back({}), isRoot.push_back(false);
            node = next[node][c - 'a'];
        }
        isRoot[node] = true;
    }
    std::istringstream in(sentence);
    std::string word, out;
    while (in >> word) {
        std::size_t rootLen = 0;  // walk the word down the trie; the first root on the way is the shortest
        for (std::size_t i = 0, node = 0; i < word.size(); i++) {
            node = next[node][word[i] - 'a'];
            if (!node) break;
            if (isRoot[node]) {
                rootLen = i + 1;
                break;
            }
        }
        out += (out.empty() ? "" : " ") + (rootLen ? word.substr(0, rootLen) : word);
    }
    return out;
}
`,
    bruteForce: `#include <sstream>
#include <string>
#include <vector>

std::string withRoots(const std::vector<std::string>& roots, const std::string& sentence) {
    std::istringstream in(sentence);
    std::string word, out;
    while (in >> word) {
        std::string best = word;
        bool found = false;
        for (const auto& r : roots)  // try every root against every word
            if (word.compare(0, r.size(), r) == 0 && r.size() <= word.size() && (!found || r.size() < best.size())) best = r, found = true;
        out += (out.empty() ? "" : " ") + best;
    }
    return out;
}
`,
    cases: [
      { args: `{"cat", "bat", "rat"}, "the cattle was rattled by the battery"`, expected: "the cat was rat by the bat" },
      { args: `{"a", "b", "c"}, "aadsfasf absbs bbab cadsfafs"`, expected: "a a b c" },
      { args: `{}, "hello world"`, expected: "hello world" },
      { args: `{"ab", "a"}, "abc"`, expected: "a" },
      { args: `{"x", "y"}, ""`, expected: "" },
      { args: `{"car", "cart"}, "cart ca"`, expected: "car ca" },
      { args: "gen::words(756, 200, 3, 4), gen::sentence(757, 200, 6, 4)" },
      { args: "gen::words(758, 100000, 5, 6), gen::sentence(759, 100000, 8, 6)" },
    ],
  },

  // ── fenwick-trees ──
  predict(
    "fenwick-trees",
    "What does it print? Jumping by the lowest bit",
    `#include <iostream>

int main() {
    for (int i = 13; i > 0; i -= i & -i) std::cout << i << " ";
    std::cout << "| ";
    for (int i = 5; i <= 16; i += i & -i) std::cout << i << " ";
    std::cout << "\\n";
}
`,
    "13 12 8 | 5 6 8 16",
  ),
  {
    skill: "fenwick-trees",
    rung: 5,
    title: "Insert, then ask for the k-th smallest",
    promptMd: `Each operation is \`{1, x}\`, insert the number x (1 ≤ x ≤ 1,000,000; repeats allowed), or \`{2, k}\`, ask for the k-th smallest number inserted so far (k is always between 1 and the count). Write \`std::vector<int> kthSoFar(const std::vector<std::pair<int, int>>& ops)\` that answers the questions in order. For \`{{1, 5}, {1, 2}, {2, 1}, {1, 9}, {2, 2}, {2, 3}}\` that's \`2 5 9\`. Hint: a Fenwick tree counting how many of each value were inserted can find the k-th one by walking down its powers of two. ${TASK} ${limits("up to 1,000,000 operations")}`,
    functionSignature: "std::vector<int> kthSoFar(const std::vector<std::pair<int, int>>& ops)",
    call: showCall("kthSoFar"),
    generator: GEN + WORDS + SHAPES,
    starterCode: `#include <utility>
#include <vector>

std::vector<int> kthSoFar(const std::vector<std::pair<int, int>>& ops) {
    return {};
}
`,
    reference: `#include <utility>
#include <vector>

std::vector<int> kthSoFar(const std::vector<std::pair<int, int>>& ops) {
    const int N = 1 << 20;  // a power of two above the largest value
    std::vector<int> tree(N + 1, 0);
    std::vector<int> out;
    for (auto [type, x] : ops) {
        if (type == 1) {
            for (int i = x; i <= N; i += i & -i) tree[i]++;
            continue;
        }
        int pos = 0, k = x;  // the largest pos with fewer than k values at or below it; the answer is pos + 1
        for (int step = N; step > 0; step >>= 1)
            if (pos + step <= N && tree[pos + step] < k) pos += step, k -= tree[pos];
        out.push_back(pos + 1);
    }
    return out;
}
`,
    bruteForce: `#include <algorithm>
#include <utility>
#include <vector>

std::vector<int> kthSoFar(const std::vector<std::pair<int, int>>& ops) {
    std::vector<int> sorted, out;
    for (auto [type, x] : ops) {  // a sorted list, shifting the rest along for each insert
        if (type == 1) sorted.insert(std::upper_bound(sorted.begin(), sorted.end(), x), x);
        else out.push_back(sorted[x - 1]);
    }
    return out;
}
`,
    cases: [
      { args: "{{1, 5}, {1, 2}, {2, 1}, {1, 9}, {2, 2}, {2, 3}}", expected: "2 5 9" },
      { args: "{{1, 7}, {1, 7}, {2, 2}}", expected: "7" },
      { args: "{{1, 1000000}, {1, 1}, {2, 2}}", expected: "1000000" },
      { args: "{}", expected: "" },
      { args: "{{1, 3}, {2, 1}, {1, 1}, {2, 1}, {2, 2}}", expected: "3 1 3" },
      { args: "gen::rankOps(760, 2000, 1000000)" },
      { args: "gen::rankOps(761, 1000000, 1000000)" },
    ],
  },

  // ── segment-trees ──
  predict(
    "segment-trees",
    "What does it print? Building a minimum tree",
    `#include <algorithm>
#include <iostream>
#include <vector>

std::vector<int> a = {5, 2, 6, 3}, t(8);

void build(int node, int l, int r) {
    if (l == r) {
        t[node] = a[l];
        return;
    }
    int m = (l + r) / 2;
    build(2 * node, l, m);
    build(2 * node + 1, m + 1, r);
    t[node] = std::min(t[2 * node], t[2 * node + 1]);
}

int main() {
    build(1, 0, 3);
    for (int i = 1; i < 8; i++) std::cout << t[i];
    std::cout << "\\n";
}
`,
    "2235263",
  ),
  {
    skill: "segment-trees",
    rung: 5,
    title: "The best run in a range, with updates",
    promptMd: `Write a class \`MaxRun\` over positions 0 to n - 1, all starting at 0:
- \`explicit MaxRun(int n)\`
- \`void set(int i, int x)\`: a[i] becomes x (between -10^9 and 10^9).
- \`long long best(int l, int r) const\`: the largest sum of a run of one or more neighbouring values inside a[l..r].

Hint: let each segment-tree node keep four numbers for its range (total, best prefix, best suffix, best run) and combine two children from them. The tests run many operations and print what each \`best\` returns. ${TASK} ${limits("up to 200,000 positions and 200,000 operations")}`,
    functionSignature: "class MaxRun { public: explicit MaxRun(int n); void set(int i, int x); long long best(int l, int r) const; };",
    call: (args) => `gen::show(gen::driveRuns(${args}));`,
    generator: GEN + RANGE_OPS + RUN_DRIVER,
    starterCode: `class MaxRun {
public:
    explicit MaxRun(int n) {}
    void set(int i, int x) {}
    long long best(int l, int r) const { return 0; }
};
`,
    reference: `#include <algorithm>
#include <vector>

class MaxRun {
    struct Node {
        long long total, prefix, suffix, run;
    };
    static Node join(const Node& a, const Node& b) {
        return {a.total + b.total, std::max(a.prefix, a.total + b.prefix), std::max(b.suffix, b.total + a.suffix),
                std::max({a.run, b.run, a.suffix + b.prefix})};  // the best run is in one half, or crosses the middle
    }
    int size;
    std::vector<Node> tree;

public:
    explicit MaxRun(int n) : size(1) {
        while (size < n) size *= 2;
        tree.assign(2 * size, Node{0, 0, 0, 0});
    }
    void set(int i, int x) {
        tree[i += size] = {x, x, x, x};
        for (i /= 2; i >= 1; i /= 2) tree[i] = join(tree[2 * i], tree[2 * i + 1]);
    }
    long long best(int l, int r) const {
        Node left{0, 0, 0, 0}, right{0, 0, 0, 0};
        bool hasLeft = false, hasRight = false;
        for (l += size, r += size + 1; l < r; l /= 2, r /= 2) {  // bottom-up, keeping the left and right pieces in order
            if (l & 1) left = hasLeft ? join(left, tree[l]) : tree[l], hasLeft = true, l++;
            if (r & 1) --r, right = hasRight ? join(tree[r], right) : tree[r], hasRight = true;
        }
        return (hasLeft && hasRight ? join(left, right) : hasLeft ? left : right).run;
    }
};
`,
    bruteForce: `#include <algorithm>
#include <climits>
#include <vector>

class MaxRun {
    std::vector<long long> a;

public:
    explicit MaxRun(int n) : a(n, 0) {}
    void set(int i, int x) { a[i] = x; }
    long long best(int l, int r) const {  // Kadane's algorithm over the whole range, every time
        long long best = LLONG_MIN, here = 0;
        for (int i = l; i <= r; i++) here = std::max(a[i], here + a[i]), best = std::max(best, here);
        return best;
    }
};
`,
    cases: [
      { args: "5, {{1, 0, 3}, {1, 1, -4}, {1, 2, 5}, {2, 0, 2}, {2, 0, 1}, {1, 1, 10}, {2, 0, 4}, {2, 3, 4}}", expected: "5 3 18 0" },
      { args: "1, {{2, 0, 0}, {1, 0, -7}, {2, 0, 0}}", expected: "0 -7" },
      { args: "3, {{1, 0, -1}, {1, 1, -2}, {1, 2, -3}, {2, 0, 2}, {2, 1, 2}}", expected: "-1 -2" },
      { args: "4, {{1, 0, 2}, {1, 1, -1}, {1, 2, 2}, {1, 3, -5}, {2, 0, 3}, {2, 1, 3}}", expected: "3 2" },
      { args: "2000, gen::rangeOps(762, 2000, 2000, 0, -1000000000, 1000000000)" },
      { args: "200000, gen::rangeOps(763, 200000, 200000, 0, -1000000000, 1000000000)" },
    ],
  },
];
