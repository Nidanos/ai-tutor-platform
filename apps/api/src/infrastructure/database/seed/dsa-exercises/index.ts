// The hand-written DSA practice bank: rungs 1–5 for each skill (ADR-0020), one file per skill.
import { binarySearch } from "./binary-search.js";
import { binarySearchOnAnswer } from "./binary-search-on-answer.js";
import { bitManipulation } from "./bit-manipulation.js";
import { combinatorics } from "./combinatorics.js";
import { complexity } from "./complexity.js";
import { designDataStructures } from "./design-data-structures.js";
import { elementarySorts } from "./elementary-sorts.js";
import { hashing } from "./hashing.js";
import { linearTimeSorting } from "./linear-time-sorting.js";
import { linkedListTechniques } from "./linked-list-techniques.js";
import { linkedLists } from "./linked-lists.js";
import { matrices } from "./matrices.js";
import { mergeSort } from "./merge-sort.js";
import { monotonicStack } from "./monotonic-stack.js";
import { numberTheory } from "./number-theory.js";
import { prefixSums } from "./prefix-sums.js";
import { queues } from "./queues.js";
import { quickSort } from "./quick-sort.js";
import { recursion } from "./recursion.js";
import { slidingWindow } from "./sliding-window.js";
import { stacks } from "./stacks.js";
import { stringMatching } from "./string-matching.js";
import { stringTechniques } from "./string-techniques.js";
import { twoPointers } from "./two-pointers.js";

export const dsaPracticeBank = [
  ...complexity,
  ...recursion,
  ...binarySearch,
  ...elementarySorts,
  ...mergeSort,
  ...quickSort,
  ...linearTimeSorting,
  ...binarySearchOnAnswer,
  ...prefixSums,
  ...twoPointers,
  ...hashing,
  ...slidingWindow,
  ...matrices,
  ...stringTechniques,
  ...stringMatching,
  ...bitManipulation,
  ...numberTheory,
  ...combinatorics,
  ...linkedLists,
  ...linkedListTechniques,
  ...stacks,
  ...queues,
  ...monotonicStack,
  ...designDataStructures,
];
