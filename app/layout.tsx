import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NewsGlobe — 24H Global News Intelligence",
  description: "Real-time global news intelligence dashboard. Scans multiple sources, summarizes with AI, displays on an interactive map.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
