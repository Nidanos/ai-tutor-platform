import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, LIST, LIST_NODE } from "./harness.js";

// Each test builds the list from its values and prints what the function returns.
const printWithList = (fn: string) => (args: string) => `std::cout << gen::withList(${fn}, ${args}) << "\\n";`;

const MIDDLE_AND_REVERSE = `    ListNode *slow = head, *fast = head;
    while (fast && fast->next) slow = slow->next, fast = fast->next->next;  // slow: the start of the second half
    ListNode* prev = nullptr;
    while (slow) {  // reverse the second half
        ListNode* next = slow->next;
        slow->next = prev;
        prev = slow;
        slow = next;
    }`;

export const linkedListTechniques: ExerciseTemplate[] = [
  predict(
    "linked-list-techniques",
    "What does it print? Slow and fast pointers",
    `#include <iostream>
#include <vector>

struct Node {
    int value;
    Node* next;
};

void middle(int n) {
    std::vector<Node> nodes(n);
    for (int i = 0; i < n; i++) nodes[i] = {i + 1, i + 1 < n ? &nodes[i + 1] : nullptr};
    Node *slow = &nodes[0], *fast = &nodes[0];
    int steps = 0;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        steps++;
    }
    std::cout << slow->value << " " << steps << "\\n";
}

int main() {
    middle(6);
    middle(9);
}
`,
    "4 3\n5 4",
  ),
  {
    skill: "linked-list-techniques",
    rung: 2,
    title: "Fix the middle node",
    promptMd: `\`middleNode(head)\` gets a non-empty list and returns its middle node, taking the **second** middle when the length is even: 4 for \`1 2 3 4 5 6\`. The fast pointer moves two steps for every step of the slow one. For even lengths it stops one step too early and returns the first middle. **Find the fault and fix it.** Each test prints the returned node's value.`,
    functionSignature: "int middleNode(ListNode* head)",
    call: printWithList("middleNode"),
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

int middleNode(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast->next && fast->next->next) slow = slow->next, fast = fast->next->next;
    return slow->value;
}
`,
    reference: `${LIST_NODE}

int middleNode(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) slow = slow->next, fast = fast->next->next;  // fast falls off the end at the second middle
    return slow->value;
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5, 6}", expected: "4" },
      { args: "{1, 2, 3}", expected: "2" },
      { args: "{9}", expected: "9" },
      { args: "{1, 2}", expected: "2" },
      { args: "{5, 6, 7, 8}", expected: "7" },
    ],
  },
  {
    skill: "linked-list-techniques",
    rung: 3,
    title: "Complete the palindrome list check",
    promptMd: `\`isPalindromeList(head)\` says whether the list reads the same both ways, using O(1) extra memory. It finds the middle with slow and fast pointers and reverses the second half in place. Now \`prev\` heads the reversed second half. **Complete the comparison**: walk from \`head\` and from \`prev\` together. Each test prints 1 or 0.`,
    functionSignature: "bool isPalindromeList(ListNode* head)",
    call: printWithList("isPalindromeList"),
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

bool isPalindromeList(ListNode* head) {
${MIDDLE_AND_REVERSE}
    // TODO: walk from head and from prev together, comparing values
    return true;
}
`,
    reference: `${LIST_NODE}

bool isPalindromeList(ListNode* head) {
${MIDDLE_AND_REVERSE}
    for (ListNode *a = head, *b = prev; b; a = a->next, b = b->next)  // the reversed half is never longer
        if (a->value != b->value) return false;
    return true;
}
`,
    cases: [
      { args: "{1, 2, 2, 1}", expected: "1" },
      { args: "{1, 2, 3}", expected: "0" },
      { args: "{}", expected: "1" },
      { args: "{7}", expected: "1" },
      { args: "{1, 2, 3, 2, 1}", expected: "1" },
      { args: "{1, 1, 2}", expected: "0" },
    ],
  },
  {
    skill: "linked-list-techniques",
    rung: 4,
    title: "Extend cycle detection to the cycle's length",
    promptMd: `\`cycleLength(head)\` should return how many nodes the list's loop has, or 0 if the list ends. Floyd's method already works: if fast, moving two steps at a time, ever meets slow, there's a loop. But it returns 1 for every loop. **Extend it** to measure the loop: from the meeting point, walk once around the loop and count. Each test builds the list with its last node linked back to the given position, or no loop for -1, and prints the length.`,
    functionSignature: "int cycleLength(ListNode* head)",
    call: (args) => `std::cout << cycleLength(gen::cyclic(${args})) << "\\n";`,
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

int cycleLength(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return 1;  // they met inside a loop
    }
    return 0;  // fast reached the end: no loop
}
`,
    reference: `${LIST_NODE}

int cycleLength(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {  // they met inside a loop: go round it once
            int length = 1;
            for (ListNode* p = slow->next; p != slow; p = p->next) length++;
            return length;
        }
    }
    return 0;  // fast reached the end: no loop
}
`,
    cases: [
      { args: "{1, 2, 3, 4, 5}, 1", expected: "4" },
      { args: "{1, 2, 3}, -1", expected: "0" },
      { args: "{7}, 0", expected: "1" },
      { args: "{1, 2}, 0", expected: "2" },
      { args: "{}, -1", expected: "0" },
      { args: "{1, 2, 3, 4, 5, 6}, 5", expected: "1" },
    ],
  },
  {
    skill: "linked-list-techniques",
    rung: 5,
    title: "Reorder a list from both ends",
    promptMd: `\`reorder(head)\` rearranges the list in place to take nodes alternately from the front and the back: \`10 20 30 40 50\` becomes \`10 50 20 40 30\`. Move the nodes themselves, not their values. Hint: find the middle, reverse the second half, then weave the two halves together. ${TASK} Each test prints the list after reordering.`,
    functionSignature: "void reorder(ListNode* head)",
    call: (args) => `{ ListNode* h = gen::list(${args}); reorder(h); gen::showList(h); }`,
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

void reorder(ListNode* head) {
}
`,
    reference: `${LIST_NODE}

void reorder(ListNode* head) {
    if (!head) return;
    ListNode *slow = head, *fast = head->next;  // slow stops at the first half's last node
    while (fast && fast->next) slow = slow->next, fast = fast->next->next;
    ListNode* second = slow->next;
    slow->next = nullptr;
    ListNode* prev = nullptr;
    while (second) {  // reverse the second half
        ListNode* next = second->next;
        second->next = prev;
        prev = second;
        second = next;
    }
    for (ListNode *a = head, *b = prev; b;) {  // weave: a from the front, b from the back
        ListNode *aNext = a->next, *bNext = b->next;
        a->next = b;
        b->next = aNext;
        a = aNext;
        b = bNext;
    }
}
`,
    cases: [
      { args: "{10, 20, 30, 40, 50}", expected: "10 50 20 40 30" },
      { args: "{1, 2, 3, 4, 5, 6}", expected: "1 6 2 5 3 4" },
      { args: "{}", expected: "" },
      { args: "{7}", expected: "7" },
      { args: "{1, 2}", expected: "1 2" },
    ],
  },
];
