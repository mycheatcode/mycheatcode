import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist - MyCheatCode",
  description: "Be the first to unlock your unlimited potential. Join the MyCheatCode early access waitlist and get the AI mental performance coach designed for basketball players.",
  openGraph: {
    title: "Join the Waitlist - MyCheatCode",
    description: "Be the first to unlock your unlimited potential. Join the MyCheatCode early access waitlist and get the AI mental performance coach designed for basketball players.",
    url: "https://www.mycheatcode.ai/waitlist",
    siteName: "MyCheatCode",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Waitlist - MyCheatCode",
    description: "Be the first to unlock your unlimited potential. Join the MyCheatCode early access waitlist and get the AI mental performance coach designed for basketball players.",
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}