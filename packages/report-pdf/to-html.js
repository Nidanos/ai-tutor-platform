// Markdown → print-ready HTML, set to the MCA-269 rules: A4, Times New Roman 12, 1.5 spacing, margins
// L 3.0 / R 2.0 / T,B 2.54 cm, page numbers at the foot, a blank page before each chapter, chapter headings
// 20 pt centred, code 10 pt Courier New.
import { marked } from "marked";

// Mermaid reads the diagram text back from the page, so <<interface>> and the like must survive as text.
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const renderer = new marked.Renderer();
const baseCode = renderer.code.bind(renderer);
renderer.code = (token) => (token.lang === "mermaid" ? `<div class="mermaid">${escapeHtml(token.text)}</div>` : baseCode(token));

const CSS = `
@page { size: A4; margin: 2.54cm 2cm 2.54cm 3cm; @bottom-center { content: counter(page); font: 11pt "Times New Roman", Times, serif; } }
@page :first { @bottom-center { content: none; } }
.blank-page { break-before: page; height: 1px; }
/* The Markdown's own title and working notes: the printed copy starts at the cover page. */
body > h1:first-child, body > h1:first-child + blockquote, body > h1:first-child + blockquote + hr { display: none; }
.cover { text-align: center; padding-top: 3cm; font-size: 14pt; }
.cover table { width: auto; margin: 1.5cm auto; font-size: 12pt; }
body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; text-align: justify; color: #000; }
h1 { font-size: 20pt; text-align: center; margin: 30pt 0; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 14pt; text-decoration: underline; margin: 12pt 0; text-align: left; page-break-after: avoid; }
h3, h4 { font-size: 12pt; margin: 10pt 0 6pt; page-break-after: avoid; }
p, li { margin: 6pt 0; }
table { border-collapse: collapse; width: 100%; font-size: 10.5pt; margin: 8pt 0; page-break-inside: auto; }
th, td { border: 1px solid #444; padding: 3pt 5pt; text-align: left; vertical-align: top; }
th { background: #eee; }
tr { page-break-inside: avoid; }
pre { font-family: "Courier New", monospace; font-size: 9pt; line-height: 1.25; background: #f6f6f6; padding: 6pt; white-space: pre-wrap; word-break: break-word; border: 1px solid #ddd; }
code { font-family: "Courier New", monospace; font-size: 10pt; }
blockquote { border-left: 3px solid #999; margin: 8pt 0; padding: 2pt 10pt; color: #333; }
hr { border: 0; page-break-after: always; }
p:has(+ .mermaid) { page-break-after: avoid; page-break-inside: avoid; }
.mermaid { text-align: center; margin: 10pt 0; page-break-inside: avoid; }
.mermaid svg { max-width: 100%; max-height: 21cm; height: auto; }`;

// Diagrams shrink to the 16 cm text width; small ones would print larger than needed, so every
// diagram's text is also capped at about 8 pt (Mermaid's 16 px text × 2/3).
const SCRIPT = `
mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict", flowchart: { useMaxWidth: true }, er: { useMaxWidth: true } });
mermaid.run({ querySelector: ".mermaid" }).then(() => {
  document.querySelectorAll(".mermaid svg").forEach((svg) => {
    const w = svg.viewBox.baseVal.width;
    if (w) svg.style.maxWidth = "min(100%, " + Math.round((w * 2) / 3) + "px)";
  });
});`;

export function toHtml(markdown) {
  const title = escapeHtml(markdown.match(/^# (.+)$/m)?.[1] ?? "Report");
  // MCA-269: a blank page before each chapter.
  // The cover prints centred, without its working heading. A single line break is kept, as on the cover and
  // the certificate's signature lines; the chapters put each paragraph on one line, so nothing else changes.
  const body = marked
    .parse(markdown, { renderer, breaks: true })
    .replace(/<h1([^>]*)>CHAPTER/g, '<div class="blank-page"></div><h1$1>CHAPTER')
    .replace(/<h2>Cover Page[^<]*<\/h2>([\s\S]*?)<hr>/, '<section class="cover">$1</section><hr>');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>${CSS}</style></head><body>${body}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<script>${SCRIPT}</script></body></html>`;
}
