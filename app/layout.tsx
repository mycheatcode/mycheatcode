import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import NotificationToast from "@/components/NotificationToast";
import PasswordProtection from "@/components/PasswordProtection";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Confidence Coach for Basketball Players",
  description: "The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court.",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "AI Confidence Coach for Basketball Players",
    description: "The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court.",
    url: "https://www.mycheatcode.ai",
    siteName: "MyCheatCode AI - Basketball Confidence Coach",
    type: "website",
    images: [
      {
        url: 'https://www.mycheatcode.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyCheatCode AI',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Confidence Coach for Basketball Players",
    description: "The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court.",
    images: ['https://www.mycheatcode.ai/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${dmSans.variable} antialiased`}
      >
        <PasswordProtection>
          <PageTransition>
            {children}
          </PageTransition>
        </PasswordProtection>
        <NotificationToast />
      </body>
    </html>
  );
}
