import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import { marked } from "marked";
import styles from "./legal.module.css";

// Working values for now (Ashwani, 19 Oct 2026). Review them before the pilot: the mailboxes on this
// domain must exist, and the grievance officer needs a real postal address.
const BLANKS: Record<string, string> = {
    "[PRODUCT]": "AI-Tutor by Nidanos",
    "[DOMAIN]": "nidanos.com",
    "[ENTITY]": "Nidanos Private Limited", // the planned company; both texts say it takes over once incorporated
    "[ADDRESS]": "to be added before public launch",
};

// The texts live once, in DOCS/legal. The page is built from them at build time: the internal draft
// lines become the pilot's, the blanks get the values above, and links point at the site's pages.
function toHtml(file: string) {
    const markdown = readFileSync(join(process.cwd(), "../../DOCS/legal", file), "utf8")
        .replace(/^> \*\*Draft v([\d.]+), ([^.]+)\..*\n(?:> .*\n)*/m, "> **Version $1, $2, for the pilot.** A lawyer-reviewed version replaces it before public launch.\n")
        .replace(/^\*Version ([\d.]+) · Draft · (.+)\*$/m, "*Version $1 · Pilot · $2*")
        .replace(/`([^`]*\[(?:PRODUCT|DOMAIN|ENTITY|ADDRESS)\][^`]*)`/g, "$1")
        .replace(/\[(?:PRODUCT|DOMAIN|ENTITY|ADDRESS)\]/g, (blank) => BLANKS[blank])
        .replaceAll("](privacy-policy.md)", "](/privacy)")
        .replaceAll("](terms-of-service.md)", "](/terms)");
    // Fail the build rather than publish an internal draft line or a blank.
    if (/Not yet in force|· Draft ·|\[(?:PRODUCT|DOMAIN|ENTITY|ADDRESS)\]|\.md\)/.test(markdown))
        throw new Error(`${file}: its draft lines or blanks changed shape; update LegalPage.tsx`);
    return marked.parse(markdown, { async: false });
}

// A policy from DOCS/legal, or a page written here (the providers list).
type LegalPageProps =
    | { file: "terms-of-service.md" | "privacy-policy.md"; children?: never }
    | { file?: never; children: ReactNode };

function LegalPage({ file, children }: LegalPageProps) {
    return (
        <main className={styles.page}>
            <nav className={styles.nav}>
                <Link href="/">AI Tutor</Link>
                <span>
                    <Link href="/terms">Terms of Service</Link> · <Link href="/privacy">Privacy Policy</Link>
                </span>
            </nav>
            {file ? (
                <article className={styles.doc} dangerouslySetInnerHTML={{ __html: toHtml(file) }} />
            ) : (
                <article className={styles.doc}>{children}</article>
            )}
        </main>
    );
}

export default LegalPage;
