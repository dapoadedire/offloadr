import type { Metadata } from "next";
import { M_PLUS_Code_Latin } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";



const mPlusCodeLatin = M_PLUS_Code_Latin({
  subsets: ["latin"],
  variable: "--font-mplus-code-latin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Offloadr - The Easiest Way for Students to Sell Used Items on Campus",
  description:
    "Offloadr is the easiest way for students to sell used items on campus. Simple, safe, and sustainable. List items in minutes, connect with buyers instantly.",
  keywords: [
    "student marketplace",
    "campus marketplace",
    "sell used items",
    "student resale",
    "campus buy and sell",
    "sustainable shopping",
    "student deals",
    "college marketplace",
  ],
  authors: [{ name: "Offloadr" }],
  openGraph: {
    title: "Offloadr - The Easiest Way for Students to Sell Used Items",
    description:
      "Simple, safe, and sustainable student marketplace. Sell your stuff before you leave campus.",
    type: "website",
    locale: "en_US",
    siteName: "Offloadr",
  },
  twitter: {
    card: "summary_large_image",
    title: "Offloadr - Campus Marketplace for Students",
    description:
      "The easiest way for students to sell used items on campus. Simple, safe, and sustainable.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${mPlusCodeLatin.variable} font-mono antialiased`}>
        <QueryProvider>
          <Header />
          {children}
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
