import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Confidence Coach - Join Waitlist",
  description: "Master the mental game of basketball and unlock your full potential on the court.",
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "AI Confidence Coach - Join Waitlist",
    description: "Master the mental game of basketball and unlock your full potential on the court.",
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
    description: "Master the mental game of basketball and unlock your full potential on the court.",
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