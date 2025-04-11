import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Loading from "@/components/Loading";
import DBInitializer from "@/components/DBInitializer";
import JsonLd from '@/components/JsonLd';
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Palaviva",
    template: "%s | Palaviva",
  },
  description: "Learn languages by reading texts.",
  metadataBase: new URL("https://palaviva.vercel.app"),

  openGraph: {
    title: "Palaviva",
    description: "Learn languages by reading texts.",
    url: "https://palaviva.vercel.app",
    siteName: "Palaviva",
    images: [
      {
        url: "https://palaviva.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Palaviva – Learn Language with Texts",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Palaviva",
    description: "Learn languages by reading texts.",
    images: ["https://palaviva.vercel.app/twitter-image.jpg"],
    site: "@jancarauma",
    creator: "@jancarauma",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://palaviva.vercel.app",
    languages: {
      "en-US": "https://palaviva.vercel.app",
      "pt-BR": "https://palaviva.vercel.app/pt",
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",

  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={<Loading />}>
          <DBInitializer>{children}</DBInitializer>
        </Suspense>
        <Analytics />
        <JsonLd />
      </body>
    </html>
  );
}
