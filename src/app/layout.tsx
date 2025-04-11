// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from 'react';
import "./globals.css";
import Loading from "@/components/Loading";
import DBInitializer from "@/components/DBInitializer";  // <-- importamos aqui

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Palaviva",
  description: "Learn a Language with Texts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DBInitializer>
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
        </DBInitializer>
      </body>
    </html>
  );
}
