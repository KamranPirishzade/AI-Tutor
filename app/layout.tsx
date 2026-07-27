import type { Metadata } from "next";
import { Bricolage_Grotesque, Karla, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const bodyFont = Karla({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "AI Repetitor",
  description: "Təqdimatları Azərbaycan dilində səsli izah edən AI köməkçi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="az"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
