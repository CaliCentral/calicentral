import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Independent coverage of calisthenics culture, athletes, competitions, rankings, and videos—from California to the global stage.";

export const metadata: Metadata = {
  title: {
    default: "Cali Central | Independent Calisthenics Media",
    template: "%s | Cali Central",
  },
  description,
  applicationName: "Cali Central",
  openGraph: {
    title: "Cali Central | Independent Calisthenics Media",
    description,
    type: "website",
    siteName: "Cali Central",
  },
  twitter: {
    card: "summary",
    title: "Cali Central | Independent Calisthenics Media",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body id="top" className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-sm bg-ink px-4 py-3 text-sm font-bold text-canvas transition-transform focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
