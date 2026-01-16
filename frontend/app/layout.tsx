import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Inter } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import "./globals.css";
import { Providers } from "./providers";

// const fontCheck = Inter({ subsets: ["latin"] });
const fontCheck = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSCS - Computer Science Conference paper Searcher",
  description: "Instant access to 400,000+ academic papers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontCheck.className} antialiased min-h-screen bg-background text-foreground`}>
        <NuqsAdapter>
          <Providers>
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
