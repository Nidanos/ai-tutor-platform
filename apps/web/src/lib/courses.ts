import type { CourseSlug } from "@ai-tutor/types";

// Navigation labels only: learning state and authorisation come from the API. Subtopics are the
// seeded skill names (apps/api seed), which is how the learning screens find each skill in GET /progress.
export type CourseTopicGroup = { name: string; description: string; subtopics: string[] };
export type CourseDefinition = {
  slug: CourseSlug;
  title: string;
  shortTitle: string;
  description: string;
  topics: CourseTopicGroup[];
  resources: Array<{ title: string; description: string; url: string }>;
};

const cppBasics: CourseDefinition = {
  slug: "cpp-basics",
  title: "C++ Basics",
  shortTitle: "C++",
  description: "Build the C++ foundations needed to solve programming problems confidently.",
  topics: [
    { name: "Foundations", description: "Learn how a C++ program is structured.", subtopics: ["Your first program", "Variables and types", "Operators"] },
    { name: "Control Flow", description: "Make decisions and repeat work safely.", subtopics: ["Making decisions", "Loops"] },
    { name: "Reusable Code", description: "Organise programs into reusable functions.", subtopics: ["Functions", "Lambdas"] },
    { name: "Collections", description: "Store and work with groups of values.", subtopics: ["Arrays", "Strings", "Vectors", "Iterators", "Maps and sets", "Stack, queue and priority queue"] },
    { name: "Memory and Types", description: "Understand references, pointers and your own types.", subtopics: ["References", "Pointers", "Heap memory", "Structs and classes", "Smart pointers"] },
    { name: "Standard Library and Bits", description: "Use proven library algorithms and bit operations.", subtopics: ["STL algorithms", "Bitwise operators"] },
  ],
  resources: [
    { title: "Learn C++", description: "Structured C++ tutorials for beginners.", url: "https://www.learncpp.com/" },
    { title: "cppreference", description: "Reference documentation for the C++ language and standard library.", url: "https://en.cppreference.com/w/" },
  ],
};

const dsa: CourseDefinition = {
  slug: "dsa",
  title: "Data Structures and Algorithms",
  shortTitle: "DSA",
  description: "Develop algorithmic thinking from foundations to advanced problem-solving.",
  topics: [
    { name: "Foundations", description: "Understand complexity and foundational techniques.", subtopics: ["Complexity analysis", "Recursion"] },
    { name: "Searching and Sorting", description: "Find items and order data efficiently.", subtopics: ["Linear and binary search", "Simple sorts", "Merge sort", "Quick sort and quickselect", "Counting, radix and bucket sort", "Binary search on the answer"] },
    { name: "Array, String and Math Techniques", description: "Use common patterns to solve array, string and numeric problems.", subtopics: ["Prefix sums and difference arrays", "Two pointers", "Hashing and hash tables", "Sliding window", "Matrices and grids", "String techniques", "String matching", "Bit manipulation", "Number theory", "Counting and combinatorics"] },
    { name: "Linear Data Structures", description: "Build and apply linked lists, stacks and queues.", subtopics: ["Linked lists", "Linked list techniques", "Stacks", "Queues and deques", "Monotonic stacks and queues", "Designing data structures"] },
    { name: "Trees", description: "Work with hierarchical data and range-query structures.", subtopics: ["Binary trees", "Tree problems", "Binary search trees", "Balanced search trees", "Heaps and priority queues", "Tries", "Fenwick trees", "Segment trees"] },
    { name: "Graphs", description: "Represent networks and reason about paths and connectivity.", subtopics: ["Graphs and their representations", "Breadth-first search", "Depth-first search", "Topological sort", "Disjoint set union", "Shortest paths", "Minimum spanning trees", "Bridges and strongly connected components", "Maximum flow and matching"] },
    { name: "Algorithm Design", description: "Choose a strategy for increasingly complex problems.", subtopics: ["Greedy algorithms", "Backtracking", "Dynamic programming basics", "DP on sequences and strings", "Knapsack and subset DP", "DP on grids and intervals", "Advanced dynamic programming"] },
    { name: "Putting It Together", description: "Translate constraints into an effective solution strategy.", subtopics: ["Problem solving from constraints"] },
  ],
  resources: [
    { title: "cppreference", description: "C++ language and standard-library reference.", url: "https://en.cppreference.com/w/" },
    { title: "CP-Algorithms", description: "Reference articles for common algorithms and data structures.", url: "https://cp-algorithms.com/" },
  ],
};

export const COURSES: CourseDefinition[] = [cppBasics, dsa];
export const DEFAULT_COURSE: CourseSlug = "cpp-basics";
export const getCourse = (slug: CourseSlug) => COURSES.find((course) => course.slug === slug) ?? cppBasics;
