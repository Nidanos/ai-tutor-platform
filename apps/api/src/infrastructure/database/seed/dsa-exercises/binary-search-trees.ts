import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, TREE, TREE_NODE } from "./harness.js";

const printWithTree = (fn: string) => (args: string) => `std::cout << gen::withTree(${fn}, ${args}) << "\\n";`;
const showWithTree = (fn: string) => (args: string) => `gen::show(gen::withTree(${fn}, ${args}));`;
const TREES = "Trees are given in level order, with X for a missing child: `{8, 4, 12, X, 6}` is 8 with children 4 and 12, and 6 as the right child of 4.";
const SAMPLE = "{8, 4, 12, 2, 6, 10, 14}";

// q ranges (a, a + width) with a from lo to hi.
const NARROW = String.raw`
namespace gen {
std::vector<std::pair<int, int>> narrowRanges(std::uint64_t seed, int q, int lo, int hi, int width) {
    state = seed;
    std::vector<std::pair<int, int>> out(q);
    for (auto& [a, b] : out) a = (int)between(lo, hi), b = a + width;
    return out;
}
}  // namespace gen
`;

export const binarySearchTrees: ExerciseTemplate[] = [
  predict(
    "binary-search-trees",
    "What does it print? Keys inserted one by one",
    `#include <algorithm>
#include <iostream>

struct Node {
    int key;
    Node *left, *right;
};

Node* insert(Node* n, int key) {
    if (!n) return new Node{key, nullptr, nullptr};
    if (key < n->key) n->left = insert(n->left, key);
    else n->right = insert(n->right, key);
    return n;
}
void preorder(const Node* n) {
    if (!n) return;
    std::cout << n->key << " ";
    preorder(n->left);
    preorder(n->right);
}
int height(const Node* n) { return n ? 1 + std::max(height(n->left), height(n->right)) : 0; }

int main() {
    Node* root = nullptr;
    for (int k : {50, 30, 70, 20, 40, 60, 35}) root = insert(root, k);
    preorder(root);
    std::cout << "\\n" << height(root) << "\\n";
}
`,
    "50 30 20 40 35 70 60\n4",
  ),
  {
    skill: "binary-search-trees",
    rung: 2,
    title: "Fix the validity check",
    promptMd: `\`isValid(root)\` should say whether the tree is a binary search tree: every key in a node's left subtree is **smaller** than the node's key, and every key in its right subtree is **bigger**. It only compares each node with its own children, so it accepts \`{10, 5, 15, X, X, 6, 20}\`, where 6 sits on 10's right side. **Find the fault and fix it**: each node must fit between limits passed down from all its ancestors. ${TREES} Each test prints 1 or 0.`,
    functionSignature: "bool isValid(const TreeNode* root)",
    call: printWithTree("isValid"),
    generator: GEN + TREE,
    starterCode: `${TREE_NODE}

bool isValid(const TreeNode* root) {
    if (!root) return true;
    if (root->left && root->left->value >= root->value) return false;
    if (root->right && root->right->value <= root->value) return false;
    return isValid(root->left) && isValid(root->right);
}
`,
    reference: `#include <climits>

${TREE_NODE}

// Every key must lie strictly between the limits its ancestors set.
bool within(const TreeNode* n, long long lo, long long hi) {
    if (!n) return true;
    if (n->value <= lo || n->value >= hi) return false;
    return within(n->left, lo, n->value) && within(n->right, n->value, hi);
}

bool isValid(const TreeNode* root) { return within(root, LLONG_MIN, LLONG_MAX); }
`,
    cases: [
      { args: "{10, 5, 15, X, X, 6, 20}", expected: "0" },
      { args: "{2, 1, 3}", expected: "1" },
      { args: "{}", expected: "1" },
      { args: "{5, 5}", expected: "0" },
      { args: SAMPLE, expected: "1" },
      { args: "{8, 4, 12, 2, 9}", expected: "0" },
    ],
  },
  {
    skill: "binary-search-trees",
    rung: 3,
    title: "Complete the k-th smallest key",
    promptMd: `\`kthSmallest(root, k)\` returns the k-th smallest key of a binary search tree, counting from 1 (k is at most the number of keys). An inorder walk visits the keys smallest first, so the walk counts k down and stops once it reaches 0, without visiting the rest of the tree. **Complete the step for the current node.** ${TREES}`,
    functionSignature: "int kthSmallest(const TreeNode* root, int k)",
    call: printWithTree("kthSmallest"),
    generator: GEN + TREE,
    starterCode: `${TREE_NODE}

void walk(const TreeNode* n, int& k, int& answer) {
    if (!n || k == 0) return;
    walk(n->left, k, answer);
    // TODO: count this node; if it's the k-th, record it
    walk(n->right, k, answer);
}

int kthSmallest(const TreeNode* root, int k) {
    int answer = -1;
    walk(root, k, answer);
    return answer;
}
`,
    reference: `${TREE_NODE}

void walk(const TreeNode* n, int& k, int& answer) {
    if (!n || k == 0) return;
    walk(n->left, k, answer);
    if (k > 0 && --k == 0) answer = n->value;  // all smaller keys are counted: this is the next one
    walk(n->right, k, answer);
}

int kthSmallest(const TreeNode* root, int k) {
    int answer = -1;
    walk(root, k, answer);
    return answer;
}
`,
    cases: [
      { args: `${SAMPLE}, 3`, expected: "6" },
      { args: `${SAMPLE}, 1`, expected: "2" },
      { args: `${SAMPLE}, 7`, expected: "14" },
      { args: "{7}, 1", expected: "7" },
      { args: "{2, 1, 3}, 2", expected: "2" },
    ],
  },
  {
    skill: "binary-search-trees",
    rung: 4,
    title: "Extend searching to the floor of each query",
    promptMd: `\`floors(root, queries)\` should return, for each query, the **largest key at most the query**, or -1 if every key is bigger. For ${"`"}${SAMPLE}${"`"} and the query 5 that's 4. So far it only answers the query itself when it's in the tree, and -1 otherwise. **Extend the search**: whenever the path goes right, the key just passed is a floor candidate. ${limits("trees of up to 200,000 keys, about 40 levels deep, and 200,000 queries")} ${TREES}`,
    functionSignature: "std::vector<int> floors(const TreeNode* root, const std::vector<int>& queries)",
    call: showWithTree("floors"),
    generator: GEN + TREE,
    starterCode: `#include <vector>

${TREE_NODE}

bool contains(const TreeNode* n, int x) {
    while (n && n->value != x) n = x < n->value ? n->left : n->right;
    return n != nullptr;
}

std::vector<int> floors(const TreeNode* root, const std::vector<int>& queries) {
    std::vector<int> out;
    for (int q : queries) out.push_back(contains(root, q) ? q : -1);
    return out;
}
`,
    reference: `#include <vector>

${TREE_NODE}

int floorOf(const TreeNode* n, int x) {
    int best = -1;
    while (n) {
        if (n->value == x) return x;
        if (n->value < x) best = n->value, n = n->right;  // a candidate; a bigger one may lie to the right
        else n = n->left;
    }
    return best;
}

std::vector<int> floors(const TreeNode* root, const std::vector<int>& queries) {
    std::vector<int> out;
    for (int q : queries) out.push_back(floorOf(root, q));
    return out;
}
`,
    bruteForce: `#include <vector>

${TREE_NODE}

void collect(const TreeNode* n, std::vector<int>& keys) {
    if (!n) return;
    collect(n->left, keys);
    keys.push_back(n->value);
    collect(n->right, keys);
}

std::vector<int> floors(const TreeNode* root, const std::vector<int>& queries) {
    std::vector<int> keys, out;
    collect(root, keys);
    for (int q : queries) {
        int best = -1;
        for (int k : keys)
            if (k <= q) best = k;
        out.push_back(best);
    }
    return out;
}
`,
    cases: [
      { args: `${SAMPLE}, {5, 8, 1, 20, 11}`, expected: "4 8 -1 14 10" },
      { args: "{}, {3}", expected: "-1" },
      { args: "{5}, {5, 4, 6}", expected: "5 -1 5" },
      { args: "gen::bstOf(351, 2000, 1, 1000000), gen::ints(352, 2000, 1, 1000000)" },
      { args: "gen::bstOf(353, 200000, 1, 1000000000), gen::ints(354, 200000, 1, 1000000000)" },
    ],
  },
  {
    skill: "binary-search-trees",
    rung: 5,
    title: "Range sums in a search tree",
    promptMd: `\`rangeSums(root, queries)\` returns, for each query (lo, hi), the sum of the keys from lo to hi, both included. For ${"`"}${SAMPLE}${"`"} and (5, 11) it's 6 + 8 + 10 = 24. Don't visit the whole tree each time: skip any subtree that can't hold keys in the range. ${TASK} ${limits("trees of up to 200,000 keys and 200,000 narrow queries")} ${TREES}`,
    functionSignature: "std::vector<long long> rangeSums(const TreeNode* root, const std::vector<std::pair<int, int>>& queries)",
    call: showWithTree("rangeSums"),
    generator: GEN + TREE + NARROW,
    starterCode: `#include <utility>
#include <vector>

${TREE_NODE}

std::vector<long long> rangeSums(const TreeNode* root, const std::vector<std::pair<int, int>>& queries) {
    return std::vector<long long>(queries.size(), 0);
}
`,
    reference: `#include <utility>
#include <vector>

${TREE_NODE}

long long sumIn(const TreeNode* n, int lo, int hi) {
    if (!n) return 0;
    if (n->value < lo) return sumIn(n->right, lo, hi);  // n and its left side are too small
    if (n->value > hi) return sumIn(n->left, lo, hi);   // n and its right side are too big
    return n->value + sumIn(n->left, lo, hi) + sumIn(n->right, lo, hi);
}

std::vector<long long> rangeSums(const TreeNode* root, const std::vector<std::pair<int, int>>& queries) {
    std::vector<long long> out;
    for (auto [lo, hi] : queries) out.push_back(sumIn(root, lo, hi));
    return out;
}
`,
    bruteForce: `#include <utility>
#include <vector>

${TREE_NODE}

long long everything(const TreeNode* n, int lo, int hi) {
    if (!n) return 0;
    return (n->value >= lo && n->value <= hi ? n->value : 0) + everything(n->left, lo, hi) + everything(n->right, lo, hi);
}

std::vector<long long> rangeSums(const TreeNode* root, const std::vector<std::pair<int, int>>& queries) {
    std::vector<long long> out;
    for (auto [lo, hi] : queries) out.push_back(everything(root, lo, hi));
    return out;
}
`,
    cases: [
      { args: `${SAMPLE}, {{5, 11}, {1, 3}, {9, 9}, {0, 100}}`, expected: "24 2 0 56" },
      { args: "{}, {{1, 5}, {2, 3}}", expected: "0 0" },
      { args: "{5}, {{5, 5}, {6, 9}}", expected: "5 0" },
      { args: "gen::bstOf(355, 2000, 1, 1000000), gen::narrowRanges(356, 2000, 1, 1000000, 5000)" },
      { args: "gen::bstOf(357, 200000, 1, 1000000000), gen::narrowRanges(358, 200000, 1, 1000000000, 20000)" },
    ],
  },
];
