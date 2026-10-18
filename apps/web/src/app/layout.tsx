
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "@/components/auth/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Tutor",
  description: "Learn. Build. Go Further.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
