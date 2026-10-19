// Builds a report PDF next to its Markdown: `pnpm report:pdf [path/to/report.md]`, path from the repo root.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { toHtml } from "./to-html.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
// The first one found: BROWSER, then Chrome, then Edge (whose headless mode stopped working here on 19 Oct 2026).
const BROWSER = [process.env.BROWSER, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"]
  .find((path) => path && existsSync(path));
if (!BROWSER) throw new Error("No Chrome or Edge found: set BROWSER to one");

const source = resolve(ROOT, process.argv[2] ?? "DOCS/phase-3/MP3-Draft-Report.md");
const target = source.replace(/\.md$/, ".pdf");
const markdown = readFileSync(source, "utf8");
const dir = mkdtempSync(join(tmpdir(), "report-pdf-"));
const html = join(dir, "report.html");
// Its own profile, so an open browser window can't take over the run; long enough for Mermaid to load and draw.
const RENDER = ["--headless=new", "--disable-gpu", `--user-data-dir=${join(dir, "profile")}`, "--virtual-time-budget=60000"];
writeFileSync(html, toHtml(markdown));
const url = pathToFileURL(html).href;

try {
  // A diagram with a syntax error would print as an error box: stop before writing the PDF.
  const dom = execFileSync(BROWSER, [...RENDER, "--dump-dom", url], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  const expected = (markdown.match(/^```mermaid$/gm) ?? []).length;
  const drawn = (dom.match(/<div class="mermaid"[^>]*><svg/g) ?? []).length;
  if (drawn !== expected || dom.includes("Syntax error")) throw new Error(`Only ${drawn} of ${expected} diagrams drew cleanly (look for "Syntax error").`);

  // Printed to a temp file first, so a failed run never leaves the old PDF looking new.
  const printed = join(dir, "report.pdf");
  execFileSync(BROWSER, [...RENDER, "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw", `--print-to-pdf=${printed}`, url], { stdio: "ignore" });
  const pages = existsSync(printed) ? (readFileSync(printed).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length : 0;
  if (!pages) throw new Error("The browser printed no PDF.");
  copyFileSync(printed, target);
  console.log(`${target}: ${pages} pages, ${expected} diagrams`);
} catch (error) {
  console.error(`${error.message} No PDF written.`);
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
}
