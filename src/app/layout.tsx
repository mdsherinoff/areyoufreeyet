import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});
const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AreYouFreeYet",
  description: "Find time that works for everyone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
