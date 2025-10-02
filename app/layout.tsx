import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import NotificationToast from "@/components/NotificationToast";
import PasswordProtection from "@/components/PasswordProtection";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyCheatCode - Unlock Your Unlimited Potential",
  description: "The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court. Join the waitlist for early access.",
  openGraph: {
    title: "MyCheatCode - Unlock Your Unlimited Potential",
    description: "The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court. Join the waitlist for early access.",
    url: "https://www.mycheatcode.ai",
    siteName: "MyCheatCode",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyCheatCode - Unlock Your Unlimited Potential",
    description: "The first A.I. Mental Performance Coach designed to help you master the mental game of basketball and unlock your full potential on the court. Join the waitlist for early access.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${oswald.variable} antialiased`}
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
