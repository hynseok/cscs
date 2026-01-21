import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Inter } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import "./globals.css";
import { Providers } from "./providers";
import { GeminiPanel } from "@/components/gemini-panel";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";

// const fontCheck = Inter({ subsets: ["latin"] });
const fontCheck = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "CSCS - Computer Science Conference Searcher",
    template: "%s | CSCS"
  },
  description: "Instant access to 400,000+ academic papers from top computer science conferences.",
  applicationName: "CSCS",
  authors: [{ name: "CSCS Team" }], // Replace with actual author if known
  keywords: ["computer science", "papers", "conferences", "research", "academic search"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "CSCS - Computer Science Conference Searcher",
    description: "Instant access to 400,000+ academic papers from top computer science conferences.",
    siteName: "CSCS",
    images: [{
      url: '/icon.png', // We can update this to a proper OG image later
      width: 512,
      height: 512,
      alt: "CSCS Logo"
    }],
  },
  twitter: {
    card: "summary", // or 'summary_large_image' if we have a wide banner
    title: "CSCS - Computer Science Conference Searcher",
    description: "Instant access to 400,000+ academic papers.",
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontCheck.className} antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <JsonLd />
        <NuqsAdapter>
          <Providers>
            <main className="flex-1">
              {children}
            </main>
            <GeminiPanel />
          </Providers>
        </NuqsAdapter>
        <SiteFooter />
      </body>
    </html>
  );
}
