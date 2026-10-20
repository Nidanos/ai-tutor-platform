import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, TREE, TREE_NODE } from "./harness.js";

const printWithTree = (fn: string) => (args: string) => `std::cout << gen::withTree(${fn}, ${args}) << "\\n";`;
const TREES = "Trees are given in level order, with X for a missing child: `{1, 2, 3, X, 4}` is 1 with children 2 and 3, and 4 as the right child of 2.";

// A tree's traversals, and a left-going chain of the values 1..n.
const TRAVERSALS = String.raw`
namespace gen {
void preorderInto(const TreeNode* n, std::vector<int>& out) {
    if (!n) return;
    out.push_back(n->value);
    preorderInto(n->left, out);
    preorderInto(n->right, out);
}
void inorderInto(const TreeNode* n, std::vector<int>& out) {
    if (!n) return;
    inorderInto(n->left, out);
    out.push_back(n->value);
    inorderInto(n->right, out);
}
std::vector<int> preorderOf(const TreeNode* n) { std::vector<int> v; preorderInto(n, v); return v; }
std::vector<int> inorderOf(const TreeNode* n) { std::vector<int> v; inorderInto(n, v); return v; }
TreeNode* leftChain(int n) {  // 1 at the top, then 2 as its left child, and so on
    TreeNode* root = nullptr;
    for (int v = n; v >= 1; v--) {
        TreeNode* top = node(v);
        top->left = root;
        root = top;
    }
    return root;
}
// A random shape holding the values 1..n, each once.
TreeNode* distinctTree(std::uint64_t seed, int n) {
    std::vector<int> values = permutation(seed, n);
    TreeNode* root = randomTree(seed + 1, n, 0, 0);
    std::vector<TreeNode*> stack = {root};
    for (std::size_t i = 0; !stack.empty(); i++) {
        TreeNode* p = stack.back();
        stack.pop_back();
        p->value = values[i];
        if (p->left) stack.push_back(p->left);
        if (p->right) stack.push_back(p->right);
    }
    return root;
}
}  // namespace gen
`;

const HEIGHT = `int height(const TreeNode* n) { return n ? 1 + std::max(height(n->left), height(n->right)) : 0; }`;

