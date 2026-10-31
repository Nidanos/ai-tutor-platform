import type { Metadata } from "next";
import AccountPage from "@/features/account/components/AccountPage";

export const metadata: Metadata = { title: "Account · AI Tutor" };

export default function Page() {
  return <AccountPage />;
}
