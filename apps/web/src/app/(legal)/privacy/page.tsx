import type { Metadata } from "next";
import LegalPage from "../LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · AI Tutor" };

export default function PrivacyPage() {
    return <LegalPage file="privacy-policy.md" />;
}
