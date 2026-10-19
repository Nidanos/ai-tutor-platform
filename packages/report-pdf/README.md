# Report PDF

Builds the Phase 3 report PDF from its Markdown. From the repo root:

```bash
pnpm report:pdf
```

- Markdown becomes HTML (marked), Mermaid 11.4.1 draws the diagrams (from a CDN, so it needs internet), and headless Chrome prints the PDF next to the `.md`.
- The page follows MCA-269: A4, Times New Roman 12, 1.5 spacing, margins L 3 / R 2 / T,B 2.54 cm.
- No PDF is written if a diagram fails to draw.
- Chrome, then Edge, at their usual Windows paths; set `BROWSER` to use another Chrome or Edge binary.
- Another report: `pnpm report:pdf DOCS/path/to/report.md`.

**Keeping diagrams readable on paper.** Each diagram is shrunk to the 16 cm text width, so a wide one gets tiny text. Draw flows top to bottom (`flowchart TB`), break long labels with `<br/>`, and split a diagram whose text would print below about 6 pt.
