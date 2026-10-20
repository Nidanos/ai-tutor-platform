import { predict, printCall, TASK, type ExerciseTemplate } from "../cpp-templates.js";
import { GEN, limits, showCall } from "./harness.js";

// The values 1..rows*cols shuffled into a grid, so every value is different.
const GRID = String.raw`
namespace gen {
std::vector<std::vector<int>> distinctGrid(std::uint64_t seed, int rows, int cols) {
    std::vector<int> values = permutation(seed, rows * cols);
    std::vector<std::vector<int>> g(rows, std::vector<int>(cols));
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) g[r][c] = values[r * cols + c];
    return g;
}
}  // namespace gen
`;

const SORTED_GRID = "{{1, 4, 7, 11}, {2, 5, 8, 12}, {3, 6, 9, 16}, {10, 13, 14, 17}}";

// The learner's function changes or builds a grid; each test prints it, one row per line.
const printGrid = (make: (g: string) => string) => (args: string) =>
  `{ std::vector<std::vector<int>> g = ${args}; ${make("g")} for (const auto& row : g) gen::show(row); }`;

export const matrices: ExerciseTemplate[] = [
  predict(
    "matrices",
    "What does it print? Diagonals and a cross",
    `#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> m = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    int diagonal = 0, anti = 0;
    for (int i = 0; i < 3; i++) diagonal += m[i][i], anti += m[i][2 - i];
    std::cout << diagonal << " " << anti << "\\n";
    for (int c = 0; c < 3; c++) std::cout << m[2][c] + m[c][2] << " ";
    std::cout << "\\n";
}
`,
    "15 15\n10 14 18",
  ),
  {
    skill: "matrices",
    rung: 2,
    title: "Fix the search in a sorted grid",
    promptMd: `In this grid every row and every column is sorted, smallest first. \`contains(g, x)\` should say whether x is in it, walking a single path that drops a row or a column at each step. It starts in the wrong corner: from the top-left, both moves lead to bigger values, so it can't decide which way to go. **Find the fault and fix it.** Each test prints 1 for found, 0 for not.`,
    functionSignature: "bool contains(const std::vector<std::vector<int>>& g, int x)",
    call: printCall("contains"),
    starterCode: `#include <vector>

bool contains(const std::vector<std::vector<int>>& g, int x) {
    if (g.empty()) return false;
    int r = 0, c = 0;
    while (r < (int)g.size() && c < (int)g[0].size()) {
        if (g[r][c] == x) return true;
        if (g[r][c] < x) c++;
        else r++;
    }
    return false;
}
`,
    reference: `#include <vector>

bool contains(const std::vector<std::vector<int>>& g, int x) {
    if (g.empty()) return false;
    int r = 0, c = (int)g[0].size() - 1;  // the top-right corner: left gets smaller, down gets bigger
    while (r < (int)g.size() && c >= 0) {
        if (g[r][c] == x) return true;
        if (g[r][c] < x) r++;  // everything left of here in this row is smaller still
        else c--;              // everything below here in this column is bigger still
    }
    return false;
}
`,
    cases: [
      { args: `${SORTED_GRID}, 5`, expected: "1" },
      { args: `${SORTED_GRID}, 15`, expected: "0" },
      { args: `${SORTED_GRID}, 10`, expected: "1" },
      { args: `${SORTED_GRID}, 17`, expected: "1" },
      { args: "{}, 3", expected: "0" },
      { args: "{{2}}, 2", expected: "1" },
    ],
  },
  {
    skill: "matrices",
    rung: 3,
    title: "Complete the in-place transpose",
    promptMd: `\`transposeInPlace(m)\` turns a square grid's rows into its columns: \`m[i][j]\` and \`m[j][i]\` change places. It swaps the pairs in place, but swapping **every** (i, j) puts each pair back where it started. **Complete the inner loop's start** so each pair is swapped once. Each test prints the grid, one row per line.`,
    functionSignature: "void transposeInPlace(std::vector<std::vector<int>>& m)",
    call: printGrid((g) => `transposeInPlace(${g});`),
    generator: GEN,
    starterCode: `#include <utility>
#include <vector>

void transposeInPlace(std::vector<std::vector<int>>& m) {
    int n = m.size();
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)  // TODO: which j should this start from?
            std::swap(m[i][j], m[j][i]);
}
`,
    reference: `#include <utility>
#include <vector>

void transposeInPlace(std::vector<std::vector<int>>& m) {
    int n = m.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)  // above the diagonal only: each pair once
            std::swap(m[i][j], m[j][i]);
}
`,
    cases: [
      { args: "{{1, 2}, {3, 4}}", expected: "1 3\n2 4" },
      { args: "{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}", expected: "1 4 7\n2 5 8\n3 6 9" },
      { args: "{{5}}", expected: "5" },
      { args: "{}", expected: "" },
    ],
  },
  {
    skill: "matrices",
    rung: 4,
    title: "Extend row minimums to saddle points",
    promptMd: `A **saddle point** is a value that is the smallest in its row and the largest in its column. \`saddlePoints(g)\` should return all of them, smallest first; all the grid's values are different. So far it returns the smallest value of each row. **Extend it**: also find each column's largest value, then keep the values that are both. ${limits("grids up to 1500 × 1500")}`,
    functionSignature: "std::vector<int> saddlePoints(const std::vector<std::vector<int>>& g)",
    call: showCall("saddlePoints"),
    generator: GEN + GRID,
    starterCode: `#include <algorithm>
#include <vector>

std::vector<int> saddlePoints(const std::vector<std::vector<int>>& g) {
    std::vector<int> rowMin;
    for (const auto& row : g) rowMin.push_back(*std::min_element(row.begin(), row.end()));
    return rowMin;
}
`,
    reference: `#include <algorithm>
#include <vector>

std::vector<int> saddlePoints(const std::vector<std::vector<int>>& g) {
    if (g.empty()) return {};
    int rows = g.size(), cols = g[0].size();
    std::vector<int> rowMin(rows), colMax(cols, g[0][0]);
    for (int r = 0; r < rows; r++) rowMin[r] = *std::min_element(g[r].begin(), g[r].end());
    for (int c = 0; c < cols; c++)
        for (int r = 0; r < rows; r++) colMax[c] = std::max(colMax[c], g[r][c]);
    std::vector<int> found;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (g[r][c] == rowMin[r] && g[r][c] == colMax[c]) found.push_back(g[r][c]);
    std::sort(found.begin(), found.end());
    return found;
}
`,
    bruteForce: `#include <algorithm>
#include <vector>

std::vector<int> saddlePoints(const std::vector<std::vector<int>>& g) {
    std::vector<int> found;
    for (std::size_t r = 0; r < g.size(); r++)
        for (std::size_t c = 0; c < g[r].size(); c++) {  // this cell's whole row and whole column, every time
            int rowMin = g[r][c], colMax = g[r][c];
            for (std::size_t k = 0; k < g[r].size(); k++) rowMin = std::min(rowMin, g[r][k]);
            for (std::size_t k = 0; k < g.size(); k++) colMax = std::max(colMax, g[k][c]);
            if (g[r][c] == rowMin && g[r][c] == colMax) found.push_back(g[r][c]);
        }
    std::sort(found.begin(), found.end());
    return found;
}
`,
    cases: [
      { args: "{{5, 9, 2}, {8, 10, 7}, {1, 4, 3}}", expected: "7" },
      { args: "{{1, 2}, {3, 4}}", expected: "3" },
      { args: "{{4}}", expected: "4" },
      { args: "{{1, 6}, {5, 2}}", expected: "" },
      { args: "gen::distinctGrid(241, 40, 50)" },
      { args: "gen::distinctGrid(242, 1500, 1500)" },
    ],
  },
  {
    skill: "matrices",
    rung: 5,
    title: "One step of the Game of Life",
    promptMd: `In the Game of Life each cell is alive (1) or dead (0), and its neighbours are the up to 8 cells around it; cells outside the grid count as dead. In one step, a live cell with 2 or 3 live neighbours stays alive, a dead cell with exactly 3 comes alive, and every other cell is dead. \`lifeStep(g)\` returns the next grid. All cells change **at the same time**, so count from the old grid. ${TASK} Each test prints the grid, one row per line.`,
    functionSignature: "std::vector<std::vector<int>> lifeStep(const std::vector<std::vector<int>>& g)",
    call: printGrid((g) => `${g} = lifeStep(${g});`),
    generator: GEN,
    starterCode: `#include <vector>

std::vector<std::vector<int>> lifeStep(const std::vector<std::vector<int>>& g) {
    return g;
}
`,
    reference: `#include <vector>

std::vector<std::vector<int>> lifeStep(const std::vector<std::vector<int>>& g) {
    int rows = g.size();
    std::vector<std::vector<int>> next = g;  // a copy, so every count reads the old grid
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < (int)g[r].size(); c++) {
            int live = 0;
            for (int dr = -1; dr <= 1; dr++)
                for (int dc = -1; dc <= 1; dc++) {
                    int nr = r + dr, nc = c + dc;
                    if ((dr || dc) && nr >= 0 && nr < rows && nc >= 0 && nc < (int)g[nr].size()) live += g[nr][nc];
                }
            next[r][c] = live == 3 || (g[r][c] == 1 && live == 2);
        }
    return next;
}
`,
    cases: [
      { args: "{{0, 1, 0}, {0, 1, 0}, {0, 1, 0}}", expected: "0 0 0\n1 1 1\n0 0 0" },
      { args: "{{1, 1}, {1, 1}}", expected: "1 1\n1 1" },
      { args: "{{1}}", expected: "0" },
      { args: "{{1, 1, 0}, {1, 0, 0}, {0, 0, 0}}", expected: "1 1 0\n1 1 0\n0 0 0" },
      { args: "{}", expected: "" },
    ],
  },
];
