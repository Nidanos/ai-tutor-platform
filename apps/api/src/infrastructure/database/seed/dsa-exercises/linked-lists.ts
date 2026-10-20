import { predict, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, LIST, LIST_NODE } from "./harness.js";

// Each test builds the list from its values, calls the function and prints the list it returns.
const listCall = (fn: string) => (args: string) => `gen::showList(gen::withList(${fn}, ${args}));`;

const ROTATE_BY_STEPS = `${LIST_NODE}

ListNode* rotateRight(ListNode* head, long long k) {
    if (!head || !head->next) return head;
    for (long long step = 0; step < k; step++) {  // one step: the last node moves to the front
        ListNode* beforeLast = head;
        while (beforeLast->next->next) beforeLast = beforeLast->next;
        ListNode* last = beforeLast->next;
        beforeLast->next = nullptr;
        last->next = head;
        head = last;
    }
    return head;
}
`;

export const linkedLists: ExerciseTemplate[] = [
  predict(
    "linked-lists",
    "What does it print? Relinking nodes",
    `#include <iostream>

struct Node {
    int value;
    Node* next;
};

int main() {
    Node* head = nullptr;
    for (int v : {4, 3, 2, 1}) head = new Node{v, head};
    Node* second = head->next;
    Node* gone = second->next;
    second->next = gone->next;
    delete gone;
    head = new Node{0, head};
    Node* third = head->next->next;
    third->next = new Node{9, third->next};
    int count = 0;
    for (Node* p = head; p; p = p->next, count++) std::cout << p->value << " ";
    std::cout << "\\n" << count << "\\n";
    while (head) {
        Node* next = head->next;
        delete head;
        head = next;
    }
}
`,
    "0 1 2 9 4\n5",
  ),
  {
    skill: "linked-lists",
    rung: 2,
    title: "Fix removing every matching node",
    promptMd: `\`removeAll(head, x)\` should delete every node whose value is x and return the list's new head. For \`1 2 6 3 6\` and 6 it works, giving \`1 2 3\`. But it misses a matching first node, and it misses the second of two matches in a row. **Find the faults and fix them.** Each test prints the list returned. Hint: a dummy node in front of the head makes the first node no special case.`,
    functionSignature: "ListNode* removeAll(ListNode* head, int x)",
    call: listCall("removeAll"),
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

ListNode* removeAll(ListNode* head, int x) {
    for (ListNode* p = head; p && p->next; p = p->next)
        if (p->next->value == x) {
            ListNode* gone = p->next;
            p->next = gone->next;
            delete gone;
        }
    return head;
}
`,
    reference: `${LIST_NODE}

ListNode* removeAll(ListNode* head, int x) {
    ListNode dummy{0, head};  // a node before the first, so the first node is no special case
    ListNode* p = &dummy;
    while (p->next) {
        if (p->next->value == x) {
            ListNode* gone = p->next;
            p->next = gone->next;  // stay at p: the new p->next may match too
            delete gone;
        } else {
            p = p->next;
        }
    }
    return dummy.next;
}
`,
    cases: [
      { args: "{1, 2, 6, 3, 6}, 6", expected: "1 2 3" },
      { args: "{7, 7, 7}, 7", expected: "" },
      { args: "{7, 1, 7, 7, 2}, 7", expected: "1 2" },
      { args: "{}, 4", expected: "" },
      { args: "{1, 2}, 3", expected: "1 2" },
    ],
  },
  {
    skill: "linked-lists",
    rung: 3,
    title: "Complete inserting into a sorted list",
    promptMd: `\`insertSorted(head, x)\` gets a list sorted smallest first and inserts a new node holding x so it stays sorted, returning the head, which may now be the new node. A dummy node in front means that inserting at the front is no special case. The loop already finds the node after which x belongs. **Complete the link.** Each test prints the list returned.`,
    functionSignature: "ListNode* insertSorted(ListNode* head, int x)",
    call: listCall("insertSorted"),
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

ListNode* insertSorted(ListNode* head, int x) {
    ListNode dummy{0, head};
    ListNode* p = &dummy;
    while (p->next && p->next->value < x) p = p->next;
    // TODO: link a new node holding x between p and p->next
    return dummy.next;
}
`,
    reference: `${LIST_NODE}

ListNode* insertSorted(ListNode* head, int x) {
    ListNode dummy{0, head};
    ListNode* p = &dummy;
    while (p->next && p->next->value < x) p = p->next;
    p->next = new ListNode{x, p->next};  // the new node points on to what came after p
    return dummy.next;
}
`,
    cases: [
      { args: "{1, 3, 5}, 4", expected: "1 3 4 5" },
      { args: "{}, 7", expected: "7" },
      { args: "{2, 3}, 1", expected: "1 2 3" },
      { args: "{1, 2}, 9", expected: "1 2 9" },
      { args: "{5, 5}, 5", expected: "5 5 5" },
    ],
  },
  {
    skill: "linked-lists",
    rung: 4,
    title: "Extend reversing to a stretch of the list",
    promptMd: `\`reverseBetween(head, left, right)\` reverses the whole list so far. **Extend it** to reverse only the nodes at positions left to right, counting from 1 (1 ≤ left ≤ right ≤ the length), and leave the rest in place. For \`10 20 30 40 50 60\` with left 2 and right 5 the result is \`10 50 40 30 20 60\`. Each test prints the list returned.`,
    functionSignature: "ListNode* reverseBetween(ListNode* head, int left, int right)",
    call: listCall("reverseBetween"),
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

ListNode* reverseBetween(ListNode* head, int left, int right) {
    ListNode* prev = nullptr;
    while (head) {
        ListNode* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
`,
    reference: `${LIST_NODE}

ListNode* reverseBetween(ListNode* head, int left, int right) {
    ListNode dummy{0, head};
    ListNode* before = &dummy;
    for (int i = 1; i < left; i++) before = before->next;  // the node just before position left
    ListNode *prev = nullptr, *cur = before->next;
    for (int i = left; i <= right; i++) {
        ListNode* next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    before->next->next = cur;  // the stretch's old first node is now its last: join it to the rest
    before->next = prev;       // and its old last node is now its first
    return dummy.next;
}
`,
    cases: [
      { args: "{10, 20, 30, 40, 50, 60}, 2, 5", expected: "10 50 40 30 20 60" },
      { args: "{1, 2, 3}, 1, 3", expected: "3 2 1" },
      { args: "{7}, 1, 1", expected: "7" },
      { args: "{1, 2, 3, 4}, 3, 4", expected: "1 2 4 3" },
      { args: "{1, 2}, 1, 1", expected: "1 2" },
    ],
  },
  {
    skill: "linked-lists",
    rung: 5,
    title: "Rotate a list to the right",
    promptMd: `\`rotateRight(head, k)\` moves the last node to the front, k times over, and returns the new head. For \`10 20 30 40\` and k = 1 the result is \`40 10 20 30\`. k can be as large as 10¹⁸, so don't move one node at a time: after n rotations a list of n nodes is back where it started. ${TASK} Hidden tests include lists of up to 1,000 nodes with k up to 10¹⁸, and each test must finish within 2 seconds. Each test prints the list returned.`,
    functionSignature: "ListNode* rotateRight(ListNode* head, long long k)",
    call: listCall("rotateRight"),
    generator: GEN + LIST,
    starterCode: `${LIST_NODE}

ListNode* rotateRight(ListNode* head, long long k) {
    return head;
}
`,
    reference: `${LIST_NODE}

ListNode* rotateRight(ListNode* head, long long k) {
    if (!head) return head;
    long long n = 1;
    ListNode* tail = head;
    while (tail->next) tail = tail->next, n++;
    k %= n;  // n rotations change nothing
    if (k == 0) return head;
    tail->next = head;  // close the list into a ring
    ListNode* newTail = head;
    for (long long i = 1; i < n - k; i++) newTail = newTail->next;
    head = newTail->next;
    newTail->next = nullptr;  // and open it again after the new tail
    return head;
}
`,
    bruteForce: ROTATE_BY_STEPS,
    cases: [
      { args: "{10, 20, 30, 40}, 1", expected: "40 10 20 30" },
      { args: "{1, 2, 3}, 3", expected: "1 2 3" },
      { args: "{}, 5", expected: "" },
      { args: "{7}, 100", expected: "7" },
      { args: "{1, 2, 3, 4, 5, 6}, 8", expected: "5 6 1 2 3 4" },
      { args: "gen::ints(291, 2000, 1, 1000000), 1500" },
      { args: "gen::ints(292, 1000, 1, 1000000), 1000000000000000000LL" },
    ],
  },
];
