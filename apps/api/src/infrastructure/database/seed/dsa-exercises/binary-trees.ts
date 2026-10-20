import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, TREE, TREE_NODE } from "./harness.js";

const printWithTree = (fn: string) => (args: string) => `std::cout << gen::withTree(${fn}, ${args}) << "\\n";`;
const showWithTree = (fn: string) => (args: string) => `gen::show(gen::withTree(${fn}, ${args}));`;
const TREES = "Trees are given in level order, with X for a missing child: `{1, 2, 3, X, 4}` is 1 with children 2 and 3, and 4 as the right child of 2.";

export const binaryTrees: ExerciseTemplate[] = [
  predict(
    "binary-trees",
    "What does it print? A tree, level by level",
    `#include <iostream>
#include <queue>

struct Node {
    int value;
    Node *left, *right;
};

int main() {
    Node d{4, nullptr, nullptr}, e{5, nullptr, nullptr}, f{6, nullptr, nullptr};
    Node b{2, &d, &e}, c{3, nullptr, &f}, a{1, &b, &c};
    std::queue<Node*> q;
    q.push(&a);
    int level = 0;
    while (!q.empty()) {
        int width = q.size();
        std::cout << "level " << level++ << ":";
        for (int i = 0; i < width; i++) {
            Node* n = q.front();
            q.pop();
            std::cout << " " << n->value;
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        std::cout << "\\n";
    }
}
`,
    "level 0: 1\nlevel 1: 2 3\nlevel 2: 4 5 6",
  ),
  {
    skill: "binary-trees",
    rung: 2,
    title: "Fix the largest value",
    promptMd: `\`maxValue(root)\` should return the largest value in a non-empty tree. It works when some value is positive, but for a tree of negative values, like \`{-5, -2, -8}\`, it returns 0, which isn't even in the tree. **Find the fault and fix it.** ${TREES}`,
    functionSignature: "int maxValue(const TreeNode* root)",
    call: printWithTree("maxValue"),
    generator: GEN + TREE,
    starterCode: `#include <algorithm>

${TREE_NODE}

int maxValue(const TreeNode* root) {
    int best = 0;
    if (!root) return best;
    return std::max({best, root->value, maxValue(root->left), maxValue(root->right)});
}
`,
    reference: `#include <algorithm>
#include <climits>

${TREE_NODE}

int maxValue(const TreeNode* root) {
    if (!root) return INT_MIN;  // an empty side must never win, so it can't be 0
    return std::max({root->value, maxValue(root->left), maxValue(root->right)});
}
`,
    cases: [
      { args: "{3, 9, 4}", expected: "9" },
      { args: "{-5, -2, -8}", expected: "-2" },
      { args: "{-1}", expected: "-1" },
      { args: "{1, X, 7}", expected: "7" },
      { args: "{-3, -4, X, -1}", expected: "-1" },
    ],
  },
  {
    skill: "binary-trees",
    rung: 3,
    title: "Complete the levels of a tree",
    promptMd: `\`levels(root)\` returns the tree's values level by level, from left to right. It takes the nodes from a queue one level at a time, and the queue's size at the start of each round is that level's width. **Complete the step** that queues the next level. ${TREES} Each test prints one level per line.`,
    functionSignature: "std::vector<std::vector<int>> levels(const TreeNode* root)",
    call: (args) => `for (const auto& level : gen::withTree(levels, ${args})) gen::show(level);`,
    generator: GEN + TREE,
    starterCode: `#include <queue>
#include <vector>

${TREE_NODE}

std::vector<std::vector<int>> levels(const TreeNode* root) {
    std::vector<std::vector<int>> out;
    std::queue<const TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        std::vector<int> level;
        for (std::size_t i = 0, width = q.size(); i < width; i++) {
            const TreeNode* n = q.front();
            q.pop();
            level.push_back(n->value);
            // TODO: queue n's children for the next level
        }
        out.push_back(level);
    }
    return out;
}
`,
    reference: `#include <queue>
#include <vector>

${TREE_NODE}

std::vector<std::vector<int>> levels(const TreeNode* root) {
    std::vector<std::vector<int>> out;
    std::queue<const TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        std::vector<int> level;
        for (std::size_t i = 0, width = q.size(); i < width; i++) {
            const TreeNode* n = q.front();
            q.pop();
            level.push_back(n->value);
            if (n->left) q.push(n->left);  // behind every node of this level, in left-to-right order
            if (n->right) q.push(n->right);
        }
        out.push_back(level);
    }
    return out;
}
`,
    cases: [
      { args: "{1, 2, 3, 4, X, X, 5}", expected: "1\n2 3\n4 5" },
      { args: "{}", expected: "" },
      { args: "{7}", expected: "7" },
      { args: "{1, X, 2, X, 3}", expected: "1\n2\n3" },
      { args: "{8, 4, 12, 2, 6, 10, 14}", expected: "8\n4 12\n2 6 10 14" },
    ],
  },
  {
    skill: "binary-trees",
    rung: 4,
    title: "Extend height to the nearest leaf",
    promptMd: `\`minDepth(root)\` should return how many nodes lie on the path from the root down to the **nearest leaf**, a node without children, or 0 for an empty tree. So far it returns the height: the path to the **farthest** leaf. **Extend it.** Careful: a node with only one child isn't a leaf, so its missing side doesn't count as a path. ${TREES}`,
    functionSignature: "int minDepth(const TreeNode* root)",
    call: printWithTree("minDepth"),
    generator: GEN + TREE,
    starterCode: `#include <algorithm>

${TREE_NODE}

int minDepth(const TreeNode* root) {
    if (!root) return 0;
    return 1 + std::max(minDepth(root->left), minDepth(root->right));
}
`,
    reference: `#include <algorithm>

${TREE_NODE}

int minDepth(const TreeNode* root) {
    if (!root) return 0;
    if (!root->left) return 1 + minDepth(root->right);  // one side missing: the leaf is on the other
    if (!root->right) return 1 + minDepth(root->left);
    return 1 + std::min(minDepth(root->left), minDepth(root->right));
}
`,
    cases: [
      { args: "{5, 1, 8, X, X, 6, 9, X, 2}", expected: "2" },
      { args: "{}", expected: "0" },
      { args: "{1}", expected: "1" },
      { args: "{1, 2, 3, 4}", expected: "2" },
      { args: "{1, X, 2, X, 3}", expected: "3" },
      { args: "{1, 2}", expected: "2" },
    ],
  },
  {
    skill: "binary-trees",
    rung: 5,
    title: "The tree seen from the right",
    promptMd: `\`rightView(root)\` returns the values you'd see looking at the tree from its right side: the **last** node of each level, from the top down. For \`{10, 20, 30, 40, X, 50}\` that's \`10 30 50\`. ${TASK} ${TREES}`,
    functionSignature: "std::vector<int> rightView(const TreeNode* root)",
    call: showWithTree("rightView"),
    generator: GEN + TREE,
    starterCode: `#include <vector>

${TREE_NODE}

std::vector<int> rightView(const TreeNode* root) {
    return {};
}
`,
    reference: `#include <queue>
#include <vector>

${TREE_NODE}

std::vector<int> rightView(const TreeNode* root) {
    std::vector<int> view;
    std::queue<const TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        std::size_t width = q.size();
        for (std::size_t i = 0; i < width; i++) {
            const TreeNode* n = q.front();
            q.pop();
            if (i == width - 1) view.push_back(n->value);  // the level's last node
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
    }
    return view;
}
`,
    cases: [
      { args: "{10, 20, 30, 40, X, 50}", expected: "10 30 50" },
      { args: "{}", expected: "" },
      { args: "{1, 2}", expected: "1 2" },
      { args: "{1, X, 2, 3}", expected: "1 2 3" },
      { args: "{5, 3, 8, 1, 4, 7, 9, X, 2}", expected: "5 8 9 2" },
    ],
  },
];
