import type { Metadata } from "next";
import LegalPage from "@/features/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · AI Tutor" };

export default function TermsPage() {
    return <LegalPage file="terms-of-service.md" />;
}
