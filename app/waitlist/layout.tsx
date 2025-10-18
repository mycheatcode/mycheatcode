import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Confidence Coach - Join Waitlist",
  description: "The first AI basketball confidence coach. Build on court confidence and unlock your full potential. Join the waitlist for early access.",
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "AI Confidence Coach - Join Waitlist",
    description: "The first AI basketball confidence coach. Build on court confidence and unlock your full potential. Join the waitlist for early access.",
    url: "https://www.mycheatcode.ai/waitlist",
    siteName: "AI Confidence Coach - Join Waitlist",
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
    title: "AI Confidence Coach - Join Waitlist",
    description: "The first AI basketball confidence coach. Build on court confidence and unlock your full potential. Join the waitlist for early access.",
    images: ['https://www.mycheatcode.ai/og-image.png'],
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}