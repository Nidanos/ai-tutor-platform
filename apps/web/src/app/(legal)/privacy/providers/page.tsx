import type { Metadata } from "next";
import Link from "next/link";
import { providers, updated } from "@ai-tutor/types/providers.json";
import LegalPage from "@/features/legal/LegalPage";

export const metadata: Metadata = { title: "Service providers · AI Tutor" };

// The same list the data download names (packages/types/providers.json), so the two can't disagree.
export default function ProvidersPage() {
    return (
        <LegalPage>
            <h1>Service providers</h1>
            <p>
                These companies process personal data for us to run AI-Tutor, under written contracts that let them use it
                only for that. Section 5 of the <Link href="/privacy">Privacy Policy</Link> explains how. Updated {updated}.
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Provider</th>
                        <th>What they do for us</th>
                        <th>What they get</th>
                    </tr>
                </thead>
                <tbody>
                    {providers.map((p) => (
                        <tr key={p.provider}>
                            <td>{p.provider}</td>
                            <td>{p.purpose}</td>
                            <td>{p.data}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </LegalPage>
    );
}
