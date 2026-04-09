import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://24-h-global-news-digest.vercel.app"),
  title: "NewsGlobe — 24H Global News Intelligence",
  description:
    "AI-powered global news dashboard. Scans ARY News, Geo TV, Arab News & BBC every few hours, summarizes by country using AI, and displays on an interactive world map.",
  keywords: ["news", "global news", "AI news", "news dashboard", "world news", "news map"],
  authors: [{ name: "Muhammad Haris" }],
  openGraph: {
    title: "NewsGlobe — 24H Global News Intelligence",
    description:
      "AI-powered news dashboard that scans 4 sources and organizes global news by country on an interactive map.",
    url: "https://24-h-global-news-digest.vercel.app",
    siteName: "NewsGlobe",
    type: "website",
    locale: "en_GB",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "NewsGlobe Dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NewsGlobe — 24H Global News Intelligence",
    description:
      "AI-powered news dashboard that scans 4 sources and organizes global news by country on an interactive map.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
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
