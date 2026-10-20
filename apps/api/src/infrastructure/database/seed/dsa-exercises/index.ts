// The hand-written DSA practice bank: rungs 1–5 for each skill (ADR-0020), one file per skill.
import { binarySearch } from "./binary-search.js";
import { binarySearchOnAnswer } from "./binary-search-on-answer.js";
import { complexity } from "./complexity.js";
import { elementarySorts } from "./elementary-sorts.js";
import { linearTimeSorting } from "./linear-time-sorting.js";
import { mergeSort } from "./merge-sort.js";
import { quickSort } from "./quick-sort.js";
import { recursion } from "./recursion.js";

export const dsaPracticeBank = [
  ...complexity,
  ...recursion,
  ...binarySearch,
  ...elementarySorts,
  ...mergeSort,
  ...quickSort,
  ...linearTimeSorting,
  ...binarySearchOnAnswer,
];