export const treeProblems: ExerciseTemplate[] = [
  predict(
    "tree-problems",
    "What does it print? Two questions about one tree",
    `#include <iostream>

struct Node {
    int value;
    Node *left, *right;
};

int leafSum(const Node* n) {
    if (!n) return 0;
    if (!n->left && !n->right) return n->value;
    return leafSum(n->left) + leafSum(n->right);
}

int oneChild(const Node* n) {
    if (!n) return 0;
    return ((n->left == nullptr) != (n->right == nullptr)) + oneChild(n->left) + oneChild(n->right);
}

int main() {
    Node g{7, nullptr, nullptr}, d{4, nullptr, nullptr}, e{5, &g, nullptr}, f{6, nullptr, nullptr};
    Node b{2, &d, &e}, c{3, nullptr, &f}, a{1, &b, &c};
    std::cout << leafSum(&a) << " " << oneChild(&a) << "\\n";
}
`,
    "17 2",
  ),
  {
    skill: "tree-problems",
    rung: 2,
    title: "Fix the balance check",
    promptMd: `A tree is **balanced** when, at **every** node, the heights of the left and right subtrees differ by at most 1. \`isBalanced(root)\` only checks the root, so it accepts \`{1, 2, 3, 4, X, X, 5, 6, X, X, 7}\`. There, both of the root's sides have height 3, but node 2 has height 2 on its left and 0 on its right. **Find the fault and fix it.** ${TREES} Each test prints 1 or 0.`,
    functionSignature: "bool isBalanced(const TreeNode* root)",
    call: printWithTree("isBalanced"),
    generator: GEN + TREE,
    starterCode: `#include <algorithm>
#include <cstdlib>

${TREE_NODE}

${HEIGHT}

bool isBalanced(const TreeNode* root) {
    if (!root) return true;
    return std::abs(height(root->left) - height(root->right)) <= 1;
}
`,
    reference: `#include <algorithm>
#include <cstdlib>

${TREE_NODE}

// The height, or -1 if some node below is unbalanced: one pass instead of a height at every node.
int checked(const TreeNode* n) {
    if (!n) return 0;
    int left = checked(n->left), right = checked(n->right);
    if (left < 0 || right < 0 || std::abs(left - right) > 1) return -1;
    return 1 + std::max(left, right);
}

bool isBalanced(const TreeNode* root) { return checked(root) >= 0; }
`,
    cases: [
      { args: "{1, 2, 3, 4, X, X, 5, 6, X, X, 7}", expected: "0" },
      { args: "{1, 2, 3}", expected: "1" },
      { args: "{}", expected: "1" },
      { args: "{1, 2, X, 3}", expected: "0" },
      { args: "{1, 2, 3, 4, 5, 6, 7}", expected: "1" },
      { args: "{1, 2, 3, 4}", expected: "1" },
    ],
  },
  {
    skill: "tree-problems",
    rung: 3,
    title: "Complete the lowest common ancestor",
    promptMd: `\`lca(n, a, b)\` returns the lowest node that has both a and b in its subtree; a node counts as being in its own subtree. Values are all different, and both a and b are in the tree. It returns a node as soon as it finds a or b, and asks both sides otherwise. **Complete the decision** from what the two sides found. ${TREES} Each test prints the ancestor's value.`,
    functionSignature: "int lowestCommon(const TreeNode* root, int a, int b)",
    call: printWithTree("lowestCommon"),
    generator: GEN + TREE,
    starterCode: `${TREE_NODE}

const TreeNode* lca(const TreeNode* n, int a, int b) {
    if (!n || n->value == a || n->value == b) return n;
    const TreeNode* left = lca(n->left, a, b);
    const TreeNode* right = lca(n->right, a, b);
    return nullptr;  // TODO: decide from what the two sides found
}

int lowestCommon(const TreeNode* root, int a, int b) { return lca(root, a, b)->value; }
`,
    reference: `${TREE_NODE}

const TreeNode* lca(const TreeNode* n, int a, int b) {
    if (!n || n->value == a || n->value == b) return n;
    const TreeNode* left = lca(n->left, a, b);
    const TreeNode* right = lca(n->right, a, b);
    if (left && right) return n;  // one on each side: they meet here
    return left ? left : right;   // both on one side, or not found below
}

int lowestCommon(const TreeNode* root, int a, int b) { return lca(root, a, b)->value; }
`,
    cases: [
      { args: "{8, 4, 12, 2, 6, 10, 14, X, X, 5, 7}, 5, 7", expected: "6" },
      { args: "{8, 4, 12, 2, 6, 10, 14, X, X, 5, 7}, 2, 7", expected: "4" },
      { args: "{8, 4, 12, 2, 6, 10, 14, X, X, 5, 7}, 5, 14", expected: "8" },
      { args: "{8, 4, 12, 2, 6, 10, 14, X, X, 5, 7}, 6, 7", expected: "6" },
      { args: "{1, 2}, 1, 2", expected: "1" },
    ],
  },
  {
    skill: "tree-problems",
    rung: 4,
    title: "Extend the path sum to counting every downward path",
    promptMd: `\`countPaths(root, target)\` should count the paths that go **downwards**, from any node to any node below it (or just one node), whose values add up to target. So far it only answers 1 or 0: is there a path from the root to a leaf with that sum? **Extend it.** Hint: as when counting stretches of a list with prefix sums, keep the running sum from the root and how often each running sum occurs on the current path. ${limits("trees of up to 100,000 nodes, possibly as deep as they are big")} ${TREES}`,
    functionSignature: "long long countPaths(const TreeNode* root, long long target)",
    call: printWithTree("countPaths"),
    generator: GEN + TREE,
    starterCode: `${TREE_NODE}

bool rootToLeaf(const TreeNode* n, long long target) {
    if (!n) return false;
    if (!n->left && !n->right) return n->value == target;
    return rootToLeaf(n->left, target - n->value) || rootToLeaf(n->right, target - n->value);
}

long long countPaths(const TreeNode* root, long long target) { return rootToLeaf(root, target); }
`,
    reference: `#include <unordered_map>

${TREE_NODE}

// sum: the running sum from the root down to n. seen: how often each running sum occurs above n.
long long countFrom(const TreeNode* n, long long sum, long long target, std::unordered_map<long long, int>& seen) {
    if (!n) return 0;
    sum += n->value;
    auto it = seen.find(sum - target);
    long long count = it == seen.end() ? 0 : it->second;  // paths ending at n
    seen[sum]++;
    count += countFrom(n->left, sum, target, seen) + countFrom(n->right, sum, target, seen);
    seen[sum]--;  // leaving n: its sum is no longer above anything
    return count;
}

long long countPaths(const TreeNode* root, long long target) {
    std::unordered_map<long long, int> seen{{0, 1}};  // the empty path above the root
    return countFrom(root, 0, target, seen);
}
`,
    bruteForce: `${TREE_NODE}

long long downFrom(const TreeNode* n, long long sum, long long target) {
    if (!n) return 0;
    sum += n->value;
    return (sum == target) + downFrom(n->left, sum, target) + downFrom(n->right, sum, target);
}

long long countPaths(const TreeNode* root, long long target) {
    if (!root) return 0;
    return downFrom(root, 0, target) + countPaths(root->left, target) + countPaths(root->right, target);
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5, X, 2}, 3", expected: "2" },
      { args: "{}, 0", expected: "0" },
      { args: "{5}, 5", expected: "1" },
      { args: "{1, -1, X, 1}, 0", expected: "2" },
      { args: "{2, 2, 2}, 2", expected: "3" },
      { args: "gen::chainTree(341, 2000, -5, 5), 3" },
      { args: "gen::chainTree(342, 100000, -5, 5), 3" },
    ],
  },
  {
    skill: "tree-problems",
    rung: 5,
    title: "Rebuild a tree from two traversals",
    promptMd: `\`buildTree(preorder, inorder)\` gets a tree's preorder (node, left, right) and inorder (left, node, right) traversals, with all values different, and rebuilds the tree. The first preorder value is the root. Its place in inorder splits the rest into the left and right subtrees. Look positions up in a hash map: searching inorder each time is O(n²) on a deep tree. ${TASK} ${limits("up to 300,000 nodes")} Each test prints the tree in level order, x for a missing child, or its size and a checksum when it's big.`,
    functionSignature: "TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder)",
    call: (args) => `gen::showTree(buildTree(${args}));`,
    generator: GEN + TREE + TRAVERSALS,
    starterCode: `#include <vector>

${TREE_NODE}

TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    return nullptr;
}
`,
    reference: `#include <unordered_map>
#include <vector>

${TREE_NODE}

// Builds the subtree whose inorder is inorder[lo, hi); next is the next unused preorder position.
TreeNode* build(const std::vector<int>& preorder, const std::unordered_map<int, int>& at, std::size_t& next, int lo, int hi) {
    if (lo >= hi) return nullptr;
    TreeNode* n = new TreeNode{preorder[next++], nullptr, nullptr};
    int mid = at.at(n->value);  // everything left of it in inorder is its left subtree
    n->left = build(preorder, at, next, lo, mid);
    n->right = build(preorder, at, next, mid + 1, hi);
    return n;
}

TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    std::unordered_map<int, int> at;  // value -> its position in inorder
    for (int i = 0; i < (int)inorder.size(); i++) at[inorder[i]] = i;
    std::size_t next = 0;
    return build(preorder, at, next, 0, inorder.size());
}
`,
    bruteForce: `#include <vector>

${TREE_NODE}

TreeNode* build(const std::vector<int>& preorder, const std::vector<int>& inorder, std::size_t& next, int lo, int hi) {
    if (lo >= hi) return nullptr;
    TreeNode* n = new TreeNode{preorder[next++], nullptr, nullptr};
    int mid = lo;
    while (inorder[mid] != n->value) mid++;  // a linear search every time
    n->left = build(preorder, inorder, next, lo, mid);
    n->right = build(preorder, inorder, next, mid + 1, hi);
    return n;
}

TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    std::size_t next = 0;
    return build(preorder, inorder, next, 0, inorder.size());
}
`,
    cases: [
      { args: "{1, 2, 4, 5, 3, 6}, {4, 2, 5, 1, 3, 6}", expected: "1 2 3 4 5 x 6" },
      { args: "{}, {}", expected: "" },
      { args: "{7}, {7}", expected: "7" },
      { args: "{1, 2, 3}, {3, 2, 1}", expected: "1 2 x 3" },
      { args: "{1, 2, 3}, {1, 2, 3}", expected: "1 x 2 x 3" },
      { args: "gen::preorderOf(gen::distinctTree(343, 2000)), gen::inorderOf(gen::distinctTree(343, 2000))" },
      { args: "gen::preorderOf(gen::leftChain(300000)), gen::inorderOf(gen::leftChain(300000))" },
    ],
  },
];
