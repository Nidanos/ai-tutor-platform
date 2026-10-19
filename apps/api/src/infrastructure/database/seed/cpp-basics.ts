// The cpp-basics course: everything a learner needs to write DSA solutions in C++.
// Skill names and descriptions are our own (ADR-0001). Resources are "further reading" links,
// never copied and never fed to the AI (their licences don't allow it).
import type { resourceKind } from "../schema/index.js";

export type ResourceSeed = { title: string; url: string; kind: (typeof resourceKind.enumValues)[number] };

export type SkillSeed = {
  slug: string;
  name: string;
  description: string;
  type: "syntactic" | "conceptual";
  difficulty: number;
  needs: string[]; // prerequisite slugs; "course/slug" for a skill of another course
  resources: ResourceSeed[];
};

const learncpp = (lesson: string, title: string): ResourceSeed => ({
  title: `learncpp: ${title}`,
  url: `https://www.learncpp.com/cpp-tutorial/${lesson}/`,
  kind: "article",
});

export const cppref = (page: string, title: string): ResourceSeed => ({
  title: `cppreference: ${title}`,
  url: `https://en.cppreference.com/cpp/${page}`,
  kind: "docs",
});

export const cppBasicsSkills: SkillSeed[] = [
  {
    slug: "program-structure",
    name: "Your first program",
    description: "How a C++ program is laid out: main, includes, statements, and printing to the screen.",
    type: "syntactic",
    difficulty: 1,
    needs: [],
    resources: [
      learncpp("statements-and-the-structure-of-a-program", "Statements and the structure of a program"),
      learncpp("introduction-to-iostream-cout-cin-and-endl", "cout, cin and endl"),
      cppref("language/main_function", "The main function"),
    ],
  },
  {
    slug: "variables-and-types",
    name: "Variables and types",
    description: "Storing values in int, long long, double, char and bool, converting between them, and avoiding overflow.",
    type: "syntactic",
    difficulty: 1,
    needs: ["program-structure"],
    resources: [
      learncpp("introduction-to-fundamental-data-types", "Fundamental data types"),
      learncpp("signed-integers", "Signed integers and overflow"),
      learncpp("introduction-to-type-conversion-and-static_cast", "Type conversion and static_cast"),
      cppref("language/types", "Fundamental types"),
    ],
  },
  {
    slug: "operators",
    name: "Operators",
    description: "Arithmetic, comparison and logical operators, including integer division and the remainder operator.",
    type: "syntactic",
    difficulty: 1,
    needs: ["variables-and-types"],
    resources: [
      learncpp("arithmetic-operators", "Arithmetic operators"),
      learncpp("logical-operators", "Logical operators"),
      cppref("language/operator_arithmetic", "Arithmetic operators"),
    ],
  },
  {
    slug: "conditionals",
    name: "Making decisions",
    description: "Choosing what runs with if, else, switch and the conditional operator.",
    type: "syntactic",
    difficulty: 1,
    needs: ["operators"],
    resources: [
      learncpp("introduction-to-if-statements", "If statements"),
      learncpp("switch-statement-basics", "Switch statements"),
      cppref("language/if", "if statement"),
    ],
  },
  {
    slug: "loops",
    name: "Loops",
    description: "Repeating work with for, while and do-while, controlling it with break and continue, and nesting loops.",
    type: "syntactic",
    difficulty: 2,
    needs: ["conditionals"],
    resources: [
      learncpp("introduction-to-loops-and-while-statements", "Loops and while statements"),
      learncpp("for-statements", "For statements"),
      learncpp("break-and-continue", "Break and continue"),
      cppref("language/for", "for loop"),
    ],
  },
  {
    slug: "functions",
    name: "Functions",
    description: "Splitting a program into named, reusable pieces with parameters, return values, local scope and overloading.",
    type: "syntactic",
    difficulty: 2,
    needs: ["conditionals"],
    resources: [
      learncpp("introduction-to-functions", "Functions"),
      learncpp("introduction-to-function-parameters-and-arguments", "Parameters and arguments"),
      learncpp("introduction-to-function-overloading", "Function overloading"),
      cppref("language/functions", "Functions"),
    ],
  },
  {
    slug: "arrays",
    name: "Arrays",
    description: "Fixed-size sequences of values, indexing them, and what happens when an index goes out of bounds.",
    type: "syntactic",
    difficulty: 2,
    needs: ["loops"],
    resources: [
      learncpp("introduction-to-c-style-arrays", "C-style arrays"),
      cppref("language/array", "Arrays"),
    ],
  },
  {
    slug: "strings",
    name: "Strings",
    description: "Working with text in std::string: length, characters, substrings, joining and comparing.",
    type: "syntactic",
    difficulty: 2,
    needs: ["loops"],
    resources: [
      learncpp("introduction-to-stdstring", "std::string"),
      cppref("string/basic_string", "std::basic_string"),
    ],
  },
  {
    slug: "vectors",
    name: "Vectors",
    description: "Growable lists with std::vector: adding items, reading them, looping over them, and 2D grids.",
    type: "syntactic",
    difficulty: 2,
    needs: ["arrays", "functions"],
    resources: [
      learncpp("introduction-to-stdvector-and-list-constructors", "std::vector"),
      cppref("container/vector", "std::vector"),
    ],
  },
  {
    slug: "references",
    name: "References",
    description: "Giving a variable a second name, and passing arguments by value, by reference or by const reference.",
    type: "conceptual",
    difficulty: 3,
    needs: ["functions"],
    resources: [
      learncpp("lvalue-references", "References"),
      learncpp("pass-by-lvalue-reference", "Pass by reference"),
      learncpp("pass-by-const-lvalue-reference", "Pass by const reference"),
      cppref("language/reference", "References"),
    ],
  },
  {
    slug: "pointers",
    name: "Pointers",
    description: "Variables that hold memory addresses: taking an address, following it, and the null pointer.",
    type: "conceptual",
    difficulty: 3,
    needs: ["arrays", "references"],
    resources: [
      learncpp("introduction-to-pointers", "Pointers"),
      learncpp("null-pointers", "Null pointers"),
      cppref("language/pointer", "Pointers"),
    ],
  },
  {
    slug: "dynamic-memory",
    name: "Heap memory",
    description: "The stack versus the heap, creating objects with new, freeing them with delete, and memory leaks.",
    type: "conceptual",
    difficulty: 3,
    needs: ["pointers"],
    resources: [
      learncpp("the-stack-and-the-heap", "The stack and the heap"),
      learncpp("dynamic-memory-allocation-with-new-and-delete", "new and delete"),
      cppref("language/new", "new expression"),
    ],
  },
  {
    slug: "structs-and-classes",
    name: "Structs and classes",
    description: "Grouping data and behaviour into your own types with members, constructors and member functions.",
    type: "conceptual",
    difficulty: 3,
    needs: ["functions"],
    resources: [
      learncpp("introduction-to-structs-members-and-member-selection", "Structs"),
      learncpp("introduction-to-classes", "Classes"),
      learncpp("introduction-to-constructors", "Constructors"),
      cppref("language/classes", "Classes"),
    ],
  },
  {
    slug: "smart-pointers",
    name: "Smart pointers",
    description: "Owning heap objects safely with unique_ptr and shared_ptr, so memory frees itself.",
    type: "conceptual",
    difficulty: 4,
    needs: ["dynamic-memory", "structs-and-classes"],
    resources: [
      learncpp("introduction-to-smart-pointers-move-semantics", "Smart pointers and move semantics"),
      learncpp("stdunique_ptr", "std::unique_ptr"),
      learncpp("stdshared_ptr", "std::shared_ptr"),
      cppref("memory/unique_ptr", "std::unique_ptr"),
      cppref("memory/shared_ptr", "std::shared_ptr"),
    ],
  },
  {
    slug: "iterators",
    name: "Iterators",
    description: "Walking through any container with begin and end, and the range-based for loop.",
    type: "conceptual",
    difficulty: 3,
    needs: ["vectors"],
    resources: [
      learncpp("introduction-to-iterators", "Iterators"),
      learncpp("range-based-for-loops-for-each", "Range-based for loops"),
      cppref("iterator", "Iterator library"),
    ],
  },
  {
    slug: "lambdas",
    name: "Lambdas",
    description: "Small unnamed functions written inline, what they capture, and using them as comparators.",
    type: "syntactic",
    difficulty: 3,
    needs: ["functions"],
    resources: [
      learncpp("introduction-to-lambdas-anonymous-functions", "Lambdas"),
      learncpp("lambda-captures", "Lambda captures"),
      cppref("language/lambda", "Lambda expressions"),
    ],
  },
  {
    slug: "container-adaptors",
    name: "Stack, queue and priority queue",
    description: "Using std::stack, std::queue and std::priority_queue: last-in-first-out, first-in-first-out and highest-first.",
    type: "syntactic",
    difficulty: 3,
    needs: ["vectors"],
    resources: [
      learncpp("stdvector-and-stack-behavior", "Stack behaviour with std::vector"),
      cppref("container/stack", "std::stack"),
      cppref("container/queue", "std::queue"),
      cppref("container/priority_queue", "std::priority_queue"),
    ],
  },
  {
    slug: "associative-containers",
    name: "Maps and sets",
    description: "Looking things up by key with map, set and their unordered (hash) versions, and storing pairs.",
    type: "conceptual",
    difficulty: 3,
    needs: ["iterators"],
    resources: [
      cppref("container/map", "std::map"),
      cppref("container/unordered_map", "std::unordered_map"),
      cppref("container/set", "std::set"),
      cppref("utility/pair", "std::pair"),
    ],
  },
  {
    slug: "stl-algorithms",
    name: "STL algorithms",
    description: "Ready-made algorithms like sort, find, min and max, with custom comparators.",
    type: "syntactic",
    difficulty: 4,
    needs: ["iterators", "lambdas"],
    resources: [
      learncpp("introduction-to-standard-library-algorithms", "Standard library algorithms"),
      cppref("algorithm", "Algorithms library"),
      cppref("algorithm/sort", "std::sort"),
    ],
  },
  {
    slug: "bitwise-operators",
    name: "Bitwise operators",
    description: "Working with individual bits using and, or, xor, not and shifts.",
    type: "syntactic",
    difficulty: 3,
    needs: ["operators"],
    resources: [
      learncpp("bitwise-operators", "Bitwise operators"),
      learncpp("bit-manipulation-with-bitwise-operators-and-bit-masks", "Bit masks"),
    ],
  },
];
