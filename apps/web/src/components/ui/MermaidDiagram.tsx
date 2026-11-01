"use client";

import { useEffect, useId, useState } from "react";

// Lesson diagrams are Mermaid source from the database. "strict" sanitises the SVG and turns off click
// handlers and HTML labels; a diagram that doesn't parse shows its source instead.
export default function MermaidDiagram({ source }: { source: string }) {
  const id = `diagram-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "dark" });
        const result = await mermaid.render(id, source);
        if (active) setSvg(result.svg);
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id, source]);

  if (failed) return <pre className="overflow-x-auto rounded-xl border border-indigo-400/15 bg-[#0b1226] p-4 font-mono text-xs leading-6 text-violet-100"><code>{source}</code></pre>;
  if (!svg) return <p role="status" className="text-sm text-indigo-300">Drawing the diagram…</p>;
  return <div className="overflow-x-auto rounded-xl border border-indigo-400/15 bg-[#0b1226] p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}
