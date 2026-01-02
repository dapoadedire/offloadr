import type { Metadata } from "next";
import { Work_Sans} from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { AuthSessionHandler } from "@/components/auth-session-handler";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const ibmPlexMono = Work_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "700"],
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
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Offloadr - Student Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offloadr - Campus Marketplace for Students",
    description:
      "The easiest way for students to sell used items on campus. Simple, safe, and sustainable.",
    images: ["/og-image.svg"],
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
      <body className={`${ibmPlexMono.variable} font-mono antialiased`}>
        <NuqsAdapter>
          <QueryProvider>
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
            <AuthSessionHandler />
            <Header />
            {children}
            <Footer />
            <Toaster />
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
